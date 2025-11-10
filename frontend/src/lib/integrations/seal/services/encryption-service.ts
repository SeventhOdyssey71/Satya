// Seal Encryption Service - High-level encryption operations

import { SEAL_CONFIG } from '../config/seal.config';
import { EncryptionCore } from '../lib/encryption-core';
import {
  PolicyType,
  PolicyParams,
  PolicyMetadata,
  EncryptionResult,
  DecryptionResult,
  SealError,
  AccessDeniedError
} from '../types';
import { PolicyEngine } from '../utils/policy-engine';
import { SessionManager } from '../utils/session-manager';
import { DEKCache } from '../utils/dek-cache';

export class SealEncryptionService {
  private encryptionCore: EncryptionCore;
  private policyEngine: PolicyEngine;
  private sessionManager: SessionManager;
  private dekCache: DEKCache;
  private policyRegistry: Map<string, PolicyMetadata> = new Map();
  
  constructor() {
    this.encryptionCore = new EncryptionCore();
    this.policyEngine = new PolicyEngine();
    this.sessionManager = new SessionManager();
    this.dekCache = new DEKCache(SEAL_CONFIG.agent.cacheSize);
  }
  
  // Encrypt data with policy
  async encryptData(
    data: Uint8Array,
    policyType: PolicyType,
    params: PolicyParams = {}
  ): Promise<EncryptionResult> {
    try {
      // Validate input
      this.encryptionCore.validateEncryptionParams(data);
      
      // 1. Generate DEK
      const dek = await this.encryptionCore.generateDEK();
      
      // 2. Create policy
      const policyId = await this.createPolicy(policyType, params);
      
      // 3. Encrypt DEK with Seal
      const encryptedDEK = await this.encryptDEKWithSeal(dek, policyId);
      
      // 4. Encrypt data with DEK
      const { ciphertext, iv } = await this.encryptionCore.encryptWithDEK(data, dek);
      
      // 5. Store policy metadata
      this.policyRegistry.set(policyId, {
        type: policyType,
        createdAt: Date.now(),
        params,
        dekHash: await this.encryptionCore.hashDEK(dek)
      });
      
      // 6. Clear DEK from memory
      this.encryptionCore.secureClear(dek);
      
      return {
        success: true,
        encryptedData: ciphertext,
        encryptedDEK,
        policyId,
        iv
      };
      
    } catch (error) {
      return {
        success: false,
        encryptedData: new Uint8Array(),
        encryptedDEK: new Uint8Array(),
        policyId: '',
        iv: new Uint8Array(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  // Decrypt data with policy verification
  async decryptData(
    encryptedData: Uint8Array,
    encryptedDEK: Uint8Array,
    iv: Uint8Array,
    policyId: string,
    purchaseRecordId: string,
    requester: string
  ): Promise<DecryptionResult> {
    try {
      // 1. Verify policy
      const policyMet = await this.verifyPolicy(policyId, requester, purchaseRecordId);
      if (!policyMet) {
        throw new AccessDeniedError('Policy conditions not met');
      }
      
      // 2. Check DEK cache
      let dek = this.dekCache.get(policyId);
      
      if (!dek) {
        // 3. Get or create session
        const session = await this.sessionManager.getOrCreateSession(requester);
        
        // 4. Decrypt DEK with Seal (mock for now)
        dek = await this.decryptDEKWithSeal(encryptedDEK, policyId, session);
        
        // 5. Cache DEK
        this.dekCache.set(policyId, dek);
      }
      
      // 6. Decrypt data with DEK
      const decryptedData = await this.encryptionCore.decryptWithDEK(
        encryptedData,
        dek,
        iv
      );
      
      // 7. Clear DEK from local variable
      this.encryptionCore.secureClear(dek);
      
      return {
        success: true,
        data: decryptedData,
        accessGranted: true
      };
      
    } catch (error) {
      if (error instanceof AccessDeniedError) {
        return {
          success: false,
          accessGranted: false,
          error: error.message
        };
      }
      
      return {
        success: false,
        accessGranted: false,
        error: `Decryption failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  // Batch encryption for multiple files
  async batchEncrypt(
    files: { name: string; data: Uint8Array }[],
    policyType: PolicyType,
    params: PolicyParams = {}
  ): Promise<EncryptionResult[]> {
    const results: EncryptionResult[] = [];
    
    // Create shared policy
    const sharedPolicyId = await this.createPolicy(policyType, params);
    
    // Generate shared DEK
    const sharedDEK = await this.encryptionCore.generateDEK();
    
    // Encrypt DEK once
    const encryptedDEK = await this.encryptDEKWithSeal(sharedDEK, sharedPolicyId);
    
    // Encrypt each file with same DEK
    for (const file of files) {
      try {
        const { ciphertext, iv } = await this.encryptionCore.encryptWithDEK(
          file.data,
          sharedDEK
        );
        
        results.push({
          success: true,
          encryptedData: ciphertext,
          encryptedDEK,
          policyId: sharedPolicyId,
          iv
        });
      } catch (error) {
        results.push({
          success: false,
          encryptedData: new Uint8Array(),
          encryptedDEK: new Uint8Array(),
          policyId: '',
          iv: new Uint8Array(),
          error: `Failed to encrypt ${file.name}: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
    
    // Clear shared DEK
    this.encryptionCore.secureClear(sharedDEK);
    
    return results;
  }
  
  // Create policy based on type
  private async createPolicy(
    type: PolicyType,
    params: PolicyParams
  ): Promise<string> {
    const policyConfig = await this.policyEngine.createPolicy(type, params);
    const policyId = this.encryptionCore.generatePolicyId(type);
    
    // Store policy config (would be on-chain in production)
    this.policyEngine.storePolicy(policyId, policyConfig);
    
    return policyId;
  }
  
  // Mock Seal DEK encryption (replace with actual Seal SDK)
  private async encryptDEKWithSeal(
    dek: Uint8Array,
    policyId: string
  ): Promise<Uint8Array> {
    // Generate a key derived from policy ID for SEAL simulation
    const policyKey = await this.deriveKeyFromPolicy(policyId);
    
    // Encrypt DEK with the policy key
    const result = await this.encryptionCore.encryptWithDEK(dek, policyKey);
    
    // Return concatenated IV + encrypted DEK for storage
    const combined = new Uint8Array(result.iv.length + result.ciphertext.length);
    combined.set(result.iv);
    combined.set(result.ciphertext, result.iv.length);
    
    return combined;
  }
  
  // Mock Seal DEK decryption (replace with actual Seal SDK)
  private async decryptDEKWithSeal(
    encryptedDEK: Uint8Array,
    policyId: string,
    _session: any
  ): Promise<Uint8Array> {
    // Generate the same key derived from policy ID
    const policyKey = await this.deriveKeyFromPolicy(policyId);
    
    // Extract IV and encrypted data
    const ivLength = 12; // AES-GCM IV length
    const iv = encryptedDEK.slice(0, ivLength);
    const ciphertext = encryptedDEK.slice(ivLength);
    
    // Decrypt DEK with the policy key
    const decryptedDEK = await this.encryptionCore.decryptWithDEK(ciphertext, policyKey, iv);
    
    return decryptedDEK;
  }
  
  // Derive encryption key from policy ID for SEAL simulation
  private async deriveKeyFromPolicy(policyId: string): Promise<Uint8Array> {
    // Use PBKDF2 to derive a key from the policy ID
    const encoder = new TextEncoder();
    const policyData = encoder.encode(policyId);
    
    // Import the policy ID as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      policyData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive a 256-bit AES key
    const salt = new TextEncoder().encode('SealEncryptionService');
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export and return the raw key
    const exported = await crypto.subtle.exportKey('raw', key);
    return new Uint8Array(exported);
  }

  // Verify policy conditions
  private async verifyPolicy(
    policyId: string,
    requester: string,
    purchaseRecordId?: string
  ): Promise<boolean> {
    const policy = this.policyRegistry.get(policyId);
    if (!policy) {
      throw new SealError('Policy not found');
    }
    
    // Verify based on policy type
    switch (policy.type) {
      case PolicyType.PAYMENT_GATED:
        return this.verifyPaymentPolicy(policy, requester, purchaseRecordId);
      
      case PolicyType.TIME_LOCKED:
        return this.verifyTimeLockPolicy(policy);
      
      case PolicyType.ALLOWLIST:
        return this.verifyAllowlistPolicy(policy, requester);
      
      default:
        return true;
    }
  }
  
  private async verifyPaymentPolicy(
    _policy: PolicyMetadata,
    _requester: string,
    purchaseRecordId?: string
  ): Promise<boolean> {
    // In production, verify on-chain purchase record
    return !!purchaseRecordId;
  }
  
  private async verifyTimeLockPolicy(
    policy: PolicyMetadata
  ): Promise<boolean> {
    const unlockTime = policy.params.unlockTime || 0;
    return Date.now() >= unlockTime;
  }
  
  private async verifyAllowlistPolicy(
    policy: PolicyMetadata,
    requester: string
  ): Promise<boolean> {
    const allowedAddresses = policy.params.allowedAddresses || [];
    return allowedAddresses.includes(requester);
  }
}