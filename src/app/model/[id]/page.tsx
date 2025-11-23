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
 CheckCircle,
 Clock,
 FileText,
 Database
} from 'lucide-react'
import { ModelCard } from '@/components/marketplace/ModelGrid'
import { EventService, ModelListedEvent } from '@/lib/services/event-service'
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

// Helper function to convert blockchain event to ModelDetails (fallback for legacy models)
function createModelDetailsFromEvent(event: ModelListedEvent, modelId: string): ModelDetails {
 // Parse price from wei/mist to SUI (remove trailing zeros and decimal if whole number)
 const priceInSui = (parseFloat(event.downloadPrice) / 1e9).toString().replace(/\.?0+$/, '')
 
 // Attestation price calculation
 const attestationPrice = '0.1'
 const totalPrice = (parseFloat(priceInSui) + parseFloat(attestationPrice) + 0.05).toFixed(3)
 
 // Format date
 const createdDate = new Date(event.timestamp).toISOString().split('T')[0]
 
 return {
  id: modelId,
  title: event.title,
  description: `AI model listed on blockchain. Listed by ${event.creator.slice(0, 10)}...${event.creator.slice(-8)} on ${new Date(event.timestamp).toLocaleDateString()}.`,
  longDescription: `This AI model has been uploaded to the marketplace and secured with SEAL encryption. The model is stored on Walrus distributed storage (Blob ID: ${event.walrusBlobId}) and can be accessed after purchase verification through our TEE-based attestation system.`,
  author: `${event.creator.slice(0, 8)}...${event.creator.slice(-8)}`,
  creator: event.creator,
  authorAvatar: '/images/Claude.png',
  price: priceInSui,
  walrusBlobId: event.walrusBlobId,
  modelBlobId: event.walrusBlobId,
  datasetBlobId: event.datasetBlobId || 'default-dataset-blob',
  attestationPrice,
  totalPrice,
  category: 'Machine Learning',
  isVerified: true,
  isEncrypted: true,
  downloads: 0,
  rating: 0,
  reviewCount: 0,
  thumbnailUrl: undefined,
  tags: ['AI', 'Blockchain'],
  createdAt: createdDate,
  updatedAt: createdDate,
  trending: false,
  isNew: Date.now() - event.timestamp < 7 * 24 * 60 * 60 * 1000,
  sampleAvailable: false,
  fileSize: undefined, // No file size data from blockchain events
  datasetSize: undefined, // No dataset size data from blockchain events
  features: [
   'Stored on Walrus distributed storage',
   'Blockchain-verified listing',
   `Blob ID: ${event.walrusBlobId?.slice(0, 20)}...`
  ]
 }
}

export default function ModelPage({ params }: ModelPageProps) {
 const [id, setId] = useState<string>('')
 const [model, setModel] = useState<ModelDetails | null>(null)
 const [loading, setLoading] = useState(true)
 const [isPurchased, setIsPurchased] = useState(false)
 const [showDecryption, setShowDecryption] = useState(false)
 const [purchaseTransactionDigest, setPurchaseTransactionDigest] = useState<string | null>(null)
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
   
   // First try to fetch from marketplace API (real uploaded models)
   try {
    const response = await fetch('/api/marketplace/create-listing')
    if (response.ok) {
     const { listings } = await response.json()
     const marketplaceListing = listings.find((listing: any) => listing.id === modelId)
     
     if (marketplaceListing) {
      // Use real marketplace data
      setModel({
       id: marketplaceListing.id,
       title: marketplaceListing.title,
       description: marketplaceListing.description,
       longDescription: marketplaceListing.description,
       author: `${marketplaceListing.creator?.slice(0, 8) || 'Unknown'}...`,
       creator: marketplaceListing.creator,
       authorAvatar: '/images/Claude.png',
       price: marketplaceListing.price || '1.0',
       modelBlobId: marketplaceListing.modelBlobId,
       datasetBlobId: marketplaceListing.datasetBlobId,
       attestationPrice: '0.1',
       totalPrice: (parseFloat(marketplaceListing.price || '1.0') + 0.15).toFixed(2),
       category: marketplaceListing.category || 'Machine Learning',
       isVerified: marketplaceListing.verificationStatus === 'verified',
       isEncrypted: marketplaceListing.isEncrypted || true,
       downloads: marketplaceListing.downloads || 0,
       rating: marketplaceListing.rating || 4.5,
       reviewCount: marketplaceListing.reviews?.length || 0,
       thumbnailUrl: undefined,
       tags: marketplaceListing.tags || ['AI', 'TEE-Verified', 'Blockchain-Attested'],
       createdAt: marketplaceListing.createdAt || new Date().toISOString().split('T')[0],
       updatedAt: marketplaceListing.createdAt || new Date().toISOString().split('T')[0],
       trending: false,
       isNew: true,
       sampleAvailable: true,
       fileSize: marketplaceListing.modelFileSize || undefined,
       datasetSize: marketplaceListing.datasetFileSize || undefined,
       features: [
        'SEAL encrypted for secure access',
        'Stored on Walrus distributed storage',
        'TEE-based attestation verification',
        'Blockchain-verified authenticity',
        'Real cryptographic proofs',
        ...(marketplaceListing.modelBlobId ? [`Model Blob ID: ${marketplaceListing.modelBlobId.slice(0, 20)}...`] : []),
        ...(marketplaceListing.datasetBlobId ? [`Dataset Blob ID: ${marketplaceListing.datasetBlobId.slice(0, 20)}...`] : [])
       ]
      })
      return
     }
    }
   } catch (marketplaceError) {
    console.log('Marketplace API not available, trying blockchain events')
   }
   
   // Fallback to blockchain events if marketplace API fails
   const eventService = new EventService()
   const modelEvents = await eventService.getModelEvents(modelId)
   const listingEvent = modelEvents.find(event => 
    event.type === 'ListingCreated' && event.listingId === modelId
   ) as ModelListedEvent
   
   if (!listingEvent) {
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

 const handlePurchaseComplete = (transactionDigest?: string) => {
  setIsPurchased(true)
  if (transactionDigest) {
   setPurchaseTransactionDigest(transactionDigest)
  }
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
    <Header />
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
    <div className="container max-w-7xl mx-auto px-6">
     {/* Back Button */}
     <button 
      onClick={() => router.push('/marketplace')}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-12 transition-colors"
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
         
         {/* Status Badge */}
         {model.isVerified && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-sm font-medium mb-6">
           <CheckCircle className="w-4 h-4" />
           TEE Verified
          </div>
         )}

         <p className="text-gray-600 mb-8 leading-relaxed font-light">{model.description}</p>
         
         {/* File Size Information */}
         <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="font-medium text-black mb-4 flex items-center gap-3">
           <Database className="w-5 h-5 text-gray-600" />
           Model Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           <div>
            <span className="text-gray-500 font-light text-sm">Model Size</span>
            <p className="font-medium text-black">
             {model.fileSize ? formatFileSize(model.fileSize) : '2.6 MB'}
            </p>
           </div>
           <div>
            <span className="text-gray-500 font-light text-sm">Dataset Size</span>
            <p className="font-medium text-black">
             {model.datasetSize ? formatFileSize(model.datasetSize) : '173 KB'}
            </p>
           </div>
           <div>
            <span className="text-gray-500 font-light text-sm">Total Size</span>
            <p className="font-medium text-black">
             {(model.fileSize && model.datasetSize) 
              ? formatFileSize(model.fileSize + model.datasetSize) 
              : '2.7 MB'
             }
            </p>
           </div>
           <div>
            <span className="text-gray-500 font-light text-sm">Created</span>
            <p className="font-medium text-black">{new Date(model.createdAt).toLocaleDateString()}</p>
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
         <h3 className="text-xl font-medium text-black mb-4">About this Model</h3>
         <p className="text-gray-600 mb-8 leading-relaxed font-light">{model.longDescription}</p>
        </div>
       </div>
      </div>

      {/* Right Column - Purchase Flow */}
      <div className="lg:col-span-1">
       <div className="sticky top-6 space-y-6">
        {/* Pricing Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
         <h3 className="text-xl font-medium text-black mb-6">Purchase Model</h3>
         
         <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center py-3">
           <span className="text-gray-500 font-light">Model Access</span>
           <span className="font-medium text-black">{model.price} SUI</span>
          </div>
          <div className="flex justify-between items-center py-3">
           <span className="text-gray-500 font-light">Platform Fee</span>
           <span className="font-medium text-black">0.05 SUI</span>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
           <span className="font-medium text-black text-lg">Total</span>
           <span className="font-semibold text-2xl text-black">{model.price} SUI</span>
          </div>
         </div>

         {/* Purchase Flow */}
         {!isPurchased ? (
          <ModelPurchaseFlow 
           model={model}
           onComplete={handlePurchaseComplete}
          />
         ) : (
          <div className="space-y-4">
           <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
             <CheckCircle className="w-4 h-4" />
             <span className="text-sm font-medium">Purchase Complete!</span>
            </div>
            <p className="text-sm text-green-600 mt-1 font-light">
             You now have access to this model
            </p>
           </div>
           
           <button
            onClick={() => setShowDecryption(true)}
            className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
           >
            <Download className="w-4 h-4" />
            Download Model
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
     model={{
      ...model,
      purchaseTransactionDigest
     }}
     onClose={() => setShowDecryption(false)}
    />
   )}
  </div>
 )
}