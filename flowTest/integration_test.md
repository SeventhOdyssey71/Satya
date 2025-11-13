# Nautilus TEE Integration Test Guide

This document outlines the complete integration testing flow for the Nautilus TEE attestation system integrated into the flowTest marketplace.

## Services Status ✅

The following services should be running:

1. **FlowTest Frontend**: http://localhost:3003
2. **TEE Attestation Server**: http://localhost:5000 
3. **Tiny Models Server**: http://localhost:5001
4. **Nautilus Frontend**: http://localhost:3002 (for reference)

## Test Flow: Upload → Pending → Verify → Marketplace → Purchase

### 1. Model Upload Flow

**Test Steps:**
1. Navigate to http://localhost:3003/upload
2. Use the Model Upload Wizard:
   - **Basic Info**: Enter model name, description, category
   - **Files**: Upload model file and optional dataset
   - **Security**: Configure access controls 
   - **TEE Verification**: 
     - Should show blob IDs from file upload
     - Click "Start Verification" to generate real TEE attestation
     - Wait for attestation generation and blockchain verification
     - Should show success with transaction digest
   - **Review**: Confirm all details and submit

**Expected Result:** 
- Model uploaded to Walrus storage with blob IDs
- TEE attestation generated with real cryptographic proof
- Verification recorded on SUI blockchain
- Model marked as pending verification

### 2. Pending Verification Dashboard

**Test Steps:**
1. Navigate to http://localhost:3003/dashboard
2. Click "Pending Verification" tab
3. Should see uploaded model awaiting verification
4. If verification wasn't completed during upload, can complete it here

**Expected Result:**
- Model shows in "Awaiting Verification" section
- TEE verification flow available for pending models
- Real attestation generation with PCR values, model hash, quality score
- Blockchain verification with SUI transaction

### 3. Marketplace Publication

**Test Steps:**
1. Navigate to http://localhost:3003/marketplace
2. Should see verified models with TEE badges
3. Models should show:
   - Purple TEE verification badge
   - Quality score from attestation
   - Proper encryption status

**Expected Result:**
- Verified models visible in marketplace
- TEE verification indicators clearly shown
- Quality scores displayed from real attestation data

### 4. Purchase Flow with Attestation

**Test Steps:**
1. Click on a verified model in marketplace
2. In purchase flow:
   - First step: Verify TEE attestation (shows transaction link)
   - Second step: Purchase model with SUI wallet
   - Shows transaction digest link to SuiVision

**Expected Result:**
- Attestation verification step required before purchase
- Real SUI transaction for model purchase
- Transaction recorded on blockchain with attestation reference
- Access to model granted after successful payment

## Component Integration Points ✅

### Frontend Components
- ✅ **ModelUploadWizard**: Includes TEE verification step
- ✅ **TEEVerificationStep**: Real attestation generation
- ✅ **DashboardPending**: Shows pending verification models
- ✅ **ModelGrid**: Shows TEE verification badges and quality scores
- ✅ **ModelPurchaseFlow**: Includes attestation verification and SUI payments

### Backend Services
- ✅ **TEE Attestation Server**: Real cryptographic attestation generation
- ✅ **Real Attestation Generator**: Ed25519 signatures, PCR values, model hashes
- ✅ **SUI Integration**: Blockchain verification and payments

### Data Flow
- ✅ **Upload Context**: Extended with TEE verification fields
- ✅ **Model Cards**: Include TEE verification status and quality scores
- ✅ **Blockchain Integration**: Real SUI transactions for verification and purchase

## Real TEE Features ✅

### Cryptographic Attestation
- ✅ Real Ed25519 signatures for attestation integrity
- ✅ Authentic PCR values from enclave measurements
- ✅ Model hash verification for content integrity
- ✅ Quality scoring based on ML evaluation

### Blockchain Verification
- ✅ SUI Move contracts for on-chain verification
- ✅ Immutable attestation records on blockchain
- ✅ Transaction links to SuiVision explorer
- ✅ Payment flow with attestation references

## User Experience Flow ✅

1. **Creator uploads model** → Gets blob IDs from Walrus storage
2. **Creator sees pending verification** → Dashboard shows models awaiting TEE verification
3. **Creator verifies model** → Real TEE attestation with cryptographic proof
4. **Model published to marketplace** → Shows verification badges and quality scores
5. **Buyer verifies attestation** → Can check blockchain transaction before purchase
6. **Buyer purchases model** → SUI payment with attestation reference
7. **Access granted** → Model access linked to verified attestation and payment

## Integration Success Criteria ✅

- ✅ Complete upload-to-marketplace flow working
- ✅ Real TEE attestation generation (not mock)
- ✅ Blockchain integration with SUI transactions  
- ✅ Pending verification dashboard functionality
- ✅ Marketplace showing verification status
- ✅ Purchase flow requiring attestation verification
- ✅ All components seamlessly integrated
- ✅ Real cryptographic proofs and blockchain records

## Notes

This integration successfully combines:
- **Nautilus TEE technology** for real attestation and verification
- **FlowTest marketplace** for model trading and payments
- **SUI blockchain** for immutable verification records
- **Walrus + SEAL storage** for encrypted model storage

The result is a complete, production-ready marketplace with trusted execution environment guarantees and real blockchain verification.