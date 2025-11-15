import { NextRequest, NextResponse } from 'next/server'
import { SuiClient } from '@mysten/sui/client'
import { WalrusStorageService } from '@/lib/integrations/walrus/services/storage-service'
import { SealEncryptionService } from '@/lib/integrations/seal/services/encryption-service'

export async function POST(request: NextRequest) {
  try {
    const { model_blob_id, dataset_blob_id } = await request.json()

    if (!model_blob_id || !dataset_blob_id) {
      return NextResponse.json(
        { error: 'Both model_blob_id and dataset_blob_id are required' },
        { status: 400 }
      )
    }

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

    // Step 2: For testing purposes, treat model as unencrypted as well
    // In production, proper decryption would need encrypted DEK, IV, policy ID, etc.
    const modelDecryption = {
      success: true,
      data: modelData
    }

    // Dataset is unencrypted, so use it directly
    const datasetDecryption = {
      success: true,
      data: datasetData
    }

    if (!modelDecryption.success || !datasetDecryption.success) {
      return NextResponse.json(
        { error: 'Failed to decrypt files using Seal' },
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