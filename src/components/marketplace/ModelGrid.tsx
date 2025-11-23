'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
 Star, 
 Download, 
 Shield, 
 Lock, 
 Verified, 
 TrendingUp,
 Clock,
 DollarSign,
 Tag as TagIcon,
 Filter,
 Grid,
 List,
 BadgeCheck,
 Award
} from 'lucide-react'

export interface ModelCard {
 id: string
 title: string
 description: string
 author: string
 creator?: string
 authorAvatar?: string
 category: string
 tags: string[]
 price: string
 downloads: number
 rating: number
 reviewCount: number
 thumbnailUrl?: string
 isEncrypted: boolean
 isVerified: boolean
 createdAt: string
 updatedAt: string
 trending?: boolean
 isNew?: boolean
 sampleAvailable?: boolean
 // TEE Verification fields
 teeVerified?: boolean
 attestationTxDigest?: string
 qualityScore?: number
}

export type ViewMode = 'grid' | 'list'

interface ModelGridProps {
 models: ModelCard[]
 loading?: boolean
 viewMode?: ViewMode
 onViewModeChange?: (mode: ViewMode) => void
 onModelClick?: (model: ModelCard) => void
 className?: string
}

export default function ModelGrid({ 
 models, 
 loading = false, 
 viewMode = 'grid',
 onViewModeChange,
 onModelClick,
 className = '' 
}: ModelGridProps) {
 const [selectedModel, setSelectedModel] = useState<string | null>(null)

 const handleModelClick = (model: ModelCard) => {
  setSelectedModel(model.id)
  onModelClick?.(model)
 }

 if (loading) {
  return <ModelGridSkeleton viewMode={viewMode} />
 }

 if (models.length === 0) {
  return (
   <div className="text-center py-12">
    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
     <TagIcon className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No models found</h3>
    <p className="text-gray-600">Try adjusting your search or filters to find what you&apos;re looking for.</p>
   </div>
  )
 }

 return (
  <div className={className}>
   {/* View Mode Toggle */}
   {onViewModeChange && (
    <div className="flex items-center justify-between mb-6">
     <p className="text-sm text-gray-600">
      Showing {models.length} model{models.length !== 1 ? 's' : ''}
     </p>
     <div className="flex items-center gap-2">
      <button
       onClick={() => onViewModeChange('grid')}
       className={`p-2 rounded-lg transition-colors ${
        viewMode === 'grid'
         ? 'bg-blue-100 text-blue-600'
         : 'text-gray-400 hover:text-gray-600'
       }`}
      >
       <Grid className="w-5 h-5" />
      </button>
      <button
       onClick={() => onViewModeChange('list')}
       className={`p-2 rounded-lg transition-colors ${
        viewMode === 'list'
         ? 'bg-blue-100 text-blue-600'
         : 'text-gray-400 hover:text-gray-600'
       }`}
      >
       <List className="w-5 h-5" />
      </button>
     </div>
    </div>
   )}

   {/* Model Grid/List */}
   <div className={
    viewMode === 'grid'
     ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
     : 'space-y-4'
   }>
    {models.map((model) => (
     <ModelCardComponent
      key={model.id}
      model={model}
      viewMode={viewMode}
      isSelected={selectedModel === model.id}
      onClick={() => handleModelClick(model)}
     />
    ))}
   </div>
  </div>
 )
}

interface ModelCardComponentProps {
 model: ModelCard
 viewMode: 'grid' | 'list'
 isSelected: boolean
 onClick: () => void
}

function ModelCardComponent({ model, viewMode, isSelected, onClick }: ModelCardComponentProps) {
 const [imageError, setImageError] = useState(false)
 
 const formatPrice = (price: string) => {
  const numPrice = parseFloat(price)
  if (isNaN(numPrice)) return price
  return `${numPrice} SUI`
 }

 const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return date.toLocaleDateString()
 }

 if (viewMode === 'list') {
  return (
   <div
    onClick={onClick}
    className={`bg-white rounded-lg border hover:shadow-md transition-all duration-200 cursor-pointer p-6 ${
     isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200'
    }`}
   >
    <div className="flex items-start gap-6">
     {/* Thumbnail */}
     <div className="relative w-24 h-24 flex-shrink-0">
      {!imageError && model.thumbnailUrl ? (
       <Image
        src={model.thumbnailUrl}
        alt={model.title}
        fill
        className="object-cover rounded-lg"
        onError={() => setImageError(true)}
       />
      ) : (
       <div className="w-full h-full bg-gradient-to-br from-amber-700 via-orange-800 to-amber-900 rounded-lg flex items-center justify-center relative overflow-hidden">
        {/* Background blur elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-700/90 via-orange-800/90 to-amber-900/90 rounded-lg"></div>
        
        {/* Radiating pattern background */}
        <div className="absolute inset-0 opacity-20">
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16">
           {/* Radiating lines */}
           {[...Array(12)].map((_, i) => (
            <div
             key={i}
             className="absolute w-8 h-0.5 bg-gray-300 origin-left"
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
        
        {/* Icon */}
        <TagIcon className="w-8 h-8 text-gray-300 relative z-10" />
       </div>
      )}
      
      {/* Badges */}
      <div className="absolute -top-1 -right-1 flex flex-col gap-1">
       {model.trending && (
        <div className="bg-orange-500 text-white rounded-full p-1">
         <TrendingUp className="w-3 h-3" />
        </div>
       )}
       {model.isNew && (
        <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
         NEW
        </div>
       )}
      </div>
     </div>

     {/* Content */}
     <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between mb-2">
       <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
         <h3 className="text-lg font-semibold text-gray-900 truncate">
          {model.title}
         </h3>
         {model.isVerified && (
          <Verified className="w-4 h-4 text-blue-500 flex-shrink-0" />
         )}
         {model.teeVerified && (
          <BadgeCheck className="w-4 h-4 text-purple-500 flex-shrink-0" />
         )}
         {model.isEncrypted && (
          <Lock className="w-4 h-4 text-green-500 flex-shrink-0" />
         )}
        </div>
        <p className="text-sm text-gray-600 mb-2">by {model.author}</p>
        <p className="text-gray-700 text-sm line-clamp-2">{model.description}</p>
       </div>
       <div className="text-right ml-4">
        <div className="text-xl font-bold text-gray-900">{formatPrice(model.price)}</div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
         <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
         <span>{model.rating}</span>
         <span>({model.reviewCount})</span>
        </div>
       </div>
      </div>

      <div className="flex items-center justify-between">
       <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{model.category}</span>
        {model.teeVerified && model.qualityScore && (
         <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs flex items-center gap-1">
          <Award className="w-3 h-3" />
          {Math.round(model.qualityScore / 100)}% Quality
         </span>
        )}
        <div className="flex items-center gap-1">
         <Download className="w-4 h-4" />
         <span>{model.downloads.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
         <Clock className="w-4 h-4" />
         <span>{formatDate(model.updatedAt)}</span>
        </div>
       </div>
       
       {model.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap max-w-xs">
         {model.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
           {tag}
          </span>
         ))}
         {model.tags.length > 3 && (
          <span className="text-xs text-gray-400">+{model.tags.length - 3}</span>
         )}
        </div>
       )}
      </div>
     </div>
    </div>
   </div>
  )
 }

 // Grid view
 return (
  <div
   onClick={onClick}
   className={`bg-white rounded-xl border hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group ${
    isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200'
   }`}
  >
   {/* Thumbnail */}
   <div className="relative aspect-[4/3] bg-gray-100">
    {!imageError && model.thumbnailUrl ? (
     <Image
      src={model.thumbnailUrl}
      alt={model.title}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => setImageError(true)}
     />
    ) : (
     <div className="w-full h-full bg-gradient-to-br from-amber-700 via-orange-800 to-amber-900 flex items-center justify-center relative overflow-hidden">
      {/* Background blur elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-700/90 via-orange-800/90 to-amber-900/90"></div>
      
      {/* Radiating pattern background */}
      <div className="absolute inset-0 opacity-30">
       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-32 h-32">
         {/* Radiating lines */}
         {[...Array(16)].map((_, i) => (
          <div
           key={i}
           className="absolute w-16 h-1 bg-gray-300 origin-left"
           style={{
            transform: `rotate(${i * 22.5}deg)`,
            top: '50%',
            left: '50%',
            transformOrigin: '0 50%'
           }}
          />
         ))}
        </div>
       </div>
      </div>
      
      {/* Icon */}
      <TagIcon className="w-16 h-16 text-gray-300 relative z-10" />
     </div>
    )}
    
    {/* Overlay badges */}
    <div className="absolute top-3 left-3 flex gap-2">
     {model.trending && (
      <div className="bg-orange-500 text-white rounded-lg px-2 py-1 text-xs font-medium flex items-center gap-1">
       <TrendingUp className="w-3 h-3" />
       Trending
      </div>
     )}
     {model.isNew && (
      <div className="bg-green-500 text-white rounded-lg px-2 py-1 text-xs font-medium">
       NEW
      </div>
     )}
    </div>

    <div className="absolute top-3 right-3 flex flex-col gap-2">
     {model.isVerified && (
      <div className="bg-blue-500 text-white rounded-full p-1.5">
       <Verified className="w-4 h-4" />
      </div>
     )}
     {model.teeVerified && (
      <div className="bg-purple-500 text-white rounded-full p-1.5" title="TEE Verified">
       <BadgeCheck className="w-4 h-4" />
      </div>
     )}
     {model.isEncrypted && (
      <div className="bg-green-500 text-white rounded-full p-1.5">
       <Lock className="w-4 h-4" />
      </div>
     )}
    </div>

    {/* Content overlay at bottom - glass morphism blur effect */}
    <div className="absolute bottom-0 left-0 right-0 backdrop-blur-lg bg-white/15 p-4 border-t border-white/30">
     <div className="flex items-start justify-between mb-2">
      <h3 className="font-semibold text-white truncate flex-1 pr-2 drop-shadow-sm">
       {model.title}
      </h3>
      <div className="flex items-center gap-1 text-sm text-white/90 flex-shrink-0">
       <Download className="w-4 h-4" />
       <span>{model.downloads}</span>
      </div>
     </div>

     <p className="text-sm text-white/95 mb-2 drop-shadow-sm">Encrypted AI model secured by SEAL technology. Listed by {model.author} on {formatDate(model.updatedAt)}.</p>
     
     <div className="flex items-center justify-between">
      <div className="text-white font-semibold text-lg drop-shadow-sm">{formatPrice(model.price)}</div>
      <button className="bg-white/25 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-lg border border-white/40 hover:bg-white/35 transition-all duration-200 drop-shadow-sm">
       View Details
      </button>
     </div>
    </div>
   </div>

   {/* Bottom white content section - simplified */}
   <div className="p-4 bg-white">
    <p className="text-gray-700 text-sm line-clamp-2 mb-3">{model.description}</p>

    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
     <div className="flex items-center gap-2">
      <span className="bg-gray-100 px-2 py-1 rounded text-xs">{model.category}</span>
      {model.teeVerified && model.qualityScore && (
       <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs flex items-center gap-1">
        <Award className="w-3 h-3" />
        {Math.round(model.qualityScore / 100)}%
       </span>
      )}
     </div>
     <div className="flex items-center gap-1">
      <Download className="w-4 h-4" />
      <span>{model.downloads.toLocaleString()}</span>
     </div>
    </div>

    {/* Tags */}
    {model.tags.length > 0 && (
     <div className="flex gap-1 flex-wrap mb-3">
      {model.tags.slice(0, 2).map((tag, index) => (
       <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
        {tag}
       </span>
      ))}
      {model.tags.length > 2 && (
       <span className="text-xs text-gray-400">+{model.tags.length - 2}</span>
      )}
     </div>
    )}

    <div className="flex items-center justify-between text-xs text-gray-400">
     <span>{formatDate(model.updatedAt)}</span>
     <div className="flex gap-2">
      {model.sampleAvailable && (
       <span className="bg-green-50 text-green-700 px-2 py-1 rounded">Sample</span>
      )}
      <span>{model.reviewCount} reviews</span>
     </div>
    </div>
   </div>
  </div>
 )
}

function ModelGridSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
 const skeletonItems = Array.from({ length: viewMode === 'grid' ? 6 : 4 }, (_, i) => i)

 if (viewMode === 'list') {
  return (
   <div className="space-y-4">
    {skeletonItems.map((i) => (
     <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start gap-6">
       <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
       <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
         <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
         </div>
         <div className="ml-4">
          <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
         </div>
        </div>
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
         </div>
         <div className="flex gap-1">
          <div className="h-6 bg-gray-200 rounded w-12"></div>
          <div className="h-6 bg-gray-200 rounded w-12"></div>
         </div>
        </div>
       </div>
      </div>
     </div>
    ))}
   </div>
  )
 }

 return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
   {skeletonItems.map((i) => (
    <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
     <div className="aspect-[4/3] bg-gray-200"></div>
     <div className="p-4">
      <div className="flex items-start justify-between mb-2">
       <div className="h-5 bg-gray-200 rounded w-3/4"></div>
       <div className="h-4 bg-gray-200 rounded w-8"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
      <div className="flex items-center justify-between mb-3">
       <div className="h-6 bg-gray-200 rounded w-16"></div>
       <div className="h-4 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="flex gap-1 mb-3">
       <div className="h-6 bg-gray-200 rounded w-12"></div>
       <div className="h-6 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="flex items-center justify-between">
       <div className="h-3 bg-gray-200 rounded w-16"></div>
       <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
     </div>
    </div>
   ))}
  </div>
 )
}