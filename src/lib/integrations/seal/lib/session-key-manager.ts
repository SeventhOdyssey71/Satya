// SEAL Session Key Manager - Advanced session management for SEAL operations

import { SessionKey, type ExportedSessionKey } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { SEAL_CONFIG } from '../config/seal.config';

export interface SessionMetadata {
 sessionId: string;
 address: string;
 packageId: string;
 createdAt: Date;
 expiresAt: Date;
 lastUsed: Date;
 usageCount: number;
 isActive: boolean;
}

export interface SessionStats {
 totalSessions: number;
 activeSessions: number;
 expiredSessions: number;
 averageSessionDuration: number;
 totalUsage: number;
}

export class SessionKeyManager {
 private suiClient: SuiClient;
 private sessionCache = new Map<string, { sessionKey: SessionKey; metadata: SessionMetadata }>();
 private cleanupInterval: NodeJS.Timeout | null = null;

 constructor(suiClient: SuiClient) {
  this.suiClient = suiClient;
  this.startCleanupService();
 }

 /**
  * Create a new session key with metadata tracking
  */
 async createSession(
  address: string,
  packageId: string,
  signer?: Signer,
  ttlMinutes?: number
 ): Promise<{ sessionKey: SessionKey; sessionId: string }> {
  try {
   const sessionId = this.generateSessionId(address, packageId);
   const ttl = ttlMinutes || SEAL_CONFIG.agent.sessionTTLMinutes;
   
   console.log(`🔑 Creating SEAL session:`, {
    sessionId: sessionId.substring(0, 16) + '...',
    address: address.substring(0, 10) + '...',
    packageId: packageId.substring(0, 10) + '...',
    ttlMinutes: ttl
   });

   // Create the session key using SEAL SDK
   const sessionKey = await SessionKey.create({
    address,
    packageId,
    ttlMin: ttl,
    signer: signer as any,
    suiClient: this.suiClient as any
   });

   // Create metadata for tracking
   const now = new Date();
   const expiresAt = new Date(now.getTime() + ttl * 60 * 1000);
   
   const metadata: SessionMetadata = {
    sessionId,
    address,
    packageId,
    createdAt: now,
    expiresAt,
    lastUsed: now,
    usageCount: 0,
    isActive: true
   };

   // Store in cache
   this.sessionCache.set(sessionId, { sessionKey, metadata });
   
   console.log(`SEAL session created successfully: ${sessionId.substring(0, 16)}...`);
   
   return { sessionKey, sessionId };
   
  } catch (error) {
   console.error('Failed to create SEAL session:', error);
   throw new Error(`Session creation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
 }

 /**
  * Get an existing session or create a new one
  */
 async getOrCreateSession(
  address: string,
  packageId: string,
  signer?: Signer,
  ttlMinutes?: number
 ): Promise<{ sessionKey: SessionKey; sessionId: string; isNew: boolean }> {
  const sessionId = this.generateSessionId(address, packageId);
  const cached = this.sessionCache.get(sessionId);
  
  // Check if we have a valid cached session
  if (cached && this.isSessionValid(cached.metadata)) {
   // Update last used time
   cached.metadata.lastUsed = new Date();
   cached.metadata.usageCount++;
   
   console.log(`Reusing existing SEAL session: ${sessionId.substring(0, 16)}...`);
   return { 
    sessionKey: cached.sessionKey, 
    sessionId, 
    isNew: false 
   };
  }

  // Create new session if none exists or expired
  if (cached) {
   console.log(`⏰ Session expired, creating new one: ${sessionId.substring(0, 16)}...`);
   this.sessionCache.delete(sessionId);
  }

  const { sessionKey, sessionId: newSessionId } = await this.createSession(
   address, 
   packageId, 
   signer, 
   ttlMinutes
  );
  
  return { sessionKey, sessionId: newSessionId, isNew: true };
 }

 /**
  * Get session by ID
  */
 getSession(sessionId: string): SessionKey | null {
  const cached = this.sessionCache.get(sessionId);
  if (cached && this.isSessionValid(cached.metadata)) {
   cached.metadata.lastUsed = new Date();
   cached.metadata.usageCount++;
   return cached.sessionKey;
  }
  return null;
 }

 /**
  * Export session for persistence (e.g., browser storage)
  */
 exportSession(sessionId: string): ExportedSessionKey | null {
  const cached = this.sessionCache.get(sessionId);
  if (cached && this.isSessionValid(cached.metadata)) {
   return cached.sessionKey.export();
  }
  return null;
 }

 /**
  * Import session from exported data
  */
 importSession(
  exportedSession: ExportedSessionKey,
  signer?: Signer,
  customTtl?: number
 ): string {
  try {
   const sessionKey = SessionKey.import(
    exportedSession,
    this.suiClient as any,
    signer as any
   );

   const sessionId = this.generateSessionId(
    exportedSession.address,
    exportedSession.packageId
   );

   // Calculate expiration based on original TTL or custom TTL
   const now = new Date();
   const ttlMinutes = customTtl || SEAL_CONFIG.agent.sessionTTLMinutes;
   const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

   const metadata: SessionMetadata = {
    sessionId,
    address: exportedSession.address,
    packageId: exportedSession.packageId,
    createdAt: now,
    expiresAt,
    lastUsed: now,
    usageCount: 0,
    isActive: true
   };

   this.sessionCache.set(sessionId, { sessionKey, metadata });
   
   console.log(`Imported SEAL session: ${sessionId.substring(0, 16)}...`);
   return sessionId;
   
  } catch (error) {
   console.error('Failed to import session:', error);
   throw new Error(`Session import failed: ${error instanceof Error ? error.message : String(error)}`);
  }
 }

 /**
  * Invalidate and remove a session
  */
 invalidateSession(sessionId: string): boolean {
  const cached = this.sessionCache.get(sessionId);
  if (cached) {
   cached.metadata.isActive = false;
   this.sessionCache.delete(sessionId);
   console.log(`Invalidated SEAL session: ${sessionId.substring(0, 16)}...`);
   return true;
  }
  return false;
 }

 /**
  * Refresh session TTL
  */
 async refreshSession(
  sessionId: string,
  additionalMinutes: number = SEAL_CONFIG.agent.sessionTTLMinutes
 ): Promise<boolean> {
  const cached = this.sessionCache.get(sessionId);
  if (cached && this.isSessionValid(cached.metadata)) {
   const newExpiresAt = new Date(Date.now() + additionalMinutes * 60 * 1000);
   cached.metadata.expiresAt = newExpiresAt;
   cached.metadata.lastUsed = new Date();
   
   console.log(`Refreshed SEAL session: ${sessionId.substring(0, 16)}...`);
   return true;
  }
  return false;
 }

 /**
  * Get all active session metadata
  */
 getActiveSessions(): SessionMetadata[] {
  return Array.from(this.sessionCache.values())
   .map(cached => cached.metadata)
   .filter(metadata => this.isSessionValid(metadata));
 }

 /**
  * Get session statistics
  */
 getSessionStats(): SessionStats {
  const allSessions = Array.from(this.sessionCache.values()).map(c => c.metadata);
  const activeSessions = allSessions.filter(s => this.isSessionValid(s));
  const expiredSessions = allSessions.filter(s => !this.isSessionValid(s));
  
  const totalUsage = allSessions.reduce((sum, s) => sum + s.usageCount, 0);
  
  // Calculate average session duration for expired sessions
  const completedSessions = expiredSessions.filter(s => s.expiresAt <= new Date());
  const averageSessionDuration = completedSessions.length > 0
   ? completedSessions.reduce((sum, s) => {
     return sum + (s.expiresAt.getTime() - s.createdAt.getTime());
    }, 0) / completedSessions.length / (1000 * 60) // Convert to minutes
   : 0;

  return {
   totalSessions: allSessions.length,
   activeSessions: activeSessions.length,
   expiredSessions: expiredSessions.length,
   averageSessionDuration,
   totalUsage
  };
 }

 /**
  * Cleanup expired sessions
  */
 cleanupExpiredSessions(): number {
  const beforeCount = this.sessionCache.size;
  const now = new Date();
  
  for (const [sessionId, cached] of this.sessionCache.entries()) {
   if (!this.isSessionValid(cached.metadata)) {
    this.sessionCache.delete(sessionId);
   }
  }
  
  const cleanedCount = beforeCount - this.sessionCache.size;
  if (cleanedCount > 0) {
   console.log(`🧹 Cleaned up ${cleanedCount} expired SEAL sessions`);
  }
  
  return cleanedCount;
 }

 /**
  * Check if a session should be refreshed soon
  */
 shouldRefreshSession(sessionId: string): boolean {
  const cached = this.sessionCache.get(sessionId);
  if (!cached || !this.isSessionValid(cached.metadata)) {
   return false;
  }
  
  const now = new Date();
  const timeToExpiry = cached.metadata.expiresAt.getTime() - now.getTime();
  const refreshThreshold = SEAL_CONFIG.agent.sessionRefreshThresholdMinutes * 60 * 1000;
  
  return timeToExpiry <= refreshThreshold;
 }

 /**
  * Generate deterministic session ID
  */
 private generateSessionId(address: string, packageId: string): string {
  return `${address}:${packageId}`;
 }

 /**
  * Check if session is still valid
  */
 private isSessionValid(metadata: SessionMetadata): boolean {
  const now = new Date();
  return metadata.isActive && metadata.expiresAt > now;
 }

 /**
  * Start periodic cleanup service
  */
 private startCleanupService(): void {
  // Run cleanup every 5 minutes
  this.cleanupInterval = setInterval(() => {
   this.cleanupExpiredSessions();
  }, 5 * 60 * 1000);
 }

 /**
  * Stop cleanup service
  */
 stopCleanupService(): void {
  if (this.cleanupInterval) {
   clearInterval(this.cleanupInterval);
   this.cleanupInterval = null;
  }
 }

 /**
  * Cleanup all resources
  */
 destroy(): void {
  this.stopCleanupService();
  this.sessionCache.clear();
 }
}