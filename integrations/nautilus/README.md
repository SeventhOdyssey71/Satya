# Nautilus Integration for Satya Marketplace

This integration enables secure off-chain computation with on-chain attestation for AI model processing and validation.

## Architecture

The Nautilus integration follows the pattern: **User Input → Enclave Processing → Signed Response → On-Chain Attestation**

### Core Components

1. **Enclave Server** (`/enclave-server`)
   - Runs inside AWS Nitro Enclave
   - Processes AI model validation requests
   - Generates signed attestations

2. **Move Contracts** (`/move-contracts`)
   - On-chain verification of enclave signatures
   - Stores attestation records
   - Manages enclave registration

3. **Client Library** (`/client`)
   - TypeScript SDK for interacting with enclaves
   - Handles attestation verification
   - Manages enclave connections

## Data Flow

```
1. User submits AI model/data for processing
   ↓
2. Request sent to Nautilus enclave
   ↓
3. Enclave processes data securely
   ↓
4. Enclave signs result with ephemeral key
   ↓
5. Signed attestation returned to user
   ↓
6. User verifies attestation on-chain
   ↓
7. Attestation stored on Sui blockchain
```

## Use Cases

- **Model Validation**: Verify AI model integrity and performance
- **Data Processing**: Secure computation on sensitive data
- **Compliance Checks**: Automated regulatory compliance verification
- **Performance Benchmarking**: Trusted model performance metrics

## Directory Structure

```
nautilus/
├── enclave-server/     # Rust server running in enclave
│   ├── src/
│   │   ├── apps/       # Application-specific logic
│   │   ├── common/     # Shared utilities
│   │   └── main.rs     # Entry point
│   └── Cargo.toml
├── move-contracts/     # Sui Move smart contracts
│   ├── sources/
│   │   ├── attestation.move
│   │   └── enclave_registry.move
│   └── Move.toml
├── client/            # TypeScript client library
│   ├── src/
│   │   ├── attestation.ts
│   │   ├── enclave.ts
│   │   └── types.ts
│   └── package.json
├── config/            # Configuration files
│   ├── enclave.yaml
│   └── endpoints.yaml
├── types/             # Shared type definitions
├── utils/             # Helper utilities
├── tests/             # Integration tests
└── docs/              # Documentation
```

## Setup Instructions

See [docs/setup.md](docs/setup.md) for detailed setup instructions.

## Integration with Marketplace

This integration connects with:
- **Walrus**: For storing model data
- **Seal**: For access control and encryption
- **Sui Blockchain**: For attestation records