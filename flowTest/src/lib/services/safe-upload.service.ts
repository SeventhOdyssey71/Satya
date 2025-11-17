// Safe Upload Service - Bulletproof wrapper around the upload functionality
// This ensures NO errors ever reach the console

import { safePromise, safeExecute } from '../utils/error-interceptor';
import type { Signer } from '@mysten/sui/cryptography';

export interface SafeUploadData {
 title: string;
 description: string;
 category: string;
 tags: string[];
 modelFile: File;
 datasetFile?: File;
 price: string;
 maxDownloads?: number;
 policyType: 'STANDARD';
 accessDuration: number;
}

export interface SafeUploadProgress {
 phase: string;
 progress: number;
 message: string;
 details?: any;
}

export interface SafeUploadResult {
 success: boolean;
 data?: {
  pendingModelId?: string;
  transactionDigest?: string;
  blobIds?: {
   model?: string;
   dataset?: string;
  };
  encryptionPolicyId?: string;
 };
 error?: string;
 phase?: string;
}

export class SafeUploadService {
 private static instance: SafeUploadService;

 private constructor() {}

 static getInstance(): SafeUploadService {
  if (!SafeUploadService.instance) {
   SafeUploadService.instance = new SafeUploadService();
  }
  return SafeUploadService.instance;
 }

 async uploadModel(
  data: SafeUploadData,
  signer: Signer,
  onProgress?: (progress: SafeUploadProgress) => void
 ): Promise<SafeUploadResult> {
  // Safe progress callback wrapper
  const safeProgress = (progress: SafeUploadProgress) => {
   if (onProgress) {
    safeExecute(() => onProgress(progress));
   }
  };

  try {
   safeProgress({
    phase: 'initialization',
    progress: 0,
    message: 'Starting safe upload process...'
   });

   // Step 1: Validate input data safely
   const validationResult = await safePromise(this.validateUploadData(data));
   if (!validationResult.success) {
    return {
     success: false,
     error: `Validation failed: ${validationResult.error}`,
     phase: 'validation'
    };
   }

   safeProgress({
    phase: 'validation',
    progress: 10,
    message: 'Input validation completed'
   });

   // Step 2: Create upload service safely
   const serviceResult = await safePromise(this.createUploadService());
   if (!serviceResult.success) {
    return {
     success: false,
     error: `Service creation failed: ${serviceResult.error}`,
     phase: 'service-creation'
    };
   }

   safeProgress({
    phase: 'service-creation',
    progress: 20,
    message: 'Upload service initialized'
   });

   // Step 3: Execute upload with comprehensive error handling
   const uploadResult = await safePromise(
    this.executeUpload(
     serviceResult.data!,
     data,
     signer,
     safeProgress
    )
   );

   if (!uploadResult.success) {
    return {
     success: false,
     error: `Upload execution failed: ${uploadResult.error}`,
     phase: 'upload-execution'
    };
   }

   safeProgress({
    phase: 'completed',
    progress: 100,
    message: 'Upload completed successfully!'
   });

   return {
    success: true,
    data: uploadResult.data
   };

  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : String(error);
   
   safeProgress({
    phase: 'error',
    progress: 0,
    message: `Upload failed: ${errorMessage}`
   });

   return {
    success: false,
    error: `Unexpected error: ${errorMessage}`,
    phase: 'unexpected-error'
   };
  }
 }

 private async validateUploadData(data: SafeUploadData): Promise<void> {
  // Safe validation with detailed checks
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
   throw new Error('Title is required and must be a non-empty string');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
   throw new Error('Description is required and must be a non-empty string');
  }

  if (!data.category || typeof data.category !== 'string') {
   throw new Error('Category is required and must be a string');
  }

  if (!Array.isArray(data.tags)) {
   throw new Error('Tags must be an array');
  }

  if (!data.modelFile || !(data.modelFile instanceof File)) {
   throw new Error('Model file is required and must be a File object');
  }

  if (data.modelFile.size === 0) {
   throw new Error('Model file cannot be empty');
  }

  if (data.modelFile.size > 500 * 1024 * 1024) { // 500MB limit
   throw new Error('Model file is too large (max 500MB)');
  }

  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0) {
   throw new Error('Price must be a positive number');
  }

  if (data.maxDownloads !== undefined) {
   if (typeof data.maxDownloads !== 'number' || data.maxDownloads < 1) {
    throw new Error('Max downloads must be a positive integer');
   }
  }

  // Validate file name safely
  if (data.modelFile.name && typeof data.modelFile.name === 'string') {
   const safeName = data.modelFile.name.toLowerCase();
   const allowedExtensions = ['.json', '.pkl', '.onnx', '.h5', '.pt', '.pth', '.bin'];
   const hasValidExtension = allowedExtensions.some(ext => safeName.endsWith(ext));
   
   if (!hasValidExtension) {
    throw new Error(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`);
   }
  }
 }

 private async createUploadService() {
  // Dynamically import with error handling
  const { ModelUploadService } = await import('./model-upload.service');
  const service = await ModelUploadService.createWithFallback();
  return service;
 }

 private async executeUpload(
  uploadService: any,
  data: SafeUploadData,
  signer: Signer,
  onProgress: (progress: SafeUploadProgress) => void
 ) {
  // Create safe upload data object
  const uploadData = {
   title: String(data.title).trim(),
   description: String(data.description).trim(),
   category: String(data.category).trim(),
   tags: data.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0),
   modelFile: data.modelFile,
   datasetFile: data.datasetFile,
   price: String(data.price),
   maxDownloads: data.maxDownloads,
   policyType: data.policyType,
   accessDuration: data.accessDuration
  };

  // Execute upload with progress tracking
  const result = await uploadService.uploadModel(
   uploadData,
   signer,
   (progress: any) => {
    // Safe progress handling
    try {
     onProgress({
      phase: progress.phase || 'processing',
      progress: Math.min(Math.max(progress.progress || 0, 0), 100),
      message: String(progress.message || 'Processing...'),
      details: progress.details
     });
    } catch (progressError) {
     // If progress callback fails, continue upload
     console.log('Progress callback failed, continuing upload...');
    }
   }
  );

  // Safely extract result data
  if (result && result.success) {
   return {
    pendingModelId: result.pendingModelId,
    transactionDigest: result.transactionDigest,
    blobIds: result.blobIds,
    encryptionPolicyId: result.encryptionPolicyId
   };
  } else {
   throw new Error(result?.error || 'Upload failed with unknown error');
  }
 }

 // Utility method to create a test signer safely
 async createTestSigner(): Promise<{ success: boolean; signer?: any; error?: string }> {
  try {
   const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');
   const keypair = new Ed25519Keypair();
   return { success: true, signer: keypair };
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : String(error);
   return { success: false, error: errorMessage };
  }
 }

 // Utility method to check wallet connection safely
 checkWalletConnection(currentAccount: any): { connected: boolean; address?: string; error?: string } {
  try {
   if (!currentAccount) {
    return { connected: false, error: 'No wallet account available' };
   }

   if (!currentAccount.address) {
    return { connected: false, error: 'Wallet account has no address' };
   }

   return {
    connected: true,
    address: String(currentAccount.address)
   };
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : String(error);
   return { connected: false, error: errorMessage };
  }
 }
}

// Export singleton instance
export const safeUploadService = SafeUploadService.getInstance();