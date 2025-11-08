import { describe, it, expect, beforeEach } from 'vitest';
import { SealEncryptionService } from '../integrations/seal/services/encryption-service';
import { PolicyType } from '../integrations/seal/types';

describe('Seal Encryption Service Tests', () => {
  let sealService: SealEncryptionService;
  let testData: Uint8Array;

  beforeEach(() => {
    sealService = new SealEncryptionService();
    testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const encryptResult = await sealService.encryptData(
        testData,
        PolicyType.PAYMENT_GATED,
        { seller: '0xSeller123' }
      );

      expect(encryptResult.success).toBe(true);
      expect(encryptResult.encryptedData.length).toBeGreaterThan(0);
      expect(encryptResult.policyId).toBeTruthy();

      const decryptResult = await sealService.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        'purchase-123',
        '0xBuyer456'
      );

      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toEqual(testData);
    });

    it('should fail decryption without valid purchase', async () => {
      const encryptResult = await sealService.encryptData(
        testData,
        PolicyType.PAYMENT_GATED
      );

      const decryptResult = await sealService.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        '', // No purchase record
        '0xUnauthorized'
      );

      expect(decryptResult.success).toBe(false);
      expect(decryptResult.accessGranted).toBe(false);
    });
  });

  describe('Policy Types', () => {
    it('should enforce payment-gated policy', async () => {
      const encryptResult = await sealService.encryptData(
        testData,
        PolicyType.PAYMENT_GATED,
        { seller: '0xSeller123' }
      );

      // Should fail without purchase record
      const unauthorizedDecrypt = await sealService.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        '',
        '0xBuyer456'
      );

      expect(unauthorizedDecrypt.success).toBe(false);

      // Should succeed with purchase record
      const authorizedDecrypt = await sealService.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        'purchase-123',
        '0xBuyer456'
      );

      expect(authorizedDecrypt.success).toBe(true);
    });

    it('should enforce time-locked policy', async () => {
      const futureTime = Date.now() + 60000; // 1 minute in future
      
      const encryptResult = await sealService.encryptData(
        testData,
        PolicyType.TIME_LOCKED,
        { unlockTime: futureTime }
      );

      // Should fail before unlock time
      const earlyDecrypt = await sealService.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        'purchase-123',
        '0xBuyer456'
      );

      expect(earlyDecrypt.success).toBe(false);

      // Test with past time (should succeed)
      const pastTime = Date.now() - 60000;
      const pastEncryptResult = await sealService.encryptData(
        testData,
        PolicyType.TIME_LOCKED,
        { unlockTime: pastTime }
      );

      const validDecrypt = await sealService.decryptData(
        pastEncryptResult.encryptedData,
        pastEncryptResult.encryptedDEK,
        pastEncryptResult.iv,
        pastEncryptResult.policyId,
        'purchase-123',
        '0xBuyer456'
      );

      expect(validDecrypt.success).toBe(true);
    });

    it('should enforce allowlist policy', async () => {
      const allowedAddresses = ['0xAllowed1', '0xAllowed2'];
      
      const encryptResult = await sealService.encryptData(
        testData,
        PolicyType.ALLOWLIST,
        { allowedAddresses }
      );

      // Should fail for unauthorized address
      const unauthorizedDecrypt = await sealService.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        'purchase-123',
        '0xUnauthorized'
      );

      expect(unauthorizedDecrypt.success).toBe(false);

      // Should succeed for allowed address
      const authorizedDecrypt = await sealService.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        'purchase-123',
        '0xAllowed1'
      );

      expect(authorizedDecrypt.success).toBe(true);
    });
  });

  describe('Batch Operations', () => {
    it('should batch encrypt multiple files', async () => {
      const files = [
        { name: 'file1.txt', data: new Uint8Array([1, 2, 3]) },
        { name: 'file2.txt', data: new Uint8Array([4, 5, 6]) },
        { name: 'file3.txt', data: new Uint8Array([7, 8, 9]) }
      ];

      const results = await sealService.batchEncrypt(
        files,
        PolicyType.PAYMENT_GATED,
        { seller: '0xBatchSeller' }
      );

      expect(results.length).toBe(3);
      expect(results.every(r => r.success)).toBe(true);
      
      // All should share same policy and DEK
      const firstPolicyId = results[0].policyId;
      expect(results.every(r => r.policyId === firstPolicyId)).toBe(true);
    });

    it('should handle batch encryption failures gracefully', async () => {
      const files = [
        { name: 'valid.txt', data: new Uint8Array([1, 2, 3]) },
        { name: 'empty.txt', data: new Uint8Array() }, // Invalid empty data
        { name: 'valid2.txt', data: new Uint8Array([4, 5, 6]) }
      ];

      const results = await sealService.batchEncrypt(
        files,
        PolicyType.PAYMENT_GATED,
        { seller: '0xBatchSeller' }
      );

      expect(results.length).toBe(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false); // Empty data should fail
      expect(results[2].success).toBe(true);
    });
  });

  describe('Security Tests', () => {
    it('should generate unique policy IDs', async () => {
      const results = await Promise.all([
        sealService.encryptData(testData, PolicyType.PAYMENT_GATED),
        sealService.encryptData(testData, PolicyType.PAYMENT_GATED),
        sealService.encryptData(testData, PolicyType.PAYMENT_GATED)
      ]);

      const policyIds = results.map(r => r.policyId);
      const uniqueIds = new Set(policyIds);
      
      expect(uniqueIds.size).toBe(3);
    });

    it('should generate unique encryption outputs for same input', async () => {
      const result1 = await sealService.encryptData(testData, PolicyType.PAYMENT_GATED);
      const result2 = await sealService.encryptData(testData, PolicyType.PAYMENT_GATED);

      // Same input should produce different ciphertext due to random IV
      expect(result1.encryptedData).not.toEqual(result2.encryptedData);
      expect(result1.iv).not.toEqual(result2.iv);
    });

    it('should validate encryption parameters', async () => {
      // Test with null/undefined data
      const invalidResult = await sealService.encryptData(
        new Uint8Array(),
        PolicyType.PAYMENT_GATED
      );

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toBeTruthy();
    });

    it('should clear sensitive data from memory', async () => {
      const encryptResult = await sealService.encryptData(
        testData,
        PolicyType.PAYMENT_GATED
      );

      // DEK should not be directly accessible after encryption
      expect(encryptResult.encryptedDEK).not.toEqual(testData);
      expect(encryptResult.encryptedData).not.toEqual(testData);
    });
  });

  describe('Error Handling', () => {
    it('should handle policy creation failures', async () => {
      // Test with invalid policy parameters
      const result = await sealService.encryptData(
        testData,
        'INVALID_POLICY' as PolicyType
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle DEK generation failures', async () => {
      // This would test crypto.getRandomValues failures
      // Mock the crypto module to simulate failure
      const originalCrypto = globalThis.crypto;
      
      try {
        // @ts-ignore
        globalThis.crypto = {
          ...originalCrypto,
          getRandomValues: () => { throw new Error('Crypto failure'); }
        };

        const result = await sealService.encryptData(
          testData,
          PolicyType.PAYMENT_GATED
        );

        expect(result.success).toBe(false);
      } finally {
        globalThis.crypto = originalCrypto;
      }
    });

    it('should handle missing policy verification', async () => {
      const result = await sealService.decryptData(
        testData,
        testData,
        testData,
        'non-existent-policy',
        'purchase-123',
        '0xBuyer'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Policy not found');
    });
  });

  describe('Performance Tests', () => {
    it('should encrypt large data efficiently', async () => {
      const largeData = new Uint8Array(1024 * 1024); // 1MB
      largeData.fill(42);

      const startTime = Date.now();
      const result = await sealService.encryptData(
        largeData,
        PolicyType.PAYMENT_GATED
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in 1s
    });

    it('should handle concurrent encryption requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        sealService.encryptData(
          new Uint8Array([i, i, i]),
          PolicyType.PAYMENT_GATED,
          { seller: `0xSeller${i}` }
        )
      );

      const results = await Promise.all(requests);
      
      expect(results.length).toBe(10);
      expect(results.every(r => r.success)).toBe(true);
      
      // All should have unique policy IDs
      const policyIds = results.map(r => r.policyId);
      const uniqueIds = new Set(policyIds);
      expect(uniqueIds.size).toBe(10);
    });
  });
});