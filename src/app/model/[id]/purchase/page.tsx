'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import ExtendedPurchasePage from '@/components/purchase/ExtendedPurchasePage'
import { ModelCard } from '@/components/marketplace/ModelGrid'

export default function ModelPurchasePage() {
 const params = useParams()
 const router = useRouter()
 const [model, setModel] = useState<ModelCard | null>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  if (params.id) {
   loadModelDetails()
  }
 }, [params.id])

 const loadModelDetails = async () => {
  try {
   // Mock model data - in a real app, this would fetch from API
   const mockModel: ModelCard = {
    id: params.id as string,
    title: 'Self Drive Model',
    description: 'Advanced AI model for autonomous vehicle navigation and decision-making',
    author: 'AI Research Lab',
    price: '125.50',
    category: 'Machine Learning',
    isVerified: true,
    isEncrypted: true,
    downloads: 1250,
    rating: 4.8,
    reviewCount: 150,
    tags: ['AI', 'Computer Vision', 'Autonomous Driving'],
    thumbnailUrl: '/images/Claude.png',
    createdAt: '2024-01-15',
    updatedAt: '2024-03-20'
   }
   setModel(mockModel)
  } catch (error) {
   console.error('Failed to load model details:', error)
  } finally {
   setLoading(false)
  }
 }

 const handleClose = () => {
  router.back()
 }

 if (loading) {
  return (
   <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
     <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
     <p className="text-gray-600">Loading model details...</p>
    </div>
   </div>
  )
 }

 if (!model) {
  return (
   <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
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
  )
 }

 return (
  <ExtendedPurchasePage
   model={model}
   onClose={handleClose}
  />
 )
}