// Marketplace Contract Service - Smart contract integration for complete flow

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import type { Signer } from '@mysten/sui/cryptography';
import { createSuiClientWithFallback } from '../integrations/sui/rpc-fallback';
import { logger } from '../integrations/core/logger';

// Contract configuration
export const MARKETPLACE_CONFIG = {
  PACKAGE_ID: process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID || '0x0000000000000000000000000000000000000000000000000000000000000000',
  REGISTRY_OBJECT_ID: process.env.NEXT_PUBLIC_MARKETPLACE_REGISTRY_ID || '',
  PLATFORM_ADDRESS: process.env.NEXT_PUBLIC_PLATFORM_ADDRESS || '0x0000000000000000000000000000000000000000000000000000000000000000',
};

export interface UploadModelParams {
  title: string;
  description: string;
  category: string;
  tags: string[];
  modelBlobId: string;
  datasetBlobId?: string;
  encryptionPolicyId: string;
  sealMetadata: Uint8Array;
  price: string; // In SUI units (1 SUI = 1000000000)
  maxDownloads?: number;
}

export interface VerificationParams {
  modelId: string;
  enclaveId: string;
  qualityScore: number; // 0-10000 basis points
  securityAssessment: string;
  attestationHash: Uint8Array;
  verifierSignature: Uint8Array;
}

export interface PurchaseParams {
  marketplaceModelId: string;
  paymentAmount: string; // In SUI units
}

export interface ContractResult {
  success: boolean;
  transactionDigest?: string;
  objectId?: string;
  error?: string;
}

export class MarketplaceContractService {
  private suiClient: SuiClient;
  
  constructor(suiClient?: SuiClient) {
    this.suiClient = suiClient || new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
  }

  // Create service with fallback RPC support
  static async createWithFallback(): Promise<MarketplaceContractService> {
    const suiClient = await createSuiClientWithFallback();
    return new MarketplaceContractService(suiClient);
  }

  /**
   * Phase 1: Upload model to pending state
   */
  async uploadModel(
    params: UploadModelParams,
    signer: Signer
  ): Promise<ContractResult> {
    try {
      // Validate parameters
      if (!params.title || typeof params.title !== 'string') {
        throw new Error('Invalid title parameter');
      }
      if (!params.description || typeof params.description !== 'string') {
        throw new Error('Invalid description parameter');
      }
      if (!params.category || typeof params.category !== 'string') {
        throw new Error('Invalid category parameter');
      }
      if (!params.modelBlobId || typeof params.modelBlobId !== 'string') {
        throw new Error('Invalid modelBlobId parameter');
      }
      if (!params.encryptionPolicyId || typeof params.encryptionPolicyId !== 'string') {
        throw new Error('Invalid encryptionPolicyId parameter');
      }
      if (!params.price || (typeof params.price !== 'string' && typeof params.price !== 'number')) {
        throw new Error(`Invalid price parameter: ${typeof params.price}, value: ${params.price}`);
      }
      if (!Array.isArray(params.tags)) {
        throw new Error(`Invalid tags parameter: ${typeof params.tags}, value: ${params.tags}`);
      }
      // Ensure all tags are strings
      const validTags = params.tags.filter(tag => typeof tag === 'string' && tag.length > 0);
      if (validTags.length !== params.tags.length) {
        logger.warn('Some tags were filtered out due to invalid type', {
          originalTags: params.tags,
          validTags: validTags
        });
      }

      logger.info('Creating upload model transaction', {
        title: params.title,
        blobId: params.modelBlobId,
        price: params.price,
        priceType: typeof params.price,
        packageId: MARKETPLACE_CONFIG.PACKAGE_ID,
        target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model`
      });

      const tx = new Transaction();

      // Upload model call
      const result = tx.moveCall({
        target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model`,
        arguments: [
          tx.pure.string(params.title),
          tx.pure.string(params.description),
          tx.pure.string(params.category),
          tx.pure.vector('string', validTags),
          tx.pure.string(params.modelBlobId),
          tx.pure.option('string', params.datasetBlobId ?? null),
          tx.pure.string(params.encryptionPolicyId),
          tx.pure.vector('u8', Array.from(params.sealMetadata)),
          tx.pure.u64(params.price),
          tx.pure.option('u64', params.maxDownloads ?? null),
          tx.object('0x6'), // System Clock object
        ],
      });

      // Transfer the returned PendingModel to the transaction sender
      const senderAddress = await signer.toSuiAddress();
      tx.transferObjects([result], senderAddress);

      // Execute transaction
      const txResult = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true
        }
      });

      if (txResult.effects?.status?.status === 'success') {
        // Extract the created object ID
        const createdObjects = txResult.objectChanges?.filter(
          change => change.type === 'created'
        );
        const pendingModelObj = createdObjects?.find(
          obj => obj.type === 'created' && 
          obj.objectType?.includes('PendingModel')
        );

        logger.info('Model uploaded successfully', {
          digest: txResult.digest,
          objectId: pendingModelObj?.objectId,
          title: params.title
        });

        return {
          success: true,
          transactionDigest: txResult.digest,
          objectId: pendingModelObj?.objectId
        };
      } else {
        const error = txResult.effects?.status?.error || 'Transaction failed';
        logger.error('Upload transaction failed', { error, digest: txResult.digest });
        
        return {
          success: false,
          error: `Transaction failed: ${error}`
        };
      }

    } catch (error) {
      logger.error('Upload model contract call failed', {
        error: error instanceof Error ? error.message : String(error),
        params: { title: params.title, blobId: params.modelBlobId }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Phase 2: Submit model for TEE verification
   */
  async submitForVerification(
    pendingModelId: string,
    signer: Signer
  ): Promise<ContractResult> {
    try {
      logger.info('Submitting model for verification', { pendingModelId });

      const tx = new Transaction();

      // Get the pending model object
      const pendingModel = tx.object(pendingModelId);

      // Add current timestamp
      tx.moveCall({
        target: `0x2::clock::create_for_testing`,
        arguments: [tx.pure.u64(Date.now())]
      });

      // Submit for verification
      tx.moveCall({
        target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::submit_for_verification`,
        arguments: [
          pendingModel,
          tx.object(MARKETPLACE_CONFIG.REGISTRY_OBJECT_ID),
          tx.object('0x6'), // Clock
        ],
      });

      const txResult = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showEvents: true
        }
      });

      if (txResult.effects?.status?.status === 'success') {
        logger.info('Verification submission successful', {
          digest: txResult.digest,
          modelId: pendingModelId
        });

        return {
          success: true,
          transactionDigest: txResult.digest,
          objectId: pendingModelId
        };
      } else {
        const error = txResult.effects?.status?.error || 'Transaction failed';
        return {
          success: false,
          error: `Verification submission failed: ${error}`
        };
      }

    } catch (error) {
      logger.error('Submit for verification failed', {
        error: error instanceof Error ? error.message : String(error),
        pendingModelId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Phase 3: Complete TEE verification (called by TEE service)
   */
  async completeVerification(
    pendingModelId: string,
    params: VerificationParams,
    signer: Signer
  ): Promise<ContractResult> {
    try {
      logger.info('Completing TEE verification', {
        modelId: pendingModelId,
        qualityScore: params.qualityScore
      });

      const tx = new Transaction();

      const pendingModel = tx.object(pendingModelId);

      tx.moveCall({
        target: `0x2::clock::create_for_testing`,
        arguments: [tx.pure.u64(Date.now())]
      });

      const verificationResult = tx.moveCall({
        target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::complete_verification`,
        arguments: [
          pendingModel,
          tx.object(MARKETPLACE_CONFIG.REGISTRY_OBJECT_ID),
          tx.pure.string(params.enclaveId),
          tx.pure.u64(params.qualityScore),
          tx.pure.string(params.securityAssessment),
          tx.pure.vector('u8', Array.from(params.attestationHash)),
          tx.pure.vector('u8', Array.from(params.verifierSignature)),
          tx.object('0x6'), // Clock
        ],
      });

      const senderAddress = await signer.toSuiAddress();
      tx.transferObjects([verificationResult], senderAddress);

      const txResult = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true
        }
      });

      if (txResult.effects?.status?.status === 'success') {
        const createdObjects = txResult.objectChanges?.filter(
          change => change.type === 'created'
        );
        const verificationObj = createdObjects?.find(
          obj => obj.type === 'created' && 
          obj.objectType?.includes('VerificationResult')
        );

        logger.info('TEE verification completed', {
          digest: txResult.digest,
          verificationId: verificationObj?.objectId,
          qualityScore: params.qualityScore
        });

        return {
          success: true,
          transactionDigest: txResult.digest,
          objectId: verificationObj?.objectId
        };
      } else {
        const error = txResult.effects?.status?.error || 'Transaction failed';
        return {
          success: false,
          error: `Verification completion failed: ${error}`
        };
      }

    } catch (error) {
      logger.error('Complete verification failed', {
        error: error instanceof Error ? error.message : String(error),
        modelId: pendingModelId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Phase 4: List verified model on marketplace
   */
  async listOnMarketplace(
    pendingModelId: string,
    verificationId: string,
    signer: Signer
  ): Promise<ContractResult> {
    try {
      logger.info('Listing model on marketplace', {
        pendingModelId,
        verificationId
      });

      const tx = new Transaction();

      const pendingModel = tx.object(pendingModelId);
      const verification = tx.object(verificationId);

      tx.moveCall({
        target: `0x2::clock::create_for_testing`,
        arguments: [tx.pure.u64(Date.now())]
      });

      const marketplaceModel = tx.moveCall({
        target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::list_on_marketplace`,
        arguments: [
          pendingModel,
          verification,
          tx.object(MARKETPLACE_CONFIG.REGISTRY_OBJECT_ID),
          tx.object('0x6'), // Clock
        ],
      });

      const senderAddress = await signer.toSuiAddress();
      tx.transferObjects([marketplaceModel], senderAddress);

      const txResult = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true
        }
      });

      if (txResult.effects?.status?.status === 'success') {
        const createdObjects = txResult.objectChanges?.filter(
          change => change.type === 'created'
        );
        const marketplaceObj = createdObjects?.find(
          obj => obj.type === 'created' && 
          obj.objectType?.includes('MarketplaceModel')
        );

        logger.info('Model listed on marketplace', {
          digest: txResult.digest,
          marketplaceId: marketplaceObj?.objectId
        });

        return {
          success: true,
          transactionDigest: txResult.digest,
          objectId: marketplaceObj?.objectId
        };
      } else {
        const error = txResult.effects?.status?.error || 'Transaction failed';
        return {
          success: false,
          error: `Marketplace listing failed: ${error}`
        };
      }

    } catch (error) {
      logger.error('List on marketplace failed', {
        error: error instanceof Error ? error.message : String(error),
        pendingModelId,
        verificationId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create purchase transaction (for use with useSignAndExecuteTransaction)
   */
  async createPurchaseTransaction(params: PurchaseParams): Promise<Transaction> {
    const tx = new Transaction();
    
    // Split coin for payment
    const [paymentCoin] = tx.splitCoins(
      tx.gas,
      [tx.pure.u64(params.paymentAmount)]
    );
    
    // Call purchase_model function
    tx.moveCall({
      target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::purchase_model`,
      arguments: [
        tx.object(MARKETPLACE_CONFIG.REGISTRY_OBJECT_ID),
        tx.pure.id(params.marketplaceModelId),
        paymentCoin
      ]
    });
    
    return tx;
  }

  /**
   * Phase 5: Purchase model from marketplace
   */
  async purchaseModel(
    params: PurchaseParams,
    signer: Signer
  ): Promise<ContractResult> {
    try {
      logger.info('Purchasing model', {
        modelId: params.marketplaceModelId,
        amount: params.paymentAmount
      });

      const tx = new Transaction();

      // Split coin for payment
      const [paymentCoin] = tx.splitCoins(
        tx.gas,
        [tx.pure.u64(params.paymentAmount)]
      );

      const marketplaceModel = tx.object(params.marketplaceModelId);

      tx.moveCall({
        target: `0x2::clock::create_for_testing`,
        arguments: [tx.pure.u64(Date.now())]
      });

      const purchaseRecord = tx.moveCall({
        target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::purchase_model`,
        arguments: [
          marketplaceModel,
          tx.object(MARKETPLACE_CONFIG.REGISTRY_OBJECT_ID),
          paymentCoin,
          tx.object('0x6'), // Clock
        ],
      });

      const senderAddress = await signer.toSuiAddress();
      tx.transferObjects([purchaseRecord], senderAddress);

      const txResult = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true
        }
      });

      if (txResult.effects?.status?.status === 'success') {
        const createdObjects = txResult.objectChanges?.filter(
          change => change.type === 'created'
        );
        const purchaseObj = createdObjects?.find(
          obj => obj.type === 'created' && 
          obj.objectType?.includes('PurchaseRecord')
        );

        logger.info('Model purchased successfully', {
          digest: txResult.digest,
          purchaseId: purchaseObj?.objectId,
          amount: params.paymentAmount
        });

        return {
          success: true,
          transactionDigest: txResult.digest,
          objectId: purchaseObj?.objectId
        };
      } else {
        const error = txResult.effects?.status?.error || 'Transaction failed';
        return {
          success: false,
          error: `Purchase failed: ${error}`
        };
      }

    } catch (error) {
      logger.error('Purchase model failed', {
        error: error instanceof Error ? error.message : String(error),
        modelId: params.marketplaceModelId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Query marketplace models
   */
  async getMarketplaceModels(limit = 50): Promise<any[]> {
    try {
      // TODO: Implement proper querying when SuiClient API is stable
      logger.warn('getMarketplaceModels not implemented yet');
      return [];

    } catch (error) {
      logger.error('Failed to query marketplace models', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Query pending models for user
   */
  async getUserPendingModels(userAddress: string): Promise<any[]> {
    try {
      // TODO: Implement proper querying when SuiClient API is stable
      logger.warn('getUserPendingModels not implemented yet', { userAddress });
      return [];

    } catch (error) {
      logger.error('Failed to query user pending models', {
        error: error instanceof Error ? error.message : String(error),
        userAddress
      });
      return [];
    }
  }

  /**
   * Get purchase records for user
   */
  async getUserPurchases(userAddress: string): Promise<any[]> {
    try {
      // TODO: Implement proper querying when SuiClient API is stable
      logger.warn('getUserPurchases not implemented yet', { userAddress });
      return [];

    } catch (error) {
      logger.error('Failed to query user purchases', {
        error: error instanceof Error ? error.message : String(error),
        userAddress
      });
      return [];
    }
  }
}