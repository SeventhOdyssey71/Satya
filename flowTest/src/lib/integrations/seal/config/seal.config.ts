// Seal Network Configuration
import { SEAL_CONFIG as MAIN_SEAL_CONFIG } from '../../../constants';
import type { KeyServerConfig } from '@mysten/seal';

export const SEAL_CONFIG = {
  testnet: {
    keyServers: MAIN_SEAL_CONFIG.KEY_SERVERS.map(server => ({
      objectId: server.OBJECT_ID,
      url: server.URL,
      weight: (server as any).WEIGHT || 1,
      apiKeyName: (server as any).API_KEY_NAME,
      apiKey: (server as any).API_KEY
    } as KeyServerConfig)),
    packageId: MAIN_SEAL_CONFIG.PACKAGE_ID,
    threshold: MAIN_SEAL_CONFIG.agent.threshold,
    verifyKeyServers: false // Disable for testnet as recommended by SEAL SDK docs
  },
  
  agent: {
    sessionTTLMinutes: MAIN_SEAL_CONFIG.agent.sessionTtlMinutes,
    sessionRefreshThresholdMinutes: 5,
    maxRetries: MAIN_SEAL_CONFIG.agent.maxRetries,
    retryDelayMs: 1000,
    cacheSize: MAIN_SEAL_CONFIG.agent.cacheSize,
    cacheTTLSeconds: 300,
    defaultEpochs: MAIN_SEAL_CONFIG.agent.defaultEpochs
  },
  
  policies: {
    defaultEpochs: MAIN_SEAL_CONFIG.agent.defaultEpochs,
    paymentVerification: true,
    teeAttestation: true,
    timeLockEnabled: true
  },
  
  security: {
    verifyKeyServers: false, // For testnet
    secureMemoryClear: true,
    auditLogging: true,
    rateLimiting: true
  },
  
  monitoring: {
    healthCheckIntervalMs: 30000,
    metricsEnabled: true,
    logLevel: "info" as const
  }
};

export type SealConfig = typeof SEAL_CONFIG;

export interface KeyServer {
  objectId: string;
  url: string;
  weight: number;
  mode: "Open" | "Restricted";
}