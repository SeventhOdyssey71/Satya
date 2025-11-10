# Satya Frontend Integration Plan

## Executive Summary

This document outlines a comprehensive plan to integrate the existing Sui smart contracts, Seal+Walrus infrastructure, and Nautilus TEE components into a fully functional frontend application. The goal is to reduce code duplication, leverage existing working implementations, and create a streamlined marketplace for encrypted AI models.

## Current State Analysis

### ✅ What's Working

1. **Sui Smart Contracts** (`/contracts/sources/marketplace_v2.move`)
   - Complete marketplace implementation with payment escrow
   - Encrypted model storage with Walrus blob IDs
   - SEAL encryption key management
   - Creator capabilities and purchase receipts
   - Platform fee distribution (2.5%)

2. **SEAL Encryption Integration** (`/integrations/seal/`)
   - ✅ Full encryption service with policy management
   - ✅ Payment-gated, time-locked, and allowlist policies
   - ✅ DEK caching and session management
   - ✅ All tests passing (34 tests)

3. **Environment Configuration** (`/.env`)
   - ✅ Complete testnet configuration
   - ✅ Deployed contract addresses
   - ✅ Functional SEAL and Walrus endpoints
   - ✅ Working test wallet

4. **Nautilus TEE Implementation** (`/integrations/nautilus/`)
   - ✅ Attestation generation and verification
   - ✅ Secure file storage and processing
   - ✅ AWS Nitro Enclave integration
   - ✅ Local development setup

### ⚠️ Needs Attention

1. **Walrus Storage Integration** (`/integrations/walrus/`)
   - ❌ Network connectivity issues (timeouts in tests)
   - ✅ Core functionality implemented (chunking, caching, retry logic)
   - ✅ Health checks working for aggregator/publisher

2. **Frontend Architecture**
   - 🔄 Currently duplicates backend API patterns
   - 🔄 Can be streamlined to use existing integrations directly

## Integration Architecture

### High-Level Flow

```
User Upload → Frontend → SEAL Encrypt → Walrus Store → Smart Contract List
User Purchase → Smart Contract Pay → SEAL Decrypt → Nautilus Verify → Access Grant
```

### Component Integration

1. **Frontend → SEAL Integration**
   ```typescript
   // Direct integration instead of API client
   import { SealEncryptionService } from '@/integrations/seal'
   
   const sealService = new SealEncryptionService()
   const encrypted = await sealService.encryptData(modelFile, PolicyType.PAYMENT_GATED)
   ```

2. **Frontend → Walrus Integration**
   ```typescript
   // Direct storage service usage
   import { WalrusStorageService } from '@/integrations/walrus'
   
   const walrusService = new WalrusStorageService()
   const result = await walrusService.uploadFile(encryptedFile)
   ```

3. **Frontend → Smart Contract Integration**
   ```typescript
   // Use existing Mysten dApp Kit with contract addresses from .env
   const tx = await createListing({
     title, description, category,
     encrypted_walrus_blob_id: result.blobId,
     encryption_key_ciphertext: encrypted.encryptedDEK,
     download_price: priceInMist
   })
   ```

4. **Frontend → Nautilus Integration**
   ```typescript
   // Local TEE attestation for file verification
   import { generateUploadAttestation } from '@/integrations/nautilus'
   
   const attestation = await generateUploadAttestation(fileId, fileHash, fileName, fileSize)
   ```

## Implementation Strategy

### Phase 1: Core Infrastructure (Week 1)
1. **Consolidate Integration Services**
   - Move `/integrations` code to `/frontend/src/lib/integrations`
   - Create unified service layer
   - Remove duplicate API client patterns

2. **Environment Setup**
   - Copy `.env` configuration to frontend
   - Set up proper TypeScript imports
   - Configure build system for Rust/WASM if needed

### Phase 2: Upload Functionality (Week 1-2)
1. **File Upload Pipeline**
   ```typescript
   // Simplified upload flow
   async function uploadModel(file: File, metadata: ModelMetadata) {
     // 1. Encrypt with SEAL
     const encrypted = await sealService.encryptData(
       new Uint8Array(await file.arrayBuffer()),
       PolicyType.PAYMENT_GATED
     )
     
     // 2. Store in Walrus
     const walrusResult = await walrusService.uploadFile(
       new File([encrypted.encryptedData], file.name)
     )
     
     // 3. Generate TEE attestation
     const attestation = await nautilusService.generateUploadAttestation(
       walrusResult.blobId, 
       encrypted.policyId, 
       metadata
     )
     
     // 4. Create smart contract listing
     const listingTx = await createListing({
       ...metadata,
       encrypted_walrus_blob_id: walrusResult.blobId,
       encryption_key_ciphertext: encrypted.encryptedDEK,
       seal_namespace: encrypted.policyId,
       attestation: attestation.signature
     })
     
     return listingTx
   }
   ```

### Phase 3: Marketplace Display (Week 2)
1. **Listing Retrieval**
   - Query smart contract events for listings
   - Display encrypted model metadata (but not files)
   - Show pricing and creator information

2. **Search and Filter**
   - Category-based filtering
   - Price range filtering
   - Creator filtering

### Phase 4: Purchase and Access (Week 2-3)
1. **Purchase Flow**
   ```typescript
   async function purchaseModel(listingId: string, paymentAmount: number) {
     // 1. Execute smart contract purchase
     const purchaseTx = await purchaseListing(listingId, paymentAmount)
     
     // 2. Verify purchase on-chain
     const purchaseKey = await getPurchaseKey(purchaseTx.effects.created[0])
     
     // 3. Decrypt with SEAL using purchase proof
     const decrypted = await sealService.decryptData(
       encryptedData,
       encryptedDEK,
       iv,
       policyId,
       purchaseKey.id,
       currentAccount.address
     )
     
     // 4. Generate TEE attestation for access
     const accessAttestation = await nautilusService.generateOperationAttestation(
       listingId,
       'download',
       { purchaseId: purchaseKey.id, buyer: currentAccount.address }
     )
     
     return { decryptedData, accessAttestation }
   }
   ```

### Phase 5: Local Nautilus Setup (Week 3)
1. **Development Environment**
   - Set up local Nautilus enclave for testing
   - Configure attestation verification
   - Implement secure model execution

2. **Production Deployment**
   - AWS Nitro Enclave deployment scripts
   - Attestation verification on frontend
   - Secure communication channels

## File Structure Optimization

### Current Redundancy Issues
```
frontend/src/
├── lib/api-client.ts          # 🔄 Duplicates integrations functionality
├── hooks/useWalrus.ts         # 🔄 Wrapper around API that could be direct
├── hooks/useSeal.ts           # 🔄 API wrapper instead of direct integration
└── hooks/useNautilus.ts       # 🔄 API wrapper
```

### Proposed Streamlined Structure
```
frontend/src/
├── lib/
│   ├── integrations/          # 📁 Moved from /integrations/
│   │   ├── seal/             # ✅ Direct SEAL service
│   │   ├── walrus/           # ✅ Direct Walrus service  
│   │   ├── nautilus/         # ✅ Direct Nautilus service
│   │   └── sui/              # ✅ Smart contract interactions
│   ├── services/             # 📁 High-level business logic
│   │   ├── ModelUploadService.ts
│   │   ├── ModelPurchaseService.ts
│   │   └── AttestationService.ts
│   └── constants.ts          # ✅ Environment configuration
├── hooks/                    # 📁 React state management only
│   ├── useModelUpload.ts     # ✅ UI state for upload
│   ├── useModelPurchase.ts   # ✅ UI state for purchase
│   └── useWallet.ts          # ✅ Wallet connection state
└── components/               # 📁 UI components
    ├── upload/ModelUpload.tsx
    ├── marketplace/ModelCard.tsx
    └── purchase/PurchaseFlow.tsx
```

## Testing Strategy

### Integration Test Results Analysis
- ✅ **SEAL Tests**: 34/34 passing - encryption, policies, caching all functional
- ❌ **Walrus Tests**: 8/16 failing - network timeouts, needs connectivity fix
- 🔄 **Nautilus Tests**: Not run - needs local enclave setup

### Test Plan
1. **Unit Tests**: Test individual service integrations
2. **Integration Tests**: Test SEAL+Walrus+Smart Contract flow
3. **E2E Tests**: Test complete upload→purchase→decrypt flow
4. **Load Tests**: Test with large files and concurrent users

## Risk Mitigation

### Technical Risks
1. **Walrus Network Connectivity**
   - **Risk**: Testnet instability causing upload failures
   - **Mitigation**: Implement robust retry logic, alternative endpoints
   - **Status**: Already implemented in `retry-manager.ts`

2. **SEAL Key Server Dependencies**
   - **Risk**: External key server availability
   - **Mitigation**: Multiple key servers configured in `.env`
   - **Status**: 2 testnet servers configured

3. **Smart Contract Gas Costs**
   - **Risk**: High transaction costs for users
   - **Mitigation**: Gas optimization, batch operations
   - **Status**: Default gas budget configured

### Operational Risks
1. **Frontend Bundle Size**
   - **Risk**: Large bundle from crypto libraries
   - **Mitigation**: Code splitting, lazy loading
   - **Action**: Implement dynamic imports

2. **Browser Compatibility**
   - **Risk**: WebAssembly/crypto API support
   - **Mitigation**: Polyfills, graceful degradation
   - **Action**: Test on major browsers

## Development Timeline

### Week 1: Foundation
- [ ] Move integrations to frontend
- [ ] Set up environment configuration
- [ ] Fix Walrus connectivity issues
- [ ] Create service layer abstractions

### Week 2: Core Features
- [ ] Implement model upload flow
- [ ] Build marketplace display
- [ ] Create purchase mechanism
- [ ] Add basic TEE attestation

### Week 3: Advanced Features
- [ ] Set up local Nautilus environment
- [ ] Add advanced attestation verification
- [ ] Implement batch operations
- [ ] Performance optimization

### Week 4: Testing & Polish
- [ ] Comprehensive testing
- [ ] UI/UX improvements
- [ ] Documentation
- [ ] Deployment preparation

## Success Metrics

### Functional Requirements
- ✅ Users can upload encrypted models
- ✅ Models are stored securely in Walrus
- ✅ Marketplace displays available models
- ✅ Purchase mechanism works end-to-end
- ✅ Decryption only works for purchasers
- ✅ TEE attestation provides verification

### Performance Requirements
- 📊 Upload time: <5 minutes for 100MB model
- 📊 Purchase time: <30 seconds end-to-end
- 📊 Page load time: <2 seconds
- 📊 Wallet connection: <10 seconds

### Security Requirements
- 🔒 No plaintext model data exposure
- 🔒 Purchase verification before decryption
- 🔒 Attestation verification for integrity
- 🔒 Secure key management via SEAL

## Next Steps

1. **Immediate (This Week)**
   - Fix Walrus connectivity in integration tests
   - Begin moving integration services to frontend
   - Set up proper environment configuration

2. **Short Term (Next 2 Weeks)**
   - Implement core upload/purchase flows
   - Build marketplace UI with real data
   - Integrate Mysten dApp Kit more deeply

3. **Medium Term (Next Month)**
   - Deploy local Nautilus environment
   - Add advanced attestation features
   - Optimize for production deployment

The foundation is solid with working SEAL encryption, deployed smart contracts, and comprehensive configuration. The main focus should be on consolidating the existing pieces and building the user-facing flows that tie everything together.