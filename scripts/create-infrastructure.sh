#!/bin/bash
set -e

echo "Creating AWS infrastructure for Nautilus server..."

# Variables
REGION="us-east-1"
KEY_PAIR_NAME="nautilus-keypair"
ROLE_NAME="NautilusServerRole"
INSTANCE_PROFILE_NAME="NautilusServerProfile"
SECURITY_GROUP_NAME="nautilus-server-sg"

# Create IAM role
echo "Creating IAM role..."
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document '{
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
  }' || echo "Role already exists"

# Attach policies
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore || true

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy || true

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name $INSTANCE_PROFILE_NAME || echo "Profile already exists"

aws iam add-role-to-instance-profile \
  --instance-profile-name $INSTANCE_PROFILE_NAME \
  --role-name $ROLE_NAME || echo "Role already added"

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)
echo "Using VPC: $VPC_ID"

# Create security group
echo "Creating security group..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
  --group-name $SECURITY_GROUP_NAME \
  --description "Security group for Nautilus TEE server" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
  --group-names $SECURITY_GROUP_NAME \
  --query 'SecurityGroups[0].GroupId' --output text)

echo "Security Group ID: $SECURITY_GROUP_ID"

# Add security group rules
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 || echo "SSH rule already exists"

aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp --port 8080 --cidr 0.0.0.0/0 || echo "8080 rule already exists"

aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 || echo "HTTPS rule already exists"

aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 || echo "HTTP rule already exists"

# Create key pair (if it doesn't exist)
if ! aws ec2 describe-key-pairs --key-names $KEY_PAIR_NAME >/dev/null 2>&1; then
  echo "Creating key pair..."
  aws ec2 create-key-pair \
    --key-name $KEY_PAIR_NAME \
    --query 'KeyMaterial' \
    --output text > ~/.ssh/${KEY_PAIR_NAME}.pem
  chmod 400 ~/.ssh/${KEY_PAIR_NAME}.pem
  echo "Key pair saved to ~/.ssh/${KEY_PAIR_NAME}.pem"
else
  echo "Key pair $KEY_PAIR_NAME already exists"
fi

echo "Infrastructure setup complete!"
echo "Security Group ID: $SECURITY_GROUP_ID"
echo "Key Pair: $KEY_PAIR_NAME"
echo "Instance Profile: $INSTANCE_PROFILE_NAME"