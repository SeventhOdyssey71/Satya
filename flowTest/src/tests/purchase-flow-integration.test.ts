import { describe, it, expect, beforeEach, vi } from 'vitest';
import PurchaseVerificationService, { ModelPurchaseData } from '@/lib/services/purchase-verification-service';
import PurchaseTransactionService from '@/lib/services/purchase-transaction-service';
import { NautilusClient } from '@/lib/integrations/nautilus/client';
import { SealEncryptionService } from '@/lib/integrations/seal/services/encryption-service';
import { WalrusStorageService } from '@/lib/integrations/walrus/services/storage-service';
import { SuiClient } from '@mysten/sui/client';

// Mock the services for testing
vi.mock('@/lib/integrations/nautilus/client');
vi.mock('@/lib/integrations/seal/services/encryption-service');
vi.mock('@/lib/integrations/walrus/services/storage-service');
vi.mock('@mysten/sui/client');

describe('Purchase Flow Integration Tests', () => {
  let verificationService: PurchaseVerificationService;
  let transactionService: PurchaseTransactionService;
  let mockNautilusClient: vi.Mocked<NautilusClient>;
  let mockSealService: vi.Mocked<SealEncryptionService>;
  let mockWalrusService: vi.Mocked<WalrusStorageService>;
  let mockSuiClient: vi.Mocked<SuiClient>;

  beforeEach(() => {
    // Create mocked instances
    mockNautilusClient = vi.mocked(new NautilusClient({
      enclaveUrl: 'test-url',
      verificationApiUrl: 'test-url',
      attestationStorageUrl: 'test-url',
      network: 'testnet'
    }));

    mockSealService = vi.mocked(new SealEncryptionService());
    mockWalrusService = vi.mocked(new WalrusStorageService());
    mockSuiClient = vi.mocked(new SuiClient({ url: 'test-url' }));

    // Initialize services with mocks
    verificationService = new PurchaseVerificationService(
      mockNautilusClient,
      mockSealService,
      mockWalrusService,
      mockSuiClient
    );

    transactionService = new PurchaseTransactionService(mockSuiClient);
  });

  describe('Verification Flow', () => {
    const mockPurchaseData: ModelPurchaseData = {
      modelId: 'test-model-123',
      buyerAddress: '0x123456789abcdef',
      sellerAddress: '0x987654321fedcba',
      price: '125.50',
      walrusBlobId: 'blob-123',
      attestationId: 'attestation-123'
    };

    it('should successfully complete full verification flow', async () => {
      // Mock successful responses
      mockNautilusClient.verifyDatasetIntegrity.mockResolvedValue({
        valid: true,
        attestation: {
          moduleId: 'test-model-123',
          pcr0: 'mock-pcr0',
          pcr1: 'mock-pcr1',
          pcr2: 'mock-pcr2',
          public_key: 'mock-key',
          user_data: 'mock-hash',
          nonce: 'mock-nonce',
          timestamp: Date.now(),
          signature: 'mock-signature',
          certificate: 'mock-cert'
        }
      });

      mockNautilusClient.validateAttestationDocument.mockResolvedValue(true);
      
      mockWalrusService.getBlobMetadata.mockResolvedValue({
        blobId: 'blob-123',
        size: 1000000,
        contentType: 'application/octet-stream',
        uploadTimestamp: Date.now(),
        encryptionMetadata: {
          algorithm: 'SEAL',
          keyId: 'key-123'
        }
      });

      mockSealService.encryptData.mockResolvedValue({
        success: true,
        encryptedData: 'encrypted-key-data',
        sessionKey: 'session-key-123'
      });

      // Track step updates
      const stepUpdates: any[] = [];
      const onStepUpdate = vi.fn((steps) => stepUpdates.push([...steps]));

      // Run verification
      const result = await verificationService.verifyPurchase(
        mockPurchaseData,
        onStepUpdate
      );

      // Verify success
      expect(result.success).toBe(true);
      expect(result.accessKeys).toBeDefined();
      expect(result.accessKeys?.encryptionKey).toBeTruthy();
      expect(result.accessKeys?.decryptionPolicy).toBeTruthy();
      expect(result.accessKeys?.sessionToken).toBeTruthy();

      // Verify all steps were completed
      expect(stepUpdates.length).toBeGreaterThan(0);
      const finalSteps = stepUpdates[stepUpdates.length - 1];
      expect(finalSteps.every((step: any) => step.status === 'completed')).toBe(true);

      // Verify service calls were made
      expect(mockNautilusClient.verifyDatasetIntegrity).toHaveBeenCalled();
      expect(mockNautilusClient.validateAttestationDocument).toHaveBeenCalled();
      expect(mockWalrusService.getBlobMetadata).toHaveBeenCalled();
      expect(mockSealService.encryptData).toHaveBeenCalled();
    });

    it('should handle enclave registration failure', async () => {
      // Mock enclave registration failure by having the first verification fail
      mockNautilusClient.verifyDatasetIntegrity.mockRejectedValue(new Error('Enclave not registered'));

      const stepUpdates: any[] = [];
      const onStepUpdate = vi.fn((steps) => stepUpdates.push([...steps]));

      const result = await verificationService.verifyPurchase(
        mockPurchaseData,
        onStepUpdate
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Enclave not registered');

      // Check that first step failed
      const finalSteps = stepUpdates[stepUpdates.length - 1];
      const enclaveStep = finalSteps.find((step: any) => step.id === 'enclave_registration');
      expect(enclaveStep?.status).toBe('failed');
    });

    it('should handle attestation validation failure', async () => {
      // Mock successful early steps but failed attestation validation
      mockNautilusClient.verifyDatasetIntegrity.mockResolvedValue({
        valid: true,
        attestation: {
          moduleId: 'test-model-123',
          pcr0: 'invalid-pcr0',
          pcr1: 'invalid-pcr1',
          pcr2: 'invalid-pcr2',
          public_key: 'mock-key',
          user_data: 'mock-hash',
          nonce: 'mock-nonce',
          timestamp: Date.now(),
          signature: 'invalid-signature',
          certificate: 'mock-cert'
        }
      });

      mockNautilusClient.validateAttestationDocument.mockResolvedValue(false);

      const stepUpdates: any[] = [];
      const onStepUpdate = vi.fn((steps) => stepUpdates.push([...steps]));

      const result = await verificationService.verifyPurchase(
        mockPurchaseData,
        onStepUpdate
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Attestation document validation failed');
    });

    it('should handle SEAL encryption failure', async () => {
      // Mock successful early steps but failed SEAL encryption
      mockNautilusClient.verifyDatasetIntegrity.mockResolvedValue({
        valid: true,
        attestation: {
          moduleId: 'test-model-123',
          pcr0: 'mock-pcr0',
          pcr1: 'mock-pcr1',
          pcr2: 'mock-pcr2',
          public_key: 'mock-key',
          user_data: 'mock-hash',
          nonce: 'mock-nonce',
          timestamp: Date.now(),
          signature: 'mock-signature',
          certificate: 'mock-cert'
        }
      });

      mockNautilusClient.validateAttestationDocument.mockResolvedValue(true);
      mockWalrusService.getBlobMetadata.mockResolvedValue({
        blobId: 'blob-123',
        size: 1000000,
        contentType: 'application/octet-stream',
        uploadTimestamp: Date.now(),
        encryptionMetadata: {
          algorithm: 'SEAL',
          keyId: 'key-123'
        }
      });

      mockSealService.encryptData.mockResolvedValue({
        success: false,
        error: 'Failed to generate access keys'
      });

      const stepUpdates: any[] = [];
      const onStepUpdate = vi.fn((steps) => stepUpdates.push([...steps]));

      const result = await verificationService.verifyPurchase(
        mockPurchaseData,
        onStepUpdate
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to generate access keys');
    });
  });

  describe('Transaction Flow', () => {
    const mockAccount = {
      address: '0x123456789abcdef',
      chains: ['sui:testnet'],
      features: ['sui:signAndExecuteTransaction'],
      label: 'Test Wallet'
    };

    const mockTransaction = {
      modelId: 'test-model-123',
      buyerAddress: '0x123456789abcdef',
      price: '125.50',
      currency: 'SUI' as const,
      sellerAddress: '0x987654321fedcba',
      marketplaceContract: '0xmarket123'
    };

    it('should successfully execute purchase transaction', async () => {
      // Mock successful balance check
      mockSuiClient.getBalance.mockResolvedValue({
        coinType: '0x2::sui::SUI',
        coinObjectCount: 1,
        totalBalance: '1000000000000', // 1000 SUI
        lockedBalance: {}
      });

      // Mock successful transaction execution
      const mockSignAndExecute = vi.fn().mockResolvedValue({
        digest: '0xtxhash123',
        effects: {
          status: { status: 'success' },
          created: [
            {
              reference: { objectId: '0xnft123' }
            }
          ]
        }
      });

      const result = await transactionService.executePurchase(
        mockTransaction,
        mockAccount,
        mockSignAndExecute
      );

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xtxhash123');
      expect(result.licenseNftId).toBeTruthy();
      expect(result.accessTokens).toBeDefined();
      expect(mockSignAndExecute).toHaveBeenCalledOnce();
    });

    it('should fail with insufficient balance', async () => {
      // Mock insufficient balance
      mockSuiClient.getBalance.mockResolvedValue({
        coinType: '0x2::sui::SUI',
        coinObjectCount: 1,
        totalBalance: '1000000000', // Only 1 SUI
        lockedBalance: {}
      });

      const mockSignAndExecute = vi.fn();

      const result = await transactionService.executePurchase(
        mockTransaction,
        mockAccount,
        mockSignAndExecute
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient SUI balance');
      expect(mockSignAndExecute).not.toHaveBeenCalled();
    });

    it('should handle transaction failure', async () => {
      // Mock successful balance check
      mockSuiClient.getBalance.mockResolvedValue({
        coinType: '0x2::sui::SUI',
        coinObjectCount: 1,
        totalBalance: '1000000000000',
        lockedBalance: {}
      });

      // Mock transaction failure
      const mockSignAndExecute = vi.fn().mockRejectedValue(new Error('Transaction failed'));

      const result = await transactionService.executePurchase(
        mockTransaction,
        mockAccount,
        mockSignAndExecute
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Transaction failed');
    });
  });

  describe('End-to-End Integration', () => {
    it('should complete full purchase flow from verification to transaction', async () => {
      // This test would integrate both services to simulate a complete purchase
      const mockPurchaseData: ModelPurchaseData = {
        modelId: 'test-model-123',
        buyerAddress: '0x123456789abcdef',
        sellerAddress: '0x987654321fedcba',
        price: '125.50',
        walrusBlobId: 'blob-123',
        attestationId: 'attestation-123'
      };

      // Mock all services for successful flow
      mockNautilusClient.verifyDatasetIntegrity.mockResolvedValue({
        valid: true,
        attestation: {
          moduleId: 'test-model-123',
          pcr0: 'mock-pcr0',
          pcr1: 'mock-pcr1',
          pcr2: 'mock-pcr2',
          public_key: 'mock-key',
          user_data: 'mock-hash',
          nonce: 'mock-nonce',
          timestamp: Date.now(),
          signature: 'mock-signature',
          certificate: 'mock-cert'
        }
      });

      mockNautilusClient.validateAttestationDocument.mockResolvedValue(true);
      mockWalrusService.getBlobMetadata.mockResolvedValue({
        blobId: 'blob-123',
        size: 1000000,
        contentType: 'application/octet-stream',
        uploadTimestamp: Date.now(),
        encryptionMetadata: {
          algorithm: 'SEAL',
          keyId: 'key-123'
        }
      });

      mockSealService.encryptData.mockResolvedValue({
        success: true,
        encryptedData: 'encrypted-key-data',
        sessionKey: 'session-key-123'
      });

      // Step 1: Verification
      const stepUpdates: any[] = [];
      const verificationResult = await verificationService.verifyPurchase(
        mockPurchaseData,
        (steps) => stepUpdates.push([...steps])
      );

      expect(verificationResult.success).toBe(true);
      expect(verificationResult.accessKeys).toBeDefined();

      // Step 2: Transaction (would happen after verification in real flow)
      mockSuiClient.getBalance.mockResolvedValue({
        coinType: '0x2::sui::SUI',
        coinObjectCount: 1,
        totalBalance: '1000000000000',
        lockedBalance: {}
      });

      const mockAccount = {
        address: mockPurchaseData.buyerAddress,
        chains: ['sui:testnet'],
        features: ['sui:signAndExecuteTransaction'],
        label: 'Test Wallet'
      };

      const mockTransaction = {
        modelId: mockPurchaseData.modelId,
        buyerAddress: mockPurchaseData.buyerAddress,
        price: mockPurchaseData.price,
        currency: 'SUI' as const,
        sellerAddress: mockPurchaseData.sellerAddress,
        marketplaceContract: '0xmarket123'
      };

      const mockSignAndExecute = vi.fn().mockResolvedValue({
        digest: '0xtxhash123',
        effects: {
          status: { status: 'success' },
          created: [{ reference: { objectId: '0xnft123' } }]
        }
      });

      const transactionResult = await transactionService.executePurchase(
        mockTransaction,
        mockAccount,
        mockSignAndExecute
      );

      expect(transactionResult.success).toBe(true);
      expect(transactionResult.transactionHash).toBeTruthy();
      expect(transactionResult.licenseNftId).toBeTruthy();

      // Verify the complete flow worked
      expect(verificationResult.accessKeys).toBeDefined();
      expect(transactionResult.accessTokens).toBeDefined();
    });
  });
});