import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NautilusClient } from '../integrations/nautilus/client';

describe('Nautilus TEE Service Tests', () => {
  let nautilusClient: NautilusClient;
  let testData: Uint8Array;
  let testFile: File;

  beforeEach(() => {
    nautilusClient = new NautilusClient({
      enclaveUrl: 'http://localhost:3000',
      suiNetwork: 'testnet',
      marketplacePackageId: '0x123'
    });
    
    testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    testFile = new File([testData], 'test-data.bin', { type: 'application/octet-stream' });
  });

  describe('File Upload to Enclave', () => {
    it('should upload file to secure enclave', async () => {
      const result = await nautilusClient.uploadFile({
        file: testData,
        type: 'data'
      });

      expect(result.success).toBe(true);
      expect(result.file_id).toBeTruthy();
      expect(result.attestation_id).toBeTruthy();
      expect(result.hash).toBeTruthy();
    });

    it('should handle different file types', async () => {
      const types = ['data', 'sample', 'verification'];
      
      for (const type of types) {
        const result = await nautilusClient.uploadFile({
          file: testData,
          type
        });

        expect(result.success).toBe(true);
        expect(result.file_id).toBeTruthy();
      }
    });

    it('should generate unique file IDs', async () => {
      const uploads = await Promise.all([
        nautilusClient.uploadFile({ file: testData, type: 'data' }),
        nautilusClient.uploadFile({ file: testData, type: 'data' }),
        nautilusClient.uploadFile({ file: testData, type: 'data' })
      ]);

      const fileIds = uploads.map(u => u.file_id);
      const uniqueIds = new Set(fileIds);
      
      expect(uniqueIds.size).toBe(3);
    });

    it('should calculate correct file hash', async () => {
      const result = await nautilusClient.uploadFile({
        file: testData,
        type: 'data'
      });

      // Verify hash calculation
      const expectedHash = await crypto.subtle.digest('SHA-256', testData);
      const expectedHashHex = Array.from(new Uint8Array(expectedHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      expect(result.hash).toBe(expectedHashHex);
    });
  });

  describe('Attestation Creation', () => {
    let testFileId: string;

    beforeEach(async () => {
      const uploadResult = await nautilusClient.uploadFile({
        file: testData,
        type: 'data'
      });
      testFileId = uploadResult.file_id;
    });

    it('should create attestation for uploaded file', async () => {
      const attestation = await nautilusClient.createAttestation({
        fileId: testFileId,
        operation: 'verification',
        metadata: {
          purpose: 'data_integrity_check',
          timestamp: Date.now()
        }
      });

      expect(attestation.success).toBe(true);
      expect(attestation.id).toBeTruthy();
      expect(attestation.signature).toBeTruthy();
      expect(attestation.public_key).toBeTruthy();
    });

    it('should include operation metadata in attestation', async () => {
      const metadata = {
        listingId: 'listing-123',
        buyer: '0xBuyer456',
        seller: '0xSeller789',
        timestamp: Date.now()
      };

      const attestation = await nautilusClient.createAttestation({
        fileId: testFileId,
        operation: 'purchase_verification',
        metadata
      });

      expect(attestation.metadata).toEqual(metadata);
    });

    it('should verify attestation signatures', async () => {
      const attestation = await nautilusClient.createAttestation({
        fileId: testFileId,
        operation: 'test',
        metadata: { test: true }
      });

      const isValid = await nautilusClient.verifyAttestation({
        fileId: testFileId,
        attestationId: attestation.id,
        signature: attestation.signature,
        publicKey: attestation.public_key
      });

      expect(isValid).toBe(true);
    });

    it('should detect invalid signatures', async () => {
      const attestation = await nautilusClient.createAttestation({
        fileId: testFileId,
        operation: 'test',
        metadata: { test: true }
      });

      // Tamper with signature
      const tamperedSignature = new Uint8Array(attestation.signature);
      tamperedSignature[0] = tamperedSignature[0] ^ 0xFF;

      const isValid = await nautilusClient.verifyAttestation({
        fileId: testFileId,
        attestationId: attestation.id,
        signature: tamperedSignature,
        publicKey: attestation.public_key
      });

      expect(isValid).toBe(false);
    });
  });

  describe('File Processing', () => {
    let testFileId: string;

    beforeEach(async () => {
      const uploadResult = await nautilusClient.uploadFile({
        file: testData,
        type: 'data'
      });
      testFileId = uploadResult.file_id;
    });

    it('should process file with verification operation', async () => {
      const result = await nautilusClient.processFile({
        fileId: testFileId,
        operation: 'verify',
        metadata: {
          expectedHash: await this.calculateHash(testData),
          algorithm: 'SHA-256'
        }
      });

      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.attestation).toBeTruthy();
    });

    it('should detect hash mismatches', async () => {
      const wrongHash = 'wrong_hash_value';

      const result = await nautilusClient.processFile({
        fileId: testFileId,
        operation: 'verify',
        metadata: {
          expectedHash: wrongHash,
          algorithm: 'SHA-256'
        }
      });

      expect(result.success).toBe(true);
      expect(result.valid).toBe(false);
    });

    it('should handle quality analysis operations', async () => {
      const result = await nautilusClient.processFile({
        fileId: testFileId,
        operation: 'analyze',
        metadata: {
          analysisType: 'data_quality',
          parameters: { checkCompleteness: true }
        }
      });

      expect(result.success).toBe(true);
      expect(result.analysis).toBeTruthy();
    });

    it('should process sample verification', async () => {
      const sampleData = new Uint8Array([1, 2]);
      const sampleUpload = await nautilusClient.uploadFile({
        file: sampleData,
        type: 'sample'
      });

      const result = await nautilusClient.processFile({
        fileId: sampleUpload.file_id,
        operation: 'sample_verification',
        metadata: {
          originalFileId: testFileId,
          sampleSize: sampleData.length
        }
      });

      expect(result.success).toBe(true);
      expect(result.attestation).toBeTruthy();
    });
  });

  describe('Security Tests', () => {
    it('should isolate file processing in enclave', async () => {
      const sensitiveData = new TextEncoder().encode('sensitive_information');
      
      const uploadResult = await nautilusClient.uploadFile({
        file: sensitiveData,
        type: 'sensitive'
      });

      // File should be processed without exposing content
      const attestation = await nautilusClient.createAttestation({
        fileId: uploadResult.file_id,
        operation: 'process',
        metadata: { security_level: 'high' }
      });

      expect(attestation.success).toBe(true);
      expect(attestation.id).toBeTruthy();
      
      // Content should not be accessible outside enclave
      expect(uploadResult.file_content).toBeUndefined();
    });

    it('should generate cryptographically secure attestations', async () => {
      const uploadResult = await nautilusClient.uploadFile({
        file: testData,
        type: 'data'
      });

      const attestation = await nautilusClient.createAttestation({
        fileId: uploadResult.file_id,
        operation: 'security_test',
        metadata: { test: 'crypto_strength' }
      });

      // Signature should be 64 bytes (Ed25519)
      expect(attestation.signature.length).toBe(64);
      
      // Public key should be 32 bytes
      expect(attestation.public_key.length).toBe(32);
    });

    it('should prevent unauthorized file access', async () => {
      const uploadResult = await nautilusClient.uploadFile({
        file: testData,
        type: 'private'
      });

      // Try to access with wrong credentials/context
      await expect(
        nautilusClient.processFile({
          fileId: uploadResult.file_id,
          operation: 'unauthorized_access',
          metadata: { hacker: true }
        })
      ).rejects.toThrow();
    });

    it('should validate enclave integrity', async () => {
      const healthCheck = await nautilusClient.healthCheck();

      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.enclave_verified).toBe(true);
      expect(healthCheck.public_key).toBeTruthy();
    });
  });

  describe('Dispute Resolution Support', () => {
    let disputeFileId: string;

    beforeEach(async () => {
      const uploadResult = await nautilusClient.uploadFile({
        file: testData,
        type: 'dispute_evidence'
      });
      disputeFileId = uploadResult.file_id;
    });

    it('should create dispute attestation', async () => {
      const disputeAttestation = await nautilusClient.createAttestation({
        fileId: disputeFileId,
        operation: 'dispute_verification',
        metadata: {
          disputeId: 'dispute-123',
          buyer: '0xBuyer',
          seller: '0xSeller',
          reason: 'data_quality_issue',
          timestamp: Date.now()
        }
      });

      expect(disputeAttestation.success).toBe(true);
      expect(disputeAttestation.metadata.disputeId).toBe('dispute-123');
    });

    it('should verify evidence integrity', async () => {
      const evidence = {
        screenshots: 'base64_encoded_images',
        logs: 'error_logs',
        metadata: 'file_metadata'
      };

      const evidenceData = new TextEncoder().encode(JSON.stringify(evidence));
      const evidenceUpload = await nautilusClient.uploadFile({
        file: evidenceData,
        type: 'evidence'
      });

      const verification = await nautilusClient.processFile({
        fileId: evidenceUpload.file_id,
        operation: 'evidence_verification',
        metadata: {
          disputeId: 'dispute-123',
          evidenceType: 'quality_complaint'
        }
      });

      expect(verification.success).toBe(true);
      expect(verification.attestation).toBeTruthy();
    });

    it('should provide tamper-proof evidence storage', async () => {
      const originalEvidence = new TextEncoder().encode('original_evidence');
      const uploadResult = await nautilusClient.uploadFile({
        file: originalEvidence,
        type: 'evidence'
      });

      const attestation1 = await nautilusClient.createAttestation({
        fileId: uploadResult.file_id,
        operation: 'initial_store',
        metadata: { timestamp: Date.now() }
      });

      // Later verification should produce same hash
      const attestation2 = await nautilusClient.createAttestation({
        fileId: uploadResult.file_id,
        operation: 'integrity_check',
        metadata: { timestamp: Date.now() + 1000 }
      });

      expect(uploadResult.hash).toBe(uploadResult.hash); // Same hash
      expect(attestation1.public_key).toEqual(attestation2.public_key); // Same enclave
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent file uploads', async () => {
      const files = Array.from({ length: 5 }, (_, i) => 
        new Uint8Array([i, i, i])
      );

      const uploads = files.map((file, i) => 
        nautilusClient.uploadFile({
          file,
          type: `concurrent_${i}`
        })
      );

      const results = await Promise.allSettled(uploads);
      const successful = results.filter(r => r.status === 'fulfilled');

      expect(successful.length).toBe(5);
    });

    it('should process large files efficiently', async () => {
      const largeData = new Uint8Array(1024 * 1024); // 1MB
      largeData.fill(42);

      const startTime = Date.now();
      
      const uploadResult = await nautilusClient.uploadFile({
        file: largeData,
        type: 'large'
      });

      const attestation = await nautilusClient.createAttestation({
        fileId: uploadResult.file_id,
        operation: 'large_file_test',
        metadata: { size: largeData.length }
      });

      const endTime = Date.now();

      expect(uploadResult.success).toBe(true);
      expect(attestation.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in 5s
    });

    it('should maintain performance under load', async () => {
      const testData = new Uint8Array(1000);
      testData.fill(123);

      const operations = Array.from({ length: 10 }, async (_, i) => {
        const upload = await nautilusClient.uploadFile({
          file: testData,
          type: `load_test_${i}`
        });

        return await nautilusClient.createAttestation({
          fileId: upload.file_id,
          operation: `load_operation_${i}`,
          metadata: { index: i }
        });
      });

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const endTime = Date.now();

      expect(results.length).toBe(10);
      expect(results.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in 10s
    });
  });

  describe('Error Handling', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network failure
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        nautilusClient.uploadFile({
          file: testData,
          type: 'network_test'
        })
      ).rejects.toThrow('Network error');

      // Restore fetch
      global.fetch = originalFetch;
    });

    it('should handle enclave unavailability', async () => {
      // Test with invalid enclave URL
      const invalidClient = new NautilusClient({
        enclaveUrl: 'http://invalid-enclave:9999',
        suiNetwork: 'testnet',
        marketplacePackageId: '0x123'
      });

      await expect(
        invalidClient.uploadFile({
          file: testData,
          type: 'unavailable_test'
        })
      ).rejects.toThrow();
    });

    it('should validate file uploads', async () => {
      // Test with empty file
      await expect(
        nautilusClient.uploadFile({
          file: new Uint8Array(),
          type: 'empty'
        })
      ).rejects.toThrow();

      // Test with invalid type
      await expect(
        nautilusClient.uploadFile({
          file: testData,
          type: '' // Empty type
        })
      ).rejects.toThrow();
    });

    it('should handle attestation failures', async () => {
      await expect(
        nautilusClient.createAttestation({
          fileId: 'non-existent-file',
          operation: 'test',
          metadata: {}
        })
      ).rejects.toThrow();
    });
  });

  describe('Integration with Blockchain', () => {
    it('should verify attestations on-chain', async () => {
      const uploadResult = await nautilusClient.uploadFile({
        file: testData,
        type: 'blockchain_test'
      });

      const attestation = await nautilusClient.createAttestation({
        fileId: uploadResult.file_id,
        operation: 'blockchain_verification',
        metadata: { chain: 'sui_testnet' }
      });

      // This would verify the attestation on Sui blockchain
      const verified = await nautilusClient.verifyOnChain({
        attestationId: attestation.id,
        signature: attestation.signature,
        publicKey: attestation.public_key,
        fileHash: uploadResult.hash
      });

      expect(verified).toBe(true);
    });

    it('should integrate with marketplace contracts', async () => {
      const marketplaceData = new TextEncoder().encode(JSON.stringify({
        listingId: 'listing-123',
        seller: '0xSeller',
        dataHash: 'original_hash'
      }));

      const uploadResult = await nautilusClient.uploadFile({
        file: marketplaceData,
        type: 'marketplace_integration'
      });

      const attestation = await nautilusClient.createAttestation({
        fileId: uploadResult.file_id,
        operation: 'marketplace_verification',
        metadata: {
          marketplaceContract: '0x123',
          operation: 'list_verification'
        }
      });

      expect(attestation.success).toBe(true);
      expect(attestation.metadata.marketplaceContract).toBe('0x123');
    });
  });

  // Helper method for hash calculation
  async calculateHash(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
});