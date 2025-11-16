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
      logger.info('Creating upload model transaction', {
        title: params.title,
        blobId: params.modelBlobId,
        price: params.price
      });

      const tx = new Transaction();

      // Add current epoch timestamp
      tx.moveCall({
        target: `0x2::clock::create_for_testing`, // Use system clock in production
        arguments: [tx.pure.u64(Date.now())]
      });

      // Upload model call
      const result = tx.moveCall({
        target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model`,
        arguments: [
          tx.pure.string(params.title),
          tx.pure.string(params.description),
          tx.pure.string(params.category),
          tx.pure.vector('string', params.tags),
          tx.pure.string(params.modelBlobId),
          params.datasetBlobId ? 
            tx.pure.option('string', params.datasetBlobId) : 
            tx.pure.option('string', null),
          tx.pure.string(params.encryptionPolicyId),
          tx.pure.vector('u8', Array.from(params.sealMetadata)),
          tx.pure.u64(params.price),
          params.maxDownloads ? 
            tx.pure.option('u64', params.maxDownloads) : 
            tx.pure.option('u64', null),
          tx.object('0x6'), // Clock object
        ],
      });

      // Transfer the created PendingModel to sender
      tx.transferObjects([result], tx.gas);

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

      tx.transferObjects([verificationResult], tx.gas);

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

      tx.transferObjects([marketplaceModel], tx.gas);

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

      tx.transferObjects([purchaseRecord], tx.gas);

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
      const result = await this.suiClient.queryObjects({
        filter: {
          StructType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::MarketplaceModel`
        },
        limit,
        options: {
          showContent: true,
          showType: true,
          showOwner: true
        }
      });

      return result.data.map(obj => ({
        id: obj.data?.objectId,
        content: obj.data?.content,
        type: obj.data?.type,
        owner: obj.data?.owner
      }));

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
      const result = await this.suiClient.queryObjects({
        filter: {
          StructType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::PendingModel`
        },
        options: {
          showContent: true,
          showType: true,
          showOwner: true
        }
      });

      // Filter by owner
      return result.data
        .filter(obj => 
          obj.data?.owner && 
          typeof obj.data.owner === 'object' && 
          'AddressOwner' in obj.data.owner &&
          obj.data.owner.AddressOwner === userAddress
        )
        .map(obj => ({
          id: obj.data?.objectId,
          content: obj.data?.content,
          type: obj.data?.type,
          owner: obj.data?.owner
        }));

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
      const result = await this.suiClient.queryObjects({
        filter: {
          StructType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::PurchaseRecord`
        },
        options: {
          showContent: true,
          showType: true,
          showOwner: true
        }
      });

      return result.data
        .filter(obj => 
          obj.data?.owner && 
          typeof obj.data.owner === 'object' && 
          'AddressOwner' in obj.data.owner &&
          obj.data.owner.AddressOwner === userAddress
        )
        .map(obj => ({
          id: obj.data?.objectId,
          content: obj.data?.content,
          type: obj.data?.type,
          owner: obj.data?.owner
        }));

    } catch (error) {
      logger.error('Failed to query user purchases', {
        error: error instanceof Error ? error.message : String(error),
        userAddress
      });
      return [];
    }
  }
}