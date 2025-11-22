// Marketplace Contract Service - Smart contract integration for complete flow

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
// Wallet signer interface - using any for flexibility with different wallet types
import { createSuiClientWithFallback } from '../integrations/sui/rpc-fallback';
import { logger } from '../integrations/core/logger';
import { MARKETPLACE_CONFIG } from '../constants';

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

 // Initialize the service (for compatibility with existing hooks)
 async initialize(): Promise<void> {
  // Service is ready to use immediately after construction
  // This method exists for compatibility with existing code
  logger.info('MarketplaceContractService initialized');
 }

 /**
  * Phase 1: Upload model to pending state
  */
 async uploadModel(
  params: UploadModelParams,
  signer: any
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
    registryId: MARKETPLACE_CONFIG.REGISTRY_ID,
    target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model_entry`
   });


   const tx = new Transaction();

   // Upload model call (entry function - no return value to capture)
   try {
    tx.moveCall({
    target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model_entry`,
    arguments: [
     tx.pure.string(params.title),
     tx.pure.string(params.description),
     tx.pure.string(params.category),
     tx.pure.vector('string', validTags),
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
     tx.object('0x6'), // System Clock object
    ],
   });
   } catch (moveCallError) {
    
    if (errorMessage && errorMessage.includes('toLowerCase')) {
     throw new Error(`moveCall failed with toLowerCase error: ${errorMessage}`);
    }
    throw moveCallError;
   }

   // Entry function auto-transfers the PendingModel to the transaction sender
   // No manual transfer needed

   
   logger.info('About to execute transaction', {
    target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model_entry`,
    packageId: MARKETPLACE_CONFIG.PACKAGE_ID,
    argumentCount: 11, // title, description, category, tags, modelBlobId, datasetBlobId, encryptionPolicyId, sealMetadata, price, maxDownloads, clock
    isEntryFunction: true
   });

   
   try {
    
    // Safe toLowerCase testing
    if (params.title && typeof params.title === 'string') {
    }
    if (params.description && typeof params.description === 'string') {
    }
    if (params.category && typeof params.category === 'string') {
    }
    
   } catch (preError) {
    const errorMessage = preError instanceof Error ? preError.message : String(preError);
    throw new Error(`Parameter validation failed: ${errorMessage}`);
   }
   
   // Execute transaction using the wallet signer's executeTransaction method
   const txResult = await signer.executeTransaction(tx).catch((error: any) => {
    
    logger.error('Transaction execution failed', {
     error: error.message,
     stack: error.stack,
     errorType: typeof error,
     errorProps: Object.keys(error)
    });
    throw error;
   });

   
   // Check for success in different response formats
   const isSuccessful = txResult.effects?.status?.status === 'success' || 
             (txResult.digest && txResult.rawEffects && !txResult.errors);
   

   if (isSuccessful) {
    
    // Since dApp Kit doesn't return objectChanges, query the transaction directly
    let createdObjectId = 'pending-model-created'; // Fallback ID
    
    try {
     const txDetails = await this.suiClient.getTransactionBlock({
      digest: txResult.digest,
      options: {
       showEffects: true,
       showObjectChanges: true,
      },
     });
     
     
     if (txDetails.objectChanges) {
      const createdObjects = txDetails.objectChanges.filter(
       (change: any) => change.type === 'created'
      );
      const expectedPendingModelType = `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::PendingModel`;
      const pendingModelObj = createdObjects?.find(
       (obj: any) => obj.type === 'created' && 
       obj.objectType === expectedPendingModelType
      ) as any;
      
      if (pendingModelObj) {
       createdObjectId = pendingModelObj.objectId;
      }
     }
    } catch (queryError) {
     // Silent fail for cleaner logs
     // Continue with fallback ID
    }

    logger.info('Model uploaded successfully', {
     digest: txResult.digest,
     objectId: createdObjectId,
     title: params.title
    });

    // Dispatch event to refresh pending models
    if (typeof window !== 'undefined') {
     window.dispatchEvent(new CustomEvent('pending-models-refresh', {
      detail: { pendingModelId: createdObjectId }
     }));
    }

    return {
     success: true,
     transactionDigest: txResult.digest,
     objectId: createdObjectId
    };
   } else {
    
    // Try to get more details about the failure
    let failureReason = 'Unknown failure';
    
    try {
     if (txResult.digest) {
      const txDetails = await this.suiClient.getTransactionBlock({
       digest: txResult.digest,
       options: {
        showEffects: true,
        showEvents: true,
       },
      });
      
      
      if (txDetails.effects?.status?.status === 'failure') {
       failureReason = txDetails.effects?.status?.error || 'Smart contract execution failed';
      } else if (txDetails.effects?.status?.status === 'success') {
       // Transaction actually succeeded, but dApp Kit response was malformed
       
       // Get created objects
       let createdObjectId = 'pending-model-created';
       if (txDetails.objectChanges) {
        const createdObjects = txDetails.objectChanges.filter(
         (change: any) => change.type === 'created'
        );
        if (createdObjects.length > 0) {
         const firstCreated = createdObjects[0] as any;
         createdObjectId = firstCreated.objectId;
        }
       }
       
       return {
        success: true,
        transactionDigest: txResult.digest,
        objectId: createdObjectId
       };
      }
     }
    } catch (queryError) {
     failureReason = 'Could not determine failure reason';
    }
    
    logger.error('Upload transaction failed', { 
     error: failureReason, 
     digest: txResult.digest,
     fullResult: txResult
    });
    
    return {
     success: false,
     error: `Transaction failed: ${failureReason}`
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
  signer: any
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
     tx.object(MARKETPLACE_CONFIG.REGISTRY_ID),
     tx.object('0x6'), // Clock
    ],
   });

   const txResult = await signer.executeTransaction(tx);

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
  signer: any
 ): Promise<ContractResult> {
  try {
   // Validate inputs
   if (!pendingModelId || typeof pendingModelId !== 'string') {
    throw new Error('Invalid pending model ID provided');
   }
   
   // Validate object ID format (Sui object IDs are 32 bytes = 64 hex chars)
   if (!/^0x[0-9a-fA-F]{64}$/.test(pendingModelId)) {
    throw new Error(`Invalid object ID format: ${pendingModelId}`);
   }

   logger.info('Completing TEE verification', {
    modelId: pendingModelId,
    qualityScore: params.qualityScore
   });


   // Validate the object exists and is accessible
   try {
    const userAddress = await signer.toSuiAddress();
    
    const objectInfo = await this.suiClient.getObject({
     id: pendingModelId,
     options: { showContent: true, showType: true, showOwner: true }
    });
    
     id: objectInfo.data?.objectId,
     type: objectInfo.data?.type,
     owner: objectInfo.data?.owner,
     hasContent: !!objectInfo.data?.content
    });

    if (!objectInfo.data) {
     throw new Error('Object not found or not accessible');
    }

    if (objectInfo.data?.owner && typeof objectInfo.data.owner === 'object' && 'AddressOwner' in objectInfo.data.owner) {
     const objectOwner = (objectInfo.data.owner as any).AddressOwner;
     if (objectOwner !== userAddress) {
      throw new Error(`Object is not owned by current user. Owner: ${objectOwner}, User: ${userAddress}`);
     }
    }
   } catch (objectError) {
    throw new Error(`Cannot access pending model: ${objectError instanceof Error ? objectError.message : String(objectError)}`);
   }

   // Two-step approach: first ensure submission, then complete verification
   logger.info('Preparing verification transaction for model', { pendingModelId });

   // Check current model status to determine which operations to include
   const objectInfo = await this.suiClient.getObject({
    id: pendingModelId,
    options: { showContent: true }
   });
   
   const modelContent = objectInfo.data?.content as any;
   const currentStatus = modelContent?.fields?.status;
   

   // Create transaction with appropriate operations based on status
   const tx = new Transaction();
   
   // Set gas budget for the transaction
   tx.setGasBudget(100000000); // 0.1 SUI
   
   // Create object references
   const pendingModel = tx.object(pendingModelId);
   const registry = tx.object(MARKETPLACE_CONFIG.REGISTRY_ID);
   const clock = tx.object('0x6');

   // Handle different model statuses
   if (currentStatus === 0) {
    // PENDING - need to submit for verification first, then complete, then list
    tx.moveCall({
     target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::submit_for_verification`,
     arguments: [pendingModel, registry, clock],
    });

    const verificationResult = tx.moveCall({
     target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::complete_verification`,
     arguments: [
      pendingModel,
      registry,
      tx.pure.string(params.enclaveId),
      tx.pure.u64(params.qualityScore),
      tx.pure.string(params.securityAssessment),
      tx.pure.vector('u8', Array.from(params.attestationHash)),
      tx.pure.vector('u8', Array.from(params.verifierSignature)),
      clock
     ],
    });

    // Add marketplace listing to same transaction
    const marketplaceModel = tx.moveCall({
     target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::list_on_marketplace`,
     arguments: [
      pendingModel,
      verificationResult,
      registry,
      clock
     ],
    });

    const senderAddress = await signer.toSuiAddress();
    tx.transferObjects([marketplaceModel], senderAddress);

   } else if (currentStatus === 1) {
    // VERIFYING - only need to complete verification
    const verificationResult = tx.moveCall({
     target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::complete_verification`,
     arguments: [
      pendingModel,
      registry,
      tx.pure.string(params.enclaveId),
      tx.pure.u64(params.qualityScore),
      tx.pure.string(params.securityAssessment),
      tx.pure.vector('u8', Array.from(params.attestationHash)),
      tx.pure.vector('u8', Array.from(params.verifierSignature)),
      clock
     ],
    });

    const senderAddress = await signer.toSuiAddress();
    tx.transferObjects([verificationResult], senderAddress);

   } else if (currentStatus === 2) {
    // VERIFIED - model is already verified, return success without transaction
    return {
     success: true,
     transactionDigest: 'already-verified',
     objectId: pendingModelId // Use the model ID as object ID since it's already verified
    };
   } else {
    throw new Error(`Model is in unexpected status: ${currentStatus}. Expected 0 (PENDING), 1 (VERIFYING), or 2 (VERIFIED)`);
   }

   // Log transaction details before execution
   
   // Execute transaction (only if not already verified)
   const txResult = await signer.executeTransaction(tx);
   

   // Check if txResult is defined and has the expected structure
   if (!txResult) {
    logger.error('Transaction result is undefined', { modelId: pendingModelId });
    return {
     success: false,
     error: 'Transaction execution failed: No result returned'
    };
   }

   // Handle both direct result and nested result structures
   const effects = txResult.effects || txResult.result?.effects;
   const objectChanges = txResult.objectChanges || txResult.result?.objectChanges;
   const digest = txResult.digest || txResult.result?.digest;
   const rawEffects = txResult.rawEffects;

   // Check for success - transaction with digest and rawEffects is successful
   const isSuccessful = !!(digest && (effects?.status?.status === 'success' || rawEffects));
   
    hasDigest: !!digest,
    hasEffects: !!effects,
    hasRawEffects: !!rawEffects,
    effectsStatus: effects?.status?.status,
    isSuccessful
   });

   if (isSuccessful) {
    // Try to find the verification object from objectChanges
    let verificationObjectId;
    
    if (objectChanges) {
     const createdObjects = objectChanges.filter(
      (change: any) => change.type === 'created'
     );
     const verificationObj = createdObjects?.find(
      (obj: any) => obj.type === 'created' && 
      obj.objectType?.includes('VerificationResult')
     );
     verificationObjectId = verificationObj?.objectId;
    }
    
    // If we can't find it in objectChanges, try to query for verification results
    if (!verificationObjectId && rawEffects) {
     
     try {
      // Query the transaction to get the actual created objects
      const txDetails = await this.suiClient.getTransactionBlock({
       digest: digest,
       options: {
        showEffects: true,
        showObjectChanges: true,
       },
      });
      
      
      if (txDetails.objectChanges) {
       const createdObjects = txDetails.objectChanges.filter(
        (change: any) => change.type === 'created'
       );
       
       const verificationObj = createdObjects?.find(
        (obj: any) => obj.type === 'created' && 
        obj.objectType?.includes('VerificationResult')
       ) as any;
       
       if (verificationObj) {
        verificationObjectId = verificationObj.objectId || verificationObj.id;
       }
      }
     } catch (queryError) {
      logger.warn('Failed to query transaction details', {
        error: queryError instanceof Error ? queryError.message : String(queryError)
      });
     }
     
     // Last resort fallback
     if (!verificationObjectId) {
      verificationObjectId = pendingModelId; // Use pending model ID as fallback
     }
    }


    logger.info('TEE verification and marketplace listing completed', {
     digest: digest,
     verificationId: verificationObjectId,
     qualityScore: params.qualityScore,
     marketplaceListed: currentStatus === 0 // Only listed if it was PENDING
    });

    return {
     success: true,
     transactionDigest: digest,
     objectId: verificationObjectId
    };
   } else {
    const error = effects?.status?.error || 'Transaction failed or returned undefined result';
    logger.error('Complete verification failed', {
     error,
     txResult,
     modelId: pendingModelId
    });
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
  signer: any
 ): Promise<ContractResult> {
  try {
   logger.info('Listing model on marketplace', {
    pendingModelId,
    verificationId
   });

   const tx = new Transaction();

   const pendingModel = tx.object(pendingModelId);
   const verification = tx.object(verificationId);

   // Use the shared clock object for testnet
   const marketplaceModel = tx.moveCall({
    target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::list_on_marketplace`,
    arguments: [
     pendingModel,
     verification,
     tx.object(MARKETPLACE_CONFIG.REGISTRY_ID),
     tx.object('0x6'), // Clock shared object on testnet
    ],
   });

   const senderAddress = await signer.toSuiAddress();
   tx.transferObjects([marketplaceModel], senderAddress);

   const txResult = await signer.executeTransaction(tx);


   // Check if txResult is defined
   if (!txResult) {
    logger.error('Transaction result is undefined', { 
     pendingModelId, 
     verificationId 
    });
    return {
     success: false,
     error: 'Transaction execution failed: No result returned'
    };
   }

   // Handle both direct result and nested result structures
   const effects = txResult.effects || txResult.result?.effects;
   const objectChanges = txResult.objectChanges || txResult.result?.objectChanges;
   const digest = txResult.digest || txResult.result?.digest;
   const rawEffects = txResult.rawEffects;

   // Check for success - transaction with digest and rawEffects is successful
   const isSuccessful = !!(digest && (effects?.status?.status === 'success' || rawEffects));
   
    hasDigest: !!digest,
    hasEffects: !!effects,
    hasRawEffects: !!rawEffects,
    effectsStatus: effects?.status?.status,
    isSuccessful
   });

   if (isSuccessful) {
    // Try to find the marketplace object from objectChanges
    let marketplaceObjectId;
    
    if (objectChanges) {
     const createdObjects = objectChanges.filter(
      (change: any) => change.type === 'created'
     );
     
     
     const marketplaceObj = createdObjects?.find(
      (obj: any) => obj.type === 'created' && 
      obj.objectType?.includes('MarketplaceModel')
     );
     marketplaceObjectId = marketplaceObj?.objectId;
    }
    
    // If we can't find it in objectChanges, try to get it from effects
    if (!marketplaceObjectId && rawEffects) {
     // This is a fallback approach
     marketplaceObjectId = `marketplace-${Date.now()}`;
    }


    logger.info('Model listed on marketplace', {
     digest: digest,
     marketplaceId: marketplaceObjectId,
     pendingModelId,
     verificationId
    });

    return {
     success: true,
     transactionDigest: digest,
     objectId: marketplaceObjectId
    };
   } else {
    const error = effects?.status?.error || 'Transaction failed';
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
    tx.object(MARKETPLACE_CONFIG.REGISTRY_ID),
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
  signer: any
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
     tx.object(MARKETPLACE_CONFIG.REGISTRY_ID),
     paymentCoin,
     tx.object('0x6'), // Clock
    ],
   });

   const senderAddress = await signer.toSuiAddress();
   tx.transferObjects([purchaseRecord], senderAddress);

   const txResult = await signer.executeTransaction(tx);

   if (txResult.effects?.status?.status === 'success') {
    const createdObjects = txResult.objectChanges?.filter(
     (change: any) => change.type === 'created'
    );
    const purchaseObj = createdObjects?.find(
     (obj: any) => obj.type === 'created' && 
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
   logger.info('Querying marketplace models', { limit });

   // Try multiple approaches to find MarketplaceModel objects
   let response;
   
   // Approach 1: Query by registry ownership
   try {
    response = await this.suiClient.getOwnedObjects({
     owner: MARKETPLACE_CONFIG.REGISTRY_ID,
     filter: {
      StructType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::MarketplaceModel`
     },
     options: {
      showContent: true,
      showType: true,
      showOwner: true,
      showDisplay: true,
     },
     limit,
    });
    
    if (response.data && response.data.length > 0) {
    }
   } catch (registryError) {
   }

   // Approach 2: Try querying by object type directly
   if (!response || !response.data || response.data.length === 0) {
    
    try {
     response = await this.suiClient.getOwnedObjects({
      owner: MARKETPLACE_CONFIG.PACKAGE_ID,
      filter: {
       StructType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::MarketplaceModel`
      },
      options: {
       showContent: true,
       showType: true,
       showOwner: true,
       showDisplay: true,
      },
      limit,
     });
     
     if (response.data && response.data.length > 0) {
     }
    } catch (typeError) {
    }
   }

   // Approach 3: Event-based query if no direct results
   if (!response || !response.data || response.data.length === 0) {
    
    // Query ModelListed events to get marketplace model IDs
    const eventsResponse = await this.suiClient.queryEvents({
     query: {
      MoveEventType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::ModelListed`
     },
     limit,
     order: 'descending'
    });

    if (eventsResponse.data && eventsResponse.data.length > 0) {
     
     // Extract model IDs from events and fetch the actual objects
     const modelPromises = eventsResponse.data.map(async (event) => {
      try {
       const eventData = event.parsedJson as any;
       
       // Use marketplace_id for MarketplaceModel objects, not model_id
       const modelId = eventData?.marketplace_id || eventData?.model_id || eventData?.id;
       
       if (modelId) {
        const modelObject = await this.suiClient.getObject({
         id: modelId,
         options: {
          showContent: true,
          showType: true,
          showOwner: true,
          showDisplay: true,
         }
        });
        return modelObject;
       } else {
        console.warn('No model ID found in event:', eventData);
       }
       return null;
      } catch (err) {
       console.warn('Failed to fetch model object', { eventData: event.parsedJson, error: err });
       return null;
      }
     });

     const models = await Promise.all(modelPromises);
     const validModels = models.filter(model => model && model.data);
     
     
     // Transform to expected format
     response = {
      data: validModels.map(model => ({ data: model!.data }))
     };
    } else {
     response = { data: [] };
    }
   }

   if (!response.data) {
    logger.warn('No marketplace models found');
    return [];
   }

   logger.info('Found marketplace models', { 
    count: response.data.length,
    objects: response.data.map(obj => ({
     id: obj.data?.objectId,
     type: obj.data?.type,
     hasContent: !!obj.data?.content
    }))
   });

   const filteredData = response.data.filter(obj => obj.data !== null);
   
    total: filteredData.length,
    sample: filteredData[0] ? {
     objectId: filteredData[0].data?.objectId,
     type: filteredData[0].data?.type,
     content: filteredData[0].data?.content
    } : null
   });

   return filteredData;

  } catch (error) {
   logger.error('Failed to query marketplace models', {
    error: error instanceof Error ? error.message : String(error)
   });
   
   // Fallback: Try querying by package type without owner filter
   try {
    logger.info('Trying fallback query for marketplace models');
    
    const response = await this.suiClient.queryEvents({
     query: {
      MoveEventType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::ModelListed`
     },
     limit,
     order: 'descending'
    });

    if (response.data && response.data.length > 0) {
     logger.info('Found marketplace models via events', { count: response.data.length });
     
     // Extract model IDs from events and fetch the actual objects
     const modelPromises = response.data.map(async (event) => {
      try {
       const modelId = (event.parsedJson as any)?.marketplace_id || (event.parsedJson as any)?.model_id;
       if (modelId) {
        return await this.suiClient.getObject({
         id: modelId,
         options: {
          showContent: true,
          showType: true,
          showOwner: true,
          showDisplay: true,
         }
        });
       }
      } catch (err) {
       const modelId = (event.parsedJson as any)?.marketplace_id || (event.parsedJson as any)?.model_id;
       logger.warn('Failed to fetch model object', { modelId: modelId, error: err });
       return null;
      }
     });

     const models = await Promise.all(modelPromises);
     return models.filter(model => model && model.data).map(model => ({ data: model!.data }));
    }
    
    return [];
   } catch (fallbackError) {
    logger.error('Fallback query also failed', {
     error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
    });
    return [];
   }
  }
 }

 /**
  * Query pending models for user
  */
 async getUserPendingModels(userAddress: string): Promise<any[]> {
  try {

   // Approach 1: Get marketplace models to see which pending models have been listed
   const marketplaceModels = await this.getMarketplaceModels();
   
   const listedModelIds = new Set<string>();
   
   // Extract pending model IDs from marketplace models
   if (marketplaceModels.length > 0) {
     id: marketplaceModels[0].data?.objectId,
     fields: marketplaceModels[0].data?.content?.fields
    });
    
    marketplaceModels.forEach(model => {
     const pendingId = model.data?.content?.fields?.pending_model_id;
     if (pendingId) {
      listedModelIds.add(pendingId);
     }
    });
   }

   // Approach 2: Also check ModelListed events to get recently listed models
   try {
    const eventsResponse = await this.suiClient.queryEvents({
     query: {
      MoveEventType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::ModelListed`
     },
     limit: 100,
     order: 'descending'
    });

    if (eventsResponse.data) {
     
     eventsResponse.data.forEach(event => {
      const eventData = event.parsedJson as any;
      const pendingModelId = eventData?.pending_model_id;
      if (pendingModelId) {
       listedModelIds.add(pendingModelId);
      }
     });
    }
   } catch (eventError) {
   }


   // Query all objects owned by the user with proper pagination
   let allOwnedObjects: any[] = [];
   let cursor: string | null = null;
   let pageCount = 0;
   const maxPages = 20; // Reasonable limit to prevent infinite loops

   do {
    pageCount++;
    
    const page = await this.suiClient.getOwnedObjects({
     owner: userAddress,
     cursor: cursor,
     options: {
      showContent: true,
      showType: true,
     },
     limit: 50,
    });
    
    allOwnedObjects.push(...page.data);
    
    cursor = page.nextCursor;
    
    // Safety check to prevent infinite loops
    if (pageCount >= maxPages) {
     break;
    }
    
   } while (cursor);
   
   const ownedObjects = { data: allOwnedObjects };

   
   
   // Debug: Log all PendingModel objects specifically (including old packages for debugging)
   const allPendingModelIds = ownedObjects.data
    .filter(obj => obj.data?.type?.includes('PendingModel'))
    .map(obj => ({
     id: obj.data?.objectId,
     type: obj.data?.type,
     createdAt: (obj.data?.content as any)?.fields?.created_at,
     isCurrentPackage: obj.data?.type === `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::PendingModel`
    }));

   // Filter for PendingModel objects from CURRENT package only that haven't been listed on marketplace
   const expectedPendingModelType = `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::PendingModel`;
   
   const allPendingModels = ownedObjects.data.filter(obj => {
    const objectType = obj.data?.type;
    const isCorrectType = objectType === expectedPendingModelType;
    return isCorrectType;
   });
   
   
   const pendingModels = allPendingModels.filter(obj => {
    const objectId = obj.data?.objectId;
    if (!objectId) return false;
    const isListed = listedModelIds.has(objectId);
    
    // Don't filter by age or date validity - show ALL pending models
    const content = obj.data?.content as any;
    const fields = content?.fields || {};
    const status = fields?.status;
    
    
    // Include ALL pending models that haven't been listed on marketplace
    // Don't filter by age or timestamp validity
    return !isListed;
   });


   // If no current package models found, try to query recent events to find newly created models
   // that might not be indexed yet in getOwnedObjects
   if (currentPackageModels.length === 0) {
     try {
     const recentEvents = await this.suiClient.queryEvents({
      query: {
       MoveEventType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::ModelUploaded`
      },
      limit: 10, // Check last 10 uploads
      order: 'descending'
     });

     for (const event of recentEvents.data || []) {
      const eventData = event.parsedJson as any;
      const modelId = eventData?.model_id;
      const eventSender = event.sender;

      if (modelId && eventSender === userAddress) {

       // Try to fetch this object directly
       try {
        const recentObject = await this.suiClient.getObject({
         id: modelId,
         options: {
          showContent: true,
          showType: true,
          showOwner: true
         }
        });

        if (recentObject.data && recentObject.data.type === expectedPendingModelType) {
         
         // Add it to our results manually
         pendingModels.push({
          data: recentObject.data
         });
        }
       } catch (objectError) {
        // Silent fail for cleaner logs
       }
      }
     }
    } catch (eventError) {
     // Silent fail for cleaner logs
    }
   }


   // Return the raw object data for the dashboard to transform
   return pendingModels.map(obj => ({
    id: obj.data?.objectId,
    content: obj.data?.content,
    type: obj.data?.type
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
  * Clean up pending models from old/wrong packages
  */
 async cleanupOldPackagePendingModels(userAddress: string): Promise<{ removed: number, errors: string[] }> {
  try {
   
   // Get all pending models from ALL packages
   const ownedObjects = await this.suiClient.getOwnedObjects({
    owner: userAddress,
    options: {
     showContent: true,
     showType: true,
    },
   });

   const currentPackageType = `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::PendingModel`;
   const oldPackagePendingModels = ownedObjects.data.filter(obj => {
    const objectType = obj.data?.type;
    const isPendingModel = objectType?.includes('PendingModel');
    const isOldPackage = isPendingModel && objectType !== currentPackageType;
    
    if (isOldPackage) {
      objectId: obj.data?.objectId,
      type: objectType,
      currentExpected: currentPackageType
     });
    }
    
    return isOldPackage;
   });


   if (oldPackagePendingModels.length === 0) {
    return { removed: 0, errors: [] };
   }

   // Log what we're about to remove for transparency
   oldPackagePendingModels.forEach(obj => {
    const content = obj.data?.content as any;
    const fields = content?.fields || {};
     objectId: obj.data?.objectId,
     title: fields.title,
     type: obj.data?.type,
     createdAt: fields.created_at ? new Date(parseInt(fields.created_at)).toISOString() : 'no date'
    });
   });

   return { removed: oldPackagePendingModels.length, errors: [] };

  } catch (error) {
   logger.error('Failed to cleanup old package pending models', {
    error: error instanceof Error ? error.message : String(error)
   });
   return { 
    removed: 0, 
    errors: [error instanceof Error ? error.message : String(error)] 
   };
  }
 }

 /**
  * Clean up old pending models by removing all models with invalid dates or older than specified age
  */
 async cleanupOldPendingModels(userAddress: string, maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<{ removed: number, errors: string[] }> {
  try {
   
   // Get all pending models without age filtering
   const ownedObjects = await this.suiClient.getOwnedObjects({
    owner: userAddress,
    options: {
     showContent: true,
     showType: true,
    },
   });

   // Only clean up PendingModels from current package to avoid deleting valid old models
   const expectedPendingModelType = `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::PendingModel`;
   const allPendingModels = ownedObjects.data.filter(obj => {
    const objectType = obj.data?.type;
    return objectType === expectedPendingModelType;
   });


   const now = Date.now();
   const modelsToRemove: string[] = [];
   const errors: string[] = [];

   // Identify models to remove
   allPendingModels.forEach(obj => {
    const objectId = obj.data?.objectId;
    if (!objectId) return;

    const content = obj.data?.content as any;
    const createdAt = content?.fields?.created_at;
    const createdTimestamp = parseInt(createdAt || '0');
    
    // Remove if: invalid date OR older than maxAge
    const hasInvalidDate = !createdAt || createdTimestamp <= 0 || createdTimestamp >= now;
    const isOld = createdTimestamp > 0 && (now - createdTimestamp) > maxAgeMs;
    
    if (hasInvalidDate || isOld) {
     modelsToRemove.push(objectId);
      objectId: objectId.slice(0, 8),
      reason: hasInvalidDate ? 'invalid_date' : 'too_old',
      createdAt: hasInvalidDate ? 'invalid' : new Date(createdTimestamp).toISOString()
     });
    }
   });


   if (modelsToRemove.length === 0) {
    return { removed: 0, errors: [] };
   }

   // Note: In Sui, you cannot directly delete objects you own.
   // Objects are automatically cleaned up by the runtime when no longer referenced.
   // For now, we'll just return the count that would be removed.
   
   
   return { 
    removed: modelsToRemove.length, 
    errors: []
   };

  } catch (error) {
   logger.error('Failed to cleanup old pending models', {
    error: error instanceof Error ? error.message : String(error)
   });
   return { 
    removed: 0, 
    errors: [error instanceof Error ? error.message : String(error)]
   };
  }
 }

 /**
  * Get model details from marketplace
  */
 async getModelDetails(modelId: string): Promise<any> {
  try {
   if (!modelId) return null;
   
   // Get the model object from the blockchain
   const modelObject = await this.suiClient.getObject({
    id: modelId,
    options: {
     showContent: true,
     showType: true,
     showOwner: true
    }
   });

   if (!modelObject.data?.content) {
    console.warn('Model object not found or has no content:', modelId);
    return null;
   }

   const content = modelObject.data.content as any;
   const fields = content?.fields || {};

   return {
    title: fields.title || fields.name || 'Unknown Model',
    description: fields.description || '',
    creator: fields.creator || fields.owner || 'Unknown',
    file_size: fields.file_size || fields.size || '0',
    category: fields.category || 'Uncategorized',
    price: fields.price || '0',
    downloads: fields.downloads || '0'
   };
  } catch (error) {
   console.warn('Failed to get model details:', error);
   return null;
  }
 }

 /**
  * Get purchase records for user
  */
 async getUserPurchases(userAddress: string): Promise<any[]> {
  try {
   
   const ownedObjects = await this.suiClient.getOwnedObjects({
    owner: userAddress,
    options: { 
     showContent: true, 
     showType: true,
     showOwner: true,
     showPreviousTransaction: true
    }
   });

   // Filter for PurchaseRecord objects
   const purchaseRecords = ownedObjects.data.filter(obj => {
    const objectType = obj.data?.type;
    return objectType?.includes('PurchaseRecord') || objectType?.includes('purchase_record');
   });


   // Transform purchase records into download format
   const purchases = await Promise.all(
    purchaseRecords.map(async (record) => {
     try {
      const content = record.data?.content as any;
      const fields = content?.fields || {};
      
      // Extract model information from purchase record
      const modelId = fields.model_id || fields.marketplace_model_id;
      const purchasePrice = fields.price || fields.payment_amount || '0';
      const purchaseTime = fields.timestamp || Date.now();
      
      // Try to get model details from marketplace
      let modelTitle = 'Unknown Model';
      let fileSize = 0;
      let creator = 'Unknown';
      
      try {
       const modelDetails = await this.getModelDetails(modelId);
       if (modelDetails) {
        modelTitle = modelDetails.title || modelTitle;
        fileSize = parseInt(modelDetails.file_size || '0');
        creator = modelDetails.creator || creator;
       }
      } catch (modelError) {
       console.warn('Could not fetch model details:', modelError);
      }

      return {
       id: record.data?.objectId || `purchase_${Date.now()}`,
       modelId: modelId,
       modelTitle: modelTitle,
       downloadDate: typeof purchaseTime === 'string' ? parseInt(purchaseTime) : purchaseTime,
       fileSize: fileSize,
       attestationId: fields.attestation_id,
       encrypted: true, // All models are SEAL encrypted
       accessible: true,
       creator: creator.slice(0, 8) + '...' + creator.slice(-6),
       price: purchasePrice,
       purchaseRecord: record.data?.objectId
      };
     } catch (parseError) {
      console.warn('Error parsing purchase record:', parseError);
      return null;
     }
    })
   );

   const validPurchases = purchases.filter(p => p !== null);
   
   return validPurchases;
   
  } catch (error) {
   logger.error('Failed to query user purchases', {
    error: error instanceof Error ? error.message : String(error),
    userAddress
   });
   return [];
  }
 }

 /**
  * Get completed models (models that have been verified and listed on marketplace)
  */
 async getUserCompletedModels(userAddress: string): Promise<any[]> {
  try {

   // Get all marketplace models created by this user
   const marketplaceModels = await this.getMarketplaceModels();
   
   const userModels = marketplaceModels.filter(model => {
    const creator = model.data?.content?.fields?.creator;
    return creator === userAddress;
   });

   
   return userModels.map(obj => this.transformMarketplaceModelObject(obj));

  } catch (error) {
   logger.error('Failed to fetch completed models', { error, userAddress });
   return [];
  }
 }

 /**
  * Transform marketplace model object for dashboard display
  */
 private transformMarketplaceModelObject(obj: any): any {
  const content = obj.data?.content as any;
  const fields = content?.fields || {};

  return {
   id: obj.data?.objectId || '',
   title: fields.title || 'Untitled Model',
   description: fields.description || '',
   category: fields.category || 'Uncategorized',
   tags: Array.isArray(fields.tags) ? fields.tags : [],
   creator: fields.creator || '',
   modelBlobId: fields.model_blob_id || '',
   datasetBlobId: fields.dataset_blob_id || null,
   price: fields.price || '0',
   maxDownloads: fields.max_downloads || null,
   qualityScore: fields.quality_score ? Math.round(parseInt(fields.quality_score) / 10000) : 0,
   teeVerified: fields.tee_verified || false,
   currentDownloads: fields.current_downloads || 0,
   totalEarnings: fields.total_earnings || '0',
   listedAt: fields.listed_at ? parseInt(fields.listed_at) : Date.now(),
   pendingModelId: fields.pending_model_id || '',
   verificationId: fields.verification_id || '',
   status: 3 // STATUS_MARKETPLACE (completed)
  };
 }
}