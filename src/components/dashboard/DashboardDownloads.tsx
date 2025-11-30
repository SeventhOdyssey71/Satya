'use client'

import React, { useState, useEffect } from 'react'
import {
 IoDownload,
 IoEye,
 IoTime,
 IoCheckmarkCircle,
 IoDocument,
 IoLockClosed,
 IoLockOpen
} from 'react-icons/io5'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { MarketplaceContractService } from '@/lib/services/marketplace-contract.service'
import DecryptionModal from '@/components/marketplace/DecryptionModal'

interface Download {
 id: string
 modelId: string
 modelTitle: string
 downloadDate: number
 fileSize: number
 attestationId?: string
 encrypted: boolean
 accessible: boolean
 creator: string
 price: string
 modelBlobId?: string
 datasetBlobId?: string
 purchaseRecord?: string
}

interface DashboardDownloadsProps {
 triggerRefresh?: boolean
 onRefreshComplete?: () => void
}

export default function DashboardDownloads({ triggerRefresh, onRefreshComplete }: DashboardDownloadsProps) {
 const [downloads, setDownloads] = useState<Download[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [decryptingModel, setDecryptingModel] = useState<Download | null>(null)
 const [showRefreshSuccess, setShowRefreshSuccess] = useState(false)
 const currentAccount = useCurrentAccount()

 // Load downloads on mount and when account changes
 useEffect(() => {
  if (currentAccount?.address) {
   loadDownloads()
  } else {
   setLoading(false)
   setDownloads([])
  }
 }, [currentAccount?.address])

 // Handle refresh trigger from URL parameter (after purchase)
 useEffect(() => {
  if (triggerRefresh && currentAccount?.address) {
   console.log('Refresh triggered for Downloads section - reloading purchases...')

   // Add a small delay to allow blockchain indexing
   setTimeout(() => {
    loadDownloads().then(() => {
     // Show success message
     setShowRefreshSuccess(true)

     // Hide success message after 5 seconds
     setTimeout(() => {
      setShowRefreshSuccess(false)
     }, 5000)

     if (onRefreshComplete) {
      onRefreshComplete()
     }
    })
   }, 2000) // 2 second delay for blockchain indexing
  }
 }, [triggerRefresh])

 const loadDownloads = async () => {
  if (!currentAccount?.address) {
   setLoading(false)
   return
  }

  try {
   setLoading(true)
   setError(null)

   console.log('Loading downloads for user:', currentAccount.address)

   const contractService = new MarketplaceContractService()

   // TEMP DEBUG: Check what owned objects we have
   const suiClient = (contractService as any).suiClient
   const ownedObjects = await suiClient.getOwnedObjects({
    owner: currentAccount.address,
    limit: 50,
    options: { showContent: true, showType: true }
   })

   console.log('=== DEBUG: All owned objects ===')
   console.log('Total owned objects:', ownedObjects.data.length)
   ownedObjects.data.forEach((obj: any, i: number) => {
    console.log(`Object ${i + 1}:`, {
     type: obj.data?.type,
     objectId: obj.data?.objectId?.substring(0, 20) + '...'
    })
   })

   const userPurchases = await contractService.getUserPurchases(currentAccount.address)

   console.log('Retrieved user purchases:', userPurchases)
   console.log('Total purchases found:', userPurchases.length)

   // Fetch blob IDs for each purchase by querying the MarketplaceModel
   const enrichedPurchases = await Promise.all(
    userPurchases.map(async (purchase, index) => {
     try {
      console.log(`Enriching purchase ${index + 1}/${userPurchases.length}:`, {
       modelId: purchase.modelId,
       purchaseId: purchase.id,
       title: purchase.modelTitle
      })

      // Fetch the MarketplaceModel object to get blob IDs
      const suiClient = (contractService as any).suiClient
      const modelObject = await suiClient.getObject({
       id: purchase.modelId,
       options: { showContent: true }
      })

      if (modelObject.error) {
       console.error(`Error fetching model ${purchase.modelId}:`, modelObject.error)
       return purchase // Return without blob IDs
      }

      const content = modelObject.data?.content as any
      const fields = content?.fields || {}

      const enriched = {
       ...purchase,
       modelBlobId: fields.model_blob_id,
       datasetBlobId: fields.dataset_blob_id,
       purchaseRecord: purchase.id // PurchaseRecord ID
      }

      console.log(`✓ Enriched purchase ${index + 1}:`, {
       modelBlobId: enriched.modelBlobId ? enriched.modelBlobId.substring(0, 20) + '...' : 'none',
       datasetBlobId: enriched.datasetBlobId ? enriched.datasetBlobId.substring(0, 20) + '...' : 'none'
      })

      return enriched
     } catch (error) {
      console.error(`Failed to enrich purchase ${index + 1}:`, {
       error: error instanceof Error ? error.message : String(error),
       purchase
      })
      return purchase // Return original purchase without blob IDs
     }
    })
   )

   console.log('Final enriched purchases:', enrichedPurchases.length)
   setDownloads(enrichedPurchases)

  } catch (err) {
   console.error('Failed to load downloads:', err)
   setError(err instanceof Error ? err.message : 'Failed to load downloads')
   setDownloads([])
  } finally {
   setLoading(false)
  }
 }

 const handleViewInMarketplace = (modelId: string) => {
  window.open(`/model/${modelId}`, '_blank')
 }

 const handleDecrypt = (download: Download) => {
  console.log('Opening decryption modal for model:', download.modelId)
  setDecryptingModel(download)
 }

 // Show wallet connection prompt if no account
 if (!currentAccount?.address) {
  return (
   <div className="text-center py-12">
    <IoLockClosed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-700 mb-2">Connect Your Wallet</h3>
    <p className="text-gray-500 mb-4">
     Please connect your wallet to view your purchased models
    </p>
   </div>
  )
 }

 if (loading) {
  return (
   <div className="flex flex-col items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mb-4" />
    <p className="text-gray-600">{triggerRefresh ? 'Checking for new purchases...' : 'Loading your downloads...'}</p>
    {triggerRefresh && (
     <p className="text-sm text-gray-500 mt-2">
      Please wait while we fetch your latest purchase from the blockchain
     </p>
    )}
   </div>
  )
 }

 if (error) {
  return (
   <div className="text-center py-12">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
     <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Downloads</h3>
     <p className="text-red-600 mb-4">{error}</p>
     <button 
      onClick={loadDownloads}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
     >
      Try Again
     </button>
    </div>
   </div>
  )
 }

 return (
  <div className="space-y-6">
   {/* Success notification after purchase */}
   {showRefreshSuccess && downloads.length > 0 && (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
     <div className="flex items-center gap-3">
      <IoCheckmarkCircle className="w-5 h-5 text-green-600" />
      <div>
       <p className="font-medium text-green-800">Purchase Complete!</p>
       <p className="text-sm text-green-700 mt-1">
        Your model has been added to your downloads. Click "Decrypt & Download" to access it.
       </p>
      </div>
     </div>
    </div>
   )}

   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <h2 className="text-xl font-medium text-gray-900">Your Downloads</h2>
     <p className="text-sm text-gray-600 mt-1">
      Access and re-download your purchased models anytime
     </p>
    </div>

    <div className="flex items-center gap-3">
     <div className="text-sm text-gray-600">
      Total: {downloads.length}
     </div>
     <button
      onClick={loadDownloads}
      disabled={loading}
      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
      title="Refresh purchases"
     >
      <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Refresh
     </button>
    </div>
   </div>

   {/* Downloads List */}
   <div className="bg-white border border-gray-200 rounded-lg">
    {downloads.length === 0 ? (
     <div className="text-center py-12">
      <IoDownload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 mb-2">No purchases found</p>
      <p className="text-sm text-gray-400 mb-4">
       You haven't purchased any models yet. Browse the marketplace to find and purchase models.
      </p>
      <button
       onClick={() => window.location.href = '/marketplace'}
       className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
      >
       Browse Marketplace
      </button>
     </div>
    ) : (
     <div className="divide-y divide-gray-200">
      {downloads.map((download) => (
       <div key={download.id} className="p-6 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between">
         <div className="flex-1 min-w-0">
          {/* Model Info */}
          <div className="flex items-start gap-4">
           <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <IoDocument className="w-6 h-6 text-white" />
           </div>
           
           <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 mb-1">{download.modelTitle}</h3>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
             <span>Creator: {download.creator}</span>
             <span>•</span>
             <span>{formatFileSize(download.fileSize)}</span>
             <span>•</span>
             <span>Purchased: {new Date(download.downloadDate).toLocaleDateString()}</span>
             <span>•</span>
             <span>{(parseFloat(download.price) / 1_000_000_000).toFixed(2)} SUI</span>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-2 mb-3">
             <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              <IoCheckmarkCircle className="w-3 h-3" />
              Purchased
             </span>
             
             {download.encrypted && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
               <IoLockClosed className="w-3 h-3" />
               SEAL Encrypted
              </span>
             )}
             
             {download.attestationId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
               <IoCheckmarkCircle className="w-3 h-3" />
               Verified
              </span>
             )}
            </div>

            {download.attestationId && (
             <div className="text-xs text-gray-500">
              Attestation ID: {download.attestationId}
             </div>
            )}
           </div>
          </div>
         </div>

         {/* Actions */}
         <div className="flex items-center gap-2 ml-4">
          <button
           onClick={() => handleViewInMarketplace(download.modelId)}
           className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
           title="View in Marketplace"
          >
           <IoEye className="w-4 h-4" />
          </button>

          {download.accessible && download.encrypted && download.modelBlobId ? (
           <button
            onClick={() => handleDecrypt(download)}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            title="Decrypt and Download"
           >
            <IoLockOpen className="w-4 h-4" />
            Decrypt & Download
           </button>
          ) : (
           <div className="px-3 py-2 bg-gray-100 text-gray-500 text-sm rounded-lg flex items-center gap-1">
            <IoLockClosed className="w-4 h-4" />
            <span>Loading...</span>
           </div>
          )}
         </div>
        </div>
       </div>
      ))}
     </div>
    )}
   </div>

   {/* Download Instructions */}
   {downloads.length > 0 && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
     <h4 className="font-medium text-blue-900 mb-2">Download Instructions</h4>
     <ul className="text-sm text-blue-800 space-y-1">
      <li>• Click "Decrypt" to access SEAL encrypted models with your wallet signature</li>
      <li>• Use "Download" to get a fresh copy of your purchased models</li>
      <li>• All downloads are linked to your wallet address and remain accessible</li>
      <li>• Encrypted models require wallet verification for security</li>
     </ul>
    </div>
   )}

   {/* Decryption Modal */}
   {decryptingModel && decryptingModel.modelBlobId && (
    <DecryptionModal
     model={{
      id: decryptingModel.modelId,
      title: decryptingModel.modelTitle,
      modelBlobId: decryptingModel.modelBlobId,
      datasetBlobId: decryptingModel.datasetBlobId,
      purchaseRecordId: decryptingModel.purchaseRecord || decryptingModel.id,
      creator: decryptingModel.creator,
      price: decryptingModel.price
     }}
     onClose={() => setDecryptingModel(null)}
    />
   )}
  </div>
 )
}

function formatFileSize(bytes: number): string {
 if (bytes === 0) return '0 Bytes'
 const k = 1024
 const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
 const i = Math.floor(Math.log(bytes) / Math.log(k))
 return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}