# Seal Integration

This module handles integration with Seal for threshold encryption and programmable access control.

## Directory Structure

- **config/**: Seal key server configurations and network settings
- **lib/**: Core Seal encryption/decryption library
- **services/**: High-level services for access policy management
- **types/**: TypeScript type definitions for Seal data structures
- **utils/**: Utility functions for encryption, key management, and policy handling

## Key Features

- Threshold encryption for AI model files
- Programmable access policies via smart contracts
- Integration with Seal testnet key servers
- Envelope encryption pattern (DEK + KEK)
- Decryption request management

## Integration Points

- Access policies stored on-chain in access.move contract
- Models encrypted before Walrus upload
- Purchase grants trigger access policy updates
- Key servers validate decryption requests against on-chain policies

## Encryption Flow

1. Generate Data Encryption Key (DEK)
2. Encrypt model with DEK
3. Encrypt DEK with Seal (threshold encryption)
4. Store encrypted model on Walrus
5. Store encrypted DEK and policy on-chain