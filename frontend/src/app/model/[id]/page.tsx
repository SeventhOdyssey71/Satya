'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import { useAuth, useWallet, useMarketplace, useSeal, useWalrus, useSmartContract } from '@/hooks'
import TEECompute from '@/components/tee/TEECompute'
import type { ModelListing } from '@/lib/types'

interface ModelPageProps {
  params: Promise<{ id: string }>
}

export default function ModelPage({ params }: ModelPageProps) {
  const [id, setId] = useState<string>('')
  const { isAuthenticated } = useAuth()
  const { isConnected } = useWallet()
  const { getModel, purchaseModel, isLoading } = useMarketplace()
  const { decryptData, isDecrypting } = useSeal()
  const { downloadFile } = useWalrus()
  const { executeTransaction, isExecuting } = useSmartContract()
  
  const [model, setModel] = useState<ModelListing | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (id) {
      loadModel()
    }
  }, [id])

  const loadModel = async () => {
    try {
      const modelData = await getModel(id)
      setModel(modelData)
    } catch (error: any) {
      console.error('Failed to load model:', error)
      setError('Failed to load model details')
    }
  }

  const handlePurchase = async () => {
    if (!isAuthenticated || !isConnected || !model) {
      alert('Please connect your wallet to purchase')
      return
    }

    try {
      setIsPurchasing(true)
      setError(null)

      const purchaseRequest = {
        modelId: model.id,
        buyerAddress: '', // Will be filled by the backend from auth
        paymentAmount: model.price,
      }

      // Step 1: Create purchase transaction request
      console.log('Creating purchase transaction...')
      const transactionRequest = await purchaseModel(purchaseRequest)
      
      // Step 2: Execute smart contract transaction
      console.log('Executing smart contract purchase...')
      const transactionResult = await executeTransaction({
        type: 'purchase',
        purchaseData: purchaseRequest,
        transactionRequest
      })
      
      console.log('Purchase transaction completed:', transactionResult)

      alert('Purchase successful! You can now download the model.')
      
    } catch (error: any) {
      console.error('Purchase failed:', error)
      setError(`Purchase failed: ${error.message}`)
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleDownload = async () => {
    if (!model?.walrusBlobId) {
      alert('Model file not available')
      return
    }

    try {
      setError(null)

      // Download the model file
      const blob = await downloadFile(model.walrusBlobId)
      
      // Check if the model is encrypted and decrypt if needed
      if (model.isEncrypted && model.sealPolicyId) {
        try {
          // Convert blob to array buffer for decryption
          const encryptedData = await blob.arrayBuffer()
          const encryptedString = new TextDecoder().decode(encryptedData)
          
          // Decrypt using SEAL
          const decryptedData = await decryptData(model.sealPolicyId, encryptedString)
          
          // Create download link for decrypted data
          const decryptedBlob = new Blob([decryptedData], { type: blob.type })
          const url = URL.createObjectURL(decryptedBlob)
          
          const link = document.createElement('a')
          link.href = url
          link.download = model.metadata?.originalFileName || `${model.title}_decrypted`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          URL.revokeObjectURL(url)
          
        } catch (decryptionError) {
          console.error('Decryption failed:', decryptionError)
          alert('Failed to decrypt model. Please contact support.')
        }
      } else {
        // Model is not encrypted, download directly
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = model.title
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(url)
      }
      
    } catch (error: any) {
      console.error('Download failed:', error)
      setError(`Download failed: ${error.message}`)
    }
  }

  if (isLoading || !model) {
    return (
      <div className="min-h-screen bg-white">
        <Header activeTab="marketplace" />
        <main className="relative z-10">
          <div className="container max-w-7xl mx-auto px-6 py-8">
            <div className="animate-pulse space-y-8">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="grid grid-cols-12 gap-12">
                <div className="col-span-5">
                  <div className="aspect-[4/3] bg-gray-200 rounded-2xl"></div>
                </div>
                <div className="col-span-7 space-y-6">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header activeTab="marketplace" />
        <main className="relative z-10">
          <div className="container max-w-7xl mx-auto px-6 py-8">
            <div className="text-center py-20">
              <div className="text-red-600 text-lg mb-4">{error}</div>
              <button 
                onClick={loadModel}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header activeTab="marketplace" />
      
      <main className="relative z-10">
        <div className="container max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-8 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Marketplace
          </Link>

          <div className="grid grid-cols-12 gap-12">
            {/* Left Column - Model Image */}
            <div className="col-span-5">
              <ModelImage 
                model={model}
                onPurchase={handlePurchase}
                onDownload={handleDownload}
                isPurchasing={isPurchasing || isExecuting}
                isDecrypting={isDecrypting}
              />
            </div>

            {/* Right Column - Model Details */}
            <div className="col-span-7">
              <ModelHeader model={model} />
              <ModelTabs model={model} />
              
              {/* TEE Computation */}
              <div className="mt-8">
                <TEECompute 
                  modelId={model.id} 
                  modelTitle={model.title}
                  onResult={(result) => {
                    console.log('TEE computation result:', result)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ModelImage({ 
  model, 
  onPurchase, 
  onDownload, 
  isPurchasing, 
  isDecrypting 
}: { 
  model: ModelListing
  onPurchase: () => void
  onDownload: () => void
  isPurchasing: boolean
  isDecrypting: boolean
}) {
  const imageUrl = model.walrusBlobId 
    ? `/api/walrus/download/${model.walrusBlobId}` 
    : '/images/Claude.png'

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    return isNaN(numPrice) ? price : `${numPrice} SUI`
  }

  return (
    <div className="sticky top-8">
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3] mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageUrl} 
          alt={model.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/images/Claude.png'
          }}
        />
        
        {model.isEncrypted && (
          <div className="absolute top-4 left-4">
            <div className="bg-blue-600/90 backdrop-blur-sm border border-blue-500/50 rounded-lg px-3 py-1 text-xs font-medium text-white flex items-center gap-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              SEAL Encrypted
            </div>
          </div>
        )}
        
        {model.isVerified && (
          <div className="absolute top-4 right-4">
            <div className="bg-green-600/90 backdrop-blur-sm border border-green-500/50 rounded-lg px-3 py-1 text-xs font-medium text-white flex items-center gap-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{model.downloads} downloads</span>
          <span className="text-xl font-bold text-black">{formatPrice(model.price)}</span>
        </div>
        
        <button 
          onClick={onPurchase}
          disabled={isPurchasing}
          className="w-full bg-black text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPurchasing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Purchasing...
            </div>
          ) : (
            `Purchase Model`
          )}
        </button>
        
        <button 
          onClick={onDownload}
          disabled={isDecrypting}
          className="w-full bg-white border border-gray-300 text-gray-700 rounded-lg px-6 py-3 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDecrypting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
              {model.isEncrypted ? 'Decrypting...' : 'Downloading...'}
            </div>
          ) : (
            model.isEncrypted ? 'Download & Decrypt' : 'Download Model'
          )}
        </button>
      </div>
    </div>
  )
}

function ModelHeader({ model }: { model: ModelListing }) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-russo text-black mb-2">{model.title}</h1>
          <p className="text-lg text-gray-600 font-albert">by {model.author}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {model.category}
            </span>
            {model.rating && (
              <div className="flex items-center">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm text-gray-600">{model.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ModelTabs({ model }: { model: ModelListing }) {
  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button className="pb-3 text-base font-medium text-black border-b-2 border-black">
            Overview
          </button>
          <button className="pb-3 text-base font-medium text-gray-500 hover:text-gray-700">
            Specifications
          </button>
          <button className="pb-3 text-base font-medium text-gray-500 hover:text-gray-700">
            Security
          </button>
        </nav>
      </div>

      <div className="space-y-8">
        {/* Description */}
        <div>
          <h3 className="text-xl font-russo text-black mb-4">Description</h3>
          <p className="text-gray-700 font-albert leading-relaxed">
            {model.description}
          </p>
        </div>

        {/* Tags */}
        {model.tags && model.tags.length > 0 && (
          <div>
            <h3 className="text-xl font-russo text-black mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {model.tags.map((tag: string, index: number) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Model Details */}
        <div>
          <h3 className="text-xl font-russo text-black mb-4">Model Details</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Created</dt>
                <dd className="text-base text-gray-900 font-albert">{new Date(model.createdAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Downloads</dt>
                <dd className="text-base text-gray-900 font-albert">{model.downloads}</dd>
              </div>
              {model.metadata?.modelType && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Model Type</dt>
                  <dd className="text-base text-gray-900 font-albert">{model.metadata.modelType}</dd>
                </div>
              )}
              {model.metadata?.framework && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Framework</dt>
                  <dd className="text-base text-gray-900 font-albert">{model.metadata.framework}</dd>
                </div>
              )}
              {model.metadata?.size && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Size</dt>
                  <dd className="text-base text-gray-900 font-albert">{(model.metadata.size / 1024 / 1024).toFixed(2)} MB</dd>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div>
          <h3 className="text-xl font-russo text-black mb-4">Security Features</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${model.isEncrypted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-gray-700 font-albert">
                {model.isEncrypted ? 'SEAL Threshold Encryption Enabled' : 'No Encryption'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${model.isVerified ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-gray-700 font-albert">
                {model.isVerified ? 'Model Verified by Platform' : 'Unverified Model'}
              </span>
            </div>
            {model.isEncrypted && model.sealPolicyId && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-1">SEAL Policy ID</div>
                <div className="text-sm text-blue-700 font-mono break-all">{model.sealPolicyId}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}