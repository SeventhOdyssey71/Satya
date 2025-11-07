// Walrus Network Configuration
export const WALRUS_CONFIG = {
  testnet: {
    aggregator: "https://aggregator-devnet.walrus.space",
    publisher: "https://publisher-devnet.walrus.space",
    systemObject: "0x50b84b68eb9da4c6d904a929f43638481c09c03be6274b8569778fe085c1590d",
    storageNodes: [
      {
        url: "https://wal-testnet-stor-nest-01.walrus.space:11444",
        weight: 1.0,
        priority: 1
      },
      {
        url: "https://wal-testnet-stor-nest-02.walrus.space:11444",
        weight: 1.0,
        priority: 1
      },
      {
        url: "https://wal-testnet-stor-nest-03.walrus.space:11444",
        weight: 1.0,
        priority: 1
      },
      {
        url: "https://wal-testnet-stor-nest-04.walrus.space:11444",
        weight: 1.0,
        priority: 1
      },
      {
        url: "https://wal-testnet-stor-nest-05.walrus.space:11444",
        weight: 1.0,
        priority: 1
      }
    ]
  },
  
  agent: {
    defaultEpochs: 5,
    maxFileSize: 1073741824,  // 1GB
    chunkSize: 10485760,      // 10MB
    maxRetries: 3,
    retryDelayMs: 1000,
    cacheSizeMB: 100,
    cacheTTLSeconds: 1800,
    healthCheckIntervalMs: 30000
  },
  
  performance: {
    parallelUploads: 3,
    parallelDownloads: 5,
    connectionPoolSize: 10,
    requestTimeoutMs: 30000
  },
  
  monitoring: {
    metricsEnabled: true,
    logLevel: "info" as const,
    errorReportingEndpoint: "/api/errors"
  }
};

export type WalrusConfig = typeof WALRUS_CONFIG;