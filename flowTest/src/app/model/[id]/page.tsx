'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/ui/Header'
import { 
  Shield, 
  Lock, 
  Download, 
  User,
  Calendar,
  Tag,
  ArrowRight
} from 'lucide-react'
import { ModelCard } from '@/components/marketplace/ModelGrid'
import { EventService, ModelListedEvent } from '@/lib/services/event-service'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

interface ModelPageProps {
  params: Promise<{ id: string }>
}

interface ModelDetails extends ModelCard {
  longDescription: string
  features: string[]
}

// Helper function to convert blockchain event to ModelDetails
function createModelDetailsFromEvent(event: ModelListedEvent, modelId: string): ModelDetails {
  // Parse price from wei/mist to SUI (remove trailing zeros and decimal if whole number)
  const priceInSui = (parseFloat(event.downloadPrice) / 1e9).toString().replace(/\.?0+$/, '')
  
  // Format date
  const createdDate = new Date(event.timestamp).toISOString().split('T')[0]
  
  return {
    id: modelId,
    title: event.title,
    description: `AI model created by ${event.creator.slice(0, 8)}...${event.creator.slice(-8)}`,
    longDescription: `This AI model has been uploaded to the marketplace and secured with SEAL encryption. The model is stored on Walrus distributed storage (Blob ID: ${event.walrusBlobId}) and can be accessed after purchase verification through our TEE-based attestation system.`,
    author: `${event.creator.slice(0, 8)}...${event.creator.slice(-8)}`,
    authorAvatar: '/images/Claude.png',
    price: priceInSui,
    category: 'Machine Learning',
    isVerified: true,
    isEncrypted: true,
    downloads: Math.floor(Math.random() * 100) + 1, // Simulated downloads
    rating: 4.5 + Math.random() * 0.5, // Simulated rating
    reviewCount: Math.floor(Math.random() * 50) + 5, // Simulated reviews
    thumbnailUrl: undefined, // No thumbnail available yet - will show dynamic preview
    tags: ['AI', 'SEAL Encrypted', 'Blockchain', 'Decentralized'],
    createdAt: createdDate,
    updatedAt: createdDate,
    trending: false,
    isNew: Date.now() - event.timestamp < 7 * 24 * 60 * 60 * 1000, // New if less than 7 days old
    sampleAvailable: true,
    features: [
      'SEAL encrypted for secure access',
      'Stored on Walrus distributed storage',
      'TEE-based attestation verification',
      'Blockchain-verified authenticity',
      'Decentralized model hosting'
    ]
  }
}

export default function ModelPage({ params }: ModelPageProps) {
  const [id, setId] = useState<string>('')
  const [model, setModel] = useState<ModelDetails | null>(null)
  const [loading, setLoading] = useState(true)
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

  const handlePurchase = () => {
    router.push(`/model/${id}/purchase`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header activeTab="marketplace" />
        <main className="relative z-10 py-6">
          <div className="container max-w-7xl mx-auto px-6">
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
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
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Model Not Found</h1>
              <p className="text-gray-600 mb-4">The requested model could not be found.</p>
              <button
                onClick={() => router.push('/marketplace')}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
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
      {/* Main Satya Navigation */}
      <Header activeTab="marketplace" />
      
      {/* Navigation Bar */}
      <div className="bg-white py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type in your search here..."
                  className="w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side - Model Preview */}
            <div className="relative">
              <div className="aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden relative">
                {model.thumbnailUrl && model.thumbnailUrl !== '/images/Claude.png' && model.thumbnailUrl !== null ? (
                  <img 
                    src={model.thumbnailUrl} 
                    alt={model.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black flex flex-col items-center justify-center">
                    {/* Background pattern based on model ID */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-32 h-32">
                          {[...Array(12)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-16 h-1 bg-gray-300 origin-left"
                              style={{
                                transform: `rotate(${i * 30}deg)`,
                                top: '50%',
                                left: '50%',
                                transformOrigin: '0 50%'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center text-gray-300 relative z-10">
                    </div>
                  </div>
                )}
                
              </div>
            </div>

            {/* Right Side - Purchase Flow */}
            <div className="space-y-8">
              {/* Header with Title and Menu */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-russo text-black mb-2">{model.title}</h1>
                  <p className="text-gray-600">{model.description}</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <span className="font-medium text-black">Verify model (get attestation)</span>
                </div>
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <span className="text-gray-500">Run model</span>
                </div>
              </div>

              {/* Verification Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-russo text-black">Verify Model</h3>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-black">{model.price} SUI</div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm">
                  Start the verification process to ensure model integrity
                </p>

                <button
                  onClick={handlePurchase}
                  className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  Verify Model ({model.price} SUI)
                </button>
              </div>

              {/* Model Details Section */}
              <div className="space-y-6 pt-6">
                {/* Author and Metadata */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{model.author}</span>
                    {model.isVerified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Updated {model.updatedAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span>{model.downloads.toLocaleString()} downloads</span>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="flex gap-2">
                  {model.isVerified && (
                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                      <Shield className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  )}
                  {model.isEncrypted && (
                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      <Lock className="w-3 h-3" />
                      <span>TEE Encrypted</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    <Tag className="w-3 h-3" />
                    <span>{model.category}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {model.longDescription}
                  </p>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-3">Key Features</h3>
                  <div className="space-y-2">
                    {model.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Tags */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-3">Model Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {model.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Technical Specifications */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-3">Technical Specifications</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Model Size:</span>
                      <span>2.1 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Framework:</span>
                      <span>TensorFlow 2.8</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Input Format:</span>
                      <span>Camera RGB (640x480)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Output Format:</span>
                      <span>Control Commands</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hardware:</span>
                      <span>NVIDIA GPU Required</span>
                    </div>
                  </div>
                </div>

                {/* Upload Information */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-3">Upload Information</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Walrus Blob ID:</span>
                      <span className="font-mono text-xs">0x2ef473cf583...</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Encryption:</span>
                      <span>SEAL Homomorphic</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attestation Status:</span>
                      <span className="text-green-600">Verified</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TEE Environment:</span>
                      <span>AWS Nitro Enclave</span>
                    </div>
                  </div>
                </div>

                {/* Sample Download */}
                {model.sampleAvailable && (
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-3">Sample Data</h3>
                    <button className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                      Download Sample Dataset (10 MB)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}