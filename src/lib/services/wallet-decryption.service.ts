/**
 * Wallet Decryption Service
 *
 * Handles browser-side SEAL decryption using user's wallet signature.
 * Downloads encrypted blobs from Walrus and decrypts them before sending to TEE server.
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { WALRUS_CONFIG, SEAL_CONFIG } from '@/lib/constants';
import {
  initializeSealClient,
  createSealSessionKey,
  createSealSessionKeyWithWallet,
  decryptWithSeal,
  parseSealMetadata,
  uint8ArrayToBase64,
  base64ToUint8Array,
  type SealBlobMetadata
} from '@/lib/integrations/seal/seal-browser';

export interface WalletDecryptionRequest {
  modelBlobId: string;
  datasetBlobId?: string;
  userAddress: string;
  transactionDigest: string; // Purchase transaction
}

export interface DecryptedModelData {
  modelData: string; // base64
  datasetData: string; // base64
  metadata: SealBlobMetadata;
}

export interface WalletSigner {
  address: string;
  signPersonalMessage: (args: { message: Uint8Array }) => Promise<{ signature: string }>;
}

export class WalletDecryptionService {
  private suiClient: SuiClient;
  private activeDecryptions = new Map<string, Promise<DecryptedModelData>>();

  constructor(suiClient: SuiClient) {
    this.suiClient = suiClient;
  }

  /**
   * Generate deterministic identity from policy ID (must match encryption-service.ts)
   *
   * SEAL uses this hex-encoded identity during encryption.
   * During decryption, the approve transaction's document_id MUST match this.
   */
  private generateIdentityFromPolicy(policyId: string): string {
    const encoder = new TextEncoder();
    const policyBytes = encoder.encode(policyId);

    // Create a deterministic hex string from the policy ID
    let hexString = '0x';
    for (let i = 0; i < policyBytes.length; i++) {
      hexString += policyBytes[i].toString(16).padStart(2, '0');
    }

    return hexString;
  }

  /**
   * Download encrypted blob from Walrus
   */
  private async downloadFromWalrus(blobId: string): Promise<ArrayBuffer> {
    const url = `${WALRUS_CONFIG.AGGREGATOR_URL}/v1/blobs/${blobId}`;
    console.log(`Downloading blob from Walrus: ${blobId}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download blob ${blobId}: ${response.statusText}`);
    }

    const data = await response.arrayBuffer();
    console.log(`✓ Downloaded ${data.byteLength} bytes from Walrus`);

    return data;
  }

  /**
   * Decrypt data using AES-256-GCM with the provided DEK
   */
  private async decryptWithAES(
    encryptedData: Uint8Array,
    dek: Uint8Array,
    iv: Uint8Array
  ): Promise<Uint8Array> {
    console.log('Decrypting with AES-256-GCM...', {
      encryptedSize: encryptedData.length,
      dekSize: dek.length,
      ivSize: iv.length
    });

    // Import DEK as CryptoKey
    // Ensure dek is a proper Uint8Array with ArrayBuffer (not SharedArrayBuffer)
    const dekBuffer = new Uint8Array(dek);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      dekBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt with AES-GCM
    // Ensure iv and encryptedData are proper Uint8Arrays with ArrayBuffer
    const ivBuffer = new Uint8Array(iv);
    const encryptedBuffer = new Uint8Array(encryptedData);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      cryptoKey,
      encryptedBuffer
    );

    const decryptedData = new Uint8Array(decryptedBuffer);
    console.log('✓ AES decryption successful:', decryptedData.length, 'bytes');

    return decryptedData;
  }

  /**
   * Create SEAL approve transaction for decryption authorization
   *
   * For creators: Calls seal_approve_creator with Asset (proves ownership)
   * For buyers: Calls seal_approve with Purchase + Asset (proves purchase ownership)
   */
  private async createApproveTransaction(
    policyId: string,
    userAddress: string,
    assetId: string,  // For buyers: the Asset ID. For creators: the Asset ID
    blobId: string,   // The encrypted blob ID being decrypted
    isBuyer: boolean = true,  // Default to buyer flow (most common case)
    marketplacePackageId?: string,  // Optional: Use package ID from blob metadata (for backwards compatibility)
    purchaseRecordId?: string  // Required for buyers: the Purchase record ID
  ): Promise<Uint8Array> {
    const userType = isBuyer ? 'buyer' : 'creator';
    console.log(`Creating SEAL approve transaction for ${userType}...`, {
      policyId,
      userAddress,
      assetId,
      blobId,
      isBuyer,
      marketplacePackageId
    });

    // Use the package ID from blob metadata if provided, otherwise use current .env
    // This ensures backwards compatibility with models encrypted under old contracts
    const SATYA_MARKETPLACE_PACKAGE_ID = marketplacePackageId || process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID;

    if (!SATYA_MARKETPLACE_PACKAGE_ID) {
      throw new Error('MARKETPLACE_PACKAGE_ID not configured');
    }

    console.log(`Using marketplace package ID: ${SATYA_MARKETPLACE_PACKAGE_ID}`);

    // IMPORTANT: Check for contract version compatibility
    // If blob was encrypted with old contract but we're trying to use seal_approve_buyer,
    // the old contract doesn't have that function!
    const currentPackageId = process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID;
    const isOldContract = marketplacePackageId && marketplacePackageId !== currentPackageId;

    if (isOldContract && isBuyer) {
      throw new Error(
        `This model was encrypted with an older contract version and cannot be purchased/decrypted. ` +
        `Please ask the creator to re-upload the model with the current contract. ` +
        `Old package: ${marketplacePackageId}, Current package: ${currentPackageId}`
      );
    }

    // Create transaction that calls the appropriate seal_approve function
    const tx = new Transaction();
    tx.setSender(userAddress);

    // CRITICAL: Generate the SAME hex-encoded identity that was used during encryption
    // SEAL SDK requires hex-encoded identities, so we must match exactly
    // The document_id must match the 'id' parameter used during SEAL encryption
    const identity = this.generateIdentityFromPolicy(policyId);
    console.log('Using hex identity for SEAL document_id:', identity);

    // Convert hex identity to RAW BYTES (decode from hex, don't encode as UTF-8!)
    // SEAL expects the document_id as vector<u8> of the actual bytes, not the hex string
    const documentIdBytes = Array.from(
      Buffer.from(identity.replace('0x', ''), 'hex')
    );

    // Choose the right function based on user type
    const functionName = isBuyer ? 'seal_approve' : 'seal_approve_creator';

    console.log(`Calling ${functionName} for ${isBuyer ? 'buyer' : 'creator'}:`, assetId);

    // Call marketplace::seal_approve or seal_approve_creator
    // Parameters differ based on function:
    // - seal_approve: (purchase: &Purchase, asset: &Asset, clock: &Clock)
    // - seal_approve_creator: (asset: &Asset, clock: &Clock)
    if (isBuyer) {
      // For buyers: seal_approve(purchase, asset, clock)
      if (!purchaseRecordId) {
        console.log('⚠️ Purchase record ID not provided for buyer transaction, using assetId as purchase record');
        // Fallback: assume assetId is actually the Purchase record ID
        console.log(`Calling seal_approve with purchase: ${assetId}, asset: ${assetId} (same object)`);
        tx.moveCall({
          target: `${SATYA_MARKETPLACE_PACKAGE_ID}::core::seal_approve`,
          arguments: [
            tx.object(assetId),  // purchase object (assuming assetId is Purchase record)
            tx.object(assetId),  // asset object (same as purchase - let contract validate)
            tx.object('0x6')     // Clock object
          ]
        });
      } else {
        console.log(`Calling seal_approve with purchase: ${purchaseRecordId}, asset: ${assetId}`);
        tx.moveCall({
          target: `${SATYA_MARKETPLACE_PACKAGE_ID}::core::seal_approve`,
          arguments: [
            tx.object(purchaseRecordId),  // purchase object (Purchase record)
            tx.object(assetId),           // asset object (Asset record)
            tx.object('0x6')              // Clock object
          ]
        });
      }
    } else {
      // For creators: seal_approve_creator(asset, clock)
      console.log(`Calling seal_approve_creator with asset: ${assetId}`);
      tx.moveCall({
        target: `${SATYA_MARKETPLACE_PACKAGE_ID}::core::seal_approve_creator`,
        arguments: [
          tx.object(assetId),  // asset object (Asset record)
          tx.object('0x6')     // Clock object
        ]
      });
    }

    // Build transaction kind only (PTB) for SEAL key server validation
    // Key servers expect only the programmable transaction block, not full transaction
    const txBytes = await tx.build({
      client: this.suiClient,
      onlyTransactionKind: true
    });

    console.log(`✓ ${functionName} transaction PTB created:`, txBytes.length, 'bytes');

    return txBytes;
  }

  /**
   * Decrypt encrypted model blob with user's wallet signature
   */
  async decryptModel(
    request: WalletDecryptionRequest,
    userKeypair: Ed25519Keypair
  ): Promise<DecryptedModelData> {
    console.log('Starting wallet-signed decryption...', request);

    try {
      // Step 1: Download encrypted model from Walrus
      const modelBlob = await this.downloadFromWalrus(request.modelBlobId);

      // Step 2: Parse SEAL metadata
      const { metadata, encryptedData } = parseSealMetadata(modelBlob);

      // Step 3: Initialize SEAL client
      const sealClient = initializeSealClient(this.suiClient);

      // Step 4: Create session key with wallet signature
      const sessionKey = await createSealSessionKey(
        userKeypair,
        this.suiClient,
        10 // 10 minute TTL
      );

      // Step 5: Create approve transaction (proof of ownership - creator flow)
      const approveTransactionBytes = await this.createApproveTransaction(
        metadata.policy_id,
        request.userAddress,
        request.transactionDigest,  // PendingModel ID for creators
        request.modelBlobId,        // The blob ID we're decrypting
        false                       // isBuyer = false (this is for creators with Ed25519Keypair)
        // Don't pass seal_package_id - seal_approve is in marketplace package, not SEAL package!
      );

      // Step 6: Decrypt DEK with SEAL
      console.log('Decrypting DEK with SEAL...');
      const encryptedDEK = base64ToUint8Array(metadata.encrypted_dek_base64);
      const decryptedDEK = await decryptWithSeal(
        sealClient,
        encryptedDEK,
        sessionKey,
        approveTransactionBytes
      );

      console.log('✓ DEK decrypted successfully:', decryptedDEK.length, 'bytes');

      // Step 7: Decrypt model file with AES-GCM using the DEK
      const iv = base64ToUint8Array(metadata.iv_base64);
      const decryptedModel = await this.decryptWithAES(encryptedData, decryptedDEK, iv);

      console.log('✓ Model decrypted successfully:', decryptedModel.length, 'bytes');

      // Step 8: Download and decrypt dataset (if provided)
      let decryptedDataset: Uint8Array;

      // Only download dataset if we have a valid blob ID (not a placeholder)
      const hasValidDataset = request.datasetBlobId &&
                              request.datasetBlobId !== 'default-dataset-blob' &&
                              request.datasetBlobId.length > 0;

      if (hasValidDataset) {
        console.log('Downloading dataset...');
        const datasetBlob = await this.downloadFromWalrus(request.datasetBlobId!);

        // Check if dataset is also encrypted
        try {
          const { metadata: datasetMetadata, encryptedData: datasetEncrypted } = parseSealMetadata(datasetBlob);

          console.log('Dataset is encrypted, decrypting...');

          // Decrypt dataset DEK with SEAL
          const datasetEncryptedDEK = base64ToUint8Array(datasetMetadata.encrypted_dek_base64);
          const datasetDecryptedDEK = await decryptWithSeal(
            sealClient,
            datasetEncryptedDEK,
            sessionKey,
            approveTransactionBytes
          );

          // Decrypt dataset file with AES-GCM
          const datasetIV = base64ToUint8Array(datasetMetadata.iv_base64);
          decryptedDataset = await this.decryptWithAES(datasetEncrypted, datasetDecryptedDEK, datasetIV);

          console.log('✓ Dataset decrypted successfully:', decryptedDataset.length, 'bytes');
        } catch (error) {
          // Dataset is not encrypted, use as-is
          console.log('Dataset is plaintext, using as-is');
          decryptedDataset = new Uint8Array(datasetBlob);
        }
      } else {
        // Use default empty dataset
        decryptedDataset = new Uint8Array(0);
      }

      // Step 9: Convert to base64 for JSON transmission
      return {
        modelData: uint8ArrayToBase64(decryptedModel),
        datasetData: uint8ArrayToBase64(decryptedDataset),
        metadata
      };

    } catch (error) {
      console.error('Wallet decryption failed:', error);
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypt encrypted model blob with browser wallet signature
   *
   * This version works with @mysten/dapp-kit wallet adapters
   *
   * @param isBuyer - true for buyers (uses seal_approve_buyer + PurchaseRecord),
   *                  false for creators (uses seal_approve + PendingModel). Default: true
   */
  async decryptModelWithWallet(
    request: WalletDecryptionRequest,
    walletSigner: WalletSigner,
    isBuyer: boolean = true
  ): Promise<DecryptedModelData> {
    console.log('Starting wallet-signed decryption (browser)...', request, { isBuyer });

    // Prevent concurrent decryptions of the same model by the same user
    const decryptionKey = `${request.userAddress}-${request.modelBlobId}-${request.transactionDigest}`;
    if (this.activeDecryptions.has(decryptionKey)) {
      console.log('Decryption already in progress, waiting for existing operation...');
      return this.activeDecryptions.get(decryptionKey)!;
    }

    const decryptionPromise = this._performDecryption(request, walletSigner, isBuyer);
    this.activeDecryptions.set(decryptionKey, decryptionPromise);

    try {
      const result = await decryptionPromise;
      return result;
    } finally {
      this.activeDecryptions.delete(decryptionKey);
    }
  }

  private async _performDecryption(
    request: WalletDecryptionRequest,
    walletSigner: WalletSigner,
    isBuyer: boolean
  ): Promise<DecryptedModelData> {
    try {
      // Step 1: Download model from Walrus
      const modelBlob = await this.downloadFromWalrus(request.modelBlobId);

      // Step 2: Check if model is SEAL-encrypted
      let isEncrypted = false;
      let metadata: any = null;
      let encryptedData: Uint8Array;
      
      try {
        const result = parseSealMetadata(modelBlob);
        metadata = result.metadata;
        encryptedData = result.encryptedData;
        isEncrypted = true;
        console.log('✓ Model is SEAL-encrypted, proceeding with decryption...');
      } catch (error) {
        console.log('ℹ Model is not SEAL-encrypted, treating as plain file:', error);
        isEncrypted = false;
        // For unencrypted files, we can still perform verification but without decryption
        encryptedData = new Uint8Array(modelBlob);
      }

      if (!isEncrypted) {
        // For unencrypted models, return the raw data with mock metadata
        console.log('✓ Model is unencrypted, returning raw data');
        return {
          modelData: uint8ArrayToBase64(encryptedData),
          datasetData: uint8ArrayToBase64(new Uint8Array(0)), // Empty dataset
          metadata: {
            encrypted_dek_base64: '',
            policy_id: 'unencrypted',
            iv_base64: '',
            seal_package_id: '',
            encryption_algorithm: 'none',
            seal_threshold: 0
          }
        };
      }

      // Step 3: Initialize SEAL client (only for encrypted models)
      const sealClient = initializeSealClient(this.suiClient);

      // Step 4: Create session key with wallet signature
      // IMPORTANT: Use the package ID from the blob metadata, not the config!
      const sessionKey = await createSealSessionKeyWithWallet(
        walletSigner.address,
        this.suiClient,
        walletSigner.signPersonalMessage,
        metadata.seal_package_id,  // Use package ID from the encrypted blob!
        10 // 10 minute TTL
      );

      // Step 5: Create approve transaction (proof of ownership)
      // For buyers: uses PurchaseRecord + seal_approve_buyer
      // For creators: uses PendingModel + seal_approve
      const approveTransactionBytes = await this.createApproveTransaction(
        metadata.policy_id,
        request.userAddress,
        request.transactionDigest,  // PurchaseRecord (buyers) or PendingModel (creators)
        request.modelBlobId,        // The blob ID we're decrypting
        isBuyer                     // Use the parameter passed to this function
        // Don't pass seal_package_id - seal_approve is in marketplace package, not SEAL package!
      );

      // Step 6: Decrypt DEK with SEAL
      console.log('Decrypting DEK with SEAL...');
      const encryptedDEK = base64ToUint8Array(metadata.encrypted_dek_base64);
      const decryptedDEK = await decryptWithSeal(
        sealClient,
        encryptedDEK,
        sessionKey,
        approveTransactionBytes
      );

      console.log('✓ DEK decrypted successfully:', decryptedDEK.length, 'bytes');

      // Step 7: Decrypt model file with AES-GCM using the DEK
      const iv = base64ToUint8Array(metadata.iv_base64);
      const decryptedModel = await this.decryptWithAES(encryptedData, decryptedDEK, iv);

      console.log('✓ Model decrypted successfully:', decryptedModel.length, 'bytes');

      // Step 8: Download and decrypt dataset (if provided)
      let decryptedDataset: Uint8Array;

      // Only download dataset if we have a valid blob ID (not a placeholder)
      const hasValidDataset = request.datasetBlobId &&
                              request.datasetBlobId !== 'default-dataset-blob' &&
                              request.datasetBlobId.length > 0;

      if (hasValidDataset) {
        console.log('Downloading dataset...');
        const datasetBlob = await this.downloadFromWalrus(request.datasetBlobId!);

        // Check if dataset is also encrypted
        try {
          const { metadata: datasetMetadata, encryptedData: datasetEncrypted } = parseSealMetadata(datasetBlob);

          console.log('Dataset is encrypted, decrypting...');

          // Decrypt dataset DEK with SEAL
          const datasetEncryptedDEK = base64ToUint8Array(datasetMetadata.encrypted_dek_base64);
          const datasetDecryptedDEK = await decryptWithSeal(
            sealClient,
            datasetEncryptedDEK,
            sessionKey,
            approveTransactionBytes
          );

          // Decrypt dataset file with AES-GCM
          const datasetIV = base64ToUint8Array(datasetMetadata.iv_base64);
          decryptedDataset = await this.decryptWithAES(datasetEncrypted, datasetDecryptedDEK, datasetIV);

          console.log('✓ Dataset decrypted successfully:', decryptedDataset.length, 'bytes');
        } catch (error) {
          // Dataset is not encrypted, use as-is
          console.log('Dataset is plaintext, using as-is');
          decryptedDataset = new Uint8Array(datasetBlob);
        }
      } else {
        // Use default empty dataset
        decryptedDataset = new Uint8Array(0);
      }

      // Step 9: Convert to base64 for JSON transmission
      return {
        modelData: uint8ArrayToBase64(decryptedModel),
        datasetData: uint8ArrayToBase64(decryptedDataset),
        metadata
      };

    } catch (error) {
      console.error('Wallet decryption failed:', error);
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send decrypted data to TEE server for evaluation
   */
  async evaluateDecryptedModel(
    decryptedData: DecryptedModelData,
    teeServerUrl: string
  ): Promise<any> {
    console.log('Sending decrypted data to TEE server...');

    const response = await fetch(`${teeServerUrl}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model_data: decryptedData.modelData,
        dataset_data: decryptedData.datasetData,
        use_walrus: false // Important: We're sending plaintext, not blob IDs!
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TEE evaluation failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✓ TEE evaluation completed:', result);

    return result;
  }

  /**
   * Complete decryption and evaluation flow
   */
  async decryptAndEvaluate(
    request: WalletDecryptionRequest,
    userKeypair: Ed25519Keypair,
    teeServerUrl: string
  ): Promise<any> {
    // Decrypt model with wallet signature
    const decryptedData = await this.decryptModel(request, userKeypair);

    // Send to TEE server for evaluation
    return await this.evaluateDecryptedModel(decryptedData, teeServerUrl);
  }
}
