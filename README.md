# Satya

A decentralized AI marketplace platform built on the Sui blockchain that enables secure trading of AI models and datasets using TEE verification and distributed storage.

## Architecture

### Core Components

- **Frontend**: Next.js 15 application with TypeScript
- **Blockchain**: Sui testnet for smart contracts and transactions
- **Storage**: Walrus distributed storage network
- **Encryption**: SEAL library for homomorphic encryption
- **Verification**: TEE (Trusted Execution Environment) attestation

### Technology Stack

- Next.js 15.0.3 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- @mysten/dapp-kit for Sui integration
- React 18 for UI components

## Features

### Marketplace
- Browse and search AI models
- Filter by category, price, and verification status
- Model details with TEE verification badges
- Purchase flow with SUI cryptocurrency

### Upload System
- Multi-step model upload wizard
- File validation and metadata collection
- SEAL encryption for secure storage
- Walrus storage integration
- Smart contract listing creation

### Security
- TEE verification for model authenticity
- SEAL encryption for confidential computation
- Blockchain-verified transactions
- Distributed storage on Walrus network

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Sui wallet (for blockchain interactions)

### Installation

1. Clone the repository
```bash
git clone https://github.com/SeventhOdyssey71/Satya.git
cd Satya
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env.local
```

4. Start development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Environment Configuration

Key environment variables:

- `NEXT_PUBLIC_SUI_NETWORK`: Sui network (testnet/devnet)
- `NEXT_PUBLIC_SUI_RPC_URL`: Sui RPC endpoint
- `NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID`: Deployed marketplace contract
- `NEXT_PUBLIC_WALRUS_AGGREGATOR`: Walrus storage aggregator URL
- `NEXT_PUBLIC_SEAL_PACKAGE_ID`: SEAL encryption contract

## Smart Contracts

The platform uses Sui Move contracts for:
- Marketplace operations (listings, purchases)
- Access control and permissions
- Payment processing with platform fees
- Model verification records

Contract addresses are configured in environment variables and deployed on Sui testnet.

## Storage Architecture

### Walrus Integration
- Distributed file storage across multiple nodes
- Blob-based storage with unique identifiers
- Redundant data replication
- HTTP API for upload/download operations

### SEAL Encryption
- Policy-based access control
- Homomorphic encryption for secure computation
- Session key management
- Multi-party key servers

## Development

### Building
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

### Testing
```bash
npm test
```

### Project Structure
```
src/
├── app/                    # Next.js app router pages
├── components/             # React components
├── lib/                    # Core libraries and utilities
│   ├── integrations/       # External service integrations
│   └── services/           # Business logic services
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── providers/              # React context providers
```

## Deployment

The application is configured for deployment on Vercel or similar platforms. Build artifacts are optimized for production with static generation where possible.

### Build Output
- Static pages for public content
- Server-side rendering for dynamic content
- API routes for backend functionality
- Optimized JavaScript bundles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with appropriate tests
4. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Network Information

**Current Deployment**: Sui Testnet
**Marketplace Contract**: 0xc29f2a2de17085ce...
**Platform Fee**: 2.5% (250 basis points)
**Supported File Formats**: .pkl, .pt, .pth, .h5, .onnx, .pb, .tflite, .json