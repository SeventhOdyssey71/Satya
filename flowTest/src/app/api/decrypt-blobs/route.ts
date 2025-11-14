import { NextRequest, NextResponse } from 'next/server'
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
    const sealService = new SealEncryptionService()

    // Step 1: Download encrypted files from Walrus
    const modelResult = await walrusService.downloadFile(model_blob_id)
    const datasetResult = await walrusService.downloadFile(dataset_blob_id)

    if (!modelResult.success || !datasetResult.success) {
      return NextResponse.json(
        { error: 'Failed to download encrypted files from Walrus' },
        { status: 500 }
      )
    }

    // Step 2: Decrypt the files using Seal
    const modelDecryption = await sealService.decryptData(
      modelResult.data!,
      'payment-gated' // Use the policy type used during encryption
    )

    const datasetDecryption = await sealService.decryptData(
      datasetResult.data!,
      'payment-gated' // Use the policy type used during encryption
    )

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