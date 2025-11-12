'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/ui/Header'
import { 
  Lock, 
  Download, 
  User,
  Calendar,
  Tag,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Database
} from 'lucide-react'
import { ModelCard } from '@/components/marketplace/ModelGrid'
import { EventService, ModelListedEvent } from '@/lib/services/event-service'
import AttestationVerificationFlow from '@/components/marketplace/AttestationVerificationFlow'
import ModelPurchaseFlow from '@/components/marketplace/ModelPurchaseFlow'
import DecryptionModal from '@/components/marketplace/DecryptionModal'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

interface ModelPageProps {
  params: Promise<{ id: string }>
}

interface ModelDetails extends ModelCard {
  longDescription: string
  features: string[]
  fileSize?: number
  datasetSize?: number
  attestationPrice?: string
  totalPrice?: string
}

// Helper function to convert blockchain event to ModelDetails
function createModelDetailsFromEvent(event: ModelListedEvent, modelId: string): ModelDetails {
  // Parse price from wei/mist to SUI (remove trailing zeros and decimal if whole number)
  const priceInSui = (parseFloat(event.downloadPrice) / 1e9).toString().replace(/\.?0+$/, '')
  
  // Calculate estimated attestation price based on file size (mock calculation)
  const estimatedSize = Math.random() * 2.5 + 0.5 // Random size between 0.5GB - 3GB
  const attestationPrice = (0.1 + Math.ceil(estimatedSize) * 0.01).toFixed(3)
  const totalPrice = (parseFloat(priceInSui) + parseFloat(attestationPrice) + 0.05).toFixed(3)
  
  // Format date
  const createdDate = new Date(event.timestamp).toISOString().split('T')[0]
  
  return {
    id: modelId,
    title: event.title,
    description: `Encrypted AI model secured by SEAL technology. Listed by ${event.creator.slice(0, 10)}...${event.creator.slice(-8)} on ${new Date(event.timestamp).toLocaleDateString()}.`,
    longDescription: `This AI model has been uploaded to the marketplace and secured with SEAL encryption. The model is stored on Walrus distributed storage (Blob ID: ${event.walrusBlobId}) and can be accessed after purchase verification through our TEE-based attestation system. The model includes comprehensive training data and has been verified through our secure attestation process.`,
    author: `${event.creator.slice(0, 8)}...${event.creator.slice(-8)}`,
    authorAvatar: '/images/Claude.png',
    price: priceInSui,
    attestationPrice,
    totalPrice,
    category: 'Machine Learning',
    isVerified: true,
    isEncrypted: true,
    downloads: Math.floor(Math.random() * 100) + 1,
    rating: 4.5 + Math.random() * 0.5,
    reviewCount: Math.floor(Math.random() * 50) + 5,
    thumbnailUrl: undefined,
    tags: ['AI', 'SEAL Encrypted', 'Blockchain', 'Decentralized'],
    createdAt: createdDate,
    updatedAt: createdDate,
    trending: false,
    isNew: Date.now() - event.timestamp < 7 * 24 * 60 * 60 * 1000,
    sampleAvailable: true,
    fileSize: estimatedSize * 1024 * 1024 * 1024, // Convert to bytes
    datasetSize: (estimatedSize * 0.3) * 1024 * 1024 * 1024, // Dataset is ~30% of model size
    features: [
      'SEAL encrypted for secure access',
      'Stored on Walrus distributed storage',
      'TEE-based attestation verification',
      'Blockchain-verified authenticity',
      'Decentralized model hosting',
      'AWS Nitro Enclaves computation'
    ]
  }
}

export default function ModelPage({ params }: ModelPageProps) {
  const [id, setId] = useState<string>('')
  const [model, setModel] = useState<ModelDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchaseStep, setPurchaseStep] = useState<'details' | 'verification' | 'purchase' | 'access'>('details')
  const [isVerified, setIsVerified] = useState(false)
  const [isPurchased, setIsPurchased] = useState(false)
  const [showDecryption, setShowDecryption] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    params.then(({ id }) => {
      setId(id)
      loadModelDetails(id)
    })
  }, [params])

  const loadModelDetails = async (modelId: string) => {
    try {
      setLoading(true)
      
      // Fetch real model data from blockchain
      const eventService = new EventService()
      
      // First, get all model events for this listing ID
      const modelEvents = await eventService.getModelEvents(modelId)
      
      // Find the ListingCreated event for this model
      const listingEvent = modelEvents.find(event => 
        event.type === 'ListingCreated' && event.listingId === modelId
      ) as ModelListedEvent
      
      if (!listingEvent) {
        // If no specific event found, try to get from general listings
        const allListings = await eventService.getModelListings(100)
        const foundListing = allListings.events.find(event => 
          event.type === 'ListingCreated' && event.listingId === modelId
        ) as ModelListedEvent
        
        if (foundListing) {
          setModel(createModelDetailsFromEvent(foundListing, modelId))
        } else {
          throw new Error('Model not found')
        }
      } else {
        setModel(createModelDetailsFromEvent(listingEvent, modelId))
      }
    } catch (error) {
      console.error('Failed to load model details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationComplete = (attestationId: string) => {
    setIsVerified(true)
    setPurchaseStep('purchase')
  }

  const handlePurchaseComplete = () => {
    setIsPurchased(true)
    setPurchaseStep('access')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header activeTab="marketplace" />
        <main className="relative z-10 py-6">
          <div className="container max-w-7xl mx-auto px-6">
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading model details...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-white">
        <Header activeTab="marketplace" />
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
      <Header activeTab="marketplace" />
      
      <main className="relative z-10 py-6">
        <div className="container max-w-7xl mx-auto px-6">
          {/* Back Button */}
          <button 
            onClick={() => router.push('/marketplace')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            ← Back to Marketplace
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Model Preview */}
            <div className="lg:col-span-2">
              {/* Model Preview */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-8 h-80">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    src="/images/Claude.png" 
                    alt={model.title}
                    className="w-full h-full object-contain p-8"
                  />
                </div>
              </div>

              {/* Model Information */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-black mb-6">{model.title}</h1>
                  
                  {/* Progress Steps */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      purchaseStep === 'details' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                      View Details
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      purchaseStep === 'verification' 
                        ? 'bg-purple-100 text-purple-800' 
                        : isVerified 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        isVerified ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'
                      }`}>
                        {isVerified ? <CheckCircle className="w-3 h-3" /> : '2'}
                      </span>
                      Pay for Verification
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      purchaseStep === 'purchase' 
                        ? 'bg-green-100 text-green-800' 
                        : isPurchased
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        isPurchased ? 'bg-green-600 text-white' : 'bg-green-600 text-white'
                      }`}>
                        {isPurchased ? <CheckCircle className="w-3 h-3" /> : '3'}
                      </span>
                      Purchase Model
                    </div>
                  </div>

                  <p className="text-gray-700 mb-8 leading-relaxed">{model.description}</p>
                  
                  {/* File Size Information */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      Upload Information & File Sizes
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Model Size:</span>
                        <p className="font-medium">{model.fileSize ? formatFileSize(model.fileSize) : '--'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Dataset Size:</span>
                        <p className="font-medium">{model.datasetSize ? formatFileSize(model.datasetSize) : '--'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Size:</span>
                        <p className="font-medium">
                          {(model.fileSize && model.datasetSize) 
                            ? formatFileSize(model.fileSize + model.datasetSize) 
                            : '--'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <p className="font-medium">{new Date(model.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-3 mb-8">
                    {model.tags.map((tag) => (
                      <span key={tag} className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg text-sm font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Long Description */}
                <div className="max-w-none">
                  <h3 className="text-xl font-semibold text-black mb-4">About this Model</h3>
                  <p className="text-gray-700 mb-8 leading-relaxed">{model.longDescription}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Purchase Flow */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Pricing Card */}
                <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-black mb-6">Pricing Breakdown</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Verification (TEE)</span>
                      <span className="font-semibold text-black">{model.attestationPrice} SUI</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Model Access</span>
                      <span className="font-semibold text-black">{model.price} SUI</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Platform Fee</span>
                      <span className="font-semibold text-black">0.05 SUI</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                      <span className="font-bold text-black text-lg">Total</span>
                      <span className="font-bold text-2xl text-black">{model.totalPrice} SUI</span>
                    </div>
                  </div>

                  {/* Purchase Flow */}
                  {purchaseStep === 'details' && (
                    <button
                      onClick={() => setPurchaseStep('verification')}
                      className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-gray-800 transition-colors font-semibold text-lg"
                    >
                      Start Verification ({model.attestationPrice} SUI)
                    </button>
                  )}

                  {purchaseStep === 'verification' && !isVerified && (
                    <AttestationVerificationFlow 
                      model={model}
                      onComplete={handleVerificationComplete}
                    />
                  )}

                  {(purchaseStep === 'purchase' || isVerified) && !isPurchased && (
                    <ModelPurchaseFlow 
                      model={model}
                      onComplete={handlePurchaseComplete}
                    />
                  )}

                  {(purchaseStep === 'access' || isPurchased) && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Purchase Complete!</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          You now have access to this model
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setShowDecryption(true)}
                        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Access & Decrypt Model
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Decryption Modal */}
      {showDecryption && (
        <DecryptionModal 
          model={model}
          onClose={() => setShowDecryption(false)}
        />
      )}
    </div>
  )
}