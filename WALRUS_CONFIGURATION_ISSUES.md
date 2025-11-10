# Walrus Configuration Issues and Resolution

## Problem Summary
The Walrus upload and download functionality is failing due to incorrect endpoint configurations in the environment variables. The current configuration is using outdated devnet endpoints that are no longer functional.

## Current Configuration Issues

### ❌ Problematic Endpoints (In .env.local)
```bash
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator-devnet.walrus.space
NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher-devnet.walrus.space
NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT=0x50b84b68eb9da4c6d904a929f43638481c09c03be6274b8569778fe085c1590d
```

### 🔍 Test Results
- `https://aggregator-devnet.walrus.space` → **522 Connection Timeout**
- `https://publisher-devnet.walrus.space` → **522 Connection Timeout**
- `https://aggregator-testnet.walrus.space` → **000 Connection Failed**
- `https://publisher-testnet.walrus.space` → **000 Connection Failed**

## ✅ Correct Configuration

### Working Endpoints (Walrus Testnet)
```bash
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT=0x6c2547cbbc38025cf3adac45f63cb0a8d12ecf777cdc75a4971612bf97fdf6af
```

### ✅ Verified Working
- `https://aggregator.walrus-testnet.walrus.space/v1/api` → **200 OK**
- `https://publisher.walrus-testnet.walrus.space/v1/api` → **200 OK**

## Network Infrastructure Changes

### Timeline
- **2024**: Walrus launched on Devnet
- **October 2024**: Walrus Public Testnet launched
- **March 2025**: Walrus Mainnet launched (Epoch 1)

### Current Status
- **Devnet**: Deprecated/Non-functional endpoints
- **Testnet**: 25 community-operated storage nodes, fully functional
- **Mainnet**: 100+ storage nodes, production ready

## Required Configuration Updates

### 1. Update Environment Variables
Replace the following in your `.env.local` file:

```bash
# OLD - Remove these
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator-devnet.walrus.space
NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher-devnet.walrus.space
NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT=0x50b84b68eb9da4c6d904a929f43638481c09c03be6274b8569778fe085c1590d

# NEW - Add these
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT=0x6c2547cbbc38025cf3adac45f63cb0a8d12ecf777cdc75a4971612bf97fdf6af
```

### 2. Additional Testnet Configuration
```bash
# Testnet System Objects (from Walrus docs)
NEXT_PUBLIC_WALRUS_STAKING_OBJECT=0xbe46180321c30aab2f8b3501e24048377287fa708018a5b7c2792b35fe339ee3
NEXT_PUBLIC_WALRUS_EXCHANGE_OBJECTS=0xf4d164ea2def5fe07dc573992a029e010dba09b1a8dcbc44c5c2e79567f39073,0x19825121c52080bb1073662231cfea5c0e4d905fd13e95f21e9a018f2ef41862,0x83b454e524c71f30803f4d6c302a86fb6a39e96cdfb873c2d1e93bc1c26a3bc5,0x8d63209cf8589ce7aef8f262437163c67577ed09f3e636a9d8e0813843fb8bf1

# Sui RPC for Testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

## API Endpoints and Features

### Aggregator API
- **Base URL**: `https://aggregator.walrus-testnet.walrus.space`
- **API Spec**: `https://aggregator.walrus-testnet.walrus.space/v1/api`
- **Purpose**: Download and retrieve stored blobs

### Publisher API  
- **Base URL**: `https://publisher.walrus-testnet.walrus.space`
- **API Spec**: `https://publisher.walrus-testnet.walrus.space/v1/api`
- **Purpose**: Upload new blobs to storage
- **Size Limit**: 10 MiB by default (can be increased with custom publisher)

## Implementation Impact

### Services Affected
1. **WalrusStorageService** (`/lib/integrations/walrus/services/storage-service.ts`)
2. **MarketplaceService** (`/lib/services/marketplace-service.ts`)
3. **Model Upload Wizard** (`/components/upload/ModelUploadWizard.tsx`)

### Expected Improvements After Update
- ✅ File uploads will work correctly
- ✅ File downloads will work correctly
- ✅ Blob ID verification will function
- ✅ Storage health checks will pass
- ✅ Real marketplace functionality will be enabled

## Testing After Configuration Update

### 1. Health Check
```bash
curl -s "https://aggregator.walrus-testnet.walrus.space/v1/api"
curl -s "https://publisher.walrus-testnet.walrus.space/v1/api"
```

### 2. Upload Test (via CLI)
```bash
# After updating .env.local, test upload in the app:
# 1. Go to /upload page
# 2. Select a small test file
# 3. Fill out model details
# 4. Submit upload
# 5. Verify blob ID is generated
```

### 3. Download Test
```bash
# Test downloading a blob via aggregator:
curl -s "https://aggregator.walrus-testnet.walrus.space/v1/<blob_id>"
```

## Alternative Endpoints

If the primary testnet endpoints become unavailable, consider these alternatives:

### Community Providers
- **Staketab Mainnet Publisher**: `https://walrus-mainnet-publisher-1.staketab.org:443`
- **Nami Cloud**: Provides API access to Walrus services

### Self-Hosted Option
For production applications, consider running your own publisher/aggregator nodes as documented in the Walrus setup guides.

## Resources
- [Walrus Documentation](https://docs.wal.app)
- [Walrus Testnet Announcement](https://www.mystenlabs.com/blog/walrus-public-testnet-launches-redefining-decentralized-data-storage)
- [Walrus API Reference](https://docs.wal.app/usage/web-api.html)
- [Awesome Walrus Tools](https://github.com/MystenLabs/awesome-walrus)

---

**Action Required**: Update the environment configuration with the correct Walrus testnet endpoints to restore upload/download functionality.