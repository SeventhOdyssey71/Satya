'use client'

import React, { useState } from 'react'
import { X, Download, Lock, Unlock, CheckCircle, FileText } from 'lucide-react'
import { useCurrentAccount } from '@mysten/dapp-kit'

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

 const handleDecrypt = async () => {
  setIsDecrypting(true)
  setError(null)
  
  try {
   // Get blob IDs from model data
   const modelBlobId = model.modelBlobId || model.walrusBlobId
   const datasetBlobId = model.datasetBlobId || 'default-dataset-blob'
   
   if (!modelBlobId) {
    throw new Error('Model blob ID not found. Cannot decrypt without storage reference.')
   }

   console.log('Decrypting blobs:', { modelBlobId, datasetBlobId })
   
   // Call the blob decryption API with correct format
   const response = await fetch('/api/decrypt-blobs', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     model_blob_id: modelBlobId,
     dataset_blob_id: datasetBlobId,
     user_address: account?.address || 'demo_user',
     transaction_digest: model.purchaseTransactionDigest || 'purchase_verified'
    })
   })

   if (response.ok) {
    const result = await response.json()
    console.log('Decryption result:', result)
    
    if (result.success) {
     setIsComplete(true)
     
     // Create downloadable blobs from the decrypted data
     const urls: {model?: string, dataset?: string} = {}
     
     // Handle model data
     if (result.decrypted_model_data) {
      const modelBlob = new Blob([new Uint8Array(result.decrypted_model_data)], { 
       type: 'application/octet-stream' 
      })
      urls.model = URL.createObjectURL(modelBlob)
     }
     
     // Handle dataset data
     if (result.decrypted_dataset_data) {
      const datasetBlob = new Blob([new Uint8Array(result.decrypted_dataset_data)], { 
       type: 'application/octet-stream' 
      })
      urls.dataset = URL.createObjectURL(datasetBlob)
     }
     
     setDownloadUrls(urls)
    } else {
     throw new Error(result.error || 'Decryption failed')
    }
   } else {
    const errorData = await response.json()
    throw new Error(`Decryption failed: ${errorData.error || response.statusText}`)
   }
  } catch (error) {
   console.error('Decryption failed:', error)
   setError(error instanceof Error ? error.message : 'Decryption failed. Please try again.')
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
          ? 'Decrypting model with SEAL...'
          : 'Click to decrypt and access your purchased model'
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
        Using SEAL encryption to securely decrypt...
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
        Decrypt Model
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
       <strong>Secure Access:</strong> This model is encrypted with SEAL technology 
       and verified through TEE attestation. Your download is secure and authenticated.
      </p>
     </div>
    </div>
   </div>
  </div>
 )
}