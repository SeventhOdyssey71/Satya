# Satya Marketplace - Completion Prompts

This document contains comprehensive prompts to complete all remaining work on the Satya ML Marketplace project. Use these prompts with AI assistants to systematically complete each component.

---

## 🎯 PROMPT 1: Database & Persistence Layer Implementation

**Priority: CRITICAL - Blocks everything else**

```
I need to implement a complete database persistence layer for the Satya ML Marketplace project. 

**Project Context:**
- TypeScript/Node.js backend using Fastify
- PostgreSQL database (schema already designed in technical-architecture.md)
- Need to replace all in-memory Map registries with database storage
- Currently using Map<string, BlobMetadata> and similar in-memory structures

**Requirements:**
1. Set up PostgreSQL connection using Kysely ORM (as specified in technical-architecture.md)
2. Create database schema with all tables:
   - users, models, model_files, attestations, processing_jobs
   - listings, sales, access_keys, license_nfts
   - usage_records, reviews, model_analytics
3. Implement database models/types matching the schema
4. Create migration system for schema versioning
5. Replace in-memory registries in:
   - WalrusStorageService.blobRegistry → database table
   - SealEncryptionService.policyRegistry → database table
   - All other Map-based storage
6. Implement repository pattern for data access
7. Add connection pooling and error handling
8. Create seed data for development

**Files to create/modify:**
- api/src/database/connection.ts
- api/src/database/types.ts (Kysely types)
- api/src/database/migrations/ (migration files)
- api/src/repositories/ (repository classes)
- Update all services to use repositories instead of Maps

**Reference:**
- See technical-architecture.md for complete schema design
- Current in-memory usage in integrations/walrus/services/storage-service.ts and integrations/seal/services/encryption-service.ts

Please implement this completely with proper error handling, transactions, and TypeScript types.
```

---

## 🔐 PROMPT 2: SEAL Encryption SDK Integration

**Priority: CRITICAL - Core security feature**

```
I need to replace the mock SEAL encryption implementation with the real SEAL SDK integration.

**Project Context:**
- Satya ML Marketplace using SEAL for programmable encryption
- Currently has mock implementations in integrations/seal/services/encryption-service.ts
- Need real SEAL SDK integration for threshold encryption and key management

**Current Mock Code Locations:**
1. integrations/seal/services/encryption-service.ts:
   - encryptDEKWithSeal() - line 212 (currently mocked)
   - decryptDEKWithSeal() - line 225 (currently mocked)
   - verifyPaymentPolicy() - line 264 (needs on-chain verification)

2. integrations/seal/utils/session-manager.ts:
   - getOrCreateSession() - line 46 (currently mocked)

**Requirements:**
1. Install and configure SEAL SDK/package (check if @mysten/seal exists or use official SEAL protocol SDK) https://seal-docs.wal.app/
2. Replace mock encryptDEKWithSeal() with real SEAL encryption:
   - Use SEAL's identity-based encryption
   - Create proper policy objects
   - Encrypt DEK with policy-based access control
3. Replace mock decryptDEKWithSeal() with real SEAL decryption:
   - Connect to SEAL key servers
   - Implement threshold decryption
   - Handle session management properly
4. Implement on-chain policy verification:
   - Query Sui blockchain for purchase records
   - Verify buyer address has valid purchase
   - Check policy conditions (time-locked, allowlist, etc.)
5. Replace mock session management with real SEAL sessions
6. Add proper error handling for key server failures
7. Implement retry logic for network issues

**Integration Points:**
- Must work with SuiClient for on-chain verification
- Must integrate with WalrusStorageService for encrypted blob storage
- Must support PolicyType enum: PAYMENT_GATED, TIME_LOCKED, ALLOWLIST

**Files to modify:**
- integrations/seal/services/encryption-service.ts
- integrations/seal/utils/session-manager.ts
- integrations/seal/lib/encryption-core.ts (if needed)
- Add SEAL SDK dependencies to package.json

Please implement the real SEAL integration with proper error handling and documentation.
```

---

## 🛡️ PROMPT 3: Nautilus TEE Production Deployment

**Priority: HIGH - Differentiating feature**

```
I need to complete the Nautilus TEE integration and deploy it to AWS Nitro Enclaves for production.

**Project Context:**
- Satya ML Marketplace using Nautilus for verifiable model execution
- Rust-based TEE server exists in flowTest/nautilus-server/
- Currently has mock data generation that needs real Walrus integration
- Needs production deployment to AWS Nitro Enclaves

**Current Status:**
- TEE server code exists but uses mock data (flowTest/nautilus-server/src/apps/ml-marketplace/mod.rs)
- Deployment scripts exist but need completion
- Integration testing partially done

**Requirements:**
1. Replace mock data generation with real Walrus integration:
   - Remove generate_mock_data_for_blob() function
   - Implement real Walrus blob download in TEE
   - Handle encrypted blob decryption in enclave
   - Process real model files (PyTorch/TensorFlow)

2. Complete AWS Nitro Enclave deployment:
   - Fix SSH access for direct deployment
   - Build Nautilus enclave image
   - Deploy to EC2 with Nitro support
   - Expose endpoints securely
   - Configure security groups and networking

3. Implement health monitoring:
   - Health check endpoints
   - Auto-recovery mechanisms
   - Logging and monitoring integration

4. Register enclave with Sui blockchain:
   - Create Move contract for enclave registration
   - Store enclave attestation on-chain
   - Verify enclave identity

5. Complete end-to-end integration:
   - Model verification flow
   - Attestation generation and storage
   - Frontend integration with TEE endpoints

**Files to modify:**
- flowTest/nautilus-server/src/apps/ml-marketplace/mod.rs (remove mocks)
- flowTest/nautilus-server/src/main.rs
- Deployment scripts (configure_enclave.sh, register_enclave.sh)
- api/src/services/NautilusService.ts (remove mocks)

**Reference:**
- See flowTest/TEE_INTEGRATION_COMPLETE.md for deployment plan
- See accelerator-redac/nautilus-technical-deep-dive.md for architecture

Please implement the complete TEE integration with real Walrus data and production deployment.
```

---

## 📜 PROMPT 4: Smart Contract Deployment & Integration

**Priority: HIGH - Core marketplace functionality**

```
I need to deploy the Sui Move smart contracts and integrate them with the frontend and backend.

**Project Context:**
- Satya ML Marketplace with multiple Move contracts
- Contracts exist but not deployed to testnet/mainnet
- Frontend and backend reference package IDs that don't exist yet

**Contracts to Deploy:**
1. contracts/sources/marketplace.move - Core marketplace
2. contracts/sources/marketplace_v2.move - Enhanced marketplace
3. contracts/sources/access.move - Access control
4. contracts/sources/verifier.move - Attestation verification
5. integrations/nautilus/move/marketplace/sources/marketplace.move - Nautilus integration

**Requirements:**
1. Deploy all contracts to Sui testnet:
   - Use Sui CLI to build and deploy
   - Capture package IDs and object IDs
   - Store in environment configuration

2. Update environment configuration:
   - Add MARKETPLACE_PACKAGE_ID
   - Add MARKETPLACE_OBJECT_ID
   - Add ACCESS_PACKAGE_ID
   - Add VERIFIER_PACKAGE_ID
   - Update all references in code

3. Implement event listeners:
   - Listen for AssetListed events
   - Listen for AssetPurchased events
   - Listen for ListingCreated events
   - Update database when events occur

4. Connect frontend to deployed contracts:
   - Update SuiClient with real package IDs
   - Test transaction submission
   - Verify event emission

5. Create deployment scripts:
   - Automated deployment script
   - Verification script to check deployment
   - Rollback procedure

**Files to modify:**
- contracts/ (deployment scripts)
- flowTest/src/lib/integrations/sui/client.ts
- flowTest/src/lib/constants.ts
- api/src/services/MarketplaceService.ts
- config/environment.ts

**Reference:**
- See contracts/sources/ for contract code
- See api/docs/IMPLEMENTATION_SUMMARY.md for integration patterns

Please deploy the contracts and update all references with proper error handling.
```

---

## 💰 PROMPT 5: Complete Purchase Flow Implementation

**Priority: HIGH - Core user journey**

```
I need to complete the end-to-end purchase flow that's currently showing "coming soon" placeholders.

**Project Context:**
- Satya ML Marketplace purchase flow partially implemented
- Frontend shows "TODO: Implement purchase flow" in MarketplaceGrid.tsx
- Backend has purchase service but needs completion
- Need to integrate SEAL key distribution and license NFT creation

**Current Issues:**
1. MarketplaceGrid.tsx line 78: handlePurchase() shows alert instead of real flow
2. PurchaseTransactionService has mock implementations
3. Missing integration between purchase → SEAL keys → license NFT
4. No escrow completion logic

**Requirements:**
1. Complete frontend purchase flow:
   - Replace alert with real purchase modal/page
   - Show transaction status (pending, confirming, completed)
   - Display gas estimation
   - Handle wallet connection and signing
   - Show purchase confirmation with access details

2. Implement backend purchase service:
   - Create unsigned transaction for purchase
   - Handle signed transaction submission
   - Verify payment on-chain
   - Trigger SEAL key generation
   - Create license NFT
   - Update database with purchase record

3. Integrate SEAL key distribution:
   - After purchase confirmation, generate access keys
   - Encrypt keys with buyer's identity
   - Store keys in database
   - Provide download/access mechanism

4. Implement license NFT creation:
   - Mint NFT on Sui after purchase
   - Store NFT ID in database
   - Link NFT to purchase record
   - Enable NFT transfer if allowed

5. Complete escrow flow:
   - Initiate escrow on purchase
   - Complete escrow after key delivery
   - Handle refunds if needed
   - Distribute platform fees

**Files to modify:**
- flowTest/src/components/marketplace/MarketplaceGrid.tsx
- flowTest/src/components/purchase/PurchaseModal.tsx
- flowTest/src/lib/services/purchase-transaction-service.ts
- flowTest/src/lib/services/purchase-verification-service.ts
- api/src/services/MarketplaceService.ts
- api/src/routes/marketplace.ts

**Reference:**
- See contracts/sources/marketplace.move for escrow logic
- See integrations/seal/ for key distribution
- See api/docs/IMPLEMENTATION_SUMMARY.md for transaction flow

Please implement the complete purchase flow with proper error handling and user feedback.
```

---

## 🎨 PROMPT 6: Remove All Mocks & Complete Frontend Integration

**Priority: MEDIUM - User experience**

```
I need to remove all mock implementations and connect the frontend to real backend services.

**Project Context:**
- Satya ML Marketplace frontend has many mock implementations
- Backend APIs exist but frontend uses mock data
- Need to connect all components to real services

**Mock Implementations to Replace:**
1. User Service:
   - getUserListings() - line 304 (returns empty array)
   - getUserPurchases() - returns mock data
   - getUserStats() - uses mock data

2. Marketplace Components:
   - MarketplaceGrid.tsx - uses mock descriptions, ratings, downloads
   - Model cards show placeholder data
   - Purchase flow shows "coming soon"

3. Flow Pages:
   - flowTest/src/app/flows/purchase-flow/page.tsx - uses mockModels
   - flowTest/src/app/flows/model-verification/page.tsx - uses mockModels
   - flowTest/src/app/flows/buyer-journey/page.tsx - uses mockModels
   - flowTest/src/app/flows/seller-journey/page.tsx - uses mockModels

4. Dashboard Components:
   - DashboardPending.tsx - uses mockTasks
   - DashboardDownloads.tsx - uses mockDownloads

5. TEE Components:
   - ModelVerificationPanel.tsx - uses mockAttestationDocument
   - TEECompute.tsx - may have mock implementations

**Requirements:**
1. Create API client methods for all missing endpoints:
   - GET /api/models/user-listings
   - GET /api/models/user-purchases
   - GET /api/marketplace/listings (with real data)
   - GET /api/attestations/:modelId
   - All other missing endpoints

2. Replace all mock data with API calls:
   - Use React Query for data fetching
   - Add loading states
   - Add error handling
   - Implement caching

3. Remove MOCK_* environment flags:
   - Remove MOCK_WALRUS, MOCK_SEAL, MOCK_SUI flags
   - Update all conditional logic
   - Ensure real services are always used

4. Update components to handle real data:
   - Handle empty states properly
   - Show loading spinners
   - Display error messages
   - Format real data correctly

**Files to modify:**
- flowTest/src/lib/services/user-service.ts
- flowTest/src/components/marketplace/MarketplaceGrid.tsx
- flowTest/src/app/flows/**/*.tsx (all flow pages)
- flowTest/src/components/dashboard/*.tsx
- flowTest/src/components/verification/ModelVerificationPanel.tsx
- flowTest/src/lib/constants.ts (remove MOCK flags)
- api/src/routes/*.ts (add missing endpoints)

Please remove all mocks and implement real API integration with proper error handling.
```

---

## 🧪 PROMPT 7: Comprehensive Testing Suite

**Priority: MEDIUM - Quality assurance**

```
I need to create a comprehensive testing suite for the Satya ML Marketplace.

**Project Context:**
- Currently has walrus-storage.test.ts
- Missing tests for SEAL, Nautilus, purchase flow, and E2E scenarios
- Need unit, integration, and E2E tests

**Requirements:**
1. SEAL Encryption Tests:
   - Test encryption/decryption with real SEAL SDK
   - Test policy verification (payment-gated, time-locked, allowlist)
   - Test key distribution after purchase
   - Test error scenarios (key server failures, invalid policies)

2. Nautilus TEE Tests:
   - Test attestation generation
   - Test model verification flow
   - Test TEE endpoint integration
   - Test error handling

3. Purchase Flow Tests:
   - Test complete purchase journey
   - Test escrow creation and completion
   - Test SEAL key distribution
   - Test license NFT creation
   - Test refund scenarios

4. Integration Tests:
   - Test Walrus + SEAL integration (encrypt → upload → download → decrypt)
   - Test Purchase → SEAL keys → Access flow
   - Test Model Upload → TEE Verification → Listing flow
   - Test end-to-end buyer journey
   - Test end-to-end seller journey

5. E2E Tests:
   - Use Playwright or Cypress
   - Test complete user flows
   - Test wallet integration
   - Test transaction signing
   - Test error scenarios

6. Performance Tests:
   - Test concurrent uploads
   - Test large file handling
   - Test database query performance
   - Test API response times

7. Security Tests:
   - Test authentication/authorization
   - Test access control
   - Test input validation
   - Test SQL injection prevention
   - Test XSS prevention

**Files to create:**
- tests/seal-encryption.test.ts
- tests/nautilus-tee.test.ts (exists but needs completion)
- tests/purchase-flow.test.ts
- tests/integration-walrus-seal.test.ts
- tests/integration-purchase-flow.test.ts
- tests/e2e/buyer-journey.test.ts
- tests/e2e/seller-journey.test.ts
- tests/performance.test.ts
- tests/security.test.ts

**Reference:**
- See tests/walrus-storage.test.ts for test structure
- Use Vitest for unit/integration tests
- Use Playwright for E2E tests

Please create comprehensive tests with good coverage and clear test descriptions.
```

---

## 🚀 PROMPT 8: Production Infrastructure Setup

**Priority: MEDIUM - Deployment readiness**

```
I need to set up production infrastructure for the Satya ML Marketplace.

**Project Context:**
- Application ready for deployment
- Need Kubernetes, monitoring, logging, CI/CD
- AWS-based infrastructure (Nitro Enclaves, RDS, etc.)

**Requirements:**
1. Kubernetes Deployment:
   - Create deployment manifests for:
     - Backend API (Node.js/Fastify)
     - Frontend (Next.js)
     - Database (PostgreSQL - managed service)
     - Redis (for caching)
   - Configure services, ingress, and load balancing
   - Set up auto-scaling policies
   - Configure resource limits

2. Monitoring & Observability:
   - Set up Prometheus for metrics
   - Configure Grafana dashboards
   - Add application metrics (request rates, errors, latency)
   - Set up alerting rules
   - Monitor TEE enclave health

3. Logging:
   - Set up ELK stack or CloudWatch
   - Configure structured logging
   - Add log aggregation
   - Set up log retention policies

4. CI/CD Pipeline:
   - GitHub Actions workflow
   - Automated testing on PR
   - Build Docker images
   - Deploy to staging
   - Deploy to production (manual approval)
   - Rollback procedures

5. Database Management:
   - Set up RDS PostgreSQL
   - Configure backups
   - Set up read replicas
   - Migration strategy

6. Security:
   - Set up secrets management (AWS Secrets Manager)
   - Configure SSL/TLS certificates
   - Set up WAF rules
   - Configure network security groups
   - Set up DDoS protection

7. Backup & Disaster Recovery:
   - Automated database backups
   - Backup verification
   - Disaster recovery plan
   - RTO/RPO targets

**Files to create:**
- k8s/deployment.yaml
- k8s/service.yaml
- k8s/ingress.yaml
- k8s/configmap.yaml
- k8s/secrets.yaml
- .github/workflows/ci-cd.yml
- docker/Dockerfile.backend
- docker/Dockerfile.frontend
- terraform/ (infrastructure as code)
- monitoring/prometheus-config.yaml
- monitoring/grafana-dashboards.json

**Reference:**
- See technical-architecture.md for infrastructure design
- See accelerator-redac/aws-nitro-integration.md for TEE setup

Please create complete production infrastructure with best practices.
```

---

## 📚 PROMPT 9: Complete Documentation

**Priority: LOW - Developer experience**

```
I need to create comprehensive documentation for the Satya ML Marketplace.

**Project Context:**
- Technical documentation exists but needs completion
- Missing API documentation, user guides, and developer onboarding

**Requirements:**
1. API Documentation:
   - OpenAPI/Swagger specification
   - All endpoint documentation
   - Request/response examples
   - Authentication guide
   - Error code reference

2. Developer Documentation:
   - Setup guide (local development)
   - Architecture overview
   - Component documentation
   - Integration guides (Walrus, SEAL, Nautilus)
   - Testing guide
   - Deployment guide

3. User Documentation:
   - Getting started guide
   - How to upload models
   - How to purchase models
   - How to verify models
   - Troubleshooting guide

4. Smart Contract Documentation:
   - Contract architecture
   - Function reference
   - Event documentation
   - Integration examples

5. Infrastructure Documentation:
   - Deployment procedures
   - Monitoring setup
   - Troubleshooting guide
   - Disaster recovery procedures

**Files to create:**
- docs/api/openapi.yaml
- docs/developer/setup.md
- docs/developer/architecture.md
- docs/developer/integration-guide.md
- docs/user/getting-started.md
- docs/user/uploading-models.md
- docs/user/purchasing-models.md
- docs/contracts/README.md
- docs/infrastructure/deployment.md

Please create comprehensive, clear documentation with examples.
```

---

## 🔧 PROMPT 10: Fix Remaining TODOs & Technical Debt

**Priority: LOW - Code quality**

```
I need to fix all remaining TODOs, resolve circular dependencies, and clean up technical debt.

**Project Context:**
- Multiple TODO comments throughout codebase
- Some circular dependencies disabled
- Mock implementations need removal
- Code quality improvements needed

**Issues to Fix:**
1. Circular Dependencies:
   - flowTest/src/lib/integrations/walrus/services/storage-service.ts
     - Line 51: Re-enable connectivity checking
     - Line 431: Re-enable proper connectivity checking
     - Line 459: Re-enable proper health checking
     - Line 479: Re-enable proper connectivity testing

2. TODO Comments:
   - integrations/marketplace/service.ts line 329: Implement arbitration submission
   - flowTest/src/components/dashboard/DashboardPending.tsx line 182: Update task status
   - flowTest/src/lib/services/user-service.ts line 304: Implement user listings query

3. Placeholder Implementations:
   - flowTest/src/lib/integrations/sui/client.ts lines 414, 430: Return null placeholders
   - Various mock implementations throughout

4. Code Quality:
   - Remove unused imports
   - Fix TypeScript strict mode issues
   - Improve error messages
   - Add JSDoc comments
   - Standardize code formatting

**Requirements:**
1. Resolve all circular dependencies:
   - Refactor to break cycles
   - Use dependency injection where needed
   - Re-enable disabled code

2. Complete all TODO items:
   - Implement missing functionality
   - Remove or document intentional TODOs

3. Remove all placeholders:
   - Replace with real implementations
   - Add proper error handling

4. Code cleanup:
   - Run linter and fix issues
   - Format all code consistently
   - Remove dead code
   - Improve type safety

**Files to modify:**
- All files with TODO comments
- All files with circular dependency issues
- All files with placeholder implementations

Please fix all technical debt and improve code quality throughout the project.
```

---

## 📋 Usage Instructions

1. **Start with Priority CRITICAL prompts** (1-4) - These block other features
2. **Then move to HIGH priority** (5) - Core user functionality
3. **Complete MEDIUM priority** (6-8) - Quality and deployment
4. **Finish with LOW priority** (9-10) - Polish and documentation

**For each prompt:**
- Copy the entire prompt text
- Paste into your AI assistant
- Review the generated code
- Test thoroughly
- Commit when working

**Estimated Timeline:**
- Critical prompts: 2-3 weeks
- High priority: 1-2 weeks
- Medium priority: 2-3 weeks
- Low priority: 1 week
- **Total: 6-9 weeks to completion**

---

## 🎯 Quick Start

If you want to get started immediately, use these prompts in order:

1. **PROMPT 1** - Database (blocks everything)
2. **PROMPT 2** - SEAL Integration (core security)
3. **PROMPT 4** - Smart Contracts (marketplace foundation)
4. **PROMPT 5** - Purchase Flow (user journey)
5. **PROMPT 3** - Nautilus TEE (can be done in parallel)

This sequence will get you to a working MVP fastest.

