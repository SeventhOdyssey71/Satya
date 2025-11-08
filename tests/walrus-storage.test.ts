import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalrusStorageService } from '../integrations/walrus/services/storage-service';
import { StorageStrategy } from '../integrations/walrus/types';

describe('Walrus Storage Service Tests', () => {
  let storageService: WalrusStorageService;
  let testData: Uint8Array;
  let testFile: File;
  let largeTestFile: File;

  beforeEach(() => {
    storageService = new WalrusStorageService();
    testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    testFile = new File([testData], 'test.bin', { type: 'application/octet-stream' });
    
    // Create large test file (15MB)
    const largeData = new Uint8Array(15 * 1024 * 1024);
    largeData.fill(42);
    largeTestFile = new File([largeData], 'large-test.bin', { type: 'application/octet-stream' });
  });

  describe('Direct Upload Strategy', () => {
    it('should upload small files directly', async () => {
      const result = await storageService.uploadFile(testFile);

      expect(result.success).toBe(true);
      expect(result.blobId).toBeTruthy();
      expect(result.blobId).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it('should store blob metadata after upload', async () => {
      const result = await storageService.uploadFile(testFile);
      
      const metadata = storageService.getBlobMetadata(result.blobId);
      
      expect(metadata).toBeTruthy();
      expect(metadata?.name).toBe('test.bin');
      expect(metadata?.size).toBe(testData.length);
      expect(metadata?.uploadedAt).toBeCloseTo(Date.now(), -3);
    });

    it('should handle custom upload options', async () => {
      const options = {
        epochs: 10,
        onProgress: vi.fn()
      };

      const result = await storageService.uploadFile(testFile, options);

      expect(result.success).toBe(true);
      
      const metadata = storageService.getBlobMetadata(result.blobId);
      expect(metadata?.epochs).toBe(10);
    });
  });

  describe('Chunked Upload Strategy', () => {
    it('should use chunked upload for large files', async () => {
      const progressCallback = vi.fn();
      const options = {
        forceChunked: true,
        onProgress: progressCallback
      };

      const result = await storageService.uploadFile(testFile, options);

      expect(result.success).toBe(true);
      expect(result.blobId).toBeTruthy();
      expect(result.metadata).toBeTruthy();
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should automatically chunk files over 10MB', async () => {
      const result = await storageService.uploadFile(largeTestFile);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeTruthy();
      
      // Should create a manifest for chunked upload
      const manifest = result.metadata as any;
      expect(manifest.chunkIds).toBeInstanceOf(Array);
      expect(manifest.chunkIds.length).toBeGreaterThan(1);
    });

    it('should track progress during chunked upload', async () => {
      const progressUpdates: number[] = [];
      const options = {
        forceChunked: true,
        onProgress: (progress: number) => progressUpdates.push(progress)
      };

      await storageService.uploadFile(testFile, options);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });
  });

  describe('Download Operations', () => {
    let uploadedBlobId: string;

    beforeEach(async () => {
      const result = await storageService.uploadFile(testFile);
      uploadedBlobId = result.blobId;
    });

    it('should download blob successfully', async () => {
      const downloadedData = await storageService.downloadBlob(uploadedBlobId);

      expect(downloadedData).toEqual(testData);
    });

    it('should use cache for repeated downloads', async () => {
      // First download
      const data1 = await storageService.downloadBlob(uploadedBlobId);
      
      // Second download (should use cache)
      const data2 = await storageService.downloadBlob(uploadedBlobId);

      expect(data1).toEqual(data2);
      expect(data1).toEqual(testData);
    });

    it('should force refresh when requested', async () => {
      // First download
      await storageService.downloadBlob(uploadedBlobId);
      
      // Force refresh
      const freshData = await storageService.downloadBlob(uploadedBlobId, { 
        forceRefresh: true 
      });

      expect(freshData).toEqual(testData);
    });

    it('should fallback to alternative nodes on failure', async () => {
      // Mock primary download failure
      const originalDownload = storageService['client'].downloadBlob;
      storageService['client'].downloadBlob = vi.fn().mockRejectedValueOnce(
        new Error('Primary node failed')
      );
      
      // Mock successful alternative download
      storageService['client'].downloadFromAlternativeNodes = vi.fn().mockResolvedValue(testData);

      const downloadedData = await storageService.downloadBlob(uploadedBlobId);

      expect(downloadedData).toEqual(testData);
      expect(storageService['client'].downloadFromAlternativeNodes).toHaveBeenCalledWith(uploadedBlobId);
      
      // Restore original method
      storageService['client'].downloadBlob = originalDownload;
    });
  });

  describe('Chunked Download', () => {
    let chunkedBlobId: string;

    beforeEach(async () => {
      const result = await storageService.uploadFile(testFile, { forceChunked: true });
      chunkedBlobId = result.blobId;
    });

    it('should download and reassemble chunked files', async () => {
      const downloadedData = await storageService.downloadChunkedFile(chunkedBlobId);

      expect(downloadedData).toEqual(testData);
    });

    it('should handle chunk download failures', async () => {
      // This would test retry mechanisms for individual chunks
      const downloadedData = await storageService.downloadChunkedFile(chunkedBlobId);
      
      expect(downloadedData).toEqual(testData);
    });
  });

  describe('Stream Download', () => {
    let streamBlobId: string;

    beforeEach(async () => {
      const result = await storageService.uploadFile(largeTestFile);
      streamBlobId = result.blobId;
    });

    it('should stream large file downloads', async () => {
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of storageService.streamDownload(streamBlobId)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      
      // Reassemble and verify
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const reassembled = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        reassembled.set(chunk, offset);
        offset += chunk.length;
      }

      expect(reassembled.length).toBe(largeTestFile.size);
    });
  });

  describe('Blob Management', () => {
    let testBlobIds: string[];

    beforeEach(async () => {
      const uploads = await Promise.all([
        storageService.uploadFile(testFile, { epochs: 1 }),
        storageService.uploadFile(testFile, { epochs: 5 }),
        storageService.uploadFile(testFile, { epochs: 30 })
      ]);
      
      testBlobIds = uploads.map(u => u.blobId);
    });

    it('should track blob metadata', async () => {
      for (const blobId of testBlobIds) {
        const metadata = storageService.getBlobMetadata(blobId);
        
        expect(metadata).toBeTruthy();
        expect(metadata?.blobId).toBe(blobId);
        expect(metadata?.uploadedAt).toBeCloseTo(Date.now(), -3);
      }
    });

    it('should identify expiring blobs', () => {
      const expiringBlobs = storageService.getExpiringBlobs(2); // 2 days
      
      // Blobs with 1 epoch should be expiring soon
      const shortTermBlobs = expiringBlobs.filter(b => b.epochs === 1);
      expect(shortTermBlobs.length).toBeGreaterThan(0);
    });

    it('should calculate correct expiry times', () => {
      const metadata = storageService.getBlobMetadata(testBlobIds[0]);
      
      expect(metadata?.expiresAt).toBeGreaterThan(Date.now());
      expect(metadata?.expiresAt).toBeLessThan(Date.now() + (365 * 24 * 60 * 60 * 1000));
    });
  });

  describe('Strategy Selection', () => {
    it('should determine direct strategy for small files', async () => {
      const strategy = storageService['determineStrategy'](testFile, {});
      
      expect(strategy).toBe(StorageStrategy.DIRECT);
    });

    it('should determine chunked strategy for large files', async () => {
      const strategy = storageService['determineStrategy'](largeTestFile, {});
      
      expect(strategy).toBe(StorageStrategy.CHUNKED);
    });

    it('should respect forceChunked option', async () => {
      const strategy = storageService['determineStrategy'](testFile, { forceChunked: true });
      
      expect(strategy).toBe(StorageStrategy.CHUNKED);
    });
  });

  describe('Error Handling', () => {
    it('should handle upload failures gracefully', async () => {
      // Mock upload failure
      const originalUpload = storageService['client'].uploadBlob;
      storageService['client'].uploadBlob = vi.fn().mockRejectedValue(
        new Error('Network error')
      );

      await expect(storageService.uploadFile(testFile)).rejects.toThrow('Network error');
      
      // Restore original method
      storageService['client'].uploadBlob = originalUpload;
    });

    it('should retry failed operations', async () => {
      // Mock retry manager behavior
      let attempts = 0;
      const originalUpload = storageService['client'].uploadBlob;
      storageService['client'].uploadBlob = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return originalUpload.call(storageService['client'], testData, 5);
      });

      const result = await storageService.uploadFile(testFile);
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
      
      // Restore original method
      storageService['client'].uploadBlob = originalUpload;
    });

    it('should handle download of non-existent blob', async () => {
      await expect(
        storageService.downloadBlob('non-existent-blob-id')
      ).rejects.toThrow();
    });

    it('should handle corrupted chunk manifests', async () => {
      // Upload corrupted manifest
      const corruptedManifest = 'invalid json';
      const manifestBlob = new TextEncoder().encode(corruptedManifest);
      const uploadResult = await storageService['client'].uploadBlob(manifestBlob, 5);
      
      await expect(
        storageService.downloadChunkedFile(uploadResult.blobId)
      ).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent uploads', async () => {
      const files = Array.from({ length: 5 }, (_, i) => 
        new File([new Uint8Array([i, i, i])], `file-${i}.bin`)
      );

      const uploads = files.map(file => storageService.uploadFile(file));
      const results = await Promise.allSettled(uploads);

      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(5);
    });

    it('should cache downloads efficiently', async () => {
      const result = await storageService.uploadFile(testFile);
      
      // First download (network)
      const start1 = Date.now();
      await storageService.downloadBlob(result.blobId);
      const time1 = Date.now() - start1;

      // Second download (cache)
      const start2 = Date.now();
      await storageService.downloadBlob(result.blobId);
      const time2 = Date.now() - start2;

      // Cache should be faster
      expect(time2).toBeLessThan(time1);
    });

    it('should handle large file uploads within reasonable time', async () => {
      const startTime = Date.now();
      const result = await storageService.uploadFile(largeTestFile);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(30000); // Should complete in 30s
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files', async () => {
      const emptyFile = new File([], 'empty.txt');
      
      await expect(storageService.uploadFile(emptyFile)).rejects.toThrow();
    });

    it('should handle files with special characters in name', async () => {
      const specialFile = new File([testData], 'test@#$%^&*().bin');
      
      const result = await storageService.uploadFile(specialFile);
      
      expect(result.success).toBe(true);
      
      const metadata = storageService.getBlobMetadata(result.blobId);
      expect(metadata?.name).toBe('test@#$%^&*().bin');
    });

    it('should handle very small chunks', async () => {
      // Force small chunk size
      const originalChunkSize = storageService['chunkingUtils']['chunkSize'];
      storageService['chunkingUtils']['chunkSize'] = 2; // 2 bytes

      const result = await storageService.uploadFile(testFile, { forceChunked: true });
      
      expect(result.success).toBe(true);
      
      // Restore original chunk size
      storageService['chunkingUtils']['chunkSize'] = originalChunkSize;
    });
  });
});