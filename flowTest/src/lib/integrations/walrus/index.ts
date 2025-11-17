// Walrus Integration Export with Connectivity Fixes

export { WalrusStorageService } from './services/storage-service';
export { WalrusClient } from './lib/walrus-client';

// Utilities
export { ChunkingUtils } from './utils/chunking-utils';
export { CacheManager } from './utils/cache-manager';
export { RetryManager } from './utils/retry-manager';

// Configuration & Environment
export { WALRUS_CONFIG } from './config/walrus.config';
export { walrusEnvironment, WalrusEnvironmentManager } from './config/environment-specific';

// Diagnostics & Monitoring
export { WalrusNetworkDiagnostics } from './diagnostics/network-diagnostics';
export { WalrusConnectivityTester } from './tests/connectivity-test';
export { walrusConnectivityMonitor, WalrusConnectivityMonitor } from './monitoring/connectivity-monitor';

// Types
export * from './types';

// Convenience exports for quick connectivity checks
export const walrusHealth = {
 async isReady(): Promise<boolean> {
  try {
   const { walrusEnvironment } = await import('./config/environment-specific');
   const { walrusConnectivityMonitor } = await import('./monitoring/connectivity-monitor');
   
   // Start monitoring if not already started
   if (!walrusConnectivityMonitor.getStatus().isMonitoring) {
    await walrusConnectivityMonitor.startMonitoring();
   }
   
   const health = await walrusConnectivityMonitor.forceHealthCheck();
   return health.overall !== 'failed';
  } catch (error) {
   console.warn('Walrus health check failed:', error);
   return false;
  }
 },

 async getStatus() {
  try {
   const { walrusConnectivityMonitor } = await import('./monitoring/connectivity-monitor');
   return await walrusConnectivityMonitor.getConnectivitySummary();
  } catch (error) {
   return {
    health: { overall: 'failed' as const, components: [], timestamp: Date.now(), recommendations: [] },
    environmentInfo: {},
    alerts: [],
    recommendations: ['Failed to get status: ' + (error instanceof Error ? error.message : String(error))]
   };
  }
 },

 async testConnectivity() {
  try {
   const { WalrusConnectivityTester } = await import('./tests/connectivity-test');
   const tester = new WalrusConnectivityTester();
   return await tester.runAllTests();
  } catch (error) {
   console.warn('Walrus connectivity test failed:', error);
   return [];
  }
 }
};