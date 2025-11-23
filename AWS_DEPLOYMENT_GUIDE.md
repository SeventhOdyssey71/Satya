# AWS Deployment Guide for Nautilus TEE Server

This guide walks you through deploying the Nautilus TEE server on AWS using Nitro Enclaves for secure ML model processing.

## Prerequisites

- AWS CLI v2 installed and configured
- Docker installed locally
- Rust toolchain with cross-compilation support
- EC2 instance with Nitro Enclaves support

## AWS Infrastructure Setup

### 1. Create IAM Role for EC2 Instance

```bash
# Create IAM role for EC2 instance
aws iam create-role --role-name NautilusServerRole --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Attach necessary policies
aws iam attach-role-policy --role-name NautilusServerRole --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam attach-role-policy --role-name NautilusServerRole --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

# Create instance profile
aws iam create-instance-profile --instance-profile-name NautilusServerProfile
aws iam add-role-to-instance-profile --instance-profile-name NautilusServerProfile --role-name NautilusServerRole
```

### 2. Launch EC2 Instance with Nitro Enclaves

```bash
# Launch EC2 instance (replace with your subnet-id and security-group-id)
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type m5.large \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --iam-instance-profile Name=NautilusServerProfile \
  --enclave-options Enabled=true \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=nautilus-server}]'
```

### 3. Security Group Configuration

```bash
# Create security group
aws ec2 create-security-group \
  --group-name nautilus-server-sg \
  --description "Security group for Nautilus TEE server"

# Get security group ID
SG_ID=$(aws ec2 describe-security-groups --group-names nautilus-server-sg --query 'SecurityGroups[0].GroupId' --output text)

# Allow inbound traffic
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0     # SSH
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 8080 --cidr 0.0.0.0/0   # Nautilus API
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0    # HTTPS
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0     # HTTP
```

## Server Deployment

### 1. Prepare User Data Script

Create `user-data.sh`:

```bash
#!/bin/bash
yum update -y
yum install -y docker git awscli

# Install Nitro CLI
yum install -y aws-nitro-enclaves-cli aws-nitro-enclaves-cli-devel

# Configure Docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user
usermod -a -G ne ec2-user

# Configure Nitro Enclaves
systemctl start nitro-enclaves-allocator.service
systemctl enable nitro-enclaves-allocator.service
systemctl start docker
systemctl enable docker

# Set enclave allocator resources
echo 'ALLOCATOR_YAML="'$(echo -e 'cpu_count: 2\nmemory_mib: 1024')'\"' | tee -a /etc/nitro_enclaves/allocator.yaml

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env
```

### 2. Build and Deploy Nautilus Server

SSH into your EC2 instance and run:

```bash
# Clone repository
git clone https://github.com/SeventhOdyssey71/Satya.git
cd Satya/nautilus-server

# Build the server
cargo build --release

# Create systemd service
sudo tee /etc/systemd/system/nautilus-server.service > /dev/null <<EOF
[Unit]
Description=Nautilus TEE Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/Satya/nautilus-server
ExecStart=/home/ec2-user/Satya/nautilus-server/target/release/nautilus-server
Restart=always
RestartSec=10
Environment=RUST_LOG=info
Environment=BIND_ADDRESS=0.0.0.0:8080

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable nautilus-server
sudo systemctl start nautilus-server
```

### 3. Build Nitro Enclave

```bash
# Build enclave EIF file
cd nautilus-server/enclave
nitro-cli build-enclave --docker-uri nautilus-enclave:latest --output-file nautilus-enclave.eif

# Run enclave
nitro-cli run-enclave \
  --cpu-count 2 \
  --memory 1024 \
  --eif-path nautilus-enclave.eif \
  --debug-mode

# Check enclave status
nitro-cli describe-enclaves
```

## Environment Configuration

### 1. Environment Variables

Create `/home/ec2-user/Satya/nautilus-server/.env`:

```bash
# Server Configuration
RUST_LOG=info
BIND_ADDRESS=0.0.0.0:8080
DATABASE_URL=postgresql://user:password@localhost/nautilus

# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=nautilus-model-storage

# TEE Configuration
ENCLAVE_ID=i-1234567890abcdef0-enc-1234567890abcdef0
NSM_LIBRARY_PATH=/usr/lib64/libnsm.so

# SEAL Configuration
SEAL_PACKAGE_ID=0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82
SUI_NETWORK_URL=https://fullnode.testnet.sui.io
```

### 2. Database Setup (Optional)

If using PostgreSQL:

```bash
# Install PostgreSQL
sudo yum install -y postgresql postgresql-server

# Initialize and start PostgreSQL
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb nautilus
sudo -u postgres createuser -P nautilususer
```

## SSL/TLS Configuration

### 1. Install Certbot for Let's Encrypt

```bash
# Install certbot
sudo yum install -y certbot

# Get SSL certificate (replace with your domain)
sudo certbot certonly --standalone -d nautilus.yourdomain.com

# Configure nginx reverse proxy
sudo yum install -y nginx
```

### 2. Nginx Configuration

Create `/etc/nginx/conf.d/nautilus.conf`:

```nginx
server {
    listen 80;
    server_name nautilus.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nautilus.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/nautilus.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nautilus.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:8080/health;
    }
}
```

## Monitoring and Logging

### 1. CloudWatch Configuration

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/nautilus-server.log",
            "log_group_name": "nautilus-server",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "Nautilus/Server",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"]
      },
      "disk": {
        "measurement": ["used_percent"],
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"]
      }
    }
  }
}
EOF

# Start CloudWatch agent
sudo systemctl start amazon-cloudwatch-agent
sudo systemctl enable amazon-cloudwatch-agent
```

### 2. Log Management

```bash
# Configure logrotate for nautilus logs
sudo tee /etc/logrotate.d/nautilus-server > /dev/null <<EOF
/var/log/nautilus-server.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ec2-user ec2-user
    postrotate
        /bin/systemctl reload nautilus-server
    endscript
}
EOF
```

## Health Checks and Auto-Scaling

### 1. Health Check Endpoint

The nautilus server exposes health checks at `/health`. Configure ALB health checks:

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name nautilus-alb \
  --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-xxxxxxxxx

# Create target group
aws elbv2 create-target-group \
  --name nautilus-targets \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-xxxxxxxxx \
  --health-check-path /health
```

### 2. Auto Scaling Configuration

```bash
# Create launch template
aws ec2 create-launch-template \
  --launch-template-name nautilus-template \
  --launch-template-data '{
    "ImageId": "ami-0abcdef1234567890",
    "InstanceType": "m5.large",
    "KeyName": "your-key-pair",
    "SecurityGroupIds": ["sg-xxxxxxxxx"],
    "IamInstanceProfile": {"Name": "NautilusServerProfile"},
    "UserData": "'$(base64 -w 0 user-data.sh)'"
  }'

# Create Auto Scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name nautilus-asg \
  --launch-template LaunchTemplateName=nautilus-template,Version=1 \
  --min-size 1 \
  --max-size 3 \
  --desired-capacity 2 \
  --vpc-zone-identifier "subnet-xxxxxxxx,subnet-yyyyyyyy"
```

## Deployment Scripts

### 1. Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Deploying Nautilus Server to AWS..."

# Build release version
cargo build --release

# Stop existing service
sudo systemctl stop nautilus-server || true

# Copy new binary
sudo cp target/release/nautilus-server /usr/local/bin/

# Start service
sudo systemctl start nautilus-server
sudo systemctl status nautilus-server

# Check health
sleep 5
curl -f http://localhost:8080/health || exit 1

echo "Deployment completed successfully!"
```

### 2. Rollback Script

Create `rollback.sh`:

```bash
#!/bin/bash
set -e

echo "Rolling back Nautilus Server..."

# Stop current service
sudo systemctl stop nautilus-server

# Restore backup binary
sudo cp /usr/local/bin/nautilus-server.backup /usr/local/bin/nautilus-server

# Start service
sudo systemctl start nautilus-server
sudo systemctl status nautilus-server

echo "Rollback completed!"
```

## Security Hardening

### 1. System Updates

```bash
# Set up automatic security updates
sudo tee /etc/yum.conf.d/security.conf > /dev/null <<EOF
[main]
exclude=kernel*
EOF

# Install automatic updates
sudo yum install -y yum-cron
sudo systemctl enable yum-cron
sudo systemctl start yum-cron
```

### 2. Firewall Configuration

```bash
# Configure iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -j DROP

# Save iptables rules
sudo service iptables save
```

## Troubleshooting

### 1. Common Issues

**Enclave fails to start:**
```bash
# Check allocator resources
cat /sys/module/nitro_enclaves/parameters/ne_cpus
cat /sys/module/nitro_enclaves/parameters/ne_hugepages

# Check enclave logs
nitro-cli console --enclave-id $(nitro-cli describe-enclaves | jq -r '.[0].EnclaveID')
```

**Service won't start:**
```bash
# Check service logs
sudo journalctl -u nautilus-server -f

# Check port availability
sudo netstat -tlnp | grep 8080
```

### 2. Debugging Commands

```bash
# Check system resources
free -h
df -h
top

# Check network connectivity
curl -v http://localhost:8080/health
telnet localhost 8080

# Check enclave status
nitro-cli describe-enclaves
```

## Cost Optimization

### 1. Instance Types

- **Development**: t3.medium (2 vCPU, 4 GB RAM) - ~$30/month
- **Production**: m5.large (2 vCPU, 8 GB RAM) - ~$70/month
- **High Performance**: m5.xlarge (4 vCPU, 16 GB RAM) - ~$140/month

### 2. Reserved Instances

Consider purchasing Reserved Instances for long-term deployments to save up to 75% on compute costs.

## Maintenance

### 1. Regular Tasks

```bash
# Weekly tasks
sudo yum update -y
docker system prune -f
sudo logrotate -f /etc/logrotate.d/nautilus-server

# Monthly tasks
sudo certbot renew
aws logs delete-log-group --log-group-name old-log-groups
```

### 2. Backup Strategy

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backup/nautilus-backup-$DATE.tar.gz /home/ec2-user/Satya/nautilus-server
aws s3 cp /backup/nautilus-backup-$DATE.tar.gz s3://nautilus-backups/
```

This guide provides a complete deployment pipeline for running the Nautilus TEE server on AWS with production-grade security, monitoring, and scalability features.