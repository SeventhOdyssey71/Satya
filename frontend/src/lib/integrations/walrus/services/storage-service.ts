// Walrus Storage Service - High-level storage operations

import { WalrusClient } from '../lib/walrus-client';
import { WALRUS_CONFIG } from '../config/walrus.config';
import { walrusEnvironment } from '../config/environment-specific';
import { walrusConnectivityMonitor } from '../monitoring/connectivity-monitor';
import {
  BlobMetadata,
  UploadOptions,
  UploadResult,
  DownloadOptions,
  ChunkedUploadManifest,
  StorageStrategy,
  WalrusError
} from '../types';
import { ChunkingUtils } from '../utils/chunking-utils';
import { CacheManager } from '../utils/cache-manager';
import { RetryManager } from '../utils/retry-manager';
import { logger } from '../../core/logger';

export class WalrusStorageService {
  private client: WalrusClient;
  private cache: CacheManager;
  private retryManager: RetryManager;
  private chunkingUtils: ChunkingUtils;
  private blobRegistry: Map<string, BlobMetadata> = new Map();
  
  constructor() {
    this.client = new WalrusClient('testnet');
    this.cache = new CacheManager(WALRUS_CONFIG.agent.cacheSizeMB);
    
    // Use environment-specific retry configuration
    const retryConfig = walrusEnvironment.getRetryConfig();
    this.retryManager = new RetryManager(
      retryConfig.maxRetries,
      retryConfig.baseDelay
    );
    this.chunkingUtils = new ChunkingUtils(WALRUS_CONFIG.agent.chunkSize);

    // Start connectivity monitoring if not already started
    this.initializeMonitoring();
  }

  // Initialize connectivity monitoring
  private async initializeMonitoring(): Promise<void> {
    try {
      if (!walrusConnectivityMonitor.getStatus().isMonitoring) {
        await walrusConnectivityMonitor.startMonitoring();
        logger.info('Walrus connectivity monitoring initialized');
      }
    } catch (error) {
      logger.warn('Failed to initialize connectivity monitoring', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Intelligent file upload with automatic strategy selection
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    // Check connectivity before upload
    const health = await this.checkConnectivity();
    if (!health.canUpload) {
      throw new WalrusError(`Upload blocked: ${health.reason}`);
    }

    const strategy = this.determineStrategy(file, options);
    
    logger.info('Starting file upload', {
      fileName: file.name,
      fileSize: file.size,
      strategy,
      options
    });

    try {
      let result: UploadResult;
      
      switch (strategy) {
        case StorageStrategy.CHUNKED:
          result = await this.uploadChunked(file, options);
          break;
        case StorageStrategy.DIRECT:
          result = await this.uploadDirect(file, options);
          break;
        default:
          result = await this.uploadDirect(file, options);
      }

      if (result.success) {
        logger.info('File upload completed successfully', {
          fileName: file.name,
          blobId: result.blobId,
          strategy
        });
      }

      return result;
    } catch (error) {
      logger.error('File upload failed', {
        fileName: file.name,
        fileSize: file.size,
        strategy,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  // Direct upload for small files
  private async uploadDirect(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    const data = new Uint8Array(await file.arrayBuffer());
    const epochs = options.epochs || WALRUS_CONFIG.agent.defaultEpochs;
    
    return await this.retryManager.executeWithRetry(async () => {
      const result = await this.client.uploadBlob(data, epochs);
      
      if (result.success && result.blobId) {
        // Store in registry
        this.blobRegistry.set(result.blobId, {
          blobId: result.blobId,
          size: file.size,
          name: file.name,
          uploadedAt: Date.now(),
          expiresAt: this.calculateExpiry(epochs),
          epochs,
          certificate: result.certificate
        });
      }
      
      return result;
    });
  }
  
  // Chunked upload for large files
  private async uploadChunked(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    const chunks = await this.chunkingUtils.chunkFile(file);
    const chunkIds: string[] = [];
    const epochs = options.epochs || WALRUS_CONFIG.agent.defaultEpochs;
    
    // Upload each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunkResult = await this.retryManager.executeWithRetry(async () => {
        return await this.client.uploadBlob(chunks[i], epochs);
      });
      
      if (!chunkResult.success) {
        throw new WalrusError(`Failed to upload chunk ${i}`);
      }
      
      chunkIds.push(chunkResult.blobId);
      
      // Report progress
      if (options.onProgress) {
        options.onProgress((i + 1) / chunks.length * 100);
      }
    }
    
    // Create manifest
    const manifest: ChunkedUploadManifest = {
      fileName: file.name,
      fileSize: file.size,
      chunkIds,
      chunkSize: WALRUS_CONFIG.agent.chunkSize,
      uploadedAt: Date.now()
    };
    
    // Upload manifest
    const manifestBlob = new TextEncoder().encode(JSON.stringify(manifest));
    const manifestResult = await this.retryManager.executeWithRetry(async () => {
      return await this.client.uploadBlob(manifestBlob, epochs);
    });
    
    if (manifestResult.success && manifestResult.blobId) {
      // Store in registry
      this.blobRegistry.set(manifestResult.blobId, {
        blobId: manifestResult.blobId,
        size: file.size,
        name: file.name,
        uploadedAt: Date.now(),
        expiresAt: this.calculateExpiry(epochs),
        epochs,
        certificate: manifestResult.certificate
      });
    }
    
    return {
      success: true,
      blobId: manifestResult.blobId,
      metadata: manifest
    };
  }
  
  // Download with caching and error recovery
  async downloadBlob(
    blobId: string,
    options: DownloadOptions = {}
  ): Promise<Uint8Array> {
    // Check cache first
    if (!options.forceRefresh) {
      const cached = this.cache.get(blobId);
      if (cached) {
        console.log(`Cache hit for blob ${blobId}`);
        return cached;
      }
    }
    
    try {
      // Try primary download
      const data = await this.retryManager.executeWithRetry(async () => {
        return await this.client.downloadBlob(blobId);
      });
      
      // Cache for future use
      this.cache.set(blobId, data);
      
      return data;
      
    } catch (error) {
      // Try alternative nodes
      console.log(`Primary download failed, trying alternative nodes...`);
      const data = await this.client.downloadFromAlternativeNodes(blobId);
      
      // Cache successful alternative download
      this.cache.set(blobId, data);
      
      return data;
    }
  }
  
  // Download chunked file
  async downloadChunkedFile(manifestBlobId: string): Promise<Uint8Array> {
    // Download manifest
    const manifestData = await this.downloadBlob(manifestBlobId);
    const manifestText = new TextDecoder().decode(manifestData);
    const manifest: ChunkedUploadManifest = JSON.parse(manifestText);
    
    // Download all chunks
    const chunks: Uint8Array[] = [];
    
    for (const chunkId of manifest.chunkIds) {
      const chunkData = await this.downloadBlob(chunkId);
      chunks.push(chunkData);
    }
    
    // Reassemble file
    return this.chunkingUtils.reassembleChunks(chunks);
  }
  
  // Stream download for large files
  async *streamDownload(blobId: string): AsyncGenerator<Uint8Array> {
    yield* this.client.streamDownload(blobId);
  }
  
  // Get blob metadata
  getBlobMetadata(blobId: string): BlobMetadata | undefined {
    return this.blobRegistry.get(blobId);
  }
  
  // Get expiring blobs
  getExpiringBlobs(daysUntilExpiry: number = 7): BlobMetadata[] {
    const expiryThreshold = Date.now() + (daysUntilExpiry * 24 * 60 * 60 * 1000);
    
    return Array.from(this.blobRegistry.values()).filter(
      blob => blob.expiresAt < expiryThreshold
    );
  }
  
  // Helper: Determine upload strategy
  private determineStrategy(file: File, options: UploadOptions): StorageStrategy {
    const SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB
    
    if (options.forceChunked || file.size > SIZE_THRESHOLD) {
      return StorageStrategy.CHUNKED;
    }
    
    return StorageStrategy.DIRECT;
  }
  
  // Helper: Calculate expiry timestamp
  private calculateExpiry(epochs: number): number {
    const EPOCH_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day per epoch
    return Date.now() + (epochs * EPOCH_DURATION_MS);
  }

  // Check connectivity health before operations
  private async checkConnectivity(): Promise<{
    canUpload: boolean;
    canDownload: boolean;
    reason?: string;
  }> {
    try {
      const status = walrusConnectivityMonitor.getStatus();
      
      if (!status.lastHealthCheck) {
        // Force a health check if none exists
        await walrusConnectivityMonitor.forceHealthCheck();
      }

      const health = status.lastHealthCheck;
      
      if (!health) {
        return {
          canUpload: false,
          canDownload: false,
          reason: 'Unable to determine network health'
        };
      }

      const hasPublisher = health.components.some(c => 
        c.component === 'Walrus Publisher' && c.status !== 'failed'
      );
      
      const hasAggregator = health.components.some(c => 
        c.component === 'Walrus Aggregator' && c.status !== 'failed'
      );

      return {
        canUpload: hasPublisher,
        canDownload: hasAggregator,
        reason: !hasPublisher ? 'Publisher unavailable' : 
                !hasAggregator ? 'Aggregator unavailable' : undefined
      };
    } catch (error) {
      logger.warn('Connectivity check failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Allow operations but log warning
      return {
        canUpload: true,
        canDownload: true
      };
    }
  }

  // Get service health status
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'failed';
    services: Record<string, string>;
    connectivity: any;
    recommendations: string[];
  }> {
    const summary = await walrusConnectivityMonitor.getConnectivitySummary();
    
    return {
      overall: summary.health.overall,
      services: Object.fromEntries(
        summary.health.components.map(c => [c.component, c.status])
      ),
      connectivity: summary.environmentInfo,
      recommendations: summary.recommendations
    };
  }

  // Force connectivity test
  async testConnectivity(): Promise<boolean> {
    try {
      const results = await walrusConnectivityMonitor.forceConnectivityTests();
      const criticalTests = ['Small File Upload Test', 'File Download Test', 'Aggregator Health Check', 'Publisher Health Check'];
      
      const criticalPassed = results
        .filter(r => criticalTests.includes(r.testName))
        .every(r => r.success);

      return criticalPassed;
    } catch (error) {
      logger.error('Connectivity test failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
}