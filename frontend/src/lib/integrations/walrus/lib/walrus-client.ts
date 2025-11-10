// Walrus Client Core Library

import { WALRUS_CONFIG } from '../config/walrus.config';
import { walrusEnvironment } from '../config/environment-specific';
import { 
  UploadResult, 
  WalrusError,
  BlobNotFoundError,
  DownloadError,
  NodeHealth
} from '../types';
import { logger } from '../../core/logger';

export class WalrusClient {
  private config = WALRUS_CONFIG.testnet;
  private nodeStatus: Map<string, NodeHealth> = new Map();
  
  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    if (network === 'mainnet') {
      throw new Error('Mainnet not yet configured');
    }
  }
  
  // Direct upload to Walrus
  async uploadBlob(
    data: Uint8Array,
    epochs: number = WALRUS_CONFIG.agent.defaultEpochs
  ): Promise<UploadResult> {
    try {
      const uploadUrl = walrusEnvironment.getUploadUrl(`${this.config.publisher}/v1/blobs?epochs=${epochs}`);
      const headers = {
        ...walrusEnvironment.getRequestHeaders(),
        'Content-Length': data.length.toString()
      };
      const timeout = walrusEnvironment.getTimeout('upload');

      logger.debug('Starting Walrus upload', {
        dataSize: data.length,
        epochs,
        url: uploadUrl,
        timeout
      });

      let response: Response;
      
      try {
        response = await fetch(uploadUrl, {
          method: 'PUT',
          body: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
          headers,
          signal: AbortSignal.timeout(timeout),
          mode: 'cors', // Explicitly set CORS mode
          cache: 'no-cache',
          redirect: 'follow'
        });
      } catch (fetchError) {
        // If direct fetch fails (likely CORS), fall back to mock for development
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Walrus upload failed, using development mock', {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            dataSize: data.length
          });
          
          // Return mock success response for development
          const mockBlobId = `dev_blob_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          return {
            success: true,
            blobId: mockBlobId,
            suiRef: mockBlobId,
            size: data.length,
            epochs: epochs,
            endEpoch: epochs + 100,
            storageCost: "1000000",
            encodedSize: data.length,
            encodingType: "RedStuff"
          };
        }
        throw fetchError;
      }
      
      if (!response.ok) {
        throw new WalrusError(`Upload failed: ${response.statusText}`, response.status);
      }
      
      const result = await response.json() as any;
      
      logger.info('Walrus upload successful', {
        blobId: result.blob_id || result.blobId,
        dataSize: data.length,
        epochs
      });

      return {
        success: true,
        blobId: result.blob_id || result.blobId,
        certificate: result.certificate
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Walrus upload failed', {
        error: errorMessage,
        dataSize: data.length,
        epochs
      });

      // Report connectivity issue
      walrusEnvironment.reportConnectivityIssue('Publisher', errorMessage);

      if (error instanceof WalrusError) throw error;
      throw new WalrusError(`Upload error: ${errorMessage}`);
    }
  }
  
  // Download blob from Walrus
  async downloadBlob(blobId: string): Promise<Uint8Array> {
    try {
      const downloadUrl = walrusEnvironment.getDownloadUrl(`${this.config.aggregator}/v1/blobs/${blobId}`);
      const headers = walrusEnvironment.getRequestHeaders();
      const timeout = walrusEnvironment.getTimeout('download');

      logger.debug('Starting Walrus download', {
        blobId,
        url: downloadUrl,
        timeout
      });

      let response: Response;
      
      try {
        response = await fetch(downloadUrl, {
          headers,
          signal: AbortSignal.timeout(timeout),
          mode: 'cors',
          cache: 'no-cache',
          redirect: 'follow'
        });
      } catch (fetchError) {
        // If direct fetch fails (likely CORS), fall back to mock for development
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Walrus download failed, using development mock', {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            blobId
          });
          
          // Return mock data for development
          const mockData = new TextEncoder().encode(`Mock data for blob ${blobId}`);
          return mockData;
        }
        throw new DownloadError(`Download failed: ${fetchError instanceof Error ? fetchError.message : 'Network error'}`);
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new BlobNotFoundError(blobId);
        }
        throw new DownloadError(`Download failed: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      logger.info('Walrus download successful', {
        blobId,
        dataSize: data.length
      });
      
      return data;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Walrus download failed', {
        blobId,
        error: errorMessage
      });

      // Report connectivity issue
      walrusEnvironment.reportConnectivityIssue('Aggregator', errorMessage);

      if (error instanceof WalrusError) throw error;
      throw new DownloadError(`Download error: ${errorMessage}`);
    }
  }
  
  // Stream download for large files
  async *streamDownload(blobId: string): AsyncGenerator<Uint8Array> {
    const response = await fetch(
      `${this.config.aggregator}/v1/blobs/${blobId}`
    );
    
    if (!response.ok || !response.body) {
      throw new DownloadError(`Stream failed for ${blobId}`);
    }
    
    const reader = response.body.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }
  
  // Check aggregator health
  async checkAggregatorHealth(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.aggregator}/health`,
        { 
          signal: AbortSignal.timeout(5000)
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
  
  // Check publisher health
  async checkPublisherHealth(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.publisher}/health`,
        { 
          signal: AbortSignal.timeout(5000)
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
  
  // Check storage node health
  async checkNodeHealth(nodeUrl: string): Promise<NodeHealth> {
    const start = Date.now();
    
    try {
      const response = await fetch(
        `${nodeUrl}/health`,
        { 
          signal: AbortSignal.timeout(5000)
        }
      );
      
      const healthy = response.ok;
      const responseTime = Date.now() - start;
      
      const health: NodeHealth = {
        url: nodeUrl,
        healthy,
        lastChecked: Date.now(),
        responseTime: healthy ? responseTime : null,
        errorCount: healthy ? 0 : 1
      };
      
      this.nodeStatus.set(nodeUrl, health);
      return health;
      
    } catch (error) {
      const health: NodeHealth = {
        url: nodeUrl,
        healthy: false,
        lastChecked: Date.now(),
        responseTime: null,
        errorCount: (this.nodeStatus.get(nodeUrl)?.errorCount || 0) + 1
      };
      
      this.nodeStatus.set(nodeUrl, health);
      return health;
    }
  }
  
  // Get healthy storage nodes
  getHealthyNodes(): string[] {
    return Array.from(this.nodeStatus.entries())
      .filter(([_, health]) => health.healthy)
      .sort((a, b) => (a[1].responseTime || 999999) - (b[1].responseTime || 999999))
      .map(([url]) => url);
  }
  
  // Try alternative nodes for download
  async downloadFromAlternativeNodes(blobId: string): Promise<Uint8Array> {
    const fallbackNodes = walrusEnvironment.getFallbackNodes();
    
    logger.info('Attempting download from alternative nodes', {
      blobId,
      nodeCount: fallbackNodes.length
    });

    for (const nodeUrl of fallbackNodes) {
      try {
        const downloadUrl = walrusEnvironment.getDownloadUrl(`${nodeUrl}/v1/blobs/${blobId}`);
        const headers = walrusEnvironment.getRequestHeaders();
        
        const response = await fetch(downloadUrl, {
          headers,
          signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
          const data = new Uint8Array(await response.arrayBuffer());
          logger.info('Alternative node download successful', {
            blobId,
            nodeUrl,
            dataSize: data.length
          });
          return data;
        }
      } catch (error) {
        logger.warn('Alternative node failed', {
          blobId,
          nodeUrl,
          error: error instanceof Error ? error.message : String(error)
        });
        continue;
      }
    }
    
    logger.error('All alternative nodes failed', { blobId });
    throw new BlobNotFoundError(blobId);
  }
}