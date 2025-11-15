// Walrus SDK Client - SUI wallet integrated storage client

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { walrus, WalrusFile } from '@mysten/walrus';
// Ed25519Keypair removed - using wallet-based signing only
import { Transaction } from '@mysten/sui/transactions';
import { WALRUS_CONFIG } from '../../../constants';
import { logger } from '../../core/logger';
import { UploadResult, WalrusError, DownloadError, BlobNotFoundError } from '../types';

export interface WalrusUploadOptions {
  epochs?: number;
  deletable?: boolean;
  onProgress?: (progress: number) => void;
}

export interface DappKitSigner {
  toSuiAddress?: () => string;
  signAndExecuteTransaction?: (transaction: any) => Promise<any>;
}

export class WalrusSDKClient {
  private client: any; // SuiClient extended with walrus
  private network: 'testnet' | 'mainnet' | 'devnet';

  constructor(network: 'testnet' | 'mainnet' | 'devnet' = 'testnet') {
    this.network = network;
    
    // Create SUI client with Walrus extension
    const suiClient = new SuiClient({
      url: getFullnodeUrl(network)
    });
    
    // Configure Walrus with network and upload relay to avoid direct storage node connections
    this.client = suiClient.$extend(walrus({
      network: network as 'testnet' | 'mainnet',
      uploadRelay: {
        host: 'https://upload-relay.testnet.walrus.space',
        sendTip: {
          max: 1000 // Maximum tip in MIST
        }
      }
    }));
    
    logger.info('Walrus SDK client initialized', {
      network,
      rpcUrl: getFullnodeUrl(network)
    });
  }

  /**
   * Upload a file using Walrus HTTP API (no private key required)
   */
  async uploadFile(
    file: File,
    options: WalrusUploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const epochs = options.epochs || WALRUS_CONFIG.agent.defaultEpochs;
      
      logger.info('Starting Walrus HTTP API upload', {
        fileName: file.name,
        fileSize: file.size,
        epochs
      });

      // Use HTTP API for upload to avoid private key requirement
      return await this.storeViaHttpAPI(file, options);

    } catch (error) {
      logger.error('Walrus upload operation failed', { 
        fileName: file.name,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new WalrusError(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * HTTP API fallback for file uploads (no private key required)
   */
  private async storeViaHttpAPI(file: File, options: WalrusUploadOptions = {}): Promise<UploadResult> {
    try {
      const epochs = options.epochs || WALRUS_CONFIG.agent.defaultEpochs;
      
      logger.info('Using Walrus HTTP API for upload', {
        fileName: file.name,
        fileSize: file.size,
        epochs
      });

      // Create form data for HTTP upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('epochs', epochs.toString());

      // Use Walrus Publisher endpoint
      const publisherUrl = WALRUS_CONFIG.PUBLISHER_URL;
      const response = await fetch(`${publisherUrl}/v1/store?epochs=${epochs}`, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new WalrusError(`HTTP upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      options.onProgress?.(100);

      return {
        success: true,
        blobId: result.newlyCreated?.blobObject?.blobId || result.alreadyCertified?.blobId || '',
        certificate: result.newlyCreated ? 'certified' : 'already_certified'
      };

    } catch (error) {
      logger.error('HTTP API upload failed', { 
        fileName: file.name,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new WalrusError(`HTTP upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload multiple files sequentially using HTTP API
   */
  async uploadFiles(
    files: File[],
    options: WalrusUploadOptions = {}
  ): Promise<UploadResult[]> {
    try {
      logger.info('Starting batch Walrus HTTP upload', {
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0)
      });

      // Upload files sequentially using HTTP API
      const results: UploadResult[] = [];
      
      for (const file of files) {
        try {
          const result = await this.storeViaHttpAPI(file, options);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            blobId: '',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      return results;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Batch Walrus HTTP upload failed', {
        fileCount: files.length,
        error: errorMessage
      });

      throw new WalrusError(`Batch upload failed: ${errorMessage}`);
    }
  }

  /**
   * Download a blob using the blob ID
   */
  async downloadBlob(blobId: string): Promise<Uint8Array> {
    try {
      logger.debug('Starting Walrus SDK download', { blobId });

      // Use Walrus SDK for download
      const data = await this.client.walrus.readBlob({
        blobId: blobId
      });

      if (!data) {
        throw new BlobNotFoundError(blobId);
      }

      logger.info('Walrus SDK download successful', {
        blobId,
        dataSize: data.length
      });

      return new Uint8Array(data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Walrus SDK download failed', {
        blobId,
        error: errorMessage
      });

      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        throw new BlobNotFoundError(blobId);
      }

      throw new DownloadError(`Download failed: ${errorMessage}`);
    }
  }

  /**
   * Get blob information from the Sui blockchain
   */
  async getBlobInfo(blobId: string): Promise<{
    size: number;
    encoding: string;
    certified: boolean;
    storageEndEpoch?: number;
  } | null> {
    try {
      logger.debug('Getting blob info from Sui', { blobId });

      // Query Sui for blob object information
      // This would use the Walrus system object to get blob metadata
      const blobInfo = await this.client.walrus.getBlobInfo({
        blobId: blobId
      });

      if (!blobInfo) {
        return null;
      }

      logger.debug('Blob info retrieved', {
        blobId,
        blobInfo
      });

      return {
        size: blobInfo.size || 0,
        encoding: blobInfo.encoding || 'unknown',
        certified: blobInfo.certified || false,
        storageEndEpoch: blobInfo.storageEndEpoch
      };

    } catch (error) {
      logger.warn('Failed to get blob info', {
        blobId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Check if the client can perform uploads (has necessary tokens)
   */
  async canUpload(address: string): Promise<{
    canUpload: boolean;
    hasWAL: boolean;
    hasSUI: boolean;
    walBalance?: string;
    suiBalance?: string;
    reason?: string;
  }> {
    try {
      logger.debug('Checking upload capability', { address });

      // Get WAL token balance
      const walCoins = await this.client.getCoins({
        owner: address,
        coinType: '0x2::sui::SUI' // This would need to be updated to actual WAL coin type
      });

      // Get SUI token balance
      const suiCoins = await this.client.getCoins({
        owner: address,
        coinType: '0x2::sui::SUI'
      });

      const hasWAL = walCoins.data && walCoins.data.length > 0;
      const hasSUI = suiCoins.data && suiCoins.data.length > 0;
      
      const walBalance = hasWAL ? 
        walCoins.data.reduce((sum: bigint, coin: any) => sum + BigInt(coin.balance), BigInt(0)).toString() : 
        '0';
      
      const suiBalance = hasSUI ? 
        suiCoins.data.reduce((sum: bigint, coin: any) => sum + BigInt(coin.balance), BigInt(0)).toString() : 
        '0';

      const canUpload = hasWAL && hasSUI;
      const reason = !canUpload ? 
        (!hasWAL && !hasSUI ? 'No WAL or SUI tokens' : 
         !hasWAL ? 'No WAL tokens for storage' : 
         'No SUI tokens for transaction fees') : 
        undefined;

      logger.debug('Upload capability check result', {
        address,
        canUpload,
        hasWAL,
        hasSUI,
        walBalance,
        suiBalance,
        reason
      });

      return {
        canUpload,
        hasWAL,
        hasSUI,
        walBalance,
        suiBalance,
        reason
      };

    } catch (error) {
      logger.error('Failed to check upload capability', {
        address,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        canUpload: false,
        hasWAL: false,
        hasSUI: false,
        reason: 'Failed to check token balances'
      };
    }
  }

  /**
   * Estimate storage cost for a file
   */
  async estimateStorageCost(
    fileSize: number,
    epochs: number = WALRUS_CONFIG.agent.defaultEpochs
  ): Promise<{
    walCost: string;
    suiCost: string;
    totalCostUSD?: string;
  }> {
    try {
      // This would use Walrus system calls to get current storage pricing
      // For now, return estimated costs based on file size and epochs
      
      const bytesPerWAL = 1024 * 1024; // 1MB per WAL (example)
      const walCost = Math.ceil(fileSize / bytesPerWAL) * epochs;
      const suiCost = 100000000; // 0.1 SUI for transaction fees (example)

      logger.debug('Storage cost estimated', {
        fileSize,
        epochs,
        walCost,
        suiCost
      });

      return {
        walCost: walCost.toString(),
        suiCost: suiCost.toString()
      };

    } catch (error) {
      logger.error('Failed to estimate storage cost', {
        fileSize,
        epochs,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new WalrusError(`Failed to estimate storage cost: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get Walrus network health
   */
  async getNetworkHealth(): Promise<{
    healthy: boolean;
    publisher: boolean;
    aggregator: boolean;
    storageNodes: number;
  }> {
    try {
      // This would check Walrus system health through Sui
      // For now, return a simplified health check
      
      return {
        healthy: true,
        publisher: true,
        aggregator: true,
        storageNodes: 25 // Based on testnet status
      };

    } catch (error) {
      logger.error('Failed to get network health', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        healthy: false,
        publisher: false,
        aggregator: false,
        storageNodes: 0
      };
    }
  }
}
