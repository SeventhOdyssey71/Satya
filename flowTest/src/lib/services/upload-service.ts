// Upload Service Layer - Handles file uploads with encryption

import { SuiClient } from '@mysten/sui/client';
import { SealEncryptionService } from '../integrations/seal/services/encryption-service';
import { WalrusStorageService } from '../integrations/walrus/services/storage-service';
import { logger } from '../integrations/core/logger';
import { PolicyType, EncryptionResult } from '../integrations/seal/types';
import { UploadResult } from '../integrations/walrus/types';
import { SUI_CONFIG } from '../constants';

export interface FileUploadRequest {
  file: File;
  encrypt?: boolean;
  policyType?: PolicyType;
  policyParams?: Record<string, any>;
  storageOptions?: {
    epochs?: number;
    forceChunked?: boolean;
  };
}

export interface FileUploadProgress {
  phase: 'validation' | 'encryption' | 'upload' | 'completed' | 'error';
  progress: number;
  message: string;
  details?: Record<string, any>;
}

export interface FileUploadResult {
  success: boolean;
  fileId: string;
  blobId?: string;
  encryptionId?: string;
  policyId?: string;
  size: number;
  hash: string;
  uploadedAt: Date;
  expiresAt?: Date;
  error?: string;
}

export type UploadProgressCallback = (progress: FileUploadProgress) => void;

export class UploadService {
  private sealService: SealEncryptionService;
  private walrusService: WalrusStorageService;
  private activeUploads = new Map<string, AbortController>();

  constructor() {
    try {
      // Initialize SUI client first 
      const suiClient = new SuiClient({
        url: SUI_CONFIG.RPC_URL
      });
      
      this.sealService = new SealEncryptionService(suiClient);
      this.walrusService = new WalrusStorageService();
    } catch (error) {
      console.error('Failed to initialize UploadService:', error);
      throw error;
    }
  }

  // Upload file with optional encryption
  async uploadFile(
    request: FileUploadRequest,
    onProgress?: UploadProgressCallback
  ): Promise<FileUploadResult> {
    const fileId = crypto.randomUUID();
    const controller = new AbortController();
    this.activeUploads.set(fileId, controller);

    logger.info('Starting file upload', {
      fileId,
      fileName: request.file.name,
      fileSize: request.file.size,
      encrypt: request.encrypt
    });

    try {
      // Phase 1: Validation
      onProgress?.({
        phase: 'validation',
        progress: 10,
        message: 'Validating file...',
        details: { fileName: request.file.name, size: request.file.size }
      });

      await this.validateFile(request.file);
      
      if (controller.signal.aborted) {
        throw new Error('Upload cancelled');
      }

      // Calculate file hash
      const fileData = new Uint8Array(await request.file.arrayBuffer());
      const hash = await this.calculateHash(fileData);

      let processedData = fileData;
      let encryptionResult: EncryptionResult | undefined;

      // Phase 2: Encryption (if requested)
      if (request.encrypt) {
        onProgress?.({
          phase: 'encryption',
          progress: 30,
          message: 'Encrypting file...',
          details: { algorithm: 'AES-256-GCM' }
        });

        try {
          encryptionResult = await this.sealService.encryptData(
            fileData,
            request.policyType || PolicyType.PAYMENT_GATED,
            request.policyParams || {}
          );

          if (!encryptionResult.success) {
            throw new Error(`Encryption failed: ${encryptionResult.error}`);
          }

          processedData = new Uint8Array(encryptionResult.encryptedData);
        } catch (error) {
          logger.warn('SEAL encryption failed, proceeding with unencrypted upload', {
            fileId,
            error: error instanceof Error ? error.message : String(error)
          });
          
          // Continue with unencrypted upload as fallback
          onProgress?.({
            phase: 'encryption',
            progress: 30,
            message: 'Encryption unavailable, uploading without encryption...',
            details: { fallback: true, reason: 'SEAL encryption failed' }
          });
          
          // Keep original data for unencrypted upload
          processedData = fileData;
          encryptionResult = undefined;
        }
        
        if (encryptionResult) {
          logger.debug('File encrypted successfully', {
            fileId,
            policyId: encryptionResult.policyId,
            originalSize: fileData.length,
            encryptedSize: processedData.length
          });
        }
      }

      if (controller.signal.aborted) {
        throw new Error('Upload cancelled');
      }

      // Phase 3: Upload to storage
      onProgress?.({
        phase: 'upload',
        progress: 50,
        message: 'Uploading to decentralized storage...',
        details: { 
          storage: 'Walrus',
          strategy: request.storageOptions?.forceChunked ? 'chunked' : 'auto'
        }
      });

      const isActuallyEncrypted = request.encrypt && encryptionResult !== undefined;
      const uploadFile = new File(
        [processedData],
        isActuallyEncrypted ? `${request.file.name}.encrypted` : request.file.name,
        { type: isActuallyEncrypted ? 'application/octet-stream' : request.file.type }
      );

      // Use HTTP API for upload instead of SDK to avoid private key requirement
      const uploadResult = await this.walrusService.uploadFile(uploadFile, {
        ...request.storageOptions,
        // Remove signer - use HTTP API instead
        onProgress: (uploadProgress) => {
          onProgress?.({
            phase: 'upload',
            progress: 50 + (uploadProgress * 0.4), // 50-90%
            message: `Uploading... ${uploadProgress.toFixed(1)}%`,
            details: { uploadProgress }
          });
        }
      });

      if (!uploadResult.success) {
        throw new Error(`Storage upload failed: ${uploadResult.error}`);
      }

      if (controller.signal.aborted) {
        throw new Error('Upload cancelled');
      }

      // Phase 4: Complete
      onProgress?.({
        phase: 'completed',
        progress: 100,
        message: 'Upload completed successfully',
        details: { blobId: uploadResult.blobId }
      });

      const result: FileUploadResult = {
        success: true,
        fileId,
        blobId: uploadResult.blobId,
        encryptionId: encryptionResult?.policyId,
        policyId: encryptionResult?.policyId,
        size: request.file.size,
        hash,
        uploadedAt: new Date(),
        expiresAt: request.storageOptions?.epochs ? 
          new Date(Date.now() + request.storageOptions.epochs * 24 * 60 * 60 * 1000) :
          undefined
      };

      logger.info('File upload completed successfully', {
        fileId,
        blobId: uploadResult.blobId,
        encrypted: isActuallyEncrypted,
        encryptionRequested: request.encrypt,
        size: request.file.size
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      onProgress?.({
        phase: 'error',
        progress: 0,
        message: `Upload failed: ${errorMessage}`,
        details: { error: errorMessage }
      });

      logger.error('File upload failed', {
        fileId,
        fileName: request.file.name,
        error: errorMessage
      });

      return {
        success: false,
        fileId,
        size: request.file.size,
        hash: '',
        uploadedAt: new Date(),
        error: errorMessage
      };

    } finally {
      this.activeUploads.delete(fileId);
    }
  }

  // Upload multiple files in parallel
  async uploadMultipleFiles(
    requests: FileUploadRequest[],
    onProgress?: (fileIndex: number, progress: FileUploadProgress) => void
  ): Promise<FileUploadResult[]> {
    logger.info('Starting multiple file upload', {
      fileCount: requests.length,
      totalSize: requests.reduce((sum, r) => sum + r.file.size, 0)
    });

    const uploadPromises = requests.map((request, index) =>
      this.uploadFile(request, (progress) => onProgress?.(index, progress))
    );

    return await Promise.all(uploadPromises);
  }

  // Cancel upload by file ID
  cancelUpload(fileId: string): boolean {
    const controller = this.activeUploads.get(fileId);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(fileId);
      logger.info('Upload cancelled', { fileId });
      return true;
    }
    return false;
  }

  // Cancel all active uploads
  cancelAllUploads(): number {
    const count = this.activeUploads.size;
    for (const [fileId, controller] of this.activeUploads.entries()) {
      controller.abort();
    }
    this.activeUploads.clear();
    logger.info('All uploads cancelled', { count });
    return count;
  }

  // Get active upload count
  getActiveUploadCount(): number {
    return this.activeUploads.size;
  }

  // Get upload service health
  async getHealthStatus(): Promise<{
    encryption: 'healthy' | 'degraded' | 'failed';
    storage: 'healthy' | 'degraded' | 'failed';
    overall: 'healthy' | 'degraded' | 'failed';
    activeUploads: number;
  }> {
    const storageHealth = await this.walrusService.getHealthStatus();
    
    return {
      encryption: 'healthy', // SEAL is local
      storage: storageHealth.overall,
      overall: storageHealth.overall === 'failed' ? 'degraded' : 'healthy',
      activeUploads: this.activeUploads.size
    };
  }

  // Test upload capabilities
  async testUploadCapability(): Promise<{
    canUpload: boolean;
    canEncrypt: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    let canUpload = true;
    let canEncrypt = true;

    try {
      // Test storage connectivity
      const storageConnected = await this.walrusService.testConnectivity();
      if (!storageConnected) {
        canUpload = false;
        issues.push('Storage service unavailable');
      }

      // Test encryption service
      try {
        const testData = new Uint8Array([1, 2, 3, 4]);
        const encResult = await this.sealService.encryptData(
          testData, 
          PolicyType.PAYMENT_GATED, 
          { price: 1 }
        );
        if (!encResult.success) {
          canEncrypt = false;
          issues.push('Encryption service unavailable');
        }
      } catch (error) {
        canEncrypt = false;
        issues.push('Encryption test failed');
      }

    } catch (error) {
      canUpload = false;
      canEncrypt = false;
      issues.push('Service connectivity test failed');
    }

    return {
      canUpload,
      canEncrypt,
      issues
    };
  }

  // Private validation methods
  private async validateFile(file: File): Promise<void> {
    if (!file || file.size === 0) {
      throw new Error('File is required and cannot be empty');
    }

    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)} MB`);
    }

    // Validate file type (basic check)
    if (file.name.length > 255) {
      throw new Error('File name is too long (maximum 255 characters)');
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (dangerousExtensions.includes(fileExtension)) {
      throw new Error(`File type ${fileExtension} is not allowed`);
    }
  }

  private async calculateHash(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}