# Network Integration Tests

This document outlines the requirements and setup needed for running network integration tests against live Sui, Walrus, and Seal testnets.

## Prerequisites

### 1. Sui Wallet & Testnet Funds
- **Sui Wallet Address**: Required for signing transactions
- **Testnet SUI Tokens**: Obtain from [Sui Testnet Faucet](https://discord.com/channels/916379725201563759/971488439931392130)
- **Private Key**: Store securely in environment variables

### 2. Walrus Testnet Access
- **Publisher URL**: `https://publisher-devnet.walrus.space`
- **Aggregator URL**: `https://aggregator-devnet.walrus.space`
- **WAL Tokens**: Required for storage operations
  - Obtain from Walrus testnet faucet
  - Each blob storage requires WAL tokens based on size and duration

### 3. Seal Testnet Configuration
- **Key Server URLs**: Already configured in `/integrations/seal/config/seal.config.ts`
- **Testnet Contract**: Deploy Seal-enabled contracts to Sui testnet
- **Session Keys**: Generated automatically per user session

## Environment Setup

Create a `.env.testnet` file with the following variables:

```bash
# Sui Configuration
SUI_NETWORK=testnet
SUI_PRIVATE_KEY=your_private_key_here
SUI_ADDRESS=your_sui_address_here

# Walrus Configuration
WALRUS_NETWORK=testnet
WALRUS_PUBLISHER=https://publisher-devnet.walrus.space
WALRUS_AGGREGATOR=https://aggregator-devnet.walrus.space

# Contract Addresses (after deployment)
MARKETPLACE_PACKAGE_ID=
MARKETPLACE_ADMIN_CAP=
VERIFIER_REGISTRY_ID=
ACCESS_CONTROL_ID=

# Test Configuration
TEST_TIMEOUT_MS=30000
MAX_RETRY_ATTEMPTS=3
```

## Required NPM Packages

```json
{
  "devDependencies": {
    "@mysten/sui.js": "^0.50.0",
    "dotenv": "^16.3.1",
    "@types/node": "^20.10.5"
  }
}
```

## Test Structure

### 1. Contract Deployment Tests (`deploy.test.ts`)
- Deploy marketplace contract
- Deploy verifier contract  
- Deploy access control contract
- Initialize platform with admin capabilities
- Verify deployment addresses

### 2. Walrus Integration Tests (`walrus-network.test.ts`)
- Upload test AI model to Walrus
- Verify blob storage and retrieval
- Test chunked uploads for large models
- Verify storage node health checks
- Test epoch-based storage duration

### 3. Seal Encryption Tests (`seal-network.test.ts`)
- Generate and encrypt DEKs with Seal
- Create payment-gated policies on-chain
- Test threshold encryption with key servers
- Verify policy enforcement
- Test session management and refresh

### 4. End-to-End Marketplace Tests (`marketplace-e2e.test.ts`)
- List AI model with encrypted metadata
- Upload model to Walrus
- Encrypt with Seal policy
- Create on-chain listing
- Execute purchase transaction
- Verify access control post-purchase
- Download and decrypt model

## Running Network Tests

```bash
# Install dependencies
pnpm install

# Run contract deployment
pnpm run test:deploy

# Run individual test suites
pnpm run test:walrus-network
pnpm run test:seal-network
pnpm run test:marketplace-e2e

# Run all network tests
pnpm run test:network
```

## Important Considerations

### Rate Limits
- Walrus testnet has rate limits per IP
- Implement exponential backoff for retries
- Cache successful responses where appropriate

### Gas Costs
- Each Sui transaction requires gas
- Estimate ~0.01 SUI per transaction
- Monitor balance and refill as needed

### Storage Costs
- Walrus charges based on blob size and storage duration
- 1 epoch = ~24 hours
- Minimum 5 epochs recommended for testing

### Network Latency
- Testnet responses can be slow (5-30 seconds)
- Implement proper timeouts and retries
- Use async/await patterns consistently

### Error Handling
- Network requests may fail intermittently
- Implement comprehensive error catching
- Log all failures for debugging
- Provide clear error messages

## Monitoring & Debugging

### Sui Explorer
- Track transactions: https://suiexplorer.com/?network=testnet
- Verify contract deployments
- Monitor gas usage

### Walrus Dashboard
- Monitor blob storage: https://walrus-testnet-dashboard.mystenlabs.com
- Check storage node status
- Verify blob availability

### Logging
- Enable debug logging for network requests
- Log all transaction hashes
- Track blob IDs and policy IDs
- Monitor encryption/decryption times

## Security Notes

1. **Never commit private keys** - Use environment variables
2. **Rotate test keys regularly** - Generate new keys for each test cycle
3. **Monitor gas spending** - Set limits to prevent drainage
4. **Use testnet only** - Never use mainnet keys in test environment
5. **Clean up test data** - Remove test blobs and contracts after testing

## Next Steps

1. Set up environment variables
2. Obtain testnet tokens
3. Deploy contracts to testnet
4. Run integration tests
5. Monitor and debug any failures
6. Document test results
7. Prepare for mainnet deployment