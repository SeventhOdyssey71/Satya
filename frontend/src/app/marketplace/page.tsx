'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import { useMarketplace } from '@/hooks'
import type { ModelListing, ModelFilters } from '@/lib/types'

export default function MarketplacePage() {
  const { models, searchModels, isLoading, error } = useMarketplace()
  const [filters, setFilters] = useState<ModelFilters>({
    category: 'designs',
    page: 1,
    pageSize: 12,
  })

  useEffect(() => {
    searchModels(filters).catch(console.error)
  }, [filters, searchModels])

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category, page: 1 }))
  }

  const handleSearch = (searchQuery: string) => {
    setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }))
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <Header activeTab="marketplace" />
      
      {/* Main Content */}
      <main className="relative z-10 py-6">
        <div className="container max-w-7xl mx-auto px-6">
          {/* Combined Navigation, Categories and Search */}
          <CombinedNavigation 
            activeCategory={filters.category || 'designs'}
            onCategoryChange={handleCategoryChange}
            onSearch={handleSearch}
          />
          
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          
          {/* Model Grid */}
          <ModelGrid models={models} isLoading={isLoading} />
          
          {/* Pagination */}
          <Pagination 
            currentPage={filters.page || 1}
            onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          />
          
          {/* Footer Guide */}
          <MarketplaceGuide />
        </div>
      </main>
    </div>
  )
}



function CombinedNavigation({ 
  activeCategory, 
  onCategoryChange, 
  onSearch 
}: { 
  activeCategory: string
  onCategoryChange: (category: string) => void
  onSearch: (query: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  
  const categories = [
    { value: 'designs', label: 'Designs' },
    { value: 'machine-learning', label: 'Machine Learning' },
    { value: 'healthcare', label: 'HealthCare' },
    { value: 'education', label: 'Education' },
    { value: 'others', label: 'Others' },
  ]

  const handleSearchSubmit = () => {
    onSearch(searchQuery)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    }
  }

  return (
    <div className="mb-8">
      {/* Categories and Search Bar in same row */}
      <div className="flex items-center justify-between gap-6">
        {/* Category Tabs */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-1 flex">
          {categories.map((category) => (
            <div 
              key={category.value}
              className={`px-6 py-3 cursor-pointer transition-colors ${
                activeCategory === category.value 
                  ? 'bg-white rounded-lg shadow-sm' 
                  : 'hover:bg-white hover:rounded-lg'
              }`}
              onClick={() => onCategoryChange(category.value)}
            >
              <span className={`text-sm font-medium font-albert ${
                activeCategory === category.value ? 'text-black' : 'text-gray-600'
              }`}>
                {category.label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Search Input */}
        <div className="bg-white rounded-full shadow-sm border border-gray-200 px-6 py-3 min-w-[400px]">
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Type in your search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-sm font-albert text-gray-600 bg-transparent outline-none flex-1 placeholder-gray-400"
            />
            <button 
              onClick={handleSearchSubmit}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModelGrid({ 
  models, 
  isLoading 
}: { 
  models: ModelListing[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="aspect-[4/4] bg-gray-200 animate-pulse"></div>
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg font-albert mb-4">No models found</div>
        <p className="text-gray-400">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {models.map((model) => (
        <ModelCard key={model.id} model={model} />
      ))}
    </div>
  )
}

function ModelCard({ model }: { model: ModelListing }) {
  // Use placeholder image if none provided
  const imageUrl = model.walrusBlobId 
    ? `/api/walrus/download/${model.walrusBlobId}` 
    : '/images/Claude.png'

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    return isNaN(numPrice) ? price : `${numPrice} SUI`
  }

  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div className="aspect-[4/4] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageUrl} 
          alt={model.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement
            target.src = '/images/Claude.png'
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30"></div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-russo leading-tight flex-1">{model.title}</h3>
          {model.isVerified && (
            <div className="ml-2 flex-shrink-0">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        <p className="text-sm font-albert text-gray-200 mb-3 line-clamp-2 leading-relaxed">
          {model.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-white">
            {formatPrice(model.price)}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-300 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              {model.downloads}
            </div>
            <Link href={`/model/${model.id}`}>
              <button className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-sm font-medium font-albert text-white hover:bg-white/30 transition-colors">
                View Model
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Pagination({ 
  currentPage, 
  onPageChange 
}: { 
  currentPage: number
  onPageChange: (page: number) => void
}) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    onPageChange(currentPage + 1)
  }

  return (
    <div className="flex items-center justify-center gap-6 mb-8">
      <button 
        onClick={handlePrevious}
        disabled={currentPage <= 1}
        className={`px-4 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2 text-sm font-medium font-albert transition-colors ${
          currentPage <= 1 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Prev
      </button>
      
      <div className="flex items-center gap-2">
        <div className="text-sm font-albert text-gray-600">
          Page {currentPage}
        </div>
      </div>
      
      <button 
        onClick={handleNext}
        className="px-4 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2 text-sm font-medium font-albert text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        Next
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

function MarketplaceGuide() {
  return (
    <div className="flex items-center gap-2 mt-12 pt-6 border-t border-gray-100">
      <span className="text-sm font-albert text-gray-500">Marketplace Guide</span>
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}