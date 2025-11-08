// Walrus Storage Service - High-level storage operations

import { WalrusClient } from '../lib/walrus-client';
import { WALRUS_CONFIG } from '../config/walrus.config';
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

export class WalrusStorageService {
  private client: WalrusClient;
  private cache: CacheManager;
  private retryManager: RetryManager;
  private chunkingUtils: ChunkingUtils;
  private blobRegistry: Map<string, BlobMetadata> = new Map();
  
  constructor() {
    this.client = new WalrusClient('testnet');
    this.cache = new CacheManager(WALRUS_CONFIG.agent.cacheSizeMB);
    this.retryManager = new RetryManager(
      WALRUS_CONFIG.agent.maxRetries,
      WALRUS_CONFIG.agent.retryDelayMs
    );
    this.chunkingUtils = new ChunkingUtils(WALRUS_CONFIG.agent.chunkSize);
  }
  
  // Intelligent file upload with automatic strategy selection
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const strategy = this.determineStrategy(file, options);
    
    switch (strategy) {
      case StorageStrategy.CHUNKED:
        return await this.uploadChunked(file, options);
      case StorageStrategy.DIRECT:
        return await this.uploadDirect(file, options);
      default:
        return await this.uploadDirect(file, options);
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
}