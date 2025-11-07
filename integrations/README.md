# Integrations

This directory contains integration modules for external services used by the Satya marketplace.

## Modules

### Walrus Integration (`/walrus`)
Decentralized storage integration for AI model files. All data stored on Walrus is public, so models are encrypted before upload using Seal.

### Seal Integration (`/seal`)
Threshold encryption and programmable access control. Handles encryption of AI models before storage and manages decryption based on on-chain purchase records.

## Architecture

```
Model Upload Flow:
1. Model → Seal Encryption → Encrypted Model
2. Encrypted Model → Walrus Storage → Blob ID
3. Blob ID + Access Policy → Smart Contract

Model Access Flow:
1. Purchase → Smart Contract → Access Grant
2. Access Grant + Request → Seal Key Servers → Decryption Key
3. Blob ID → Walrus → Encrypted Model
4. Encrypted Model + Decryption Key → Original Model
```

## Development

Each integration module is structured as:
- `config/`: Configuration and environment settings
- `lib/`: Core client libraries
- `services/`: High-level service implementations
- `types/`: TypeScript type definitions
- `utils/`: Utility functions

## References

- [Walrus Documentation](https://docs.walrus.site)
- [Seal Documentation](https://github.com/MystenLabs/seal-protocol)
- [Sui Move Documentation](https://docs.sui.io)