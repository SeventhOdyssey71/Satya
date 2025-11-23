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
