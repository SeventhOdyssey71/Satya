// Seal Network Configuration

export const SEAL_CONFIG = {
  testnet: {
    keyServers: [
      {
        objectId: "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
        url: "https://seal-key-server-testnet-1.mystenlabs.com",
        weight: 1,
        mode: "Open" as const
      },
      {
        objectId: "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
        url: "https://seal-key-server-testnet-2.mystenlabs.com",
        weight: 1,
        mode: "Open" as const
      }
    ],
    packageId: "0x98f8a6ce208764219b23dc51db45bf11516ec0998810e98f3a94548d788ff679", // Deployed Seal package
    threshold: 2
  },
  
  agent: {
    sessionTTLMinutes: 30,
    sessionRefreshThresholdMinutes: 5,
    maxRetries: 3,
    retryDelayMs: 1000,
    cacheSize: 100,
    cacheTTLSeconds: 300
  },
  
  policies: {
    defaultEpochs: 200,
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