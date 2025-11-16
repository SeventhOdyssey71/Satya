// SEAL Client Wrapper - Real SEAL SDK Integration

import { SealClient, SessionKey, type ExportedSessionKey, type EncryptOptions, type DecryptOptions } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { Transaction } from '@mysten/sui/transactions';
import { SEAL_CONFIG } from '../config/seal.config';
import { SealError, SessionError } from '../types';
import { KeyServerManager } from './key-server-manager';
import { SessionKeyManager } from './session-key-manager';

export class SealClientWrapper {
  private client: SealClient;
  private suiClient: SuiClient;
  private sessionCache: Map<string, SessionKey> = new Map();
  private keyServerManager: KeyServerManager;
  private sessionKeyManager: SessionKeyManager;
  private static instance: SealClientWrapper | null = null;
  
  constructor(suiClient: SuiClient) {
    // Prevent multiple instances
    if (SealClientWrapper.instance) {
      return SealClientWrapper.instance;
    }
    
    this.suiClient = suiClient;
    
    try {
      // Initialize managers
      this.keyServerManager = new KeyServerManager(suiClient);
      this.sessionKeyManager = new SessionKeyManager(suiClient);
      
      // Create SEAL client with proper configuration
      console.log('🔧 Initializing SEAL client for testnet with key server management');
      
      // Use best available key servers
      const bestServers = this.keyServerManager.selectBestKeyServers();
      const serverConfigs = bestServers.length > 0 
        ? bestServers.map(s => ({ objectId: s.objectId, url: s.url, weight: s.weight }))
        : SEAL_CONFIG.testnet.keyServers;
      
      this.client = new SealClient({
        suiClient: suiClient as any,
        serverConfigs,
        verifyKeyServers: SEAL_CONFIG.testnet.verifyKeyServers,
        timeout: 30000
      });
      
      // Verify package exists on network (async, non-blocking)
      this.verifyPackage().catch(error => {
        console.warn('Could not verify SEAL package:', error);
      });
      
      // Run quick validation test in development
      if (process.env.NODE_ENV === 'development') {
        import('../utils/seal-test').then(({ validateSealClient }) => {
          validateSealClient().catch(console.warn);
        }).catch(() => {}); // Ignore import errors
      }
    } catch (error) {
      console.error('Failed to initialize SEAL client:', error);
      throw new SealError(`SEAL client initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    SealClientWrapper.instance = this;
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(suiClient: SuiClient): SealClientWrapper {
    if (!SealClientWrapper.instance) {
      try {
        SealClientWrapper.instance = new SealClientWrapper(suiClient);
      } catch (error) {
        // If creation fails, reset instance and rethrow
        SealClientWrapper.instance = null;
        throw error;
      }
    }
    return SealClientWrapper.instance;
  }
  
  /**
   * Reset singleton instance (for development/testing)
   */
  static resetInstance(): void {
    if (SealClientWrapper.instance) {
      // Cleanup managers
      SealClientWrapper.instance.keyServerManager?.destroy();
      SealClientWrapper.instance.sessionKeyManager?.destroy();
    }
    SealClientWrapper.instance = null;
  }
  
  /**
   * Check if instance exists
   */
  static hasInstance(): boolean {
    return SealClientWrapper.instance !== null;
  }
  
  /**
   * Verify SEAL package exists on network
   */
  private async verifyPackage(): Promise<void> {
    try {
      console.log('🔍 Verifying SEAL package:', SEAL_CONFIG.testnet.packageId);
      
      // Try to get the package object
      const packageInfo = await this.suiClient.getObject({
        id: SEAL_CONFIG.testnet.packageId,
        options: { 
          showType: true, 
          showContent: true, 
          showPreviousTransaction: true,
          showOwner: true,
          showStorageRebate: true
        }
      });
      
      console.log('📦 SEAL package details:', packageInfo);
      
      if (packageInfo.error) {
        console.error('❌ Package error:', packageInfo.error);
        
        // Try to find the correct SEAL package by searching for packages
        try {
          console.log('🔎 Searching for SEAL packages on testnet...');
          const events = await this.suiClient.queryEvents({
            query: { Package: SEAL_CONFIG.testnet.packageId },
            limit: 10
          });
          console.log('📊 SEAL package events:', events);
        } catch (eventError) {
          console.warn('Could not query package events:', eventError);
        }
      } else if (packageInfo.data) {
        console.log('✅ SEAL package found successfully');
        console.log('📄 Package type:', packageInfo.data.type);
        console.log('🔢 Package version:', packageInfo.data.version);
        console.log('👤 Package owner:', packageInfo.data.owner);
        
        // Verify this is actually a package object
        if (packageInfo.data.type !== 'package') {
          console.warn('⚠️  Object is not a package type:', packageInfo.data.type);
        }
      }
    } catch (error) {
      console.warn('❌ SEAL package verification failed:', error);
    }
  }
  
  /**
   * Create or retrieve a session key for the given user address
   */
  async getOrCreateSession(
    address: string, 
    signer?: Signer,
    ttlMinutes?: number
  ): Promise<SessionKey> {
    try {
      const { sessionKey, isNew } = await this.sessionKeyManager.getOrCreateSession(
        address,
        SEAL_CONFIG.testnet.packageId,
        signer,
        ttlMinutes
      );

      if (isNew) {
        console.log('✅ Created new SEAL session for address:', address.substring(0, 10) + '...');
      } else {
        console.log('🔄 Reusing existing SEAL session for address:', address.substring(0, 10) + '...');
      }

      return sessionKey;
    } catch (error) {
      throw new SessionError(`Failed to get or create session for ${address}: ${error instanceof Error ? error.message : String(error)}`);
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
      // Normalize package ID format
      const packageId = SEAL_CONFIG.testnet.packageId.startsWith('0x') 
        ? SEAL_CONFIG.testnet.packageId 
        : `0x${SEAL_CONFIG.testnet.packageId}`;

      const encryptOptions: EncryptOptions = {
        threshold: threshold || SEAL_CONFIG.testnet.threshold,
        packageId: packageId,
        id: identity, // Use the identity for encryption
        data,
        aad: new TextEncoder().encode(policyId) // Use policyId as additional authenticated data
      };
      
      // Log encryption attempt for debugging
      console.log('🔐 SEAL encryption attempt:', {
        threshold: encryptOptions.threshold,
        packageId: encryptOptions.packageId.substring(0, 10) + '...',
        dataSize: data.length
      });
      
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
      signer as any
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
  getSessionStats() {
    return this.sessionKeyManager.getSessionStats();
  }

  /**
   * Get key server manager for advanced operations
   */
  getKeyServerManager(): KeyServerManager {
    return this.keyServerManager;
  }

  /**
   * Get session key manager for advanced operations
   */
  getSessionKeyManager(): SessionKeyManager {
    return this.sessionKeyManager;
  }

  /**
   * Get key server health and metrics
   */
  async getKeyServerHealth() {
    return await this.keyServerManager.checkAllKeyServersHealth();
  }

  /**
   * Get key server metrics
   */
  async getKeyServerMetrics() {
    return await this.keyServerManager.getKeyServerMetrics();
  }

  /**
   * Test all key servers for SEAL operations
   */
  async testAllKeyServers() {
    const servers = this.keyServerManager.getConfiguredKeyServers();
    const testPromises = servers.map(server => 
      this.keyServerManager.testKeyServerForSeal(server)
    );
    
    const results = await Promise.allSettled(testPromises);
    
    return servers.map((server, index) => ({
      server,
      result: results[index].status === 'fulfilled' 
        ? results[index].value 
        : { success: false, error: (results[index] as PromiseRejectedResult).reason }
    }));
  }
}

// Reset instance in development mode during hot module replacement
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Clear instance on page reload/refresh in development
  window.addEventListener('beforeunload', () => {
    SealClientWrapper.resetInstance();
  });
  
  // Also clear on hot reload if available
  if ((module as any).hot) {
    (module as any).hot.dispose(() => {
      SealClientWrapper.resetInstance();
    });
  }
}