// Walrus Connectivity Test Suite

import { WalrusClient } from '../lib/walrus-client';
import { WalrusStorageService } from '../services/storage-service';
import { WALRUS_CONFIG } from '../config/walrus.config';
import { logger } from '../../core/logger';

export interface ConnectivityTestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

export class WalrusConnectivityTester {
  private client: WalrusClient;
  private storageService?: WalrusStorageService;
  private results: ConnectivityTestResult[] = [];

  constructor() {
    this.client = new WalrusClient('testnet');
    // Don't instantiate storage service here to avoid circular dependency
    // It will be created lazily when needed
  }

  private getStorageService(): WalrusStorageService {
    // Lazy load to avoid circular dependency during initial module loading
    const { WalrusStorageService: StorageServiceClass } = require('../services/storage-service');
    if (!this.storageService) {
      this.storageService = new StorageServiceClass();
    }
    return this.storageService!;
  }

  // Run all connectivity tests
  async runAllTests(): Promise<ConnectivityTestResult[]> {
    this.results = [];
    
    logger.info('Starting Walrus connectivity tests');
    
    // Core infrastructure tests
    await this.testAggregatorHealth();
    await this.testPublisherHealth();
    await this.testStorageNodeHealth();
    
    // Network operation tests
    await this.testSmallFileUpload();
    await this.testFileDownload();
    await this.testChunkedUpload();
    await this.testErrorHandling();
    
    // Performance tests
    await this.testConcurrentUploads();
    await this.testLargeFileHandling();
    
    logger.info('Walrus connectivity tests completed', {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length
    });
    
    return this.results;
  }

  // Test aggregator health endpoint
  private async testAggregatorHealth(): Promise<void> {
    const testName = 'Aggregator Health Check';
    const start = Date.now();
    
    try {
      const healthy = await this.client.checkAggregatorHealth();
      
      this.results.push({
        testName,
        success: healthy,
        duration: Date.now() - start,
        details: {
          aggregatorUrl: WALRUS_CONFIG.testnet.aggregator,
          healthy
        }
      });
      
      if (!healthy) {
        logger.warn('Aggregator health check failed', {
          url: WALRUS_CONFIG.testnet.aggregator
        });
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Test publisher health endpoint
  private async testPublisherHealth(): Promise<void> {
    const testName = 'Publisher Health Check';
    const start = Date.now();
    
    try {
      const healthy = await this.client.checkPublisherHealth();
      
      this.results.push({
        testName,
        success: healthy,
        duration: Date.now() - start,
        details: {
          publisherUrl: WALRUS_CONFIG.testnet.publisher,
          healthy
        }
      });
      
      if (!healthy) {
        logger.warn('Publisher health check failed', {
          url: WALRUS_CONFIG.testnet.publisher
        });
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Test storage node health
  private async testStorageNodeHealth(): Promise<void> {
    const testName = 'Storage Nodes Health Check';
    const start = Date.now();
    
    try {
      const healthChecks = await Promise.allSettled(
        WALRUS_CONFIG.testnet.storageNodes.map(node => 
          this.client.checkNodeHealth(node.url)
        )
      );
      
      const healthyNodes = healthChecks
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(health => health.healthy);
      
      const success = healthyNodes.length > 0;
      
      this.results.push({
        testName,
        success,
        duration: Date.now() - start,
        details: {
          totalNodes: WALRUS_CONFIG.testnet.storageNodes.length,
          healthyNodes: healthyNodes.length,
          unhealthyNodes: WALRUS_CONFIG.testnet.storageNodes.length - healthyNodes.length
        }
      });
      
      if (!success) {
        logger.error('All storage nodes are unhealthy');
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Test small file upload
  private async testSmallFileUpload(): Promise<void> {
    const testName = 'Small File Upload Test';
    const start = Date.now();
    
    try {
      // Create test data (1KB)
      const testData = new Uint8Array(1024);
      crypto.getRandomValues(testData);
      
      const result = await this.client.uploadBlob(testData, 1);
      
      this.results.push({
        testName,
        success: result.success,
        duration: Date.now() - start,
        details: {
          dataSize: testData.length,
          blobId: result.blobId,
          success: result.success
        }
      });
      
      if (result.success) {
        logger.info('Small file upload successful', {
          blobId: result.blobId,
          size: testData.length
        });
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Test file download
  private async testFileDownload(): Promise<void> {
    const testName = 'File Download Test';
    const start = Date.now();
    
    try {
      // First upload a test file
      const testData = new Uint8Array(2048);
      crypto.getRandomValues(testData);
      
      const uploadResult = await this.client.uploadBlob(testData, 1);
      
      if (!uploadResult.success) {
        throw new Error('Upload failed, cannot test download');
      }
      
      // Then download it
      const downloadedData = await this.client.downloadBlob(uploadResult.blobId);
      
      // Verify data integrity
      const dataMatches = this.compareUint8Arrays(testData, downloadedData);
      
      this.results.push({
        testName,
        success: dataMatches,
        duration: Date.now() - start,
        details: {
          uploadedSize: testData.length,
          downloadedSize: downloadedData.length,
          dataIntegrity: dataMatches,
          blobId: uploadResult.blobId
        }
      });
      
      if (dataMatches) {
        logger.info('File download and integrity check successful', {
          blobId: uploadResult.blobId
        });
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Test chunked upload for larger files
  private async testChunkedUpload(): Promise<void> {
    const testName = 'Chunked Upload Test';
    const start = Date.now();
    
    try {
      // Create test file (15MB to trigger chunking)
      const fileSize = 15 * 1024 * 1024;
      const testData = new Uint8Array(fileSize);
      crypto.getRandomValues(testData);
      
      // Create mock File object
      const blob = new Blob([testData], { type: 'application/octet-stream' });
      const file = new File([blob], 'test-large-file.bin');
      
      const result = await this.getStorageService().uploadFile(file, {
        forceChunked: true,
        epochs: 1
      });
      
      this.results.push({
        testName,
        success: result.success,
        duration: Date.now() - start,
        details: {
          fileSize,
          chunkStrategy: 'forced',
          success: result.success,
          blobId: result.blobId
        }
      });
      
      if (result.success) {
        logger.info('Chunked upload successful', {
          fileSize,
          blobId: result.blobId
        });
      }
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Test error handling with invalid requests
  private async testErrorHandling(): Promise<void> {
    const testName = 'Error Handling Test';
    const start = Date.now();
    
    try {
      let errorsCaughtCorrectly = 0;
      const totalErrorTests = 2;
      
      // Test 1: Download non-existent blob
      try {
        await this.client.downloadBlob('nonexistent-blob-id');
      } catch (error) {
        if (error instanceof Error && error.name === 'BlobNotFoundError') {
          errorsCaughtCorrectly++;
        }
      }
      
      // Test 2: Upload with invalid epochs
      try {
        const testData = new Uint8Array(100);
        await this.client.uploadBlob(testData, -1);
      } catch (error) {
        errorsCaughtCorrectly++;
      }
      
      const success = errorsCaughtCorrectly === totalErrorTests;
      
      this.results.push({
        testName,
        success,
        duration: Date.now() - start,
        details: {
          totalErrorTests,
          errorsCaughtCorrectly,
          errorHandlingWorking: success
        }
      });
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Test concurrent uploads
  private async testConcurrentUploads(): Promise<void> {
    const testName = 'Concurrent Uploads Test';
    const start = Date.now();
    
    try {
      const concurrentUploads = 3;
      const uploadPromises = [];
      
      for (let i = 0; i < concurrentUploads; i++) {
        const testData = new Uint8Array(1024 * (i + 1));
        crypto.getRandomValues(testData);
        uploadPromises.push(this.client.uploadBlob(testData, 1));
      }
      
      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads = results.filter(
        (result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value.success
      ).length;
      
      const success = successfulUploads === concurrentUploads;
      
      this.results.push({
        testName,
        success,
        duration: Date.now() - start,
        details: {
          concurrentUploads,
          successfulUploads,
          failedUploads: concurrentUploads - successfulUploads
        }
      });
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Test large file handling (without actually uploading)
  private async testLargeFileHandling(): Promise<void> {
    const testName = 'Large File Strategy Test';
    const start = Date.now();
    
    try {
      // Test strategy determination for different file sizes
      const storageService = new WalrusStorageService();
      
      // Mock small file
      const smallFile = new File([new ArrayBuffer(1024)], 'small.txt');
      // Mock large file  
      const largeFile = new File([new ArrayBuffer(50 * 1024 * 1024)], 'large.bin');
      
      // Access private method through any casting for testing
      const smallStrategy = (storageService as any).determineStrategy(smallFile, {});
      const largeStrategy = (storageService as any).determineStrategy(largeFile, {});
      
      const success = smallStrategy === 'direct' && largeStrategy === 'chunked';
      
      this.results.push({
        testName,
        success,
        duration: Date.now() - start,
        details: {
          smallFileStrategy: smallStrategy,
          largeFileStrategy: largeStrategy,
          strategySelectionWorking: success
        }
      });
    } catch (error) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Utility: Compare two Uint8Arrays
  private compareUint8Arrays(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  // Get test summary
  getTestSummary(): {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    criticalIssues: string[];
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    
    const criticalIssues = this.results
      .filter(r => !r.success && (
        r.testName.includes('Health Check') ||
        r.testName.includes('Upload Test') ||
        r.testName.includes('Download Test')
      ))
      .map(r => r.testName);
    
    return {
      total,
      passed,
      failed,
      passRate,
      criticalIssues
    };
  }
}