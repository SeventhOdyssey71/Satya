'use client'

import React, { useState } from 'react'
import { X, Download, Lock, Unlock, CheckCircle, FileText } from 'lucide-react'
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit'
import { WalletDecryptionService } from '@/lib/services/wallet-decryption.service'

interface DecryptionModalProps {
 model: any
 onClose: () => void
}

export default function DecryptionModal({ model, onClose }: DecryptionModalProps) {
 const [isDecrypting, setIsDecrypting] = useState(false)
 const [isComplete, setIsComplete] = useState(false)
 const [downloadUrls, setDownloadUrls] = useState<{model?: string, dataset?: string}>({})
 const [error, setError] = useState<string | null>(null)
 
 const account = useCurrentAccount()
 const { mutateAsync: signPersonalMessage } = useSignPersonalMessage()
 const suiClient = useSuiClient()

 const handleDecrypt = async () => {
  setIsDecrypting(true)
  setError(null)

  try {
   if (!account) {
    throw new Error('Please connect your wallet to decrypt the model.')
   }

   // Get blob IDs and purchase record from model data
   const modelBlobId = model.modelBlobId || model.walrusBlobId
   // Filter out placeholder dataset blob IDs
   const datasetBlobId = (model.datasetBlobId && model.datasetBlobId !== 'default-dataset-blob')
     ? model.datasetBlobId
     : undefined
   const purchaseRecordId = model.purchaseRecordId || model.id

   if (!modelBlobId) {
    throw new Error('Model blob ID not found. Cannot decrypt without storage reference.')
   }

   if (!purchaseRecordId) {
    throw new Error('Purchase record ID not found. Cannot verify ownership.')
   }

   console.log('Starting wallet-signed SEAL decryption for buyer...', {
    modelBlobId,
    datasetBlobId,
    purchaseRecordId,
    buyer: account.address
   })

   // Use the WalletDecryptionService (same as ModelVerificationFlow)
   const decryptionService = new WalletDecryptionService(suiClient)

   // Create wallet signer interface
   const walletSigner = {
    address: account.address,
    signPersonalMessage: async (args: { message: Uint8Array }) => {
     return await signPersonalMessage({ message: args.message })
    }
   }

   // Decrypt model with wallet signature
   console.log('Decrypting model with buyer wallet signature...')
   const decryptedData = await decryptionService.decryptModelWithWallet(
    {
     modelBlobId: modelBlobId,
     datasetBlobId: datasetBlobId,
     userAddress: account.address,
     transactionDigest: purchaseRecordId // Use purchase record as proof of ownership
    },
    walletSigner
   )

   console.log('✓ Model decrypted successfully in browser')

   // Convert base64 to Uint8Array for download
   const modelData = Uint8Array.from(atob(decryptedData.modelData), c => c.charCodeAt(0))
   const datasetData = Uint8Array.from(atob(decryptedData.datasetData), c => c.charCodeAt(0))

   setIsDecrypting(false)
   setIsComplete(true)

   // Create downloadable blobs from the decrypted data
   const urls: {model?: string, dataset?: string} = {}

   // Handle model data
   if (modelData && modelData.length > 0) {
    const modelBlob = new Blob([modelData], {
     type: 'application/octet-stream'
    })
    urls.model = URL.createObjectURL(modelBlob)
    console.log('✓ Model download ready:', modelData.length, 'bytes')
   }

   // Handle dataset data (only if available and not empty)
   if (datasetData && datasetData.length > 0) {
    const datasetBlob = new Blob([datasetData], {
     type: 'application/octet-stream'
    })
    urls.dataset = URL.createObjectURL(datasetBlob)
    console.log('✓ Dataset download ready:', datasetData.length, 'bytes')
   } else {
    console.log('No dataset data available for download')
   }

   setDownloadUrls(urls)

  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Decryption failed. Please try again.'
   console.warn('Decryption failed:', errorMessage)
   setError(errorMessage)
   setIsDecrypting(false)
  }
 }

 const handleDownload = (type: 'model' | 'dataset') => {
  const url = downloadUrls[type]
  if (!url) return
  
  // Download the decrypted file
  const link = document.createElement('a')
  link.href = url
  link.download = `${model.title.replace(/[^a-zA-Z0-9]/g, '_')}_${type}.bin`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
 }

 const handleDownloadAll = () => {
  if (downloadUrls.model) handleDownload('model')
  if (downloadUrls.dataset) handleDownload('dataset')
  
  // If no dataset, just download the model
  if (downloadUrls.model && !downloadUrls.dataset) {
   console.log('Downloaded model only (no dataset available)')
  }
 }

 // Cleanup URLs when component unmounts or modal closes
 React.useEffect(() => {
  return () => {
   Object.values(downloadUrls).forEach(url => {
    if (url) URL.revokeObjectURL(url)
   })
  }
 }, [downloadUrls])

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
   <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
    <div className="flex items-center justify-between mb-6">
     <h2 className="text-xl font-bold text-gray-900">Access Model</h2>
     <button
      onClick={onClose}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
     >
      <X className="w-5 h-5" />
     </button>
    </div>

    <div className="space-y-4">
     <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
       {error ? (
        <X className="w-8 h-8 text-red-600" />
       ) : isComplete ? (
        <Unlock className="w-8 h-8 text-green-600" />
       ) : (
        <Lock className="w-8 h-8 text-blue-600" />
       )}
      </div>
      <h3 className="font-medium text-gray-900 mb-2">{model.title}</h3>
      <p className="text-sm text-gray-600">
       {error
        ? 'Decryption failed'
        : isComplete 
         ? 'Model decrypted successfully!'
         : isDecrypting 
          ? 'Creating SEAL key verification transaction...'
          : 'Click to verify purchase and decrypt model'
       }
      </p>
     </div>

     {error && (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
       <div className="flex items-center gap-2 text-red-800">
        <X className="w-4 h-4" />
        <span className="text-sm font-medium">Decryption Error</span>
       </div>
       <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
     )}

     {isDecrypting && (
      <div className="space-y-2">
       <div className="w-full bg-blue-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }} />
       </div>
       <p className="text-xs text-gray-500 text-center">
        Creating cryptographic proof of purchase authorization...
       </p>
      </div>
     )}

     {isComplete && (
      <div className="space-y-3">
       <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-800">
         <CheckCircle className="w-4 h-4" />
         <span className="text-sm font-medium">Decryption Complete</span>
        </div>
        <p className="text-sm text-green-700 mt-1">
         Your files are ready for download
        </p>
       </div>

       <div className="grid grid-cols-2 gap-2">
        {downloadUrls.model && (
         <button
          onClick={() => handleDownload('model')}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
         >
          <FileText className="w-4 h-4" />
          Model
         </button>
        )}
        {downloadUrls.dataset && (
         <button
          onClick={() => handleDownload('dataset')}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
         >
          <Download className="w-4 h-4" />
          Dataset
         </button>
        )}
       </div>
      </div>
     )}

     <div className="flex gap-3">
      {!isComplete && !isDecrypting && !error && (
       <button
        onClick={handleDecrypt}
        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
       >
        Verify & Decrypt
       </button>
      )}

      {error && (
       <button
        onClick={() => {
         setError(null)
         handleDecrypt()
        }}
        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
       >
        Try Again
       </button>
      )}
      
      {isComplete && (downloadUrls.model || downloadUrls.dataset) && (
       <button
        onClick={handleDownloadAll}
        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
       >
        <Download className="w-4 h-4" />
        Download All
       </button>
      )}
      
      <button
       onClick={onClose}
       className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
       {isComplete ? 'Close' : 'Cancel'}
      </button>
     </div>

     <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p className="text-xs text-blue-800">
       <strong>Secure Decryption:</strong> This model uses AES-GCM encryption with per-segment keys. 
       SEAL transactions provide cryptographic proof of purchase authorization.
      </p>
     </div>
    </div>
   </div>
  </div>
 )
}