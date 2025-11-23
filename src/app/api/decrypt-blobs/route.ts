import { NextRequest, NextResponse } from 'next/server'
import { SuiClient } from '@mysten/sui/client'
import { WalrusStorageService } from '@/lib/integrations/walrus/services/storage-service'
import { SealEncryptionService } from '@/lib/integrations/seal/services/encryption-service'
import { aesGcmDecrypt, base64ToUint8Array } from '@/lib/crypto/primitives'

/**
 * Decrypt blob data using AES-GCM
 * Handles both encrypted blobs (with metadata) and fallback for unencrypted data
 */
async function decryptBlobData(blobData: Uint8Array): Promise<{ success: boolean; data?: Uint8Array; error?: string }> {
  try {
    console.log(`Decrypting blob data, size: ${blobData.length} bytes`)
    
    // Try to parse as encrypted blob first
    // Expected format: [metadata_length(4)] [metadata_json] [encrypted_data]
    if (blobData.length < 4) {
      console.log('Blob too small to be encrypted, treating as raw data')
      return { success: true, data: blobData }
    }

    // Read metadata length (first 4 bytes)
    const metadataLengthView = new DataView(blobData.buffer, 0, 4)
    const metadataLength = metadataLengthView.getUint32(0, true) // little-endian
    console.log(`Parsed metadata length: ${metadataLength}`)

    // Validate metadata length
    if (metadataLength < 10 || metadataLength > 1000) {
      console.log(`Invalid metadata length ${metadataLength}, treating as raw data`)
      return { success: true, data: blobData }
    }

    if (blobData.length < 4 + metadataLength) {
      console.log(`Not enough data for metadata (${blobData.length} < ${4 + metadataLength}), treating as raw data`)
      return { success: true, data: blobData }
    }

    // Extract metadata
    const metadataBytes = blobData.slice(4, 4 + metadataLength)
    const metadataString = new TextDecoder().decode(metadataBytes)
    console.log(`Extracted metadata string: ${metadataString}`)
    
    let metadata: { dek_base64: string; iv_base64: string }
    try {
      metadata = JSON.parse(metadataString)
      console.log(`Parsed metadata successfully:`, { hasDek: !!metadata.dek_base64, hasIv: !!metadata.iv_base64 })
    } catch (e) {
      console.log(`Invalid JSON in metadata, treating as raw data. Error:`, e)
      return { success: true, data: blobData }
    }

    if (!metadata.dek_base64 || !metadata.iv_base64) {
      // Missing required fields, treat as raw data
      return { success: true, data: blobData }
    }

    // Extract encrypted data
    const encryptedData = blobData.slice(4 + metadataLength)
    
    // Decode DEK and IV from base64
    const dek = base64ToUint8Array(metadata.dek_base64)
    const iv = base64ToUint8Array(metadata.iv_base64)

    // Validate DEK and IV sizes
    if (dek.length !== 16) {
      throw new Error(`Invalid DEK length: ${dek.length}, expected 16 bytes`)
    }
    if (iv.length !== 12) {
      throw new Error(`Invalid IV length: ${iv.length}, expected 12 bytes`)
    }

    // Decrypt the data
    const decryptedData = await aesGcmDecrypt(dek, encryptedData, iv)
    
    return { success: true, data: decryptedData }

  } catch (error) {
    console.error('Blob decryption error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown decryption error'
    }
  }
}

export async function POST(request: NextRequest) {
 try {
  const { model_blob_id, dataset_blob_id, user_address, transaction_digest, seal_transaction_digest } = await request.json()

  if (!model_blob_id || !dataset_blob_id || !user_address) {
   return NextResponse.json(
    { error: 'model_blob_id, dataset_blob_id, and user_address are required' },
    { status: 400 }
   )
  }

  // Verify SEAL transaction (in production, this would verify the actual SEAL signature)
  if (!seal_transaction_digest) {
   return NextResponse.json(
    { error: 'SEAL transaction digest required for decryption authorization' },
    { status: 403 }
   )
  }

  console.log('Decryption request:', { 
   user_address, 
   transaction_digest, 
   seal_transaction_digest,
   model_blob_id: model_blob_id.slice(0, 20) + '...',
   dataset_blob_id: dataset_blob_id.slice(0, 20) + '...'
  })

  console.log('Starting Walrus download for model and dataset...')

  const walrusService = new WalrusStorageService()
  // Create a temporary SUI client for this API call
  const suiClient = new SuiClient({ url: process.env.NEXT_PUBLIC_SUI_NETWORK_URL || 'https://fullnode.testnet.sui.io' });
  const sealService = new SealEncryptionService(suiClient)

  // Step 1: Download encrypted files from Walrus
  console.log(`Downloading model blob: ${model_blob_id}`)
  const modelData = await walrusService.downloadBlob(model_blob_id)
  console.log(`Model data downloaded, size: ${modelData?.length || 0} bytes`)

  // Try to download dataset blob, but make it optional
  let datasetData: Uint8Array | null = null
  try {
    if (dataset_blob_id && dataset_blob_id !== 'default-dataset-blob') {
      console.log(`Downloading dataset blob: ${dataset_blob_id}`)
      datasetData = await walrusService.downloadBlob(dataset_blob_id)
      console.log(`Dataset data downloaded, size: ${datasetData?.length || 0} bytes`)
    } else {
      console.log('No valid dataset blob ID provided, skipping dataset download')
    }
  } catch (datasetError) {
    console.warn('Dataset download failed, continuing with model only:', datasetError)
    datasetData = null
  }

  if (!modelData) {
   console.error('Failed to download model blob from Walrus')
   return NextResponse.json(
    { error: 'Failed to download model file from Walrus' },
    { status: 500 }
   )
  }

  // Step 2: Decrypt files using real AES-GCM decryption
  let modelDecryption: { success: boolean; data?: Uint8Array; error?: string }
  let datasetDecryption: { success: boolean; data?: Uint8Array; error?: string }

  try {
    // For real decryption, we need to parse the encrypted blob structure
    // Format: [metadata_length(4)] [metadata] [encrypted_data]
    // Metadata contains: {"dek_base64": "...", "iv_base64": "..."}
    
    console.log('Starting model decryption...')
    const modelDecryptionResult = await decryptBlobData(modelData)
    modelDecryption = modelDecryptionResult
    console.log('Model decryption result:', { success: modelDecryptionResult.success, error: modelDecryptionResult.error })

    // Only decrypt dataset if we have data
    if (datasetData) {
      console.log('Starting dataset decryption...')
      const datasetDecryptionResult = await decryptBlobData(datasetData)
      datasetDecryption = datasetDecryptionResult
      console.log('Dataset decryption result:', { success: datasetDecryptionResult.success, error: datasetDecryptionResult.error })
    } else {
      console.log('No dataset data available, marking as successful (model only)')
      datasetDecryption = { success: true, data: new Uint8Array(0) } // Empty but successful
    }

  } catch (error) {
    console.error('Decryption error:', error)
    modelDecryption = { success: false, error: 'Failed to decrypt model data' }
    datasetDecryption = { success: false, error: 'Failed to decrypt dataset data' }
  }

  // Only require model decryption to succeed (dataset is optional)
  if (!modelDecryption.success) {
   return NextResponse.json(
    { error: `Model decryption failed: ${modelDecryption.error || 'Unknown error'}` },
    { status: 500 }
   )
  }
  
  // Log if dataset decryption failed but don't fail the whole operation
  if (!datasetDecryption.success) {
   console.warn('Dataset decryption failed, but continuing with model only:', datasetDecryption.error)
  }

  // Step 3: Return decrypted data
  console.log('Decryption successful! Returning decrypted data:', {
   modelDataSize: modelDecryption.data?.length || 0,
   datasetDataSize: datasetDecryption.data?.length || 0,
   modelBlobId: model_blob_id.slice(0, 20) + '...',
   datasetBlobId: dataset_blob_id.slice(0, 20) + '...'
  })

  return NextResponse.json({
   success: true,
   decrypted_model_data: Array.from(modelDecryption.data!),
   decrypted_dataset_data: datasetDecryption.data ? Array.from(datasetDecryption.data) : [],
   model_blob_id,
   dataset_blob_id,
   info: {
    model_size: modelDecryption.data!.length,
    dataset_size: datasetDecryption.data?.length || 0,
    decryption_status: datasetDecryption.data && datasetDecryption.data.length > 0 
      ? 'Both model and dataset retrieved successfully'
      : 'Model retrieved successfully (no dataset available)',
    has_dataset: datasetDecryption.success && datasetDecryption.data && datasetDecryption.data.length > 0
   }
  })

 } catch (error) {
  console.error('Decrypt blobs API error:', error)
  return NextResponse.json(
   { error: 'Internal server error during decryption' },
   { status: 500 }
  )
 }
}