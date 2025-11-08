// Walrus Client Core Library

import { WALRUS_CONFIG } from '../config/walrus.config';
import { 
  UploadResult, 
  WalrusError,
  BlobNotFoundError,
  DownloadError,
  NodeHealth
} from '../types';

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
      const response = await fetch(
        `${this.config.publisher}/v1/blobs?epochs=${epochs}`,
        {
          method: 'PUT',
          body: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
          headers: { 
            'Content-Type': 'application/octet-stream'
          },
          signal: AbortSignal.timeout(WALRUS_CONFIG.performance.requestTimeoutMs)
        }
      );
      
      if (!response.ok) {
        throw new WalrusError(`Upload failed: ${response.statusText}`, response.status);
      }
      
      const result = await response.json() as any;
      
      return {
        success: true,
        blobId: result.blob_id || result.blobId,
        certificate: result.certificate
      };
      
    } catch (error) {
      if (error instanceof WalrusError) throw error;
      throw new WalrusError(`Upload error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Download blob from Walrus
  async downloadBlob(blobId: string): Promise<Uint8Array> {
    try {
      const response = await fetch(
        `${this.config.aggregator}/v1/blobs/${blobId}`,
        {
          signal: AbortSignal.timeout(WALRUS_CONFIG.performance.requestTimeoutMs)
        }
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new BlobNotFoundError(blobId);
        }
        throw new DownloadError(`Download failed: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
      
    } catch (error) {
      if (error instanceof WalrusError) throw error;
      throw new DownloadError(`Download error: ${error instanceof Error ? error.message : String(error)}`);
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
    for (const node of this.config.storageNodes) {
      try {
        const response = await fetch(
          `${node.url}/v1/blobs/${blobId}`,
          {
            signal: AbortSignal.timeout(10000)
          }
        );
        
        if (response.ok) {
          return new Uint8Array(await response.arrayBuffer());
        }
      } catch {
        continue;
      }
    }
    
    throw new BlobNotFoundError(blobId);
  }
}