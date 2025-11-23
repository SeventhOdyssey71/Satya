'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
 Star, 
 Download, 
 Shield, 
 Lock, 
 DollarSign,
 TrendingUp,
 ArrowRight
} from 'lucide-react'
import { ModelCard } from '@/components/marketplace'

interface RelatedModelsProps {
 currentModelId: string
 category?: string
 author?: string
 limit?: number
 className?: string
}

export default function RelatedModels({ 
 currentModelId, 
 category, 
 author, 
 limit = 4, 
 className = '' 
}: RelatedModelsProps) {
 // Mock related models data - in real app, this would come from API
 const relatedModels: ModelCard[] = [
  {
   id: 'model-2',
   title: 'Advanced Object Detection v2.0',
   description: 'High-performance object detection model with 95% accuracy',
   author: 'AI Research Lab',
   category: 'computer-vision',
   tags: ['object-detection', 'yolo', 'real-time'],
   price: '15.99',
   downloads: 8420,
   rating: 4.8,
   reviewCount: 156,
   thumbnailUrl: '/images/models/object-detection.jpg',
   isEncrypted: true,
   isVerified: true,
   createdAt: '2024-01-10',
   updatedAt: '2024-01-15',
   trending: true
  },
  {
   id: 'model-3',
   title: 'Semantic Segmentation Pro',
   description: 'Pixel-perfect segmentation for autonomous vehicles',
   author: 'AutoVision Corp',
   category: 'computer-vision',
   tags: ['segmentation', 'autonomous', 'real-time'],
   price: '25.00',
   downloads: 3210,
   rating: 4.6,
   reviewCount: 89,
   thumbnailUrl: '/images/models/segmentation.jpg',
   isEncrypted: false,
   isVerified: true,
   createdAt: '2024-01-05',
   updatedAt: '2024-01-12',
   isNew: true
  },
  {
   id: 'model-4',
   title: 'Edge Image Classifier',
   description: 'Lightweight model optimized for mobile devices',
   author: 'MobileAI Solutions',
   category: 'computer-vision',
   tags: ['mobile', 'edge', 'lightweight'],
   price: '8.99',
   downloads: 12560,
   rating: 4.4,
   reviewCount: 234,
   thumbnailUrl: '/images/models/edge-classifier.jpg',
   isEncrypted: false,
   isVerified: false,
   createdAt: '2023-12-20',
   updatedAt: '2024-01-08'
  },
  {
   id: 'model-5',
   title: 'Multi-Modal Vision Transformer',
   description: 'State-of-the-art transformer for vision tasks',
   author: 'DeepMind Research',
   category: 'computer-vision',
   tags: ['transformer', 'vision', 'sota'],
   price: '45.00',
   downloads: 1890,
   rating: 4.9,
   reviewCount: 67,
   thumbnailUrl: '/images/models/vision-transformer.jpg',
   isEncrypted: true,
   isVerified: true,
   createdAt: '2024-01-18',
   updatedAt: '2024-01-20',
   trending: true,
   isNew: true
  }
 ].filter(model => model.id !== currentModelId).slice(0, limit)

 const formatPrice = (price: string) => {
  const num = parseFloat(price)
  if (isNaN(num)) return '0.00'
  return num.toFixed(2)
 }

 if (relatedModels.length === 0) {
  return null
 }

 return (
  <div className={className}>
   <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold text-gray-900">Related Models</h2>
    <Link 
     href={`/marketplace?category=${category || ''}`}
     className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
    >
     View all in {category}
     <ArrowRight className="w-4 h-4" />
    </Link>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {relatedModels.map((model) => (
     <Link 
      key={model.id} 
      href={`/models/${model.id}`}
      className="group block"
     >
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
       {/* Model Image */}
       <div className="relative h-40 bg-gray-100">
        {model.thumbnailUrl && (
         <Image
          src={model.thumbnailUrl}
          alt={model.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
         />
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
         {model.isVerified && (
          <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
           Verified
          </span>
         )}
         {model.isEncrypted && (
          <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
           <Lock className="w-3 h-3" />
           SEAL
          </span>
         )}
         {model.trending && (
          <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
           <TrendingUp className="w-3 h-3" />
           Hot
          </span>
         )}
         {model.isNew && (
          <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
           New
          </span>
         )}
        </div>

        {/* Price Badge */}
        <div className="absolute top-2 right-2">
         <span className="bg-white/90 text-gray-900 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          {formatPrice(model.price)}
         </span>
        </div>
       </div>

       {/* Model Info */}
       <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
         {model.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
         {model.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
         <span className="truncate">by {model.author}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
           <Star className="w-4 h-4 text-yellow-400 fill-current" />
           <span className="font-medium">{model.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
           <Download className="w-4 h-4" />
           <span>{model.downloads > 1000 ? `${Math.floor(model.downloads / 1000)}k` : model.downloads}</span>
          </div>
         </div>
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1">
         {model.tags.slice(0, 2).map((tag) => (
          <span
           key={tag}
           className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
          >
           {tag}
          </span>
         ))}
         {model.tags.length > 2 && (
          <span className="text-gray-400 text-xs px-2 py-1">
           +{model.tags.length - 2}
          </span>
         )}
        </div>
       </div>
      </div>
     </Link>
    ))}
   </div>

   {/* Show more link for mobile */}
   <div className="mt-6 text-center lg:hidden">
    <Link 
     href={`/marketplace?category=${category || ''}`}
     className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
    >
     Explore more models
     <ArrowRight className="w-4 h-4" />
    </Link>
   </div>
  </div>
 )
}