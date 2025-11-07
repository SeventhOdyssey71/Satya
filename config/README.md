# Environment Configuration

This directory contains environment configuration files for the Satya Marketplace.

## Files

- **environment.ts** - TypeScript configuration loader with type safety
- **../env** - Environment variables file (not in git)
- **../.env.example** - Example environment file for reference

## Usage

### Basic Usage

```typescript
import { env, validateEnvironment } from './config/environment';

// Validate environment on startup
validateEnvironment();

// Use configuration
console.log('Running on network:', env.network);
console.log('Sui RPC URL:', env.sui.rpcUrl);
console.log('Seal Package ID:', env.seal.packageId);
```

### Integration Examples

```typescript
// Initialize Sui client
import { SuiClient } from '@mysten/sui.js/client';

const suiClient = new SuiClient({
  url: env.sui.rpcUrl,
});

// Configure Walrus client
const walrusConfig = {
  aggregator: env.walrus.aggregator,
  publisher: env.walrus.publisher,
  systemObject: env.walrus.systemObject,
  defaultEpochs: env.walrus.defaultEpochs,
};

// Configure Seal client
const sealConfig = {
  packageId: env.seal.packageId,
  keyServers: env.seal.keyServers,
  threshold: env.seal.threshold,
};
```

## Environment Variables

### Required Variables

- `SUI_PRIVATE_KEY` - Private key for Sui transactions
- `SUI_WALLET_ADDRESS` - Wallet address for transactions
- `TREASURY_ADDRESS` - Treasury address for platform fees
- `SEAL_PACKAGE_ID` - Deployed Seal package ID
- `SEAL_UPGRADE_CAP_ID` - Seal upgrade capability ID
- `WALRUS_AGGREGATOR` - Walrus aggregator endpoint
- `WALRUS_PUBLISHER` - Walrus publisher endpoint
- `WALRUS_SYSTEM_OBJECT` - Walrus system object ID

### Optional Variables

All other variables have sensible defaults and are optional.

## Security Notes

- Never commit `.env` files to git
- Use strong session secrets in production
- Rotate private keys regularly
- Use environment-specific configurations

## Network Configurations

### Testnet (Current)

- **Sui Network**: testnet
- **Walrus Network**: devnet 
- **Seal**: Deployed testnet package

### Production Checklist

Before deploying to production:

1. ✅ Change `SESSION_SECRET`
2. ✅ Set appropriate gas budgets
3. ✅ Configure production endpoints
4. ✅ Set up monitoring
5. ✅ Configure rate limiting
6. ✅ Set proper CORS origins