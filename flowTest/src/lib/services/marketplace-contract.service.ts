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

   // CRITICAL DEBUG: Print exactly which contract we're calling
   console.log('SMART CONTRACT TARGET INFO:');
   console.log(' - Package ID:', MARKETPLACE_CONFIG.PACKAGE_ID);
   console.log(' - Registry ID:', MARKETPLACE_CONFIG.REGISTRY_ID);
   console.log(' - Function target:', `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model_entry`);
   console.log(' - All MARKETPLACE_CONFIG:', MARKETPLACE_CONFIG);

   const tx = new Transaction();
   console.log('CREATED NEW TRANSACTION OBJECT');

   // Upload model call (entry function - no return value to capture)
   console.log('ABOUT TO CREATE MOVECALL...');
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
   console.log('MOVECALL CREATED SUCCESSFULLY');
   } catch (moveCallError) {
    console.log('MOVECALL CREATION FAILED:');
    const errorMessage = moveCallError instanceof Error ? moveCallError.message : String(moveCallError);
    const errorStack = moveCallError instanceof Error ? moveCallError.stack : undefined;
    
    console.log('Error message:', errorMessage);
    console.log('Error stack:', errorStack);
    console.log('Full error:', moveCallError);
    
    if (errorMessage && errorMessage.includes('toLowerCase')) {
     throw new Error(`moveCall failed with toLowerCase error: ${errorMessage}`);
    }
    throw moveCallError;
   }

   // Entry function auto-transfers the PendingModel to the transaction sender
   // No manual transfer needed

   // DEBUG: Aggressive logging to catch the exact issue
   console.log('MARKETPLACE CONFIG:', MARKETPLACE_CONFIG);
   console.log('ACTUAL TARGET:', `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model_entry`);
   console.log('DETAILED PARAMETERS:');
   console.log(' - title:', typeof params.title, JSON.stringify(params.title));
   console.log(' - description:', typeof params.description, JSON.stringify(params.description));
   console.log(' - category:', typeof params.category, JSON.stringify(params.category));
   console.log(' - tags:', typeof params.tags, JSON.stringify(params.tags));
   console.log(' - validTags:', typeof validTags, JSON.stringify(validTags));
   console.log(' - modelBlobId:', typeof params.modelBlobId, JSON.stringify(params.modelBlobId));
   console.log(' - datasetBlobId:', typeof params.datasetBlobId, JSON.stringify(params.datasetBlobId));
   console.log(' - encryptionPolicyId:', typeof params.encryptionPolicyId, JSON.stringify(params.encryptionPolicyId));
   console.log(' - sealMetadata:', typeof params.sealMetadata, params.sealMetadata);
   console.log(' - price:', typeof params.price, JSON.stringify(params.price));
   console.log(' - maxDownloads:', typeof params.maxDownloads, JSON.stringify(params.maxDownloads));
   
   logger.info('About to execute transaction', {
    target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model_entry`,
    packageId: MARKETPLACE_CONFIG.PACKAGE_ID,
    argumentCount: 11, // title, description, category, tags, modelBlobId, datasetBlobId, encryptionPolicyId, sealMetadata, price, maxDownloads, clock
    isEntryFunction: true
   });

   console.log('STARTING TRANSACTION EXECUTION...');
   
   // Check for toLowerCase issues in our own data
   console.log('PRE-EXECUTION VALIDATION:');
   try {
    console.log('Testing title type:', typeof params.title, params.title);
    console.log('Testing description type:', typeof params.description, params.description); 
    console.log('Testing category type:', typeof params.category, params.category);
    console.log('Testing tags type:', typeof validTags, validTags);
    console.log('Testing modelBlobId type:', typeof params.modelBlobId, params.modelBlobId);
    
    // Safe toLowerCase testing
    if (params.title && typeof params.title === 'string') {
     console.log('Title toLowerCase test passed');
    }
    if (params.description && typeof params.description === 'string') {
     console.log('Description toLowerCase test passed');
    }
    if (params.category && typeof params.category === 'string') {
     console.log('Category toLowerCase test passed');
    }
    
    console.log('All our parameters are safe for string operations');
   } catch (preError) {
    const errorMessage = preError instanceof Error ? preError.message : String(preError);
    console.log('PRE-EXECUTION ERROR:', errorMessage);
    throw new Error(`Parameter validation failed: ${errorMessage}`);
   }
   
   // Execute transaction using the wallet signer's executeTransaction method
   console.log('CALLING signer.executeTransaction...');
   const txResult = await signer.executeTransaction(tx).catch((error: any) => {
    console.log('TRANSACTION EXECUTION FAILED:');
    console.log('Error message:', error.message);
    console.log('Error type:', typeof error);
    console.log('Error stack:', error.stack);
    console.log('Error object keys:', Object.keys(error));
    console.log('Full error:', error);
    
    logger.error('Transaction execution failed', {
     error: error.message,
     stack: error.stack,
     errorType: typeof error,
     errorProps: Object.keys(error)
    });
    throw error;
   });

   // Enhanced debugging for transaction results
   console.log('TRANSACTION RESULT ANALYSIS:');
   console.log(' - Digest:', txResult.digest);
   console.log(' - Effects status:', txResult.effects?.status);
   console.log(' - Raw effects length:', txResult.rawEffects?.length);
   console.log(' - Object changes:', txResult.objectChanges);
   
   // Check for success in different response formats
   const isSuccessful = txResult.effects?.status?.status === 'success' || 
             (txResult.digest && txResult.rawEffects && !txResult.errors);
   
   console.log('SUCCESS DETERMINATION:');
   console.log(' - Effects status success:', txResult.effects?.status?.status === 'success');
   console.log(' - Has digest:', !!txResult.digest);
   console.log(' - Has rawEffects:', !!txResult.rawEffects);
   console.log(' - No errors:', !txResult.errors);
   console.log(' - Final determination:', isSuccessful);

   if (isSuccessful) {
    console.log('TRANSACTION SUCCESS - Querying for object changes...');
    
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
     
     console.log('TRANSACTION DETAILS from SUI Client:');
     console.log(' - Status:', txDetails.effects?.status?.status);
     console.log(' - Object changes:', txDetails.objectChanges);
     
     if (txDetails.objectChanges) {
      const createdObjects = txDetails.objectChanges.filter(
       (change: any) => change.type === 'created'
      );
      const pendingModelObj = createdObjects?.find(
       (obj: any) => obj.type === 'created' && 
       obj.objectType?.includes('PendingModel')
      ) as any;
      
      if (pendingModelObj) {
       createdObjectId = pendingModelObj.objectId;
       console.log('FOUND PENDING MODEL:', createdObjectId);
      } else {
       console.log('CREATED OBJECTS:', createdObjects);
       // Use first created object if PendingModel not found
       if (createdObjects.length > 0) {
        const firstCreated = createdObjects[0] as any;
        createdObjectId = firstCreated.objectId;
        console.log('USING FIRST CREATED OBJECT:', createdObjectId);
       }
      }
     }
    } catch (queryError) {
     console.log('Could not query transaction details:', queryError);
     // Continue with fallback ID
    }

    logger.info('Model uploaded successfully', {
     digest: txResult.digest,
     objectId: createdObjectId,
     title: params.title
    });

    return {
     success: true,
     transactionDigest: txResult.digest,
     objectId: createdObjectId
    };
   } else {
    console.log('TRANSACTION FAILED - Investigating cause...');
    
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
      
      console.log('FAILURE INVESTIGATION:');
      console.log(' - Transaction status:', txDetails.effects?.status?.status);
      console.log(' - Transaction error:', txDetails.effects?.status?.error);
      console.log(' - Gas used:', txDetails.effects?.gasUsed);
      console.log(' - Events:', txDetails.events);
      
      if (txDetails.effects?.status?.status === 'failure') {
       failureReason = txDetails.effects?.status?.error || 'Smart contract execution failed';
      } else if (txDetails.effects?.status?.status === 'success') {
       // Transaction actually succeeded, but dApp Kit response was malformed
       console.log('ACTUALLY SUCCESSFUL - dApp Kit response issue');
       
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
     console.log('Could not investigate failure:', queryError);
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

   console.log('=== VERIFICATION DEBUG ===');
   console.log('Pending Model ID:', pendingModelId);
   console.log('Enclave ID:', params.enclaveId);
   console.log('Quality Score:', params.qualityScore);
   console.log('Security Assessment:', params.securityAssessment);
   console.log('Package ID:', MARKETPLACE_CONFIG.PACKAGE_ID);
   console.log('Registry ID:', MARKETPLACE_CONFIG.REGISTRY_ID);

   // Validate the object exists and is accessible
   try {
    const userAddress = await signer.toSuiAddress();
    console.log('User address:', userAddress);
    
    const objectInfo = await this.suiClient.getObject({
     id: pendingModelId,
     options: { showContent: true, showType: true, showOwner: true }
    });
    
    console.log('Object info:', {
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
    console.error('Object validation failed:', objectError);
    throw new Error(`Cannot access pending model: ${objectError instanceof Error ? objectError.message : String(objectError)}`);
   }

   // Two-step approach: first ensure submission, then complete verification
   logger.info('Preparing verification transaction for model', { pendingModelId });

   // Create single transaction with both operations
   console.log('Creating verification transaction...');
   const tx = new Transaction();
   
   // Create object references
   const pendingModel = tx.object(pendingModelId);
   const registry = tx.object(MARKETPLACE_CONFIG.REGISTRY_ID);
   const clock = tx.object('0x6');

   // Step 1: Submit for verification (changes PENDING -> VERIFYING)
   console.log('Adding submit_for_verification to transaction...');
   tx.moveCall({
    target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::submit_for_verification`,
    arguments: [pendingModel, registry, clock],
   });

   // Step 2: Complete verification (changes VERIFYING -> VERIFIED) 
   console.log('Adding complete_verification to transaction...');
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

   const txResult = await signer.executeTransaction(tx);
   
   console.log('Complete verification transaction result:', JSON.stringify(txResult, null, 2));

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

   if (effects?.status?.status === 'success') {
    const createdObjects = objectChanges?.filter(
     (change: any) => change.type === 'created'
    );
    const verificationObj = createdObjects?.find(
     (obj: any) => obj.type === 'created' && 
     obj.objectType?.includes('VerificationResult')
    );

    logger.info('TEE verification completed', {
     digest: digest,
     verificationId: verificationObj?.objectId,
     qualityScore: params.qualityScore
    });

    return {
     success: true,
     transactionDigest: digest,
     objectId: verificationObj?.objectId
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

   console.log('List on marketplace transaction result:', JSON.stringify(txResult, null, 2));

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

   if (effects?.status?.status === 'success') {
    const createdObjects = objectChanges?.filter(
     (change: any) => change.type === 'created'
    );
    const marketplaceObj = createdObjects?.find(
     (obj: any) => obj.type === 'created' && 
     obj.objectType?.includes('MarketplaceModel')
    );

    logger.info('Model listed on marketplace', {
     digest: digest,
     marketplaceId: marketplaceObj?.objectId
    });

    return {
     success: true,
     transactionDigest: digest,
     objectId: marketplaceObj?.objectId
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
     console.log('Found marketplace models via registry ownership:', response.data.length);
    }
   } catch (registryError) {
    console.log('Registry ownership query failed, trying alternative approach');
   }

   // Approach 2: Event-based query if no direct results
   if (!response || !response.data || response.data.length === 0) {
    console.log('No direct results, using event-based query');
    
    // Query ModelListed events to get marketplace model IDs
    const eventsResponse = await this.suiClient.queryEvents({
     query: {
      MoveEventType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::ModelListed`
     },
     limit,
     order: 'descending'
    });

    if (eventsResponse.data && eventsResponse.data.length > 0) {
     console.log('Found ModelListed events:', eventsResponse.data.length);
     
     // Extract model IDs from events and fetch the actual objects
     const modelPromises = eventsResponse.data.map(async (event) => {
      try {
       const eventData = event.parsedJson as any;
       const modelId = eventData?.model_id;
       
       if (modelId) {
        console.log('Fetching marketplace model:', modelId);
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
       return null;
      } catch (err) {
       console.warn('Failed to fetch model object', { modelId: event.parsedJson, error: err });
       return null;
      }
     });

     const models = await Promise.all(modelPromises);
     const validModels = models.filter(model => model && model.data);
     
     console.log('Successfully fetched marketplace models from events:', validModels.length);
     
     // Transform to expected format
     response = {
      data: validModels.map(model => ({ data: model!.data }))
     };
    } else {
     console.log('No ModelListed events found');
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
   
   console.log('Marketplace models raw data:', {
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
       const modelId = (event.parsedJson as any)?.model_id;
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
       const modelId = (event.parsedJson as any)?.model_id;
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
   console.log('Querying pending models for user:', userAddress);

   // Approach 1: Get marketplace models to see which pending models have been listed
   const marketplaceModels = await this.getMarketplaceModels();
   console.log('Marketplace models found:', marketplaceModels.length);
   
   const listedModelIds = new Set<string>();
   
   // Extract pending model IDs from marketplace models
   if (marketplaceModels.length > 0) {
    console.log('Sample marketplace model:', {
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
     console.log('Found ModelListed events:', eventsResponse.data.length);
     
     eventsResponse.data.forEach(event => {
      const eventData = event.parsedJson as any;
      const pendingModelId = eventData?.pending_model_id;
      if (pendingModelId) {
       listedModelIds.add(pendingModelId);
       console.log('Found listed model from event:', pendingModelId);
      }
     });
    }
   } catch (eventError) {
    console.log('Failed to query events:', eventError);
   }

   console.log('All listed model IDs (from models + events):', Array.from(listedModelIds));

   // Query all objects owned by the user
   const ownedObjects = await this.suiClient.getOwnedObjects({
    owner: userAddress,
    options: {
     showContent: true,
     showType: true,
    },
   });

   console.log('Total owned objects:', ownedObjects.data.length);
   
   // Debug: Log all owned object types to see what we have
   const objectTypes = ownedObjects.data.map(obj => ({
    id: obj.data?.objectId?.slice(0, 8),
    type: obj.data?.type
   }));
   console.log('Owned object types sample:', objectTypes.slice(0, 10));
   
   // Debug: Log all PendingModel objects specifically
   const allPendingModelIds = ownedObjects.data
    .filter(obj => obj.data?.type?.includes('PendingModel'))
    .map(obj => ({
     id: obj.data?.objectId,
     type: obj.data?.type,
     createdAt: (obj.data?.content as any)?.fields?.created_at
    }));
   console.log('ALL PENDING MODELS FOUND:', allPendingModelIds);

   // Filter for PendingModel objects that haven't been listed on marketplace
   const allPendingModels = ownedObjects.data.filter(obj => {
    const objectType = obj.data?.type;
    return objectType?.includes('PendingModel');
   });
   
   console.log(`Found ${allPendingModels.length} total pending models for user`);
   
   const pendingModels = allPendingModels.filter(obj => {
    const objectId = obj.data?.objectId;
    if (!objectId) return false;
    const isListed = listedModelIds.has(objectId);
    
    // Check age and validity - exclude models with invalid dates or older than 7 days
    const content = obj.data?.content as any;
    const createdAt = content?.fields?.created_at;
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    // Filter out models with invalid timestamps (0 or invalid values)
    const createdTimestamp = parseInt(createdAt || '0');
    const hasValidDate = createdTimestamp > 0 && createdTimestamp < now;
    const isOld = hasValidDate && (now - createdTimestamp) > sevenDays;
    
    console.log('Pending model check:', {
     objectId: objectId?.slice(0, 8),
     isListed: isListed,
     isOld: isOld,
     hasValidDate: hasValidDate,
     createdAt: hasValidDate ? new Date(createdTimestamp).toISOString() : 'invalid',
     willInclude: !isListed && !isOld && hasValidDate
    });
    
    // Only include pending models that haven't been listed, aren't too old, and have valid dates
    return !isListed && !isOld && hasValidDate;
   });
   
   const pendingModels = allPendingModels.filter(obj => {
    const objectId = obj.data?.objectId;
    if (!objectId) return false;
    const isListed = listedModelIds.has(objectId);
    return !isListed;
   });

   // Event-based fallback for recently created models
   if (allPendingModels.length === 0) {
    try {
     const recentEvents = await this.suiClient.queryEvents({
      query: {
       MoveEventType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::ModelUploaded`
      },
      limit: 10,
      order: 'descending'
     });

     for (const event of recentEvents.data || []) {
      const eventData = event.parsedJson as any;
      const modelId = eventData?.model_id;
      const eventSender = event.sender;

      if (modelId && eventSender === userAddress) {
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
         console.log('✓ Found recent model via events:', modelId.slice(0, 10) + '...');
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

   console.log(`✓ Found ${pendingModels.length} pending models`);

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
   console.log('Querying purchase records for user:', userAddress);
   
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

   console.log(`Found ${purchaseRecords.length} purchase records for user`);

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
   console.log(`Successfully processed ${validPurchases.length} purchase records`);
   
   return validPurchases;
   
  } catch (error) {
   console.error('Failed to query user purchases:', error);
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
   console.log('Querying completed models for user:', userAddress);

   // Get all marketplace models created by this user
   const marketplaceModels = await this.getMarketplaceModels();
   console.log('Total marketplace models found:', marketplaceModels.length);
   
   const userModels = marketplaceModels.filter(model => {
    const creator = model.data?.content?.fields?.creator;
    return creator === userAddress;
   });

   console.log(`Found ${userModels.length} completed models for user ${userAddress}`);
   
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
   qualityScore: fields.quality_score || 0,
   teeVerified: fields.tee_verified || false,
   currentDownloads: fields.current_downloads || 0,
   totalEarnings: fields.total_earnings || '0',
   listedAt: fields.listed_at || Date.now(),
   pendingModelId: fields.pending_model_id || '',
   verificationId: fields.verification_id || '',
   status: 3 // STATUS_MARKETPLACE (completed)
  };
 }
}