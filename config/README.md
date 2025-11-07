# Environment Configuration

Environment configuration loader for the Satya Marketplace.

## Usage

```typescript
import { env, validateEnvironment } from './config/environment';

// Validate environment on startup
validateEnvironment();

// Use configuration
console.log('Network:', env.network);
console.log('Sui RPC:', env.sui.rpcUrl);
```

## Setup

1. Copy `.env.example` to `.env`
2. Fill in your values
3. Never commit `.env` to git

## Required for Production

- `SUI_PRIVATE_KEY` - Wallet private key
- `SUI_WALLET_ADDRESS` - Wallet address
- `MARKETPLACE_PACKAGE_ID` - Deployed contract ID
- `SEAL_PACKAGE_ID` - Seal package ID
- `WALRUS_SYSTEM_OBJECT` - Walrus system object ID