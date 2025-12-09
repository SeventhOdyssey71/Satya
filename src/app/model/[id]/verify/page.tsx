'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/ui/Header'
import { ModelVerificationFlow } from '@/components/tee/ModelVerificationFlow'

interface VerifyPageProps {
  params: Promise<{ id: string }>
}

export default function VerifyModelPage({ params }: VerifyPageProps) {
  const [modelId, setModelId] = useState<string>('')
  const [modelData, setModelData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    params.then(({ id }) => {
      setModelId(id)
      loadModelData(id)
    })
  }, [params])

  const loadModelData = async (id: string) => {
    try {
      setLoading(true)
      
      // Try to fetch model data from marketplace API
      const response = await fetch('/api/marketplace/create-listing')
      if (response.ok) {
        const { listings } = await response.json()
        const model = listings.find((listing: any) => listing.id === id)
        
        if (model) {
          setModelData(model)
        } else {
          // Fallback: use basic model data with the ID
          setModelData({
            id: id,
            title: 'Model Verification',
            modelBlobId: 'unknown',
            datasetBlobId: 'default-dataset-blob'
          })
        }
      }
    } catch (error) {
      console.error('Failed to load model data:', error)
      // Use basic fallback
      setModelData({
        id: id,
        title: 'Model Verification',
        modelBlobId: 'unknown', 
        datasetBlobId: 'default-dataset-blob'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="relative z-10 py-6">
          <div className="container max-w-7xl mx-auto px-6">
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading verification flow...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!modelData) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="relative z-10 py-6">
          <div className="container max-w-7xl mx-auto px-6">
            <div className="text-center py-20">
              <p className="text-gray-600">Model not found</p>
              <button 
                onClick={() => router.push('/marketplace')}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Back to Marketplace
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="relative z-10 pt-24 pb-12">
        <div className="container max-w-4xl mx-auto px-6">
          {/* Back Button */}
          <button 
            onClick={() => router.push('/marketplace')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            ← Back to Marketplace
          </button>

          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Verify AI Model
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Verify the authenticity and quality of this AI model using TEE (Trusted Execution Environment) attestation.
              This process will decrypt and analyze the model to generate cryptographic proofs.
            </p>
          </div>

          {/* Model Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Model Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">Model ID</span>
                <p className="font-medium text-gray-900">{modelData.id}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Model Title</span>
                <p className="font-medium text-gray-900">{modelData.title || 'Untitled Model'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Model Blob ID</span>
                <p className="font-medium text-gray-900 text-sm break-all">
                  {modelData.modelBlobId || 'Unknown'}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Dataset Blob ID</span>
                <p className="font-medium text-gray-900 text-sm break-all">
                  {modelData.datasetBlobId || 'default-dataset-blob'}
                </p>
              </div>
            </div>
          </div>

          {/* Verification Flow */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">TEE Verification Process</h2>
            
            <ModelVerificationFlow
              pendingModelId={modelId}
              modelBlobId={modelData.modelBlobId || 'unknown'}
              datasetBlobId={modelData.datasetBlobId || 'default-dataset-blob'}
              modelName={modelData.title || 'Untitled Model'}
            />
          </div>

          {/* Information Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              About TEE Verification
            </h3>
            <div className="space-y-2 text-blue-800 text-sm">
              <p>• <strong>Trusted Execution:</strong> Model analysis runs in a secure, isolated environment</p>
              <p>• <strong>Cryptographic Proofs:</strong> Generates verifiable attestation signatures</p>
              <p>• <strong>Blockchain Recording:</strong> Verification results are permanently recorded on-chain</p>
              <p>• <strong>Quality Assessment:</strong> Automated evaluation of model accuracy and performance</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}