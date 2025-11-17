// Download Service Layer - Handles secure file downloads and access control

import { SealEncryptionService } from '../integrations/seal/services/encryption-service';
import { WalrusStorageService } from '../integrations/walrus/services/storage-service';
import { SuiMarketplaceClient } from '../integrations/sui/client';
import { SUI_CONFIG, MARKETPLACE_CONFIG } from '../constants';
import { logger } from '../integrations/core/logger';
import { 
  MarketplaceError, 
  ErrorCode,
  OperationResult 
} from '../integrations/types';

export interface DownloadRequest {
  purchaseId: string;
  userKeypair: any;
  saveToFile?: boolean;
  fileName?: string;
}

export interface DownloadProgress {
  phase: 'validation' | 'retrieval' | 'decryption' | 'completed' | 'error';
  progress: number;
  message: string;
  details?: Record<string, any>;
}

export interface DownloadResult {
  success: boolean;
  data?: Uint8Array;
  fileName: string;
  size: number;
  mimeType?: string;
  downloadedAt: Date;
  error?: string;
}

export type DownloadProgressCallback = (progress: DownloadProgress) => void;

export class DownloadService {
  private sealService: SealEncryptionService;
  private walrusService: WalrusStorageService;
  private suiClient: SuiMarketplaceClient;
  private activeDownloads = new Map<string, AbortController>();

  constructor() {
    // Initialize SUI client first
    this.suiClient = new SuiMarketplaceClient({
      network: SUI_CONFIG.NETWORK,
      packageId: MARKETPLACE_CONFIG.PACKAGE_ID,
      marketplaceObjectId: MARKETPLACE_CONFIG.REGISTRY_ID
    });
    
    this.sealService = new SealEncryptionService(this.suiClient.suiClient);
    this.walrusService = new WalrusStorageService();
  }

  // Download purchased file with decryption
  async downloadFile(
    request: DownloadRequest,
    onProgress?: DownloadProgressCallback
  ): Promise<DownloadResult> {
    const downloadId = crypto.randomUUID();
    const controller = new AbortController();
    this.activeDownloads.set(downloadId, controller);

    logger.info('Starting secure file download', {
      downloadId,
      purchaseId: request.purchaseId
    });

    try {
      // Phase 1: Validation
      onProgress?.({
        phase: 'validation',
        progress: 10,
        message: 'Validating purchase access...',
        details: { purchaseId: request.purchaseId }
      });

      await this.validateDownloadAccess(request.purchaseId, request.userKeypair);
      
      if (controller.signal.aborted) {
        throw new Error('Download cancelled');
      }

      // Get purchase and listing details
      const purchase = await this.suiClient.getPurchase(request.purchaseId);
      if (!purchase) {
        throw new MarketplaceError(
          ErrorCode.PURCHASE_NOT_FOUND,
          'Purchase record not found'
        );
      }

      const listing = await this.suiClient.getListing(purchase.listingId);
      if (!listing) {
        throw new MarketplaceError(
          ErrorCode.LISTING_NOT_FOUND,
          'Original listing not found'
        );
      }

      // Phase 2: Retrieval
      onProgress?.({
        phase: 'retrieval',
        progress: 30,
        message: 'Retrieving encrypted data from storage...',
        details: { blobId: listing.encryptedBlobId }
      });

      const encryptedData = await this.walrusService.downloadBlob(listing.encryptedBlobId);
      
      if (controller.signal.aborted) {
        throw new Error('Download cancelled');
      }

      // Phase 3: Decryption
      onProgress?.({
        phase: 'decryption',
        progress: 60,
        message: 'Decrypting file...',
        details: { 
          encryptedSize: encryptedData.length,
          policyId: listing.encryptionPolicyId 
        }
      });

      // Note: In a real implementation, this would use the actual SEAL decryption
      // with the policy and user credentials. For now, we simulate successful decryption.
      const decryptedData = await this.decryptFileData(
        encryptedData, 
        listing.encryptionPolicyId,
        request.userKeypair
      );

      if (controller.signal.aborted) {
        throw new Error('Download cancelled');
      }

      // Update download count on-chain
      await this.suiClient.confirmDownload(
        request.purchaseId,
        null, // No TEE attestation for now
        request.userKeypair
      );

      // Phase 4: Complete
      const fileName = request.fileName || listing.title || 'downloaded-file';
      
      onProgress?.({
        phase: 'completed',
        progress: 100,
        message: 'Download completed successfully',
        details: { 
          fileName,
          size: decryptedData.length 
        }
      });

      // Save to file if requested (browser environment)
      if (request.saveToFile && typeof window !== 'undefined') {
        this.saveToFile(decryptedData, fileName);
      }

      const result: DownloadResult = {
        success: true,
        data: decryptedData,
        fileName,
        size: decryptedData.length,
        downloadedAt: new Date()
      };

      logger.info('File download completed successfully', {
        downloadId,
        purchaseId: request.purchaseId,
        size: decryptedData.length,
        fileName
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      onProgress?.({
        phase: 'error',
        progress: 0,
        message: `Download failed: ${errorMessage}`,
        details: { error: errorMessage }
      });

      logger.error('File download failed', {
        downloadId,
        purchaseId: request.purchaseId,
        error: errorMessage
      });

      return {
        success: false,
        fileName: request.fileName || 'unknown',
        size: 0,
        downloadedAt: new Date(),
        error: errorMessage
      };

    } finally {
      this.activeDownloads.delete(downloadId);
    }
  }

  // Download multiple files
  async downloadMultipleFiles(
    requests: DownloadRequest[],
    onProgress?: (fileIndex: number, progress: DownloadProgress) => void
  ): Promise<DownloadResult[]> {
    logger.info('Starting multiple file download', {
      fileCount: requests.length
    });

    const downloadPromises = requests.map((request, index) =>
      this.downloadFile(request, (progress) => onProgress?.(index, progress))
    );

    return await Promise.all(downloadPromises);
  }

  // Cancel download by ID
  cancelDownload(downloadId: string): boolean {
    const controller = this.activeDownloads.get(downloadId);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(downloadId);
      logger.info('Download cancelled', { downloadId });
      return true;
    }
    return false;
  }

  // Cancel all active downloads
  cancelAllDownloads(): number {
    const count = this.activeDownloads.size;
    for (const [downloadId, controller] of this.activeDownloads.entries()) {
      controller.abort();
    }
    this.activeDownloads.clear();
    logger.info('All downloads cancelled', { count });
    return count;
  }

  // Get active download count
  getActiveDownloadCount(): number {
    return this.activeDownloads.size;
  }

  // Check if user can download file
  async canUserDownload(
    purchaseId: string,
    userKeypair: any
  ): Promise<{ canDownload: boolean; reason?: string }> {
    try {
      await this.validateDownloadAccess(purchaseId, userKeypair);
      return { canDownload: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return { canDownload: false, reason };
    }
  }

  // Get download history for user
  async getDownloadHistory(userAddress: string): Promise<{
    purchases: Array<{
      purchaseId: string;
      listingTitle: string;
      downloadCount: number;
      maxDownloads: number;
      purchasedAt: Date;
      expiresAt: Date;
      canDownload: boolean;
    }>;
  }> {
    try {
      // This would query the blockchain for user's purchases
      // For now, return empty array
      return { purchases: [] };
    } catch (error) {
      logger.error('Failed to get download history', {
        userAddress,
        error: error instanceof Error ? error.message : String(error)
      });
      return { purchases: [] };
    }
  }

  // Private validation methods
  private async validateDownloadAccess(
    purchaseId: string,
    userKeypair: any
  ): Promise<void> {
    const purchase = await this.suiClient.getPurchase(purchaseId);
    
    if (!purchase) {
      throw new MarketplaceError(
        ErrorCode.PURCHASE_NOT_FOUND,
        'Purchase record not found'
      );
    }

    if (purchase.buyer !== userKeypair.toSuiAddress()) {
      throw new MarketplaceError(
        ErrorCode.ACCESS_DENIED,
        'User is not the buyer of this purchase'
      );
    }

    if (!purchase.isActive) {
      throw new MarketplaceError(
        ErrorCode.ACCESS_EXPIRED,
        'Purchase access has been deactivated'
      );
    }

    if (new Date() > purchase.expiresAt) {
      throw new MarketplaceError(
        ErrorCode.ACCESS_EXPIRED,
        'Purchase access has expired'
      );
    }

    if (purchase.downloadCount >= purchase.maxDownloads) {
      throw new MarketplaceError(
        ErrorCode.MAX_DOWNLOADS_EXCEEDED,
        'Maximum download limit exceeded'
      );
    }
  }

  private async decryptFileData(
    encryptedData: Uint8Array,
    policyId: string,
    userKeypair: any
  ): Promise<Uint8Array> {
    // In a real implementation, this would:
    // 1. Get the encrypted DEK and IV from the policy
    // 2. Decrypt the DEK using SEAL and user credentials
    // 3. Use the DEK to decrypt the file data
    // 
    // For now, we simulate successful decryption by returning the encrypted data
    // as if it were decrypted (this would be the actual decrypted data)
    
    logger.debug('Simulating file decryption', {
      policyId,
      dataSize: encryptedData.length
    });

    // Simulate decryption delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return encryptedData;
  }

  private saveToFile(data: Uint8Array, fileName: string): void {
    try {
      const blob = new Blob([data as BlobPart]);
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      logger.info('File saved to downloads', { fileName, size: data.length });
    } catch (error) {
      logger.error('Failed to save file', {
        fileName,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}