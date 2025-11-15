// Session Manager for handling Seal sessions

import { SessionKey, type ExportedSessionKey } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { SEAL_CONFIG } from '../config/seal.config';
import { SessionData, SessionError } from '../types';
import { SealClientWrapper } from '../lib/seal-client';

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private sealClient: SealClientWrapper;
  private refreshThreshold: number;
  private sessionTTL: number;
  
  constructor(suiClient: SuiClient) {
    this.sealClient = SealClientWrapper.getInstance(suiClient);
    this.refreshThreshold = SEAL_CONFIG.agent.sessionRefreshThresholdMinutes * 60 * 1000;
    this.sessionTTL = SEAL_CONFIG.agent.sessionTTLMinutes * 60 * 1000;
    
    // Start session lifecycle management
    this.startSessionManagement();
    
    // Load persisted sessions if available
    this.loadPersistedSessions();
  }
  
  // Get or create session for user
  async getOrCreateSession(
    address: string, 
    signer?: Signer
  ): Promise<SessionKey> {
    const existing = this.getSession(address);
    
    if (existing && !this.isSessionExpired(existing)) {
      return existing.sessionKey as SessionKey;
    }
    
    return await this.createSession(address, signer);
  }
  
  // Get existing session
  getSession(address: string): SessionData | null {
    const session = this.sessions.get(address);
    
    if (!session) return null;
    
    if (this.isSessionExpired(session)) {
      this.sessions.delete(address);
      this.removePersistedSession(address);
      return null;
    }
    
    return session;
  }
  
  // Create new session using real SEAL SDK
  private async createSession(
    address: string, 
    signer?: Signer
  ): Promise<SessionKey> {
    try {
      console.log(`Creating SEAL session for ${address}`);
      
      // Create session using SEAL SDK
      const sessionKey = await this.sealClient.getOrCreateSession(
        address,
        signer,
        SEAL_CONFIG.agent.sessionTTLMinutes
      );
      
      // Store session data locally
      const sessionData: SessionData = {
        sessionKey,
        createdAt: Date.now(),
        refreshCount: 0,
        expiresAt: Date.now() + this.sessionTTL
      };
      
      this.sessions.set(address, sessionData);
      
      // Persist session
      this.persistSession(address, sessionKey);
      
      console.log(`SEAL session created successfully for ${address}`);
      
      return sessionKey;
    } catch (error) {
      console.error(`Failed to create SEAL session for ${address}:`, error);
      throw new SessionError(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Refresh session
  async refreshSession(address: string, signer?: Signer): Promise<SessionKey> {
    console.log(`Refreshing SEAL session for ${address}`);
    
    try {
      // Remove old session
      this.sessions.delete(address);
      this.removePersistedSession(address);
      
      // Create new session
      const newSession = await this.createSession(address, signer);
      
      const existingData = this.sessions.get(address);
      if (existingData) {
        existingData.refreshCount++;
      }
      
      return newSession;
      
    } catch (error) {
      console.error(`Failed to refresh session for ${address}:`, error);
      this.sessions.delete(address);
      throw new SessionError(`Session refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Check if session is expired
  private isSessionExpired(session: SessionData): boolean {
    // Check both local expiration and SEAL session expiration
    if (Date.now() >= session.expiresAt) {
      return true;
    }
    
    // Check if the SessionKey itself is expired
    if (session.sessionKey && typeof session.sessionKey.isExpired === 'function') {
      return session.sessionKey.isExpired();
    }
    
    return false;
  }
  
  // Check if session needs refresh
  private needsRefresh(session: SessionData): boolean {
    const remainingTime = session.expiresAt - Date.now();
    return remainingTime < this.refreshThreshold;
  }
  
  // Persist session to localStorage or IndexedDB
  private persistSession(address: string, sessionKey: SessionKey): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const exported = this.sealClient.exportSession(address);
        if (exported) {
          localStorage.setItem(`seal_session_${address}`, JSON.stringify(exported));
        }
      }
    } catch (error) {
      console.warn(`Failed to persist session for ${address}:`, error);
    }
  }
  
  // Remove persisted session
  private removePersistedSession(address: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(`seal_session_${address}`);
      }
    } catch (error) {
      console.warn(`Failed to remove persisted session for ${address}:`, error);
    }
  }
  
  // Load persisted sessions
  private loadPersistedSessions(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      // Scan for persisted sessions
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('seal_session_')) {
          const address = key.replace('seal_session_', '');
          const sessionData = localStorage.getItem(key);
          
          if (sessionData) {
            try {
              const exported: ExportedSessionKey = JSON.parse(sessionData);
              const sessionKey = this.sealClient.importSession(exported);
              
              // Check if session is still valid
              if (!sessionKey.isExpired()) {
                const sessionData: SessionData = {
                  sessionKey,
                  createdAt: exported.creationTimeMs,
                  refreshCount: 0,
                  expiresAt: exported.creationTimeMs + (exported.ttlMin * 60 * 1000)
                };
                
                this.sessions.set(address, sessionData);
                console.log(`Restored SEAL session for ${address}`);
              } else {
                // Remove expired persisted session
                localStorage.removeItem(key);
              }
            } catch (parseError) {
              console.warn(`Failed to parse persisted session for ${address}:`, parseError);
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted sessions:', error);
    }
  }
  
  // Start session lifecycle management
  private startSessionManagement(): void {
    setInterval(() => {
      this.checkAndRefreshSessions();
    }, 60000); // Check every minute
    
    // Also clean up expired sessions from SEAL client
    setInterval(() => {
      this.sealClient.clearExpiredSessions();
    }, 300000); // Every 5 minutes
  }
  
  // Check and refresh sessions proactively
  private async checkAndRefreshSessions(): Promise<void> {
    for (const [address, session] of this.sessions.entries()) {
      if (this.isSessionExpired(session)) {
        this.sessions.delete(address);
        this.removePersistedSession(address);
      } else if (this.needsRefresh(session)) {
        try {
          // Note: Auto-refresh requires signer which we don't have here
          // Sessions will be refreshed on next access
          console.log(`Session for ${address} needs refresh (will refresh on next access)`);
        } catch (error) {
          console.error(`Auto-refresh check failed for ${address}:`, error);
        }
      }
    }
  }
  
  // Clear all sessions
  clearAllSessions(): void {
    // Clear from memory
    this.sessions.clear();
    
    // Clear persisted sessions
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('seal_session_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }
  
  // Get session statistics
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    expiringSoon: number;
    sealClientStats: ReturnType<SealClientWrapper['getSessionStats']>;
  } {
    let activeSessions = 0;
    let expiringSoon = 0;
    
    for (const session of this.sessions.values()) {
      if (!this.isSessionExpired(session)) {
        activeSessions++;
        if (this.needsRefresh(session)) {
          expiringSoon++;
        }
      }
    }
    
    return {
      totalSessions: this.sessions.size,
      activeSessions,
      expiringSoon,
      sealClientStats: this.sealClient.getSessionStats()
    };
  }
  
  // Get the SEAL client for advanced operations
  getSealClient(): SealClientWrapper {
    return this.sealClient;
  }
}