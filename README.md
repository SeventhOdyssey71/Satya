# Satya AI Marketplace

A decentralized AI marketplace platform built on the Sui blockchain ecosystem that enables secure trading of AI models and datasets. The platform leverages TEE (Trusted Execution Environment) verification, SEAL homomorphic encryption, and Walrus distributed storage to provide a trustless environment for AI model commerce.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Platform Features](#platform-features)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Development Guide](#development-guide)
- [API Documentation](#api-documentation)
- [Security Model](#security-model)
- [Network Architecture](#network-architecture)
- [Contributing](#contributing)

## Architecture Overview

### Core Infrastructure

**Blockchain Layer**: Sui testnet provides the foundational blockchain infrastructure for smart contracts, transaction processing, and immutable record keeping.

**Storage Layer**: Walrus distributed storage network handles large file storage with built-in redundancy and fault tolerance.

**Security Layer**: SEAL (Simple Encrypted Arithmetic Library) provides homomorphic encryption capabilities for secure computation on encrypted data.

**Verification Layer**: TEE attestation through Nautilus server ensures model integrity and authentic execution environments.

**Frontend Layer**: Next.js 15 application with TypeScript provides the user interface and client-side functionality.

### Data Flow Architecture

1. **Model Upload**: Files encrypted with SEAL, stored on Walrus, metadata recorded on Sui
2. **TEE Verification**: Models processed in secure enclaves with cryptographic attestation
3. **Marketplace Listing**: Smart contracts manage pricing, access control, and ownership
4. **Purchase Flow**: SUI cryptocurrency payments with automatic escrow and release
5. **Access Control**: Policy-based decryption keys managed through SEAL infrastructure

## Technology Stack

### Frontend Technologies
- **Next.js 15.0.3**: React framework with App Router architecture
- **TypeScript**: Type-safe JavaScript with strict compilation
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React 18**: Component-based UI library with concurrent features
- **Framer Motion**: Animation library for smooth user interactions

### Blockchain Integration
- **@mysten/dapp-kit**: Official Sui development toolkit
- **@mysten/sui.js**: JavaScript SDK for Sui blockchain interaction
- **Sui Move**: Smart contract programming language
- **SUI Cryptocurrency**: Native token for transactions and gas fees

### Storage & Encryption
- **Walrus SDK**: Distributed storage client libraries
- **SEAL Library**: Homomorphic encryption implementation
- **Blob Storage**: Content-addressed storage with cryptographic hashing
- **Key Management**: Multi-party key servers with threshold cryptography

### Development Tools
- **ESLint**: Code quality and style enforcement
- **Prettier**: Automated code formatting
- **Jest**: Unit testing framework
- **TypeScript Compiler**: Static type checking

## Smart Contract Deployment

### Marketplace Contracts (Deployed November 20, 2025)

**Primary Marketplace Contract**
- Package ID: `0xc29f2a2de17085ce6b7e8c490a2d80eba3e7bdda5c2a8e1d1840af88ef604678`
- Registry ID: `0xa3a0814822a4126846b0dbc5ffef91f1ee5bf078ca129eef16c8bdf5b6481c9b`
- Upgrade Cap: `0xdc78d268de6839c736399a94ada471ef2f162d55d9d03818b1e0268b929b7e9a`

**Treasury Configuration**
- Treasury Address: `0xce5e05f1c924a9de71967d24c1bba0ee625a0210132e4d51cbb3fc290d1acbee`
- Platform Fee: 250 basis points (2.5%)
- Fee Denominator: 10,000

### SEAL Encryption Contracts

**SEAL Package**
- Package ID: `0x98f8a6ce208764219b23dc51db45bf11516ec0998810e98f3a94548d788ff679`
- Upgrade Cap: `0x6d4e3a32fd66305bde5c900341d304e9c5e4dd9b23053129e125fdc33f7a7c57`

### Gas Configuration
- Default Gas Budget: 100,000,000 MIST (0.1 SUI)
- Maximum Gas Budget: 1,000,000,000 MIST (1.0 SUI)

## Platform Features

### Marketplace Functionality

**Model Discovery**
- Advanced search with category filtering
- Price range and quality score filtering
- TEE verification status indicators
- Model size and format compatibility

**Listing Management**
- Multi-step upload wizard with validation
- Automated file processing and encryption
- Smart contract listing with configurable pricing
- Real-time upload progress tracking

**Transaction Processing**
- Secure SUI cryptocurrency payments
- Automated escrow and release mechanisms
- Platform fee collection (2.5%)
- Transaction history and receipts

### Security Features

**TEE Verification**
- Hardware-based attestation of model integrity
- Cryptographic proof of execution environment
- Quality scoring with bias assessment
- Performance benchmarking in secure enclaves

**Encryption & Access Control**
- SEAL homomorphic encryption for data privacy
- Policy-based access control mechanisms
- Session key management with automatic rotation
- Multi-party key distribution for fault tolerance

**Blockchain Security**
- Immutable transaction records on Sui blockchain
- Smart contract-enforced business logic
- Cryptographic hash verification for data integrity
- Decentralized consensus for transaction validation

## Installation & Setup

### System Requirements
- Node.js 18.0 or higher
- npm 8.0 or higher (or yarn equivalent)
- Git version control system
- Modern web browser with WebAssembly support

### Local Development Setup

1. **Repository Setup**
```bash
git clone https://github.com/SeventhOdyssey71/Satya.git
cd Satya
```

2. **Dependency Installation**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration values
```

4. **Development Server**
```bash
npm run dev
```

Access the application at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Configuration

### Environment Variables

**Blockchain Configuration**
```env
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_SUI_WEBSOCKET_URL=wss://fullnode.testnet.sui.io:9001
```

**Smart Contract Addresses**
```env
NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID=0xc29f2a2de17085ce6b7e8c490a2d80eba3e7bdda5c2a8e1d1840af88ef604678
NEXT_PUBLIC_MARKETPLACE_REGISTRY_ID=0xa3a0814822a4126846b0dbc5ffef91f1ee5bf078ca129eef16c8bdf5b6481c9b
NEXT_PUBLIC_TREASURY_ADDRESS=0xce5e05f1c924a9de71967d24c1bba0ee625a0210132e4d51cbb3fc290d1acbee
```

**Storage Configuration**
```env
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
```

**Encryption Configuration**
```env
NEXT_PUBLIC_SEAL_PACKAGE_ID=0x98f8a6ce208764219b23dc51db45bf11516ec0998810e98f3a94548d788ff679
```

### Platform Settings
```env
NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE=250
NEXT_PUBLIC_FEE_DENOMINATOR=10000
NEXT_PUBLIC_DEFAULT_GAS_BUDGET=100000000
NEXT_PUBLIC_MAX_GAS_BUDGET=1000000000
```

## Development Guide

### Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── agent/                   # AI agent interface
│   ├── api/                     # API route handlers
│   ├── dashboard/               # User dashboard
│   ├── marketplace/             # Marketplace pages
│   ├── model/                   # Model detail pages
│   └── upload/                  # Model upload flow
├── components/                   # React UI components
│   ├── dashboard/               # Dashboard-specific components
│   ├── marketplace/             # Marketplace components
│   ├── purchase/                # Purchase flow components
│   ├── tee/                     # TEE verification components
│   ├── ui/                      # Shared UI components
│   └── upload/                  # Upload flow components
├── lib/                          # Core libraries and utilities
│   ├── integrations/            # External service integrations
│   │   ├── nautilus/           # TEE verification integration
│   │   ├── seal/               # Encryption integration
│   │   ├── sui/                # Blockchain integration
│   │   └── walrus/             # Storage integration
│   ├── services/               # Business logic services
│   └── utils/                  # Utility functions
├── hooks/                        # Custom React hooks
├── providers/                    # React context providers
└── types/                       # TypeScript type definitions
```

### Key Development Commands

**Type Checking**
```bash
npx tsc --noEmit
```

**Build Production**
```bash
npm run build
```

**Local Testing**
```bash
npm test
```

**Dependency Updates**
```bash
npm audit
npm update
```

### Code Quality Standards

- TypeScript strict mode enabled
- Comprehensive type definitions required
- Component props interfaces mandatory
- Error boundary implementation for resilience
- Responsive design for mobile compatibility

## API Documentation

### Core API Routes

**Model Upload**
- `POST /api/marketplace/create-listing`: Create new model listing
- File size limits: 1GB for models, 100MB for datasets
- Supported formats: .pkl, .pt, .pth, .h5, .onnx, .pb, .tflite, .json

**TEE Verification**
- `POST /api/tee-verification`: Request model verification
- Timeout: 300 seconds for verification completion
- Returns quality scores, performance metrics, bias assessment

**Blob Decryption**
- `POST /api/decrypt-blobs`: Decrypt purchased model files
- Requires valid purchase transaction proof
- Returns signed download URLs with expiration

### Response Formats

All API responses follow standardized JSON format:
```json
{
  "success": boolean,
  "data": object | null,
  "error": string | null,
  "timestamp": string
}
```

## Security Model

### Threat Mitigation

**Data Privacy**
- End-to-end encryption using SEAL homomorphic encryption
- Zero-knowledge proof systems for verification
- Client-side key generation and management
- Encrypted storage with access control policies

**Network Security**
- HTTPS/TLS encryption for all communications
- Rate limiting on API endpoints
- CORS protection for cross-origin requests
- Input validation and sanitization

**Smart Contract Security**
- Formal verification of critical contract functions
- Multi-signature requirements for admin operations
- Upgrade mechanisms with governance controls
- Economic incentives aligned with security

### Audit & Compliance

- Regular security audits of smart contract code
- Penetration testing of web application
- Compliance with data protection regulations
- Bug bounty program for vulnerability disclosure

## Network Architecture

### Sui Blockchain Integration

**Transaction Types**
- Model listing creation and updates
- Purchase transactions with escrow
- Access permission grants and revocations
- Platform fee collection and distribution

**Consensus Mechanism**
- Byzantine Fault Tolerant consensus
- Sub-second finality for transactions
- Parallel transaction execution
- Move programming language for safety

### Walrus Storage Network

**Storage Characteristics**
- Distributed across multiple geographic regions
- Erasure coding for fault tolerance
- Content-addressed storage with cryptographic hashing
- Automatic replication and recovery

**Performance Metrics**
- 99.9% availability SLA
- Sub-second retrieval for cached content
- Automatic load balancing across nodes
- CDN integration for global distribution

## Contributing

### Development Workflow

1. **Fork Repository**: Create personal fork of the main repository
2. **Feature Branch**: Create descriptive branch name for new features
3. **Development**: Implement changes with comprehensive tests
4. **Quality Checks**: Ensure all tests pass and code meets standards
5. **Pull Request**: Submit detailed PR with description of changes
6. **Code Review**: Address feedback from maintainers
7. **Merge**: Changes integrated after approval

### Contribution Guidelines

- Follow TypeScript best practices
- Maintain test coverage above 80%
- Include documentation for new features
- Respect existing code style and patterns
- Test on multiple browsers and devices

### Issue Reporting

When reporting issues, include:
- Detailed reproduction steps
- Expected vs actual behavior
- Browser and operating system information
- Console errors and stack traces
- Screenshots for UI-related issues

## License

This project is proprietary software. All rights reserved.

## Support & Contact

For technical support, bug reports, or feature requests:
- GitHub Issues: Primary communication channel
- Documentation: Comprehensive guides and API reference
- Community: Developer forum for discussions

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Network**: Sui Testnet