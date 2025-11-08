#!/bin/bash

# Satya Enclave Configuration Script
# Based on model-nautilus configure_enclave.sh

set -euo pipefail

APP_NAME=${1:-satya}
REGION=${AWS_REGION:-us-east-1}
INSTANCE_TYPE=${INSTANCE_TYPE:-m5.large}

echo "🚀 Configuring Satya Enclave: $APP_NAME"
echo "📍 Region: $REGION"
echo "💻 Instance Type: $INSTANCE_TYPE"

# Check required environment variables
if [[ -z "${KEY_PAIR:-}" ]]; then
    echo "❌ Error: KEY_PAIR environment variable is required"
    echo "   Example: export KEY_PAIR=satya-marketplace-keypair"
    exit 1
fi

if [[ -z "${EC2_INSTANCE_NAME:-}" ]]; then
    echo "❌ Error: EC2_INSTANCE_NAME environment variable is required"
    echo "   Example: export EC2_INSTANCE_NAME=satya-marketplace-instance"
    exit 1
fi

# Ensure AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ Error: AWS CLI is not configured or credentials are invalid"
    exit 1
fi

echo "✅ AWS credentials verified"

# Check if instance already exists
EXISTING_INSTANCE=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$EC2_INSTANCE_NAME" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
    --query "Reservations[0].Instances[0].InstanceId" \
    --output text 2>/dev/null || echo "None")

if [[ "$EXISTING_INSTANCE" != "None" && "$EXISTING_INSTANCE" != "null" ]]; then
    echo "📋 Found existing instance: $EXISTING_INSTANCE"
    INSTANCE_ID=$EXISTING_INSTANCE
else
    echo "🔧 Creating new EC2 instance..."
    
    # Get latest Amazon Linux 2 AMI
    AMI_ID=$(aws ec2 describe-images \
        --owners amazon \
        --filters 'Name=name,Values=amzn2-ami-hvm-*' 'Name=state,Values=available' \
        --query 'Images|sort_by(@, &CreationDate)[-1].ImageId' \
        --output text)
    
    echo "📦 Using AMI: $AMI_ID"
    
    # Create security group if it doesn't exist
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=SatyaMarketplaceSG" \
        --query "SecurityGroups[0].GroupId" \
        --output text 2>/dev/null || echo "None")
    
    if [[ "$SECURITY_GROUP_ID" == "None" || "$SECURITY_GROUP_ID" == "null" ]]; then
        echo "🔒 Creating security group..."
        SECURITY_GROUP_ID=$(aws ec2 create-security-group \
            --group-name SatyaMarketplaceSG \
            --description "Security group for Satya Marketplace" \
            --query 'GroupId' \
            --output text)
        
        # Allow SSH (port 22)
        aws ec2 authorize-security-group-ingress \
            --group-id $SECURITY_GROUP_ID \
            --protocol tcp \
            --port 22 \
            --cidr 0.0.0.0/0
        
        # Allow enclave server (port 3000)
        aws ec2 authorize-security-group-ingress \
            --group-id $SECURITY_GROUP_ID \
            --protocol tcp \
            --port 3000 \
            --cidr 0.0.0.0/0
        
        echo "✅ Security group created: $SECURITY_GROUP_ID"
    else
        echo "📋 Using existing security group: $SECURITY_GROUP_ID"
    fi
    
    # Create user data script
    cat > /tmp/user-data.sh << 'EOF'
#!/bin/bash
yum update -y
yum install -y docker git curl

# Install Nitro CLI
amazon-linux-extras install aws-nitro-enclaves-cli

# Start Docker service
systemctl start docker
systemctl enable docker

# Add ec2-user to docker and nitro groups
usermod -a -G docker ec2-user
usermod -a -G ne ec2-user

# Configure Nitro Enclaves
echo 'memory_mib: 512' > /etc/nitro_enclaves/allocator.yaml
echo 'cpu_count: 2' >> /etc/nitro_enclaves/allocator.yaml

# Start Nitro Enclaves Allocator
systemctl start nitro-enclaves-allocator.service
systemctl enable nitro-enclaves-allocator.service

# Create directories
mkdir -p /home/ec2-user/satya
chown -R ec2-user:ec2-user /home/ec2-user/satya
EOF
    
    # Launch instance
    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id $AMI_ID \
        --count 1 \
        --instance-type $INSTANCE_TYPE \
        --key-name $KEY_PAIR \
        --security-group-ids $SECURITY_GROUP_ID \
        --user-data file:///tmp/user-data.sh \
        --enclave-options Enabled=true \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$EC2_INSTANCE_NAME},{Key=Project,Value=SatyaMarketplace}]" \
        --query 'Instances[0].InstanceId' \
        --output text)
    
    echo "🚀 Instance launched: $INSTANCE_ID"
    rm -f /tmp/user-data.sh
fi

# Wait for instance to be running
echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "🌐 Instance running at: $PUBLIC_IP"

# Wait for SSH to be ready
echo "⏳ Waiting for SSH to be ready..."
while ! ssh -i "${KEY_PAIR}.pem" -o ConnectTimeout=5 -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP "echo 'SSH Ready'" 2>/dev/null; do
    sleep 5
done

echo "✅ SSH connection established"

# Build and deploy enclave
echo "🔨 Building enclave image..."
if ! make ENCLAVE_APP=$APP_NAME; then
    echo "❌ Failed to build enclave image"
    exit 1
fi

# Transfer files to instance
echo "📦 Transferring enclave to instance..."
scp -i "${KEY_PAIR}.pem" -o StrictHostKeyChecking=no out/enclaveos.tar ec2-user@$PUBLIC_IP:~/satya/

# Set up enclave on instance
echo "⚙️ Setting up enclave on instance..."
ssh -i "${KEY_PAIR}.pem" -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP << EOF
cd ~/satya
sudo docker load -i enclaveos.tar
sudo docker tag local/enclaveos satya-enclave:latest
sudo nitro-cli build-enclave --docker-uri satya-enclave:latest --output-file satya.eif
EOF

echo "🎉 Enclave deployment complete!"
echo ""
echo "📊 Summary:"
echo "   Instance ID: $INSTANCE_ID"
echo "   Public IP: $PUBLIC_IP"
echo "   SSH Command: ssh -i ${KEY_PAIR}.pem ec2-user@$PUBLIC_IP"
echo "   Enclave File: ~/satya/satya.eif"
echo ""
echo "🚀 To start the enclave:"
echo "   ssh -i ${KEY_PAIR}.pem ec2-user@$PUBLIC_IP"
echo "   sudo nitro-cli run-enclave --cpu-count 2 --memory 512M --eif-path ~/satya/satya.eif"
echo ""
echo "🔍 To check enclave status:"
echo "   sudo nitro-cli describe-enclaves"