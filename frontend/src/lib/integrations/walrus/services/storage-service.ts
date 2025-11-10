// Walrus Storage Service - High-level storage operations

import { WalrusSDKClient } from '../lib/walrus-sdk-client';
import { WalrusClient } from '../lib/walrus-client';
import { WALRUS_CONFIG } from '../config/walrus.config';
import { walrusEnvironment } from '../config/environment-specific';
// import { walrusConnectivityMonitor } from '../monitoring/connectivity-monitor';
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
  private sdkClient: WalrusSDKClient;
  private legacyClient: WalrusClient;
  private cache: CacheManager;
  private retryManager: RetryManager;
  private chunkingUtils: ChunkingUtils;
  private blobRegistry: Map<string, BlobMetadata> = new Map();
  
  constructor() {
    this.sdkClient = new WalrusSDKClient('testnet');
    this.legacyClient = new WalrusClient('testnet');
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
      // Temporarily disabled to avoid circular dependency
      // TODO: Re-enable when circular dependency is resolved
      logger.info('Walrus connectivity monitoring initialization skipped');
    } catch (error) {
      logger.warn('Failed to initialize connectivity monitoring', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Intelligent file upload with automatic strategy selection
  async uploadFile(
    file: File,
    options: UploadOptions & { signer?: any } = {}
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
      
      // Use SDK client if signer is provided (wallet integration)
      if (options.signer) {
        logger.info('Using Walrus SDK for wallet-integrated upload', {
          fileName: file.name,
          signerAddress: options.signer.toSuiAddress()
        });
        
        result = await this.uploadWithSDK(file, options);
      } else {
        // Fallback to legacy strategy-based upload
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
  
  // Upload using Walrus SDK with wallet integration
  private async uploadWithSDK(
    file: File,
    options: UploadOptions & { signer: any }
  ): Promise<UploadResult> {
    try {
      const result = await this.sdkClient.uploadFile(file, options.signer, {
        epochs: options.epochs || WALRUS_CONFIG.agent.defaultEpochs,
        deletable: true,
        onProgress: options.onProgress
      });

      if (result.success && result.blobId) {
        // Store in registry
        this.blobRegistry.set(result.blobId, {
          blobId: result.blobId,
          size: file.size,
          name: file.name,
          uploadedAt: Date.now(),
          expiresAt: this.calculateExpiry(options.epochs || WALRUS_CONFIG.agent.defaultEpochs),
          epochs: options.epochs || WALRUS_CONFIG.agent.defaultEpochs,
          certificate: result.certificate
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('SDK upload failed, trying legacy client fallback', {
        fileName: file.name,
        error: errorMessage
      });

      // If it's a network issue, fall back to legacy client
      if (errorMessage.includes('Walrus network unavailable') || errorMessage.includes('nodes')) {
        logger.info('Falling back to legacy Walrus client due to network issues');
        
        return await this.uploadDirect(file, options);
      }
      
      throw error;
    }
  }

  // Direct upload for small files (legacy)
  private async uploadDirect(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    const data = new Uint8Array(await file.arrayBuffer());
    const epochs = options.epochs || WALRUS_CONFIG.agent.defaultEpochs;
    
    return await this.retryManager.executeWithRetry(async () => {
      const result = await this.legacyClient.uploadBlob(data, epochs);
      
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
        return await this.legacyClient.uploadBlob(chunks[i], epochs);
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
      return await this.legacyClient.uploadBlob(manifestBlob, epochs);
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
      // Try SDK download first, fallback to legacy
      let data: Uint8Array;
      try {
        data = await this.sdkClient.downloadBlob(blobId);
      } catch (sdkError) {
        logger.warn('SDK download failed, trying legacy client', {
          blobId,
          error: sdkError instanceof Error ? sdkError.message : String(sdkError)
        });
        
        data = await this.retryManager.executeWithRetry(async () => {
          return await this.legacyClient.downloadBlob(blobId);
        });
      }
      
      // Cache for future use
      this.cache.set(blobId, data);
      
      return data;
      
    } catch (error) {
      // Try alternative nodes using legacy client
      console.log(`Primary download failed, trying alternative nodes...`);
      const data = await this.legacyClient.downloadFromAlternativeNodes(blobId);
      
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
    yield* this.legacyClient.streamDownload(blobId);
  }

  // Check upload capability with wallet
  async checkUploadCapability(address: string): Promise<{
    canUpload: boolean;
    hasWAL: boolean;
    hasSUI: boolean;
    reason?: string;
  }> {
    try {
      return await this.sdkClient.canUpload(address);
    } catch (error) {
      logger.error('Failed to check upload capability', {
        address,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        canUpload: false,
        hasWAL: false,
        hasSUI: false,
        reason: 'Failed to check wallet balances'
      };
    }
  }

  // Estimate storage cost
  async estimateStorageCost(fileSize: number, epochs?: number): Promise<{
    walCost: string;
    suiCost: string;
  }> {
    try {
      return await this.sdkClient.estimateStorageCost(fileSize, epochs);
    } catch (error) {
      logger.error('Failed to estimate storage cost', {
        fileSize,
        epochs,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return fallback estimates
      return {
        walCost: '1000000', // 1 WAL
        suiCost: '100000000' // 0.1 SUI
      };
    }
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
      // Temporarily return optimistic result to avoid circular dependency
      // TODO: Re-enable proper connectivity checking when circular dependency is resolved
      logger.debug('Connectivity check skipped - returning optimistic result');
      
      return {
        canUpload: true,
        canDownload: true
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
    // Temporarily return healthy status to avoid circular dependency
    // TODO: Re-enable proper health checking when circular dependency is resolved
    
    return {
      overall: 'healthy',
      services: {
        'Walrus Publisher': 'healthy',
        'Walrus Aggregator': 'healthy'
      },
      connectivity: {
        environment: 'testnet',
        proxy: false
      },
      recommendations: []
    };
  }

  // Force connectivity test
  async testConnectivity(): Promise<boolean> {
    try {
      // Temporarily return optimistic result to avoid circular dependency
      // TODO: Re-enable proper connectivity testing when circular dependency is resolved
      logger.debug('Connectivity test skipped - returning optimistic result');
      
      return true;
    } catch (error) {
      logger.error('Connectivity test failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
}