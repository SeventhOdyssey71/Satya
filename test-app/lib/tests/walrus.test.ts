// Walrus Integration Tests

import { WalrusClient } from '../lib/walrus-client';
import { WalrusStorageService } from '../services/storage-service';
import { ChunkingUtils } from '../utils/chunking-utils';
import { CacheManager } from '../utils/cache-manager';
import { RetryManager } from '../utils/retry-manager';
import { BlobNotFoundError } from '../types';

describe('Walrus Integration', () => {
  describe('WalrusClient', () => {
    let client: WalrusClient;
    
    beforeEach(() => {
      client = new WalrusClient('testnet');
    });
    
    it('should upload blob successfully', async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await client.uploadBlob(testData, 5);
      
      expect(result.success).toBe(true);
      expect(result.blobId).toBeDefined();
      expect(result.certificate).toBeDefined();
    });
    
    it('should download blob successfully', async () => {
      // First upload
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const uploadResult = await client.uploadBlob(testData, 5);
      
      // Then download
      const downloadedData = await client.downloadBlob(uploadResult.blobId);
      
      expect(downloadedData).toEqual(testData);
    });
    
    it('should handle blob not found', async () => {
      const invalidBlobId = 'invalid_blob_id_123';
      
      await expect(client.downloadBlob(invalidBlobId))
        .rejects.toThrow(BlobNotFoundError);
    });
    
    it('should check aggregator health', async () => {
      const isHealthy = await client.checkAggregatorHealth();
      expect(typeof isHealthy).toBe('boolean');
    });
    
    it('should check publisher health', async () => {
      const isHealthy = await client.checkPublisherHealth();
      expect(typeof isHealthy).toBe('boolean');
    });
  });
  
  describe('WalrusStorageService', () => {
    let service: WalrusStorageService;
    
    beforeEach(() => {
      service = new WalrusStorageService();
    });
    
    it('should upload small file directly', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const result = await service.uploadFile(file);
      
      expect(result.success).toBe(true);
      expect(result.blobId).toBeDefined();
    });
    
    it('should upload large file in chunks', async () => {
      // Create a 15MB file (above chunk threshold)
      const largeContent = new Uint8Array(15 * 1024 * 1024);
      const file = new File([largeContent], 'large.bin', { type: 'application/octet-stream' });
      
      const result = await service.uploadFile(file);
      
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.chunkIds.length).toBeGreaterThan(1);
    });
    
    it('should use cache for repeated downloads', async () => {
      const blobId = 'test_blob_id';
      
      // Mock the client download
      const mockData = new Uint8Array([1, 2, 3]);
      jest.spyOn(service['client'], 'downloadBlob')
        .mockResolvedValueOnce(mockData);
      
      // First download
      const data1 = await service.downloadBlob(blobId);
      expect(data1).toEqual(mockData);
      
      // Second download should use cache
      const data2 = await service.downloadBlob(blobId);
      expect(data2).toEqual(mockData);
      
      // Client should only be called once
      expect(service['client'].downloadBlob).toHaveBeenCalledTimes(1);
    });
    
    it('should handle progress callback', async () => {
      const file = new File(['test'], 'test.txt');
      const progressValues: number[] = [];
      
      await service.uploadFile(file, {
        onProgress: (progress) => progressValues.push(progress)
      });
      
      expect(progressValues.length).toBeGreaterThan(0);
      expect(progressValues[progressValues.length - 1]).toBe(100);
    });
  });
  
  describe('ChunkingUtils', () => {
    let chunker: ChunkingUtils;
    
    beforeEach(() => {
      chunker = new ChunkingUtils(1024); // 1KB chunks for testing
    });
    
    it('should chunk file correctly', async () => {
      const content = new Uint8Array(2500); // 2.5KB
      const file = new File([content], 'test.bin');
      
      const chunks = await chunker.chunkFile(file);
      
      expect(chunks.length).toBe(3); // 3 chunks
      expect(chunks[0].length).toBe(1024);
      expect(chunks[1].length).toBe(1024);
      expect(chunks[2].length).toBe(452);
    });
    
    it('should reassemble chunks correctly', () => {
      const originalData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const chunks = chunker.chunkData(originalData);
      const reassembled = chunker.reassembleChunks(chunks);
      
      expect(reassembled).toEqual(originalData);
    });
    
    it('should calculate optimal chunk size', () => {
      const fileSize = 100 * 1024 * 1024; // 100MB
      const optimalSize = chunker.calculateOptimalChunkSize(fileSize);
      
      expect(optimalSize).toBeGreaterThanOrEqual(1024 * 1024);
      expect(optimalSize).toBeLessThanOrEqual(50 * 1024 * 1024);
    });
  });
  
  describe('CacheManager', () => {
    let cache: CacheManager;
    
    beforeEach(() => {
      cache = new CacheManager(1); // 1MB cache
    });
    
    it('should store and retrieve data', () => {
      const key = 'test_key';
      const data = new Uint8Array([1, 2, 3]);
      
      cache.set(key, data);
      const retrieved = cache.get(key);
      
      expect(retrieved).toEqual(data);
    });
    
    it('should evict old entries when full', () => {
      const cache = new CacheManager(0.001); // 1KB cache
      
      const data1 = new Uint8Array(500);
      const data2 = new Uint8Array(600);
      
      cache.set('key1', data1);
      cache.set('key2', data2); // Should evict key1
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).not.toBeNull();
    });
    
    it('should expire old entries', async () => {
      const cache = new CacheManager(1);
      cache['ttl'] = 100; // 100ms TTL for testing
      
      const data = new Uint8Array([1, 2, 3]);
      cache.set('key', data);
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('key')).toBeNull();
    });
  });
  
  describe('RetryManager', () => {
    let retryManager: RetryManager;
    
    beforeEach(() => {
      retryManager = new RetryManager(3, 100);
    });
    
    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return Promise.resolve('success');
      });
      
      const result = await retryManager.executeWithRetry(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
    
    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(retryManager.executeWithRetry(fn))
        .rejects.toThrow('Always fails');
      
      expect(fn).toHaveBeenCalledTimes(3);
    });
    
    it('should use exponential backoff', async () => {
      const delays: number[] = [];
      
      retryManager['delay'] = jest.fn().mockImplementation((ms: number) => {
        delays.push(ms);
        return Promise.resolve();
      });
      
      const fn = jest.fn().mockRejectedValue(new Error('Fail'));
      
      try {
        await retryManager.executeWithRetry(fn);
      } catch {}
      
      // Check exponential growth
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[0]).toBeGreaterThanOrEqual(100);
      expect(delays[0]).toBeLessThan(1100); // With jitter
    });
  });
});

// Integration test for the complete flow
describe('Walrus End-to-End', () => {
  it('should handle complete upload and download cycle', async () => {
    const service = new WalrusStorageService();
    
    // Create test file
    const content = 'This is a test AI model file content';
    const file = new File([content], 'model.bin', { type: 'application/octet-stream' });
    
    // Upload
    const uploadResult = await service.uploadFile(file);
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.blobId).toBeDefined();
    
    // Download
    const downloadedData = await service.downloadBlob(uploadResult.blobId);
    const downloadedContent = new TextDecoder().decode(downloadedData);
    
    expect(downloadedContent).toBe(content);
    
    // Verify metadata
    const metadata = service.getBlobMetadata(uploadResult.blobId);
    expect(metadata).toBeDefined();
    expect(metadata?.name).toBe('model.bin');
    expect(metadata?.size).toBe(file.size);
  });
});