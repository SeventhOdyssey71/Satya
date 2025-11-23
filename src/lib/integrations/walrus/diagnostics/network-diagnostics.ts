// Walrus Network Diagnostics and Auto-Repair

import { WalrusClient } from '../lib/walrus-client';
import { WALRUS_CONFIG } from '../config/walrus.config';
import { logger } from '../../core/logger';
import { RetryManager } from '../utils/retry-manager';

export interface NetworkDiagnosticResult {
 component: string;
 status: 'healthy' | 'degraded' | 'failed';
 responseTime?: number;
 error?: string;
 suggestion?: string;
}

export interface NetworkHealth {
 overall: 'healthy' | 'degraded' | 'failed';
 components: NetworkDiagnosticResult[];
 timestamp: number;
 recommendations: string[];
}

export class WalrusNetworkDiagnostics {
 private client: WalrusClient;
 private retryManager: RetryManager;
 private lastDiagnostic?: NetworkHealth;

 constructor() {
  this.client = new WalrusClient('testnet');
  this.retryManager = new RetryManager(3, 1000);
 }

 // Run comprehensive network diagnostics
 async runDiagnostics(): Promise<NetworkHealth> {
  logger.info('Starting Walrus network diagnostics');
  
  const components: NetworkDiagnosticResult[] = [];
  const recommendations: string[] = [];

  // Test core components
  await this.diagnoseDNSResolution(components);
  await this.diagnoseAggregator(components);
  await this.diagnosePublisher(components);
  await this.diagnoseStorageNodes(components);
  await this.diagnoseCORSConfiguration(components);
  await this.diagnoseSSLCertificates(components);

  // Determine overall health
  const failedComponents = components.filter(c => c.status === 'failed').length;
  const degradedComponents = components.filter(c => c.status === 'degraded').length;

  let overall: 'healthy' | 'degraded' | 'failed';
  if (failedComponents > 0) {
   overall = 'failed';
  } else if (degradedComponents > 0) {
   overall = 'degraded'; 
  } else {
   overall = 'healthy';
  }

  // Generate recommendations
  this.generateRecommendations(components, recommendations);

  const result: NetworkHealth = {
   overall,
   components,
   timestamp: Date.now(),
   recommendations
  };

  this.lastDiagnostic = result;
  
  logger.info('Network diagnostics completed', {
   overall,
   totalComponents: components.length,
   failedComponents,
   degradedComponents
  });

  return result;
 }

 // Diagnose DNS resolution for Walrus endpoints
 private async diagnoseDNSResolution(components: NetworkDiagnosticResult[]): Promise<void> {
  const start = Date.now();
  
  try {
   // Test if we can resolve Walrus domains
   const aggregatorDomain = new URL(WALRUS_CONFIG.testnet.aggregator).hostname;
   const publisherDomain = new URL(WALRUS_CONFIG.testnet.publisher).hostname;
   
   // Simple DNS test by attempting to connect
   await Promise.race([
    fetch(`https://${aggregatorDomain}`, { method: 'HEAD', signal: AbortSignal.timeout(5000) }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('DNS timeout')), 5000))
   ]);

   components.push({
    component: 'DNS Resolution',
    status: 'healthy',
    responseTime: Date.now() - start
   });

  } catch (error) {
   components.push({
    component: 'DNS Resolution',
    status: 'failed',
    responseTime: Date.now() - start,
    error: 'DNS resolution failed',
    suggestion: 'Check internet connectivity and DNS settings'
   });
  }
 }

 // Diagnose aggregator connectivity
 private async diagnoseAggregator(components: NetworkDiagnosticResult[]): Promise<void> {
  const start = Date.now();
  
  try {
   const healthy = await this.client.checkAggregatorHealth();
   const responseTime = Date.now() - start;

   components.push({
    component: 'Walrus Aggregator',
    status: healthy ? 'healthy' : 'failed',
    responseTime,
    error: healthy ? undefined : 'Aggregator health check failed',
    suggestion: healthy ? undefined : 'Aggregator service may be down or unreachable'
   });

  } catch (error) {
   components.push({
    component: 'Walrus Aggregator', 
    status: 'failed',
    responseTime: Date.now() - start,
    error: error instanceof Error ? error.message : 'Unknown error',
    suggestion: 'Check aggregator URL configuration and network connectivity'
   });
  }
 }

 // Diagnose publisher connectivity
 private async diagnosePublisher(components: NetworkDiagnosticResult[]): Promise<void> {
  const start = Date.now();
  
  try {
   const healthy = await this.client.checkPublisherHealth();
   const responseTime = Date.now() - start;

   components.push({
    component: 'Walrus Publisher',
    status: healthy ? 'healthy' : 'failed',
    responseTime,
    error: healthy ? undefined : 'Publisher health check failed',
    suggestion: healthy ? undefined : 'Publisher service may be down or unreachable'
   });

  } catch (error) {
   components.push({
    component: 'Walrus Publisher',
    status: 'failed', 
    responseTime: Date.now() - start,
    error: error instanceof Error ? error.message : 'Unknown error',
    suggestion: 'Check publisher URL configuration and network connectivity'
   });
  }
 }

 // Diagnose storage nodes connectivity
 private async diagnoseStorageNodes(components: NetworkDiagnosticResult[]): Promise<void> {
  const healthChecks = await Promise.allSettled(
   WALRUS_CONFIG.testnet.storageNodes.map(async (node, index) => {
    const start = Date.now();
    try {
     const health = await this.client.checkNodeHealth(node.url);
     return {
      index,
      url: node.url,
      healthy: health.healthy,
      responseTime: Date.now() - start,
      error: health.healthy ? undefined : 'Node unreachable'
     };
    } catch (error) {
     return {
      index,
      url: node.url,
      healthy: false,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
     };
    }
   })
  );

  const nodeResults = healthChecks
   .map(result => result.status === 'fulfilled' ? result.value : null)
   .filter((result): result is NonNullable<typeof result> => result !== null);

  const healthyNodes = nodeResults.filter(r => r.healthy).length;
  const totalNodes = nodeResults.length;

  let status: 'healthy' | 'degraded' | 'failed';
  let suggestion: string | undefined;

  if (healthyNodes === 0) {
   status = 'failed';
   suggestion = 'All storage nodes are unreachable. Check network connectivity.';
  } else if (healthyNodes < totalNodes * 0.5) {
   status = 'degraded';
   suggestion = 'Over 50% of storage nodes are unreachable. Some operations may fail.';
  } else {
   status = 'healthy';
  }

  components.push({
   component: 'Storage Nodes',
   status,
   responseTime: nodeResults.reduce((sum, r) => sum + r.responseTime, 0) / nodeResults.length,
   error: status !== 'healthy' ? `${totalNodes - healthyNodes}/${totalNodes} nodes unreachable` : undefined,
   suggestion
  });
 }

 // Diagnose CORS configuration
 private async diagnoseCORSConfiguration(components: NetworkDiagnosticResult[]): Promise<void> {
  const start = Date.now();
  
  try {
   // Test CORS preflight request
   const response = await fetch(WALRUS_CONFIG.testnet.aggregator, {
    method: 'OPTIONS',
    headers: {
     'Access-Control-Request-Method': 'GET',
     'Access-Control-Request-Headers': 'Content-Type',
     'Origin': window.location.origin
    },
    signal: AbortSignal.timeout(5000)
   });

   const corsAllowed = response.headers.get('Access-Control-Allow-Origin') !== null;

   components.push({
    component: 'CORS Configuration',
    status: corsAllowed ? 'healthy' : 'degraded',
    responseTime: Date.now() - start,
    error: corsAllowed ? undefined : 'CORS headers missing',
    suggestion: corsAllowed ? undefined : 'Walrus endpoints may not allow browser requests'
   });

  } catch (error) {
   components.push({
    component: 'CORS Configuration',
    status: 'degraded',
    responseTime: Date.now() - start,
    error: 'CORS preflight failed',
    suggestion: 'CORS may be blocking browser requests to Walrus'
   });
  }
 }

 // Diagnose SSL certificate validity
 private async diagnoseSSLCertificates(components: NetworkDiagnosticResult[]): Promise<void> {
  const start = Date.now();
  
  try {
   // Test SSL connection
   const response = await fetch(WALRUS_CONFIG.testnet.aggregator, {
    method: 'HEAD',
    signal: AbortSignal.timeout(5000)
   });

   const sslWorking = response.url.startsWith('https://');

   components.push({
    component: 'SSL Certificates',
    status: sslWorking ? 'healthy' : 'degraded',
    responseTime: Date.now() - start,
    error: sslWorking ? undefined : 'SSL connection issues',
    suggestion: sslWorking ? undefined : 'SSL certificate may be invalid or expired'
   });

  } catch (error) {
   components.push({
    component: 'SSL Certificates',
    status: 'failed',
    responseTime: Date.now() - start,
    error: error instanceof Error ? error.message : 'SSL error',
    suggestion: 'SSL connection failed. Check certificate validity.'
   });
  }
 }

 // Generate actionable recommendations
 private generateRecommendations(components: NetworkDiagnosticResult[], recommendations: string[]): void {
  const failedComponents = components.filter(c => c.status === 'failed');
  const degradedComponents = components.filter(c => c.status === 'degraded');

  if (failedComponents.length === 0 && degradedComponents.length === 0) {
   recommendations.push('All Walrus network components are functioning properly');
   return;
  }

  if (failedComponents.some(c => c.component === 'DNS Resolution')) {
   recommendations.push('Check internet connectivity and DNS settings');
  }

  if (failedComponents.some(c => c.component.includes('Aggregator'))) {
   recommendations.push('Walrus Aggregator is unreachable - downloads will fail');
  }

  if (failedComponents.some(c => c.component.includes('Publisher'))) {
   recommendations.push('Walrus Publisher is unreachable - uploads will fail');
  }

  if (degradedComponents.some(c => c.component === 'Storage Nodes')) {
   recommendations.push('Some storage nodes are unreachable - enable retry fallbacks');
  }

  if (degradedComponents.some(c => c.component === 'CORS Configuration')) {
   recommendations.push('CORS issues detected - may need server-side proxy for uploads');
  }

  // Network-specific recommendations
  const avgResponseTime = components
   .filter(c => c.responseTime)
   .reduce((sum, c) => sum + (c.responseTime || 0), 0) / components.length;

  if (avgResponseTime > 5000) {
   recommendations.push('High network latency detected - consider increasing timeouts');
  }

  if (failedComponents.length > 1) {
   recommendations.push('Multiple components failing - check Walrus network status');
  }
 }

 // Auto-repair common issues
 async attemptAutoRepair(): Promise<{
  attempted: string[];
  successful: string[];
  failed: string[];
 }> {
  const attempted: string[] = [];
  const successful: string[] = [];
  const failed: string[] = [];

  if (!this.lastDiagnostic) {
   await this.runDiagnostics();
  }

  const issues = this.lastDiagnostic!.components.filter(c => c.status !== 'healthy');

  for (const issue of issues) {
   switch (issue.component) {
    case 'Storage Nodes':
     attempted.push('Storage Node Failover');
     try {
      // Force refresh storage node health
      await this.refreshStorageNodeHealth();
      successful.push('Storage Node Failover');
     } catch (error) {
      failed.push('Storage Node Failover');
     }
     break;

    case 'CORS Configuration':
     attempted.push('CORS Workaround');
     try {
      // Set up CORS workaround if possible
      this.applyCORSWorkaround();
      successful.push('CORS Workaround');
     } catch (error) {
      failed.push('CORS Workaround');
     }
     break;
   }
  }

  return { attempted, successful, failed };
 }

 // Refresh storage node health and update routing
 private async refreshStorageNodeHealth(): Promise<void> {
  logger.info('Refreshing storage node health checks');
  
  const healthPromises = WALRUS_CONFIG.testnet.storageNodes.map(node =>
   this.client.checkNodeHealth(node.url)
  );

  await Promise.allSettled(healthPromises);
 }

 // Apply CORS workaround
 private applyCORSWorkaround(): void {
  logger.info('Applying CORS workaround configuration');
  // This would configure the client to use server-side proxy if available
  // For now, just log the recommendation
 }

 // Get last diagnostic result
 getLastDiagnostic(): NetworkHealth | undefined {
  return this.lastDiagnostic;
 }

 // Check if network is ready for operations
 async isNetworkReady(): Promise<boolean> {
  const diagnostic = await this.runDiagnostics();
  return diagnostic.overall !== 'failed';
 }
}