# Nautilus Integration for Satya Marketplace

## Overview

The Nautilus integration provides a secure, verifiable AI model training marketplace built on AWS Nitro Enclaves and Sui blockchain. It enables model creators to monetize their AI models while maintaining IP protection, and allows data owners to train models in a trusted execution environment with cryptographic attestation.

## Architecture

### Core Components

1. **Trusted Execution Environment (TEE)**
   - AWS Nitro Enclaves for hardware-isolated execution
   - Secure model storage and training
   - Cryptographic attestation generation

2. **Blockchain Layer**
   - Sui smart contracts for payment escrow
   - On-chain attestation verification
   - Model registry and marketplace logic

3. **Client SDK**
   - TypeScript SDK for frontend integration
   - Model upload and management
   - Training orchestration

## Features

- **Secure Model Storage**: Models encrypted at rest and in transit
- **Verifiable Training**: Hardware attestation proves computation integrity
- **Payment Escrow**: Smart contract-based payment protection
- **Privacy Preservation**: Training data never leaves the enclave
- **Scalable Architecture**: Support for multiple concurrent training sessions

## Directory Structure

```
nautilus/
├── src/               # Core implementation
├── config/            # Configuration files
├── tests/             # Test suites
├── docs/              # Documentation
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── move-contracts/    # Sui Move smart contracts
└── client/            # Client SDK implementation
```

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test
```

## Configuration

Create a `.env` file with:

```env
# AWS Configuration
AWS_REGION=us-east-1
ENCLAVE_INSTANCE_ID=i-xxxxx

# Sui Configuration
SUI_NETWORK=testnet
MARKETPLACE_PACKAGE_ID=0x...
ENCLAVE_PACKAGE_ID=0x...

# API Configuration
ENCLAVE_URL=http://localhost:3000
API_KEY=your-api-key
```

## Usage

### Initialize Client

```typescript
import { NautilusClient } from '@satya/nautilus-integration';

const client = new NautilusClient({
  enclaveUrl: process.env.ENCLAVE_URL,
  suiNetwork: 'testnet',
  marketplacePackageId: process.env.MARKETPLACE_PACKAGE_ID
});
```

### Upload Model

```typescript
const modelResult = await client.uploadModel({
  modelFile: file,
  name: 'My AI Model',
  description: 'Classification model',
  price: 100000000, // in MIST
  category: 'classification'
});
```

### Purchase Training

```typescript
const purchase = await client.purchaseTraining({
  modelId: 'model-id',
  paymentAmount: 100000000
});
```

### Execute Training

```typescript
const training = await client.startTraining({
  purchaseId: purchase.id,
  datasetFile: dataset,
  params: {
    epochs: 10,
    learning_rate: 0.001,
    batch_size: 32
  }
});
```

## AWS Deployment Quick Start

### Prerequisites
```bash
export KEY_PAIR=satya-nautilus-keypair
export EC2_INSTANCE_NAME=satya-nautilus-instance
export AWS_REGION=us-east-1
```

### Deploy to AWS
```bash
# 1. Generate SSH key
aws ec2 create-key-pair --key-name $KEY_PAIR \
  --query 'KeyMaterial' --output text > ${KEY_PAIR}.pem
chmod 400 ${KEY_PAIR}.pem

# 2. Run deployment script
./configure_enclave.sh satya

# 3. Get instance details
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=$EC2_INSTANCE_NAME" \
  --query "Reservations[0].Instances[0].InstanceId" --output text)

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

# 4. SSH and start enclave
ssh -i ${KEY_PAIR}.pem ec2-user@$PUBLIC_IP
sudo nitro-cli run-enclave \
  --cpu-count 2 --memory 4096 \
  --eif-path ~/satya/satya.eif
```

### Essential Commands
```bash
# Local development
make dev

# Build enclave
make build

# Deploy contracts
cd move/enclave && sui client publish .

# Check enclave status
sudo nitro-cli describe-enclaves

# View logs
sudo nitro-cli console --enclave-id <id>
```

### Instance Types & Pricing
- **Development**: m5.large (2 vCPU, 8GB) - $0.096/hour
- **Production**: m5.xlarge (4 vCPU, 16GB) - $0.192/hour  
- **High Load**: m5.2xlarge (8 vCPU, 32GB) - $0.384/hour

## Security Considerations

- Models are encrypted using AES-256-GCM
- All communication uses TLS 1.3
- Enclave attestation verifies code integrity
- Smart contracts enforce payment guarantees

## License

Apache 2.0