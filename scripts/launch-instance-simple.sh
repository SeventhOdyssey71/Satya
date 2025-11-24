#!/bin/bash
set -e

echo "Launching Nautilus server EC2 instance (simplified)..."

# Variables
REGION="us-east-1"
KEY_PAIR_NAME="nautilus-keypair"
SECURITY_GROUP_NAME="nautilus-server-sg"
INSTANCE_TYPE="m5.xlarge"

# Get latest Amazon Linux 2 AMI with Nitro Enclaves support
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=amzn2-ami-hvm-*" "Name=architecture,Values=x86_64" \
  --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
  --output text)

echo "Using AMI: $AMI_ID"

# Get security group ID
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
  --group-names $SECURITY_GROUP_NAME \
  --query 'SecurityGroups[0].GroupId' --output text)

# Get subnet ID (first available subnet)
SUBNET_ID=$(aws ec2 describe-subnets \
  --filters "Name=default-for-az,Values=true" \
  --query 'Subnets[0].SubnetId' --output text)

# Create user data script
cat > user-data.sh << 'EOF'
#!/bin/bash
yum update -y

# Install Docker
yum install -y docker git awscli

# Install Nitro CLI
amazon-linux-extras install aws-nitro-enclaves-cli -y
yum install -y aws-nitro-enclaves-cli-devel

# Configure services
systemctl start docker
systemctl enable docker
systemctl start nitro-enclaves-allocator.service
systemctl enable nitro-enclaves-allocator.service

# Add ec2-user to groups
usermod -a -G docker ec2-user
usermod -a -G ne ec2-user

# Configure Nitro Enclaves allocator
mkdir -p /etc/nitro_enclaves
echo -e "memory_mib: 1024\ncpu_count: 2" > /etc/nitro_enclaves/allocator.yaml

# Install Rust for ec2-user
sudo -u ec2-user bash -c 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y'
sudo -u ec2-user bash -c 'source ~/.cargo/env && rustup default stable'

# Clone repository
cd /home/ec2-user
sudo -u ec2-user git clone https://github.com/SeventhOdyssey71/Satya.git

# Create log file
touch /var/log/nautilus-server.log
chown ec2-user:ec2-user /var/log/nautilus-server.log

# Set up environment
echo 'export RUST_LOG=info' >> /home/ec2-user/.bashrc
echo 'export BIND_ADDRESS=0.0.0.0:8080' >> /home/ec2-user/.bashrc

echo "Setup complete" > /home/ec2-user/setup-complete.txt
EOF

# Launch instance WITHOUT instance profile first
echo "Launching EC2 instance without instance profile..."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type $INSTANCE_TYPE \
  --key-name $KEY_PAIR_NAME \
  --security-group-ids $SECURITY_GROUP_ID \
  --subnet-id $SUBNET_ID \
  --enclave-options Enabled=true \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=nautilus-server}]' \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance launched: $INSTANCE_ID"

# Wait for instance to be running
echo "Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Instance is running!"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "SSH command: ssh -i ~/.ssh/${KEY_PAIR_NAME}.pem ec2-user@$PUBLIC_IP"

# Clean up
rm user-data.sh

# Save instance info
cat > instance-info.txt << EOF
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
SSH Command: ssh -i ~/.ssh/${KEY_PAIR_NAME}.pem ec2-user@$PUBLIC_IP
Region: $REGION
Security Group: $SECURITY_GROUP_ID
EOF

echo "Instance information saved to instance-info.txt"
echo ""
echo "Now you can try to associate the instance profile manually if needed:"
echo "aws ec2 associate-iam-instance-profile --instance-id $INSTANCE_ID --iam-instance-profile Name=NautilusServerProfile"