// SEAL Key Server Manager - Based on SEAL Key Server Operations Documentation
// https://seal-docs.wal.app/KeyServerOps/

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { SEAL_CONFIG } from '../config/seal.config';
import { SUI_CONFIG } from '../../../constants';

export enum KeyServerMode {
  OPEN = 'Open',
  PERMISSIONED = 'Permissioned'
}

export interface KeyServerConfig {
  objectId: string;
  url: string;
  name?: string;
  mode: KeyServerMode;
  publicKey?: string;
  weight?: number;
  isActive?: boolean;
}

export interface KeyServerHealth {
  url: string;
  status: 'healthy' | 'degraded' | 'failed';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

export interface KeyServerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptime: number;
}

export class KeyServerManager {
  private suiClient: SuiClient;
  private healthCache = new Map<string, KeyServerHealth>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  constructor(suiClient: SuiClient) {
    this.suiClient = suiClient;
    this.startHealthMonitoring();
  }

  /**
   * Get all configured key servers with their current status
   */
  getConfiguredKeyServers(): KeyServerConfig[] {
    return SEAL_CONFIG.testnet.keyServers.map(server => ({
      objectId: server.objectId,
      url: server.url,
      name: `SEAL Key Server (${server.url})`,
      mode: KeyServerMode.OPEN, // Testnet servers are typically Open mode
      weight: server.weight || 1,
      isActive: true
    }) as KeyServerConfig);
  }

  /**
   * Verify key server registration on Sui network
   */
  async verifyKeyServerRegistration(objectId: string): Promise<{
    isRegistered: boolean;
    serverInfo?: any;
    error?: string;
  }> {
    try {
      console.log(`🔍 Verifying key server registration: ${objectId}`);
      
      const serverObject = await this.suiClient.getObject({
        id: objectId,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
          showPreviousTransaction: true
        }
      });

      if (serverObject.error) {
        return {
          isRegistered: false,
          error: `Server object not found: ${serverObject.error.code}`
        };
      }

      if (!serverObject.data) {
        return {
          isRegistered: false,
          error: 'Server object data not available'
        };
      }

      console.log('✅ Key server object found:', {
        type: serverObject.data.type,
        version: serverObject.data.version,
        owner: serverObject.data.owner
      });

      return {
        isRegistered: true,
        serverInfo: {
          objectId,
          type: serverObject.data.type,
          version: serverObject.data.version,
          owner: serverObject.data.owner,
          content: serverObject.data.content
        }
      };
    } catch (error) {
      return {
        isRegistered: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check health of a specific key server
   */
  async checkKeyServerHealth(url: string): Promise<KeyServerHealth> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Health checking key server: ${url}`);
      
      // Attempt to reach the key server health endpoint
      const healthUrl = `${url}/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Satya-Marketplace/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        console.log(`✅ Key server healthy: ${url} (${responseTime}ms)`);
        return {
          url,
          status: 'healthy',
          responseTime,
          lastChecked: new Date()
        };
      } else {
        console.warn(`⚠️ Key server degraded: ${url} (HTTP ${response.status})`);
        return {
          url,
          status: 'degraded',
          responseTime,
          lastChecked: new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ Key server failed: ${url}`, error);
      
      return {
        url,
        status: 'failed',
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check health of all configured key servers
   */
  async checkAllKeyServersHealth(): Promise<KeyServerHealth[]> {
    const servers = this.getConfiguredKeyServers();
    const healthPromises = servers.map(server => this.checkKeyServerHealth(server.url));
    
    const healthResults = await Promise.allSettled(healthPromises);
    
    const health: KeyServerHealth[] = healthResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          url: servers[index].url,
          status: 'failed',
          lastChecked: new Date(),
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        };
      }
    });

    // Update health cache
    health.forEach(h => this.healthCache.set(h.url, h));
    
    return health;
  }

  /**
   * Get cached health status for all key servers
   */
  getCachedHealth(): KeyServerHealth[] {
    return Array.from(this.healthCache.values());
  }

  /**
   * Select the best available key servers based on health and configuration
   */
  selectBestKeyServers(minServers = 1): KeyServerConfig[] {
    const servers = this.getConfiguredKeyServers();
    const healthData = this.getCachedHealth();
    
    // Combine server config with health data
    const serversWithHealth = servers.map(server => {
      const health = healthData.find(h => h.url === server.url);
      return {
        ...server,
        health: health || {
          url: server.url,
          status: 'unknown' as const,
          lastChecked: new Date()
        }
      };
    });

    // Sort by health status and weight
    const sortedServers = serversWithHealth.sort((a, b) => {
      // Prioritize healthy servers
      if (a.health.status === 'healthy' && b.health.status !== 'healthy') return -1;
      if (b.health.status === 'healthy' && a.health.status !== 'healthy') return 1;
      
      // Then by weight
      return (b.weight || 1) - (a.weight || 1);
    });

    // Return at least minServers if available
    const selectedServers = sortedServers
      .filter(server => server.health.status !== 'failed')
      .slice(0, Math.max(minServers, SEAL_CONFIG.testnet.threshold));

    console.log(`📊 Selected ${selectedServers.length} key servers:`, 
      selectedServers.map(s => ({ url: s.url, status: s.health.status }))
    );

    return selectedServers.map(s => ({
      objectId: s.objectId,
      url: s.url,
      name: s.name,
      mode: s.mode,
      weight: s.weight,
      isActive: s.isActive
    }));
  }

  /**
   * Create a transaction to register a new key server (for administrative use)
   */
  createKeyServerRegistrationTransaction(
    serverName: string,
    serverUrl: string,
    publicKey: string
  ): Transaction {
    const tx = new Transaction();
    
    // Call the SEAL package function to register a key server
    tx.moveCall({
      target: `${SEAL_CONFIG.testnet.packageId}::key_server::create_and_transfer_v1`,
      arguments: [
        tx.pure.string(serverName),
        tx.pure.string(serverUrl),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(publicKey)))
      ]
    });
    
    return tx;
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    // Initial health check
    this.checkAllKeyServersHealth().catch(console.warn);
    
    // Periodic health checks every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkAllKeyServersHealth().catch(console.warn);
    }, SEAL_CONFIG.monitoring.healthCheckIntervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get key server metrics and statistics
   */
  async getKeyServerMetrics(): Promise<{
    totalServers: number;
    healthyServers: number;
    degradedServers: number;
    failedServers: number;
    averageResponseTime: number;
    recommendedThreshold: number;
  }> {
    const health = this.getCachedHealth();
    
    const totalServers = health.length;
    const healthyServers = health.filter(h => h.status === 'healthy').length;
    const degradedServers = health.filter(h => h.status === 'degraded').length;
    const failedServers = health.filter(h => h.status === 'failed').length;
    
    const responseTimes = health
      .filter(h => h.responseTime !== undefined)
      .map(h => h.responseTime!);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    // Recommend threshold based on available healthy servers
    const recommendedThreshold = Math.min(
      healthyServers,
      SEAL_CONFIG.testnet.threshold
    );

    return {
      totalServers,
      healthyServers,
      degradedServers,
      failedServers,
      averageResponseTime,
      recommendedThreshold
    };
  }

  /**
   * Test key server connectivity for SEAL operations
   */
  async testKeyServerForSeal(server: KeyServerConfig): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
    serverInfo?: any;
  }> {
    try {
      const startTime = Date.now();
      
      // First verify the server is registered on-chain
      const registration = await this.verifyKeyServerRegistration(server.objectId);
      if (!registration.isRegistered) {
        return {
          success: false,
          error: `Key server not registered: ${registration.error}`
        };
      }
      
      // Then check HTTP connectivity
      const health = await this.checkKeyServerHealth(server.url);
      const latency = Date.now() - startTime;
      
      return {
        success: health.status === 'healthy',
        latency,
        error: health.error,
        serverInfo: registration.serverInfo
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopHealthMonitoring();
    this.healthCache.clear();
  }
}