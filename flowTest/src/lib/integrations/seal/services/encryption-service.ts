// Seal Encryption Service - High-level encryption operations

import { SuiClient } from '@mysten/sui/client';
import { createSuiClientWithFallback } from '../../sui/rpc-fallback';
import { Transaction } from '@mysten/sui/transactions';
import type { Signer } from '@mysten/sui/cryptography';
import { SessionKey } from '@mysten/seal';
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
import { SealClientWrapper } from '../lib/seal-client';

export class SealEncryptionService {
  private encryptionCore: EncryptionCore;
  private policyEngine: PolicyEngine;
  private sessionManager: SessionManager;
  private dekCache: DEKCache;
  private sealClient: SealClientWrapper;
  private suiClient: SuiClient;
  private policyRegistry: Map<string, PolicyMetadata> = new Map();
  
  constructor(suiClient: SuiClient) {
    this.suiClient = suiClient;
    this.encryptionCore = new EncryptionCore();
    this.policyEngine = new PolicyEngine();
    this.sessionManager = new SessionManager(suiClient);
    this.dekCache = new DEKCache(SEAL_CONFIG.agent.cacheSize);
    this.sealClient = this.sessionManager.getSealClient();
  }

  // Create service with fallback RPC support
  static async createWithFallback(): Promise<SealEncryptionService> {
    try {
      const suiClient = await createSuiClientWithFallback();
      return new SealEncryptionService(suiClient);
    } catch (error) {
      throw new SealError(`Failed to create SEAL service with fallback: ${error instanceof Error ? error.message : String(error)}`);
    }
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
  
  // Decrypt data with policy verification and real SEAL integration
  async decryptData(
    encryptedData: Uint8Array,
    encryptedDEK: Uint8Array,
    iv: Uint8Array,
    policyId: string,
    purchaseRecordId: string,
    requester: string,
    signer?: Signer
  ): Promise<DecryptionResult> {
    try {
      console.log(`Starting SEAL decryption for policy ${policyId}, requester ${requester}`);
      
      // 1. Verify policy conditions
      const policyMet = await this.verifyPolicy(policyId, requester, purchaseRecordId);
      if (!policyMet) {
        throw new AccessDeniedError('Policy conditions not met');
      }
      
      // 2. Check DEK cache
      let dek = this.dekCache.get(policyId);
      
      if (!dek) {
        // 3. Get or create SEAL session
        const session = await this.sessionManager.getOrCreateSession(requester, signer);
        
        // 4. Decrypt DEK with real SEAL using threshold decryption
        dek = await this.decryptDEKWithSeal(
          encryptedDEK, 
          policyId, 
          session, 
          requester, 
          purchaseRecordId
        );
        
        // 5. Cache DEK for future use
        this.dekCache.set(policyId, dek);
        
        console.log(`DEK successfully decrypted and cached for policy ${policyId}`);
      } else {
        console.log(`Using cached DEK for policy ${policyId}`);
      }
      
      // 6. Decrypt data with DEK
      const decryptedData = await this.encryptionCore.decryptWithDEK(
        encryptedData,
        dek,
        iv
      );
      
      // 7. Clear DEK from local variable (cache retains it)
      this.encryptionCore.secureClear(dek);
      
      console.log(`Data decryption successful for policy ${policyId}`);
      
      return {
        success: true,
        data: decryptedData,
        accessGranted: true
      };
      
    } catch (error) {
      console.error(`Decryption failed for policy ${policyId}:`, error);
      
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
  
  // Real SEAL DEK encryption with identity-based encryption
  private async encryptDEKWithSeal(
    dek: Uint8Array,
    policyId: string
  ): Promise<Uint8Array> {
    try {
      console.log(`Encrypting DEK with SEAL for policy ${policyId}`);
      
      // Use the policy ID as the identity for SEAL encryption
      const identity = this.generateIdentityFromPolicy(policyId);
      console.log(`Generated identity for policy ${policyId}:`, identity);
      
      // Encrypt DEK using SEAL's identity-based encryption
      const result = await this.sealClient.encryptWithSeal(
        dek,
        policyId,
        identity,
        SEAL_CONFIG.testnet.threshold
      );
      
      console.log(`DEK encrypted successfully with SEAL for policy ${policyId}`);
      
      // Return the encrypted object (contains all SEAL metadata)
      return result.encryptedObject;
    } catch (error) {
      console.error(`SEAL DEK encryption failed for policy ${policyId}:`, error);
      
      // Check if this is a PTB/package ID error - these are usually unrecoverable
      if (error instanceof Error && error.message.includes('Package ID used in PTB is invalid')) {
        throw new SealError(`SEAL configuration error - invalid package ID: ${SEAL_CONFIG.testnet.packageId}. This may indicate the package is not deployed or has moved.`);
      }
      
      throw new SealError(`Failed to encrypt DEK with SEAL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Real SEAL DEK decryption with threshold decryption
  private async decryptDEKWithSeal(
    encryptedDEK: Uint8Array,
    policyId: string,
    session: SessionKey,
    requester: string,
    purchaseRecordId?: string
  ): Promise<Uint8Array> {
    try {
      console.log(`Decrypting DEK with SEAL for policy ${policyId}`);
      
      // Create authorization transaction that verifies the policy
      const authTx = this.createAuthorizationTransaction(policyId, requester, purchaseRecordId);
      
      // Decrypt using SEAL's threshold decryption
      const decryptedDEK = await this.sealClient.decryptWithSeal(
        encryptedDEK,
        session,
        authTx
      );
      
      console.log(`DEK decrypted successfully with SEAL for policy ${policyId}`);
      
      return decryptedDEK;
    } catch (error) {
      console.error(`SEAL DEK decryption failed for policy ${policyId}:`, error);
      throw new SealError(`Failed to decrypt DEK with SEAL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Generate a deterministic identity from policy for SEAL encryption
  private generateIdentityFromPolicy(policyId: string): string {
    // SEAL SDK expects the identity to be a simple string
    // Use just the policy ID as the identity for now
    // TODO: Verify with SEAL documentation for proper identity format
    return policyId;
  }
  
  // Create authorization transaction for SEAL access control
  private createAuthorizationTransaction(
    policyId: string,
    requester: string,
    purchaseRecordId?: string
  ): Transaction {
    return this.sealClient.createAuthorizationTransaction(policyId, requester, purchaseRecordId);
  }
  
  // Add utility method to get session statistics  
  getSessionStats() {
    return this.sessionManager.getSessionStats();
  }
  
  // Add method to clear all sessions (for testing/admin)
  clearAllSessions(): void {
    this.sessionManager.clearAllSessions();
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
  
  // On-chain payment policy verification
  private async verifyPaymentPolicy(
    policy: PolicyMetadata,
    requester: string,
    purchaseRecordId?: string
  ): Promise<boolean> {
    if (!purchaseRecordId) {
      console.warn(`No purchase record ID provided for requester ${requester}`);
      return false;
    }
    
    try {
      console.log(`Verifying payment policy for ${requester} with purchase record ${purchaseRecordId}`);
      
      // Query the blockchain for the purchase record
      const purchaseRecord = await this.verifyPurchaseRecordOnChain(
        purchaseRecordId,
        requester,
        policy.params.assetId || '',
        policy.params.seller || ''
      );
      
      if (!purchaseRecord) {
        console.warn(`Purchase record ${purchaseRecordId} not found or invalid`);
        return false;
      }
      
      // Verify purchase is still valid (not expired, not refunded, etc.)
      const isValid = await this.verifyPurchaseRecordValidity(purchaseRecord);
      
      console.log(`Purchase record verification result: ${isValid}`);
      return isValid;
      
    } catch (error) {
      console.error(`Payment policy verification failed for ${requester}:`, error);
      return false;
    }
  }
  
  // Verify purchase record exists on Sui blockchain
  private async verifyPurchaseRecordOnChain(
    purchaseRecordId: string,
    buyerAddress: string,
    assetId: string,
    sellerAddress: string
  ): Promise<any | null> {
    try {
      // Query the Sui blockchain for the purchase object
      const purchaseObject = await this.suiClient.getObject({
        id: purchaseRecordId,
        options: {
          showContent: true,
          showOwner: true,
          showType: true
        }
      });
      
      if (!purchaseObject.data) {
        return null;
      }
      
      // Verify the purchase object structure and ownership
      const content = purchaseObject.data.content as any;
      if (!content || !content.fields) {
        return null;
      }
      
      // Verify buyer, seller, and asset match
      const fields = content.fields;
      if (
        fields.buyer !== buyerAddress ||
        fields.seller !== sellerAddress ||
        fields.asset_id !== assetId
      ) {
        console.warn('Purchase record fields do not match expected values', {
          expected: { buyerAddress, sellerAddress, assetId },
          actual: { 
            buyer: fields.buyer, 
            seller: fields.seller, 
            asset_id: fields.asset_id 
          }
        });
        return null;
      }
      
      return fields;
      
    } catch (error) {
      console.error('Failed to verify purchase record on-chain:', error);
      return null;
    }
  }
  
  // Verify purchase record is still valid
  private async verifyPurchaseRecordValidity(purchaseRecord: any): Promise<boolean> {
    try {
      const now = Date.now();
      
      // Check if purchase has expired
      if (purchaseRecord.expires_at && purchaseRecord.expires_at < now) {
        console.warn('Purchase record has expired');
        return false;
      }
      
      // Check if purchase has been refunded or cancelled
      if (purchaseRecord.status && purchaseRecord.status !== 'active') {
        console.warn('Purchase record is not active:', purchaseRecord.status);
        return false;
      }
      
      // Check access duration limit if specified
      if (purchaseRecord.access_duration_ms) {
        const accessExpiry = purchaseRecord.purchase_time + purchaseRecord.access_duration_ms;
        if (now > accessExpiry) {
          console.warn('Purchase access duration has expired');
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('Failed to verify purchase record validity:', error);
      return false;
    }
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