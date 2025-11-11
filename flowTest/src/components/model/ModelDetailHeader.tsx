'use client'

import React from 'react'
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
  User,
  Calendar,
  FileText,
  Share2,
  Heart,
  Flag
} from 'lucide-react'
import { ModelCard } from '@/components/marketplace'

interface ModelDetailHeaderProps {
  model: ModelCard
  onPurchase?: () => void
  onDownload?: () => void
  onShare?: () => void
  onFavorite?: () => void
  onReport?: () => void
  isFavorited?: boolean
  isPurchased?: boolean
  isLoading?: boolean
  className?: string
}

export default function ModelDetailHeader({
  model,
  onPurchase,
  onDownload,
  onShare,
  onFavorite,
  onReport,
  isFavorited = false,
  isPurchased = false,
  isLoading = false,
  className = ''
}: ModelDetailHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (price: string) => {
    const num = parseFloat(price)
    if (isNaN(num)) return '0.00'
    return num.toFixed(2)
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Hero Section */}
      <div className="relative">
        {model.thumbnailUrl && (
          <div className="relative h-64 md:h-80 bg-gray-100">
            <Image
              src={model.thumbnailUrl}
              alt={model.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {model.isVerified && (
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Verified className="w-4 h-4" />
              Verified
            </span>
          )}
          {model.isEncrypted && (
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Lock className="w-4 h-4" />
              SEAL Encrypted
            </span>
          )}
          {model.trending && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Trending
            </span>
          )}
          {model.isNew && (
            <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              New
            </span>
          )}
        </div>

        {/* Action Buttons Overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={onShare}
            className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-colors"
            title="Share model"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onFavorite}
            className={`p-2 rounded-full shadow-lg transition-colors ${
              isFavorited 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-white/90 hover:bg-white text-gray-700'
            }`}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onReport}
            className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-colors"
            title="Report model"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left Column - Main Info */}
          <div className="flex-1">
            {/* Title and Category */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <TagIcon className="w-4 h-4" />
                <span className="capitalize">{model.category}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{model.title}</h1>
              <p className="text-gray-600 text-lg leading-relaxed">{model.description}</p>
            </div>

            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              {model.authorAvatar ? (
                <Image
                  src={model.authorAvatar}
                  alt={model.author}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{model.author}</p>
                <p className="text-sm text-gray-500">Model Creator</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-medium">{model.rating.toFixed(1)}</span>
                <span className="text-gray-500">({model.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Download className="w-5 h-5" />
                <span>{model.downloads.toLocaleString()} downloads</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>Updated {formatDate(model.updatedAt)}</span>
              </div>
            </div>

            {/* Tags */}
            {model.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {model.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Purchase/Download Card */}
          <div className="lg:w-80 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                <span className="flex items-center justify-center gap-1">
                  <DollarSign className="w-6 h-6" />
                  {formatPrice(model.price)} SUI
                </span>
              </div>
              {parseFloat(model.price) === 0 && (
                <p className="text-green-600 font-medium">Free Model</p>
              )}
            </div>

            <div className="space-y-3">
              {isPurchased ? (
                <button
                  onClick={onDownload}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  {isLoading ? 'Processing...' : 'Download Model'}
                </button>
              ) : (
                <button
                  onClick={onPurchase}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-5 h-5" />
                  {isLoading ? 'Processing...' : parseFloat(model.price) === 0 ? 'Get Model' : 'Purchase Model'}
                </button>
              )}

              {model.sampleAvailable && !isPurchased && (
                <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  View Sample
                </button>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>File Format</span>
                  <span className="font-medium">ONNX</span>
                </div>
                <div className="flex justify-between">
                  <span>License</span>
                  <span className="font-medium">Commercial Use</span>
                </div>
                <div className="flex justify-between">
                  <span>Model Size</span>
                  <span className="font-medium">~127 MB</span>
                </div>
                {model.isEncrypted && (
                  <div className="flex justify-between items-center">
                    <span>Encryption</span>
                    <span className="flex items-center gap-1 font-medium text-blue-600">
                      <Shield className="w-3 h-3" />
                      SEAL Protected
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}