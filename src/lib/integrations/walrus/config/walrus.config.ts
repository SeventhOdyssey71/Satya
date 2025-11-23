// Walrus Network Configuration
import { WALRUS_CONFIG as MAIN_WALRUS_CONFIG, APP_CONFIG } from '../../../constants';

export const WALRUS_CONFIG = {
 testnet: {
  aggregator: MAIN_WALRUS_CONFIG.AGGREGATOR_URL,
  publisher: MAIN_WALRUS_CONFIG.PUBLISHER_URL,
  systemObject: MAIN_WALRUS_CONFIG.SYSTEM_OBJECT,
  storageNodes: MAIN_WALRUS_CONFIG.STORAGE_NODES.map(url => ({
   url,
   weight: 1.0,
   priority: 1
  }))
 },
 
 agent: {
  defaultEpochs: MAIN_WALRUS_CONFIG.agent.defaultEpochs,
  maxFileSize: MAIN_WALRUS_CONFIG.agent.maxFileSize,
  chunkSize: MAIN_WALRUS_CONFIG.agent.chunkSize,
  maxRetries: MAIN_WALRUS_CONFIG.agent.maxRetries,
  retryDelayMs: MAIN_WALRUS_CONFIG.agent.retryDelayMs,
  cacheSizeMB: MAIN_WALRUS_CONFIG.agent.cacheSizeMB,
  cacheTTLSeconds: APP_CONFIG.CACHE_TTL_SECONDS,
  healthCheckIntervalMs: 30000
 },
 
 performance: {
  parallelUploads: APP_CONFIG.PARALLEL_UPLOADS,
  parallelDownloads: APP_CONFIG.PARALLEL_DOWNLOADS,
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