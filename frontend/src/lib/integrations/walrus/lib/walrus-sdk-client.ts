// Walrus SDK Client - SUI wallet integrated storage client

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { walrus, WalrusFile } from '@mysten/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { WALRUS_CONFIG } from '../config/walrus.config';
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
    
    // Configure Walrus with network
    this.client = suiClient.$extend(walrus({
      network: network as 'testnet' | 'mainnet'
    }));
    
    logger.info('Walrus SDK client initialized', {
      network,
      rpcUrl: getFullnodeUrl(network)
    });
  }

  /**
   * Upload a file using Walrus SDK with proper WAL token spending
   */
  async uploadFile(
    file: File,
    signer: Ed25519Keypair | DappKitSigner,
    options: WalrusUploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const epochs = options.epochs || WALRUS_CONFIG.agent.defaultEpochs;
      const deletable = options.deletable ?? true;

      const signerAddress = signer.toSuiAddress ? signer.toSuiAddress() : 'unknown';
      
      logger.info('Starting Walrus SDK upload', {
        fileName: file.name,
        fileSize: file.size,
        epochs,
        deletable,
        signerAddress
      });

      // Convert File to Uint8Array
      const fileData = new Uint8Array(await file.arrayBuffer());
      
      // Create WalrusFile object
      const walrusFile = WalrusFile.from({
        contents: fileData,
        identifier: file.name,
        tags: {
          'content-type': file.type || 'application/octet-stream',
          'upload-timestamp': Date.now().toString(),
          'file-size': file.size.toString()
        }
      });

      // Try the Walrus SDK upload (works with Ed25519Keypair)
      logger.debug('Attempting Walrus SDK upload');
      
      try {
        const results = await this.client.walrus.writeFiles({
          files: [walrusFile],
          epochs,
          deletable,
          signer: signer as Ed25519Keypair
        });

        if (!results || results.length === 0) {
          throw new WalrusError('Upload failed: No results returned from Walrus SDK');
        }

        const result = results[0];
        
        if (!result.blobId) {
          throw new WalrusError('Upload failed: No blob ID returned');
        }

        logger.info('Walrus SDK upload successful', {
          fileName: file.name,
          blobId: result.blobId,
          objectId: result.id,
          epochs
        });

        return {
          success: true,
          blobId: result.blobId,
          objectId: result.id,
          certificate: result.blobObject ? 'certified' : 'pending'
        };

      } catch (sdkError) {
        const sdkErrorMessage = sdkError instanceof Error ? sdkError.message : String(sdkError);
        logger.warn('Walrus SDK upload failed, this may be due to network issues', {
          error: sdkErrorMessage
        });
        
        // Instead of failing completely, throw the network error so the storage service can handle it
        if (sdkErrorMessage.includes('Too many failures while writing blob') || sdkErrorMessage.includes('nodes')) {
          throw new WalrusError('Walrus network unavailable. Storage nodes are experiencing issues. Please try again later.');
        }
        
        throw new WalrusError(`Walrus upload failed: ${sdkErrorMessage}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Walrus SDK upload failed', {
        fileName: file.name,
        fileSize: file.size,
        signerAddress: signer.toSuiAddress(),
        error: errorMessage
      });

      // Check for specific error types
      if (errorMessage.includes('could not find WAL coins')) {
        throw new WalrusError('Insufficient WAL tokens. Please ensure your wallet has WAL tokens for storage payments.');
      }
      
      if (errorMessage.includes('Insufficient funds') || errorMessage.includes('insufficient')) {
        throw new WalrusError('Insufficient SUI tokens for transaction fees. Please top up your wallet.');
      }

      if (errorMessage.includes('Too many failures while writing blob') || errorMessage.includes('nodes')) {
        throw new WalrusError('Walrus network unavailable. Storage nodes are experiencing issues. Please try again later.');
      }

      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        throw new WalrusError('Network connection error. Please check your internet connection and try again.');
      }

      throw new WalrusError(`Upload failed: ${errorMessage}`);
    }
  }

  /**
   * Upload multiple files in a single transaction
   */
  async uploadFiles(
    files: File[],
    signer: Ed25519Keypair,
    options: WalrusUploadOptions = {}
  ): Promise<UploadResult[]> {
    try {
      const epochs = options.epochs || WALRUS_CONFIG.agent.defaultEpochs;
      const deletable = options.deletable ?? true;

      logger.info('Starting batch Walrus SDK upload', {
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        epochs,
        signerAddress: signer.toSuiAddress()
      });

      // Convert files to WalrusFile objects
      const walrusFiles = await Promise.all(files.map(async (file, index) => {
        const fileData = new Uint8Array(await file.arrayBuffer());
        
        return WalrusFile.from({
          contents: fileData,
          identifier: `${index}_${file.name}`,
          tags: {
            'content-type': file.type || 'application/octet-stream',
            'upload-timestamp': Date.now().toString(),
            'file-size': file.size.toString(),
            'batch-index': index.toString()
          }
        });
      }));

      // Upload using Walrus SDK
      const results = await this.client.walrus.writeFiles({
        files: walrusFiles,
        epochs,
        deletable,
        signer: signer
      });

      if (!results || results.length !== files.length) {
        throw new WalrusError(`Batch upload failed: Expected ${files.length} results, got ${results?.length || 0}`);
      }

      const uploadResults: UploadResult[] = results.map((result, index) => ({
        success: true,
        blobId: result.blobId,
        objectId: result.id,
        certificate: result.blobObject ? 'certified' : 'pending',
        fileName: files[index].name
      }));

      logger.info('Batch Walrus SDK upload successful', {
        fileCount: files.length,
        blobIds: uploadResults.map(r => r.blobId)
      });

      return uploadResults;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Batch Walrus SDK upload failed', {
        fileCount: files.length,
        signerAddress: signer.toSuiAddress(),
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
        walCoins.data.reduce((sum: bigint, coin: any) => sum + BigInt(coin.balance), 0n).toString() : 
        '0';
      
      const suiBalance = hasSUI ? 
        suiCoins.data.reduce((sum: bigint, coin: any) => sum + BigInt(coin.balance), 0n).toString() : 
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