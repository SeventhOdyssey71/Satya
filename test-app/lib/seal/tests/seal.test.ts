// Seal Integration Tests

import { SealEncryptionService } from '../services/encryption-service';
import { EncryptionCore } from '../lib/encryption-core';
import { PolicyEngine } from '../utils/policy-engine';
import { SessionManager } from '../utils/session-manager';
import { DEKCache } from '../utils/dek-cache';
import { PolicyType } from '../types';

describe('Seal Integration', () => {
  describe('EncryptionCore', () => {
    let core: EncryptionCore;
    
    beforeEach(() => {
      core = new EncryptionCore();
    });
    
    it('should generate DEK successfully', async () => {
      const dek = await core.generateDEK();
      
      expect(dek).toBeInstanceOf(Uint8Array);
      expect(dek.length).toBe(32); // 256 bits
    });
    
    it('should encrypt and decrypt data with DEK', async () => {
      const plaintext = new TextEncoder().encode('Test AI model data');
      const dek = await core.generateDEK();
      
      // Encrypt
      const { ciphertext, iv } = await core.encryptWithDEK(plaintext, dek);
      expect(ciphertext).toBeInstanceOf(Uint8Array);
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12);
      
      // Decrypt
      const decrypted = await core.decryptWithDEK(ciphertext, dek, iv);
      expect(decrypted).toEqual(plaintext);
    });
    
    it('should generate unique policy IDs', () => {
      const id1 = core.generatePolicyId('test');
      const id2 = core.generatePolicyId('test');
      
      expect(id1).not.toBe(id2);
      expect(id1).toContain('test_');
    });
    
    it('should convert between hex and bytes', () => {
      const bytes = new Uint8Array([0x01, 0x02, 0x03, 0xFF]);
      const hex = core.toHex(bytes);
      const converted = core.fromHex(hex);
      
      expect(hex).toBe('010203ff');
      expect(converted).toEqual(bytes);
    });
    
    it('should validate encryption parameters', () => {
      const validData = new Uint8Array([1, 2, 3]);
      const emptyData = new Uint8Array();
      const largeData = new Uint8Array(101 * 1024 * 1024); // 101MB
      
      expect(() => core.validateEncryptionParams(validData)).not.toThrow();
      expect(() => core.validateEncryptionParams(emptyData)).toThrow('Data cannot be empty');
      expect(() => core.validateEncryptionParams(largeData)).toThrow('Data too large');
    });
  });
  
  describe('SealEncryptionService', () => {
    let service: SealEncryptionService;
    
    beforeEach(() => {
      service = new SealEncryptionService();
    });
    
    it('should encrypt data with payment-gated policy', async () => {
      const data = new TextEncoder().encode('Test model');
      
      const result = await service.encryptData(
        data,
        PolicyType.PAYMENT_GATED,
        { price: 1000, seller: '0x123', assetId: 'asset_001' }
      );
      
      expect(result.success).toBe(true);
      expect(result.encryptedData).toBeInstanceOf(Uint8Array);
      expect(result.encryptedDEK).toBeInstanceOf(Uint8Array);
      expect(result.policyId).toBeDefined();
      expect(result.iv).toBeInstanceOf(Uint8Array);
    });
    
    it('should decrypt data with valid purchase record', async () => {
      const plaintext = new TextEncoder().encode('Test model');
      
      // First encrypt
      const encryptResult = await service.encryptData(
        plaintext,
        PolicyType.PAYMENT_GATED,
        { price: 1000, seller: '0x123' }
      );
      
      // Then decrypt with valid purchase record
      const decryptResult = await service.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        'valid_purchase_id',
        '0x456'
      );
      
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.accessGranted).toBe(true);
      expect(decryptResult.data).toEqual(plaintext);
    });
    
    it('should deny access without valid purchase record', async () => {
      const data = new TextEncoder().encode('Test model');
      
      // Encrypt
      const encryptResult = await service.encryptData(
        data,
        PolicyType.PAYMENT_GATED,
        { price: 1000, seller: '0x123' }
      );
      
      // Try to decrypt without purchase record
      const decryptResult = await service.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        '', // No purchase record
        '0x456'
      );
      
      expect(decryptResult.success).toBe(false);
      expect(decryptResult.accessGranted).toBe(false);
      expect(decryptResult.error).toContain('Policy conditions not met');
    });
    
    it('should handle time-locked policy', async () => {
      const data = new TextEncoder().encode('Test model');
      const futureTime = Date.now() + 10000; // 10 seconds in future
      
      // Encrypt with time lock
      const encryptResult = await service.encryptData(
        data,
        PolicyType.TIME_LOCKED,
        { unlockTime: futureTime }
      );
      
      // Try to decrypt before unlock time
      const earlyDecrypt = await service.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        '',
        '0x456'
      );
      
      expect(earlyDecrypt.success).toBe(false);
      expect(earlyDecrypt.accessGranted).toBe(false);
    });
    
    it('should handle allowlist policy', async () => {
      const data = new TextEncoder().encode('Test model');
      const allowedAddresses = ['0xAAA', '0xBBB', '0xCCC'];
      
      // Encrypt with allowlist
      const encryptResult = await service.encryptData(
        data,
        PolicyType.ALLOWLIST,
        { allowedAddresses }
      );
      
      // Allowed address should succeed
      const allowedDecrypt = await service.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        '',
        '0xAAA'
      );
      
      expect(allowedDecrypt.success).toBe(true);
      expect(allowedDecrypt.accessGranted).toBe(true);
      
      // Non-allowed address should fail
      const deniedDecrypt = await service.decryptData(
        encryptResult.encryptedData,
        encryptResult.encryptedDEK,
        encryptResult.iv,
        encryptResult.policyId,
        '',
        '0xZZZ'
      );
      
      expect(deniedDecrypt.success).toBe(false);
      expect(deniedDecrypt.accessGranted).toBe(false);
    });
    
    it('should batch encrypt multiple files', async () => {
      const files = [
        { name: 'model1.bin', data: new TextEncoder().encode('Model 1') },
        { name: 'model2.bin', data: new TextEncoder().encode('Model 2') },
        { name: 'model3.bin', data: new TextEncoder().encode('Model 3') }
      ];
      
      const results = await service.batchEncrypt(
        files,
        PolicyType.PAYMENT_GATED,
        { price: 1000, seller: '0x123' }
      );
      
      expect(results.length).toBe(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.policyId === results[0].policyId)).toBe(true);
    });
  });
  
  describe('PolicyEngine', () => {
    let engine: PolicyEngine;
    
    beforeEach(() => {
      engine = new PolicyEngine();
    });
    
    it('should create payment-gated policy', async () => {
      const policy = await engine.createPolicy(
        PolicyType.PAYMENT_GATED,
        { price: 1000, seller: '0x123', assetId: 'asset_001' }
      );
      
      expect(policy.type).toBe(PolicyType.PAYMENT_GATED);
      expect(policy.rules).toHaveLength(2);
      expect(policy.rules[0].type).toBe('payment');
      expect(policy.rules[0].amount).toBe(1000);
    });
    
    it('should create TEE-only policy', async () => {
      const policy = await engine.createPolicy(
        PolicyType.TEE_ONLY,
        { enclaveId: 'enclave_123' }
      );
      
      expect(policy.type).toBe(PolicyType.TEE_ONLY);
      expect(policy.rules).toHaveLength(1);
      expect(policy.rules[0].type).toBe('attestation');
      expect(policy.rules[0].requiredEnclaveId).toBe('enclave_123');
    });
    
    it('should validate policy parameters', () => {
      // Valid payment policy
      expect(() => engine.validatePolicyParams(
        PolicyType.PAYMENT_GATED,
        { price: 1000, seller: '0x123' }
      )).not.toThrow();
      
      // Invalid payment policy (no price)
      expect(() => engine.validatePolicyParams(
        PolicyType.PAYMENT_GATED,
        { seller: '0x123' }
      )).toThrow('Invalid price');
      
      // Invalid TEE policy (no enclave ID)
      expect(() => engine.validatePolicyParams(
        PolicyType.TEE_ONLY,
        {}
      )).toThrow('Enclave ID required');
    });
  });
  
  describe('SessionManager', () => {
    let manager: SessionManager;
    
    beforeEach(() => {
      manager = new SessionManager();
    });
    
    it('should create new session', async () => {
      const session = await manager.getOrCreateSession('0x123');
      
      expect(session).toBeDefined();
      expect(session.address).toBe('0x123');
      expect(session.id).toContain('session_');
    });
    
    it('should reuse existing session', async () => {
      const session1 = await manager.getOrCreateSession('0x123');
      const session2 = await manager.getOrCreateSession('0x123');
      
      expect(session1.id).toBe(session2.id);
    });
    
    it('should refresh expired session', async () => {
      const session1 = await manager.getOrCreateSession('0x123');
      
      // Manually expire the session
      const sessionData = manager.getSession('0x123');
      if (sessionData) {
        sessionData.expiresAt = Date.now() - 1000;
      }
      
      const session2 = await manager.getOrCreateSession('0x123');
      
      expect(session1.id).not.toBe(session2.id);
    });
    
    it('should track session statistics', async () => {
      await manager.getOrCreateSession('0x111');
      await manager.getOrCreateSession('0x222');
      await manager.getOrCreateSession('0x333');
      
      const stats = manager.getSessionStats();
      
      expect(stats.totalSessions).toBe(3);
      expect(stats.activeSessions).toBe(3);
      expect(stats.expiringSoon).toBe(0);
    });
  });
  
  describe('DEKCache', () => {
    let cache: DEKCache;
    
    beforeEach(() => {
      cache = new DEKCache(3); // Small cache for testing
    });
    
    it('should store and retrieve DEK', () => {
      const policyId = 'policy_001';
      const dek = new Uint8Array([1, 2, 3, 4, 5]);
      
      cache.set(policyId, dek);
      const retrieved = cache.get(policyId);
      
      expect(retrieved).toEqual(dek);
    });
    
    it('should evict oldest entry when full', () => {
      const dek1 = new Uint8Array([1, 2, 3]);
      const dek2 = new Uint8Array([4, 5, 6]);
      const dek3 = new Uint8Array([7, 8, 9]);
      const dek4 = new Uint8Array([10, 11, 12]);
      
      cache.set('policy_001', dek1);
      cache.set('policy_002', dek2);
      cache.set('policy_003', dek3);
      cache.set('policy_004', dek4); // Should evict policy_001
      
      expect(cache.get('policy_001')).toBeNull();
      expect(cache.get('policy_004')).not.toBeNull();
    });
    
    it('should expire old entries', async () => {
      const cache = new DEKCache(10);
      // Override TTL for testing
      cache['ttl'] = 100; // 100ms
      
      const dek = new Uint8Array([1, 2, 3]);
      cache.set('policy_001', dek);
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('policy_001')).toBeNull();
    });
    
    it('should securely clear DEKs', () => {
      const dek = new Uint8Array([1, 2, 3, 4, 5]);
      
      cache.set('policy_001', dek);
      const retrieved = cache.get('policy_001');
      expect(retrieved).toEqual(dek);
      
      cache.delete('policy_001');
      
      // After deletion, should return null
      expect(cache.get('policy_001')).toBeNull();
      
      // Original DEK should NOT be modified (we store copies)
      expect(dek).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    });
  });
});

// End-to-end integration test
describe('Seal End-to-End', () => {
  it('should handle complete encryption and decryption cycle', async () => {
    const service = new SealEncryptionService();
    
    // Test data
    const modelData = 'This is a test AI model with sensitive parameters';
    const plaintext = new TextEncoder().encode(modelData);
    
    // Encrypt with payment-gated policy
    const encryptResult = await service.encryptData(
      plaintext,
      PolicyType.PAYMENT_GATED,
      { 
        price: 5000,
        seller: '0xSELLER',
        assetId: 'model_xyz_001'
      }
    );
    
    expect(encryptResult.success).toBe(true);
    
    // Simulate purchase and decrypt
    const decryptResult = await service.decryptData(
      encryptResult.encryptedData,
      encryptResult.encryptedDEK,
      encryptResult.iv,
      encryptResult.policyId,
      'purchase_record_123',
      '0xBUYER'
    );
    
    expect(decryptResult.success).toBe(true);
    expect(decryptResult.accessGranted).toBe(true);
    
    const decryptedText = new TextDecoder().decode(decryptResult.data);
    expect(decryptedText).toBe(modelData);
  });
});