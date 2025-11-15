// SEAL Client Wrapper - Real SEAL SDK Integration

import { SealClient, seal, SessionKey, type ExportedSessionKey, type EncryptOptions, type DecryptOptions } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { Transaction } from '@mysten/sui/transactions';
import { SEAL_CONFIG } from '../config/seal.config';
import { SealError, SessionError } from '../types';

export class SealClientWrapper {
  private client: SealClient;
  private suiClient: SuiClient;
  private sessionCache: Map<string, SessionKey> = new Map();
  
  constructor(suiClient: SuiClient) {
    this.suiClient = suiClient;
    
    // Extend the SUI client with SEAL capabilities
    const sealExtension = seal({
      serverConfigs: SEAL_CONFIG.testnet.keyServers,
      verifyKeyServers: SEAL_CONFIG.testnet.verifyKeyServers,
      timeout: 30000 // 30 seconds
    });
    
    const extendedClient = suiClient.$extend(sealExtension);
    this.client = extendedClient.seal;
  }
  
  /**
   * Create or retrieve a session key for the given user address
   */
  async getOrCreateSession(
    address: string, 
    signer?: Signer,
    ttlMinutes?: number
  ): Promise<SessionKey> {
    const sessionKey = `${address}:${SEAL_CONFIG.testnet.packageId}`;
    
    // Check cache first
    const cached = this.sessionCache.get(sessionKey);
    if (cached && !cached.isExpired()) {
      return cached;
    }
    
    try {
      // Create new session
      const session = await SessionKey.create({
        address,
        packageId: SEAL_CONFIG.testnet.packageId,
        ttlMin: ttlMinutes || SEAL_CONFIG.agent.sessionTTLMinutes,
        signer,
        suiClient: this.suiClient as any
      });
      
      // Cache the session
      this.sessionCache.set(sessionKey, session);
      
      return session;
    } catch (error) {
      throw new SessionError(`Failed to create session for ${address}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Encrypt data with SEAL using identity-based encryption
   */
  async encryptWithSeal(
    data: Uint8Array,
    policyId: string,
    identity: string,
    threshold?: number
  ): Promise<{ encryptedObject: Uint8Array; symmetricKey: Uint8Array }> {
    try {
      const encryptOptions: EncryptOptions = {
        threshold: threshold || SEAL_CONFIG.testnet.threshold,
        packageId: SEAL_CONFIG.testnet.packageId,
        id: identity, // Use the identity for encryption
        data,
        aad: new TextEncoder().encode(policyId) // Use policyId as additional authenticated data
      };
      
      const result = await this.client.encrypt(encryptOptions);
      
      return {
        encryptedObject: result.encryptedObject,
        symmetricKey: result.key
      };
    } catch (error) {
      throw new SealError(`SEAL encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Decrypt data with SEAL using threshold decryption
   */
  async decryptWithSeal(
    encryptedData: Uint8Array,
    sessionKey: SessionKey,
    authorizationTx: Transaction
  ): Promise<Uint8Array> {
    try {
      // Build the authorization transaction bytes
      const txBytes = await authorizationTx.build({ client: this.suiClient });
      
      const decryptOptions: DecryptOptions = {
        data: encryptedData,
        sessionKey,
        txBytes,
        checkShareConsistency: true,
        checkLEEncoding: false
      };
      
      const decryptedData = await this.client.decrypt(decryptOptions);
      
      return decryptedData;
    } catch (error) {
      throw new SealError(`SEAL decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create an authorization transaction for accessing encrypted data
   * This should call the appropriate smart contract functions that verify the policy
   */
  createAuthorizationTransaction(
    policyId: string,
    requesterAddress: string,
    purchaseRecordId?: string
  ): Transaction {
    const tx = new Transaction();
    
    // TODO: Add the actual smart contract calls based on your policy verification contract
    // This is a placeholder for the authorization logic
    tx.moveCall({
      target: `${SEAL_CONFIG.testnet.packageId}::seal_approve::verify_access`,
      arguments: [
        tx.pure.string(policyId),
        tx.pure.address(requesterAddress),
        tx.pure.string(purchaseRecordId || '')
      ]
    });
    
    return tx;
  }
  
  /**
   * Fetch keys from SEAL key servers for multiple encrypted objects
   */
  async fetchKeysForObjects(
    objectIds: string[],
    sessionKey: SessionKey,
    authorizationTx: Transaction,
    threshold?: number
  ): Promise<void> {
    try {
      const txBytes = await authorizationTx.build({ client: this.suiClient });
      
      await this.client.fetchKeys({
        ids: objectIds,
        txBytes,
        sessionKey,
        threshold: threshold || SEAL_CONFIG.testnet.threshold
      });
    } catch (error) {
      throw new SealError(`Failed to fetch keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Export session for persistence (e.g., to IndexedDB)
   */
  exportSession(address: string): ExportedSessionKey | null {
    const sessionKey = `${address}:${SEAL_CONFIG.testnet.packageId}`;
    const session = this.sessionCache.get(sessionKey);
    
    if (!session) {
      return null;
    }
    
    return session.export();
  }
  
  /**
   * Import session from persistence
   */
  importSession(
    exportedSession: ExportedSessionKey, 
    signer?: Signer
  ): SessionKey {
    const session = SessionKey.import(
      exportedSession, 
      this.suiClient as any, 
      signer
    );
    
    const sessionKey = `${exportedSession.address}:${exportedSession.packageId}`;
    this.sessionCache.set(sessionKey, session);
    
    return session;
  }
  
  /**
   * Clear expired sessions from cache
   */
  clearExpiredSessions(): void {
    for (const [key, session] of this.sessionCache.entries()) {
      if (session.isExpired()) {
        this.sessionCache.delete(key);
      }
    }
  }
  
  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
  } {
    let activeSessions = 0;
    let expiredSessions = 0;
    
    for (const session of this.sessionCache.values()) {
      if (session.isExpired()) {
        expiredSessions++;
      } else {
        activeSessions++;
      }
    }
    
    return {
      totalSessions: this.sessionCache.size,
      activeSessions,
      expiredSessions
    };
  }
}