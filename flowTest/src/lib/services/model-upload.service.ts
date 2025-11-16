// Model Upload Service - Complete integration with smart contracts and TEE verification

import { UploadService, type FileUploadRequest, type FileUploadResult } from './upload-service';
import { MarketplaceContractService, type UploadModelParams } from './marketplace-contract.service';
import { TEEVerificationService, type ModelVerificationRequest } from './tee-verification.service';
import { PolicyType } from '../integrations/seal/types';
import { logger } from '../integrations/core/logger';
// Wallet signer interface - using any for flexibility with different wallet types

export interface ModelUploadData {
  // Basic Info
  title: string;
  description: string;
  category: string;
  tags: string[];
  
  // Files
  modelFile: File;
  datasetFile?: File;
  thumbnailFile?: File;
  
  // Pricing
  price: string; // In SUI units
  maxDownloads?: number;
  
  // Security
  policyType: PolicyType;
  accessDuration?: number;
}

export interface ModelUploadProgress {
  phase: 'validation' | 'encryption' | 'storage' | 'contract' | 'completed' | 'error';
  progress: number;
  message: string;
  details?: Record<string, any>;
  pendingModelId?: string;
  blobIds?: {
    model?: string;
    dataset?: string;
    thumbnail?: string;
  };
}

export interface ModelUploadResult {
  success: boolean;
  pendingModelId?: string;
  transactionDigest?: string;
  blobIds: {
    model?: string;
    dataset?: string;
    thumbnail?: string;
  };
  encryptionPolicyId?: string;
  error?: string;
}

export type ModelUploadProgressCallback = (progress: ModelUploadProgress) => void;

export class ModelUploadService {
  private uploadService: UploadService;
  private contractService: MarketplaceContractService;
  private teeService: TEEVerificationService;
  private activeUploads = new Map<string, AbortController>();

  constructor() {
    this.uploadService = new UploadService();
    this.contractService = new MarketplaceContractService();
    this.teeService = new TEEVerificationService();
  }

  // Create service with fallback support
  static async createWithFallback(): Promise<ModelUploadService> {
    const service = new ModelUploadService();
    service.uploadService = await UploadService.createWithFallback();
    service.contractService = await MarketplaceContractService.createWithFallback();
    return service;
  }

  /**
   * Complete model upload flow: Files → Encryption → Storage → Smart Contract
   */
  async uploadModel(
    data: ModelUploadData,
    signer: any,
    onProgress?: ModelUploadProgressCallback
  ): Promise<ModelUploadResult> {
    const uploadId = crypto.randomUUID();
    const controller = new AbortController();
    this.activeUploads.set(uploadId, controller);

    try {
      logger.info('Starting complete model upload flow', {
        uploadId,
        title: data.title,
        modelFile: data.modelFile.name,
        price: data.price
      });

      // Phase 1: Validation
      onProgress?.({
        phase: 'validation',
        progress: 5,
        message: 'Validating model data...'
      });

      this.validateModelData(data);

      if (controller.signal.aborted) {
        throw new Error('Upload cancelled');
      }

      // Phase 2: Upload and encrypt model file
      onProgress?.({
        phase: 'encryption',
        progress: 15,
        message: 'Encrypting and uploading model...'
      });

      const modelUploadResult = await this.uploadService.uploadFile(
        {
          file: data.modelFile,
          encrypt: true,
          policyType: data.policyType,
          policyParams: {
            price: parseFloat(data.price),
            seller: await signer.toSuiAddress()
          },
          storageOptions: { epochs: 30 }
        },
        (progress) => {
          onProgress?.({
            phase: 'encryption',
            progress: 15 + (progress.progress * 0.3), // 15-45%
            message: `Encrypting model: ${progress.message}`,
            details: progress.details
          });
        }
      );

      if (!modelUploadResult.success) {
        throw new Error(`Model upload failed: ${modelUploadResult.error}`);
      }

      if (!modelUploadResult.blobId) {
        throw new Error('Model upload succeeded but no blob ID was returned');
      }

      // Phase 3: Upload dataset if provided
      let datasetUploadResult: FileUploadResult | undefined;
      if (data.datasetFile) {
        onProgress?.({
          phase: 'storage',
          progress: 45,
          message: 'Uploading dataset...'
        });

        datasetUploadResult = await this.uploadService.uploadFile(
          {
            file: data.datasetFile,
            encrypt: false, // Dataset not encrypted
            storageOptions: { epochs: 30 }
          },
          (progress) => {
            onProgress?.({
              phase: 'storage',
              progress: 45 + (progress.progress * 0.2), // 45-65%
              message: `Uploading dataset: ${progress.message}`,
              details: progress.details
            });
          }
        );

        if (!datasetUploadResult.success) {
          logger.warn('Dataset upload failed, continuing without dataset', {
            error: datasetUploadResult.error
          });
        }
      }

      // Phase 4: Upload thumbnail if provided
      let thumbnailUploadResult: FileUploadResult | undefined;
      if (data.thumbnailFile) {
        onProgress?.({
          phase: 'storage',
          progress: 65,
          message: 'Uploading thumbnail...'
        });

        thumbnailUploadResult = await this.uploadService.uploadFile(
          {
            file: data.thumbnailFile,
            encrypt: false,
            storageOptions: { epochs: 30 }
          }
        );
      }

      if (controller.signal.aborted) {
        throw new Error('Upload cancelled');
      }

      // Phase 5: Create smart contract entry
      onProgress?.({
        phase: 'contract',
        progress: 80,
        message: 'Creating blockchain record...'
      });

      // Validate and prepare contract parameters with extensive debugging
      const priceInSui = parseFloat(data.price);
      const priceInMist = Math.round(priceInSui * 1000000000); // Convert to MIST (smallest SUI unit)
      
      console.log('💰 PRICE CONVERSION DEBUG:');
      console.log('  - Original price string:', data.price);
      console.log('  - Parsed price (SUI):', priceInSui);
      console.log('  - Price in MIST:', priceInMist);
      console.log('  - Price as string:', priceInMist.toString());

      const contractParams: UploadModelParams = {
        title: data.title,
        description: data.description,
        category: data.category,
        tags: data.tags,
        modelBlobId: modelUploadResult.blobId!,
        datasetBlobId: datasetUploadResult?.blobId,
        encryptionPolicyId: modelUploadResult.encryptionId || modelUploadResult.policyId || 'no-encryption-policy',
        sealMetadata: new Uint8Array(0), // SEAL metadata from encryption
        price: priceInMist.toString(),
        maxDownloads: data.maxDownloads
      };

      console.log('📄 CONTRACT PARAMS DEBUG:');
      console.log('  - Title:', contractParams.title);
      console.log('  - Description length:', contractParams.description?.length);
      console.log('  - Category:', contractParams.category);
      console.log('  - Tags count:', contractParams.tags?.length);
      console.log('  - Model blob ID:', contractParams.modelBlobId);
      console.log('  - Dataset blob ID:', contractParams.datasetBlobId);
      console.log('  - Encryption policy ID:', contractParams.encryptionPolicyId);
      console.log('  - SEAL metadata length:', contractParams.sealMetadata?.length);
      console.log('  - Price (MIST):', contractParams.price);
      console.log('  - Max downloads:', contractParams.maxDownloads);

      const contractResult = await this.contractService.uploadModel(
        contractParams,
        signer
      );

      if (!contractResult.success) {
        throw new Error(`Smart contract creation failed: ${contractResult.error}`);
      }

      // Phase 6: Complete
      onProgress?.({
        phase: 'completed',
        progress: 100,
        message: 'Upload completed successfully!',
        pendingModelId: contractResult.objectId,
        blobIds: {
          model: modelUploadResult.blobId,
          dataset: datasetUploadResult?.blobId,
          thumbnail: thumbnailUploadResult?.blobId
        }
      });

      const result: ModelUploadResult = {
        success: true,
        pendingModelId: contractResult.objectId,
        transactionDigest: contractResult.transactionDigest,
        blobIds: {
          model: modelUploadResult.blobId,
          dataset: datasetUploadResult?.blobId,
          thumbnail: thumbnailUploadResult?.blobId
        },
        encryptionPolicyId: modelUploadResult.encryptionId || modelUploadResult.policyId
      };

      logger.info('Model upload completed successfully', {
        uploadId,
        pendingModelId: result.pendingModelId,
        transactionDigest: result.transactionDigest,
        title: data.title
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

      logger.error('Model upload failed', {
        uploadId,
        title: data.title,
        error: errorMessage
      });

      return {
        success: false,
        blobIds: {},
        error: errorMessage
      };

    } finally {
      this.activeUploads.delete(uploadId);
    }
  }

  /**
   * Submit model for TEE verification
   */
  async submitForVerification(
    pendingModelId: string,
    signer: any
  ): Promise<{ success: boolean; transactionDigest?: string; error?: string }> {
    try {
      logger.info('Submitting model for verification', { pendingModelId });

      const result = await this.contractService.submitForVerification(
        pendingModelId,
        signer
      );

      if (result.success) {
        logger.info('Model submitted for verification', {
          pendingModelId,
          transactionDigest: result.transactionDigest
        });
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to submit model for verification', {
        pendingModelId,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Complete TEE verification flow
   */
  async verifyModel(
    pendingModelId: string,
    modelBlobId: string,
    datasetBlobId: string | undefined,
    encryptionPolicyId: string,
    modelName: string,
    category: string,
    signer: any
  ): Promise<{ success: boolean; verificationId?: string; transactionDigest?: string; error?: string }> {
    try {
      logger.info('Starting TEE verification', {
        pendingModelId,
        modelName,
        category
      });

      const verificationRequest: ModelVerificationRequest = {
        pendingModelId,
        modelBlobId,
        datasetBlobId,
        encryptionPolicyId,
        sealMetadata: new Uint8Array(0),
        modelName,
        category
      };

      const verificationResult = await this.teeService.verifyModel(
        verificationRequest,
        signer
      );

      if (verificationResult.success && verificationResult.verificationId) {
        logger.info('TEE verification completed', {
          pendingModelId,
          verificationId: verificationResult.verificationId,
          qualityScore: verificationResult.qualityScore
        });

        return {
          success: true,
          verificationId: verificationResult.verificationId,
          transactionDigest: verificationResult.verificationId // The smart contract transaction
        };
      } else {
        const errorMessage = verificationResult.errors?.join(', ') || 'TEE verification failed';
        return {
          success: false,
          error: errorMessage
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('TEE verification failed', {
        pendingModelId,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * List verified model on marketplace
   */
  async listOnMarketplace(
    pendingModelId: string,
    verificationId: string,
    signer: any
  ): Promise<{ success: boolean; marketplaceId?: string; transactionDigest?: string; error?: string }> {
    try {
      logger.info('Listing model on marketplace', {
        pendingModelId,
        verificationId
      });

      const result = await this.contractService.listOnMarketplace(
        pendingModelId,
        verificationId,
        signer
      );

      if (result.success) {
        logger.info('Model listed on marketplace', {
          pendingModelId,
          marketplaceId: result.objectId,
          transactionDigest: result.transactionDigest
        });
      }

      return {
        success: result.success,
        marketplaceId: result.objectId,
        transactionDigest: result.transactionDigest,
        error: result.error
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list model on marketplace', {
        pendingModelId,
        verificationId,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get user's pending models
   */
  async getUserPendingModels(userAddress: string): Promise<any[]> {
    try {
      return await this.contractService.getUserPendingModels(userAddress);
    } catch (error) {
      logger.error('Failed to fetch user pending models', {
        userAddress,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Cancel upload
   */
  cancelUpload(uploadId: string): boolean {
    const controller = this.activeUploads.get(uploadId);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(uploadId);
      logger.info('Upload cancelled', { uploadId });
      return true;
    }
    return false;
  }

  /**
   * Validate model data
   */
  private validateModelData(data: ModelUploadData): void {
    if (!data.title?.trim()) {
      throw new Error('Model title is required');
    }

    if (!data.description?.trim()) {
      throw new Error('Model description is required');
    }

    if (!data.category?.trim()) {
      throw new Error('Model category is required');
    }

    if (!data.modelFile) {
      throw new Error('Model file is required');
    }

    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) {
      throw new Error('Valid price is required');
    }

    // Validate file size
    const maxFileSize = 500 * 1024 * 1024; // 500MB
    if (data.modelFile.size > maxFileSize) {
      throw new Error(`Model file too large. Maximum size: ${maxFileSize / (1024 * 1024)}MB`);
    }

    if (data.datasetFile && data.datasetFile.size > maxFileSize) {
      throw new Error(`Dataset file too large. Maximum size: ${maxFileSize / (1024 * 1024)}MB`);
    }

    // Validate tags
    if (data.tags.length > 10) {
      throw new Error('Maximum 10 tags allowed');
    }

    // Validate max downloads
    if (data.maxDownloads !== undefined && (data.maxDownloads < 1 || data.maxDownloads > 10000)) {
      throw new Error('Max downloads must be between 1 and 10,000');
    }
  }

  /**
   * Get upload statistics
   */
  getUploadStats(): {
    activeUploads: number;
    totalUploads: number;
  } {
    return {
      activeUploads: this.activeUploads.size,
      totalUploads: 0 // Could track this if needed
    };
  }
}