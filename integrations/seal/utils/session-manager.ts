// Session Manager for handling Seal sessions

import { SEAL_CONFIG } from '../config/seal.config';
import { SessionData, SessionError } from '../types';

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private refreshThreshold: number;
  private sessionTTL: number;
  
  constructor() {
    this.refreshThreshold = SEAL_CONFIG.agent.sessionRefreshThresholdMinutes * 60 * 1000;
    this.sessionTTL = SEAL_CONFIG.agent.sessionTTLMinutes * 60 * 1000;
    
    // Start session lifecycle management
    this.startSessionManagement();
  }
  
  // Get or create session for user
  async getOrCreateSession(address: string): Promise<any> {
    const existing = this.getSession(address);
    
    if (existing && !this.isExpired(existing)) {
      return existing.sessionKey;
    }
    
    return await this.createSession(address);
  }
  
  // Get existing session
  getSession(address: string): SessionData | null {
    const session = this.sessions.get(address);
    
    if (!session) return null;
    
    if (this.isExpired(session)) {
      this.sessions.delete(address);
      return null;
    }
    
    return session;
  }
  
  // Create new session
  private async createSession(address: string): Promise<any> {
    // Mock session creation - replace with actual Seal SDK
    const mockSessionKey = {
      address,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTTL,
      id: this.generateSessionId()
    };
    
    const sessionData: SessionData = {
      sessionKey: mockSessionKey,
      createdAt: Date.now(),
      refreshCount: 0,
      expiresAt: Date.now() + this.sessionTTL
    };
    
    this.sessions.set(address, sessionData);
    
    return mockSessionKey;
  }
  
  // Refresh session
  async refreshSession(address: string): Promise<any> {
    console.log(`Refreshing session for ${address}`);
    
    try {
      const newSession = await this.createSession(address);
      
      const existingData = this.sessions.get(address);
      if (existingData) {
        existingData.refreshCount++;
        existingData.sessionKey = newSession;
        existingData.expiresAt = Date.now() + this.sessionTTL;
      }
      
      return newSession;
      
    } catch (error) {
      console.error(`Failed to refresh session for ${address}:`, error);
      this.sessions.delete(address);
      throw new SessionError(`Session refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Check if session is expired
  private isExpired(session: SessionData): boolean {
    return Date.now() >= session.expiresAt;
  }
  
  // Check if session needs refresh
  private needsRefresh(session: SessionData): boolean {
    const remainingTime = session.expiresAt - Date.now();
    return remainingTime < this.refreshThreshold;
  }
  
  // Start session lifecycle management
  private startSessionManagement(): void {
    setInterval(() => {
      this.checkAndRefreshSessions();
    }, 60000); // Check every minute
  }
  
  // Check and refresh sessions proactively
  private async checkAndRefreshSessions(): Promise<void> {
    for (const [address, session] of this.sessions.entries()) {
      if (this.isExpired(session)) {
        this.sessions.delete(address);
      } else if (this.needsRefresh(session)) {
        try {
          await this.refreshSession(address);
        } catch (error) {
          console.error(`Auto-refresh failed for ${address}:`, error);
        }
      }
    }
  }
  
  // Generate unique session ID
  private generateSessionId(): string {
    const timestamp = Date.now().toString(16);
    const random = Math.random().toString(16).substring(2);
    return `session_${timestamp}_${random}`;
  }
  
  // Clear all sessions
  clearAllSessions(): void {
    this.sessions.clear();
  }
  
  // Get session statistics
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    expiringSoon: number;
  } {
    let activeSessions = 0;
    let expiringSoon = 0;
    
    for (const session of this.sessions.values()) {
      if (!this.isExpired(session)) {
        activeSessions++;
        if (this.needsRefresh(session)) {
          expiringSoon++;
        }
      }
    }
    
    return {
      totalSessions: this.sessions.size,
      activeSessions,
      expiringSoon
    };
  }
}