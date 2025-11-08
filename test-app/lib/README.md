# Walrus Integration

This module handles integration with Walrus decentralized storage for AI model files.

## Directory Structure

- **config/**: Walrus network configuration and connection settings
- **lib/**: Core Walrus client library and helpers
- **services/**: High-level services for model upload/download
- **types/**: TypeScript type definitions for Walrus data structures
- **utils/**: Utility functions for blob handling, chunking, and validation

## Key Features

- Upload AI models to Walrus storage
- Download and retrieve models using blob IDs
- Handle large file chunking and reassembly
- Verify blob integrity with content hashing
- Manage storage proofs and attestations

## Integration Points

- Marketplace contracts store Walrus blob IDs
- Models are encrypted before upload (via Seal integration)
- Blob IDs are used as references in asset listings