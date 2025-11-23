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
    // Try to parse as encrypted blob first
    // Expected format: [metadata_length(4)] [metadata_json] [encrypted_data]
    if (blobData.length < 4) {
      // Too small to be encrypted, treat as raw data
      return { success: true, data: blobData }
    }

    // Read metadata length (first 4 bytes)
    const metadataLengthView = new DataView(blobData.buffer, 0, 4)
    const metadataLength = metadataLengthView.getUint32(0, true) // little-endian

    // Validate metadata length
    if (metadataLength < 10 || metadataLength > 1000) {
      // Invalid metadata length, likely not encrypted - treat as raw data
      return { success: true, data: blobData }
    }

    if (blobData.length < 4 + metadataLength) {
      // Not enough data for metadata, treat as raw data
      return { success: true, data: blobData }
    }

    // Extract metadata
    const metadataBytes = blobData.slice(4, 4 + metadataLength)
    const metadataString = new TextDecoder().decode(metadataBytes)
    
    let metadata: { dek_base64: string; iv_base64: string }
    try {
      metadata = JSON.parse(metadataString)
    } catch {
      // Invalid JSON, treat as raw data
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

  const walrusService = new WalrusStorageService()
  // Create a temporary SUI client for this API call
  const suiClient = new SuiClient({ url: process.env.NEXT_PUBLIC_SUI_NETWORK_URL || 'https://fullnode.testnet.sui.io' });
  const sealService = new SealEncryptionService(suiClient)

  // Step 1: Download encrypted files from Walrus
  const modelData = await walrusService.downloadBlob(model_blob_id)
  const datasetData = await walrusService.downloadBlob(dataset_blob_id)

  if (!modelData || !datasetData) {
   return NextResponse.json(
    { error: 'Failed to download encrypted files from Walrus' },
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
    
    const modelDecryptionResult = await decryptBlobData(modelData)
    modelDecryption = modelDecryptionResult

    const datasetDecryptionResult = await decryptBlobData(datasetData)
    datasetDecryption = datasetDecryptionResult

  } catch (error) {
    console.error('Decryption error:', error)
    modelDecryption = { success: false, error: 'Failed to decrypt model data' }
    datasetDecryption = { success: false, error: 'Failed to decrypt dataset data' }
  }

  if (!modelDecryption.success || !datasetDecryption.success) {
   const errors: string[] = []
   if (!modelDecryption.success) {
     errors.push(`Model: ${modelDecryption.error || 'Unknown error'}`)
   }
   if (!datasetDecryption.success) {
     errors.push(`Dataset: ${datasetDecryption.error || 'Unknown error'}`)
   }
   
   return NextResponse.json(
    { error: `Decryption failed: ${errors.join(', ')}` },
    { status: 500 }
   )
  }

  // Step 3: Return decrypted data
  return NextResponse.json({
   success: true,
   decrypted_model_data: Array.from(modelDecryption.data!),
   decrypted_dataset_data: Array.from(datasetDecryption.data!),
   model_blob_id,
   dataset_blob_id
  })

 } catch (error) {
  console.error('Decrypt blobs API error:', error)
  return NextResponse.json(
   { error: 'Internal server error during decryption' },
   { status: 500 }
  )
 }
}