'use client'

import { useState } from 'react'
import Header from '@/components/ui/Header'
import { MarketplaceGrid } from '@/components/marketplace/MarketplaceGrid'
import { HiSparkles, HiMagnifyingGlass } from 'react-icons/hi2'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

export default function MarketplacePage() {
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
  })

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category }))
  }

  const handleSearch = (searchQuery: string) => {
    setFilters(prev => ({ ...prev, search: searchQuery }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface-100/50 to-surface-200/50">
      {/* Header */}
      <Header />
      
      {/* Hero Banner */}
      <section className="relative py-12 md:py-16">
        <div className="container-custom">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-100 border border-secondary-200 rounded-full mb-6 animate-fade-in">
              <HiSparkles className="w-4 h-4 text-secondary-600" />
              <span className="text-sm font-albert font-medium text-secondary-700">Verified AI Models</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-russo leading-tight mb-6 animate-slide-up">
              Discover <span className="text-gradient">Trusted</span> AI Models
            </h1>
            
            <p className="text-xl text-secondary-600 mb-8 leading-relaxed animate-slide-up">
              Browse verified AI models with TEE attestation, cryptographic proofs, and transparent pricing. 
              Every model is secured by hardware-level guarantees.
            </p>
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <main className="relative z-10 pb-16">
        <div className="container-custom">
          {/* Combined Navigation, Categories and Search */}
          <CombinedNavigation 
            activeCategory={filters.category}
            onCategoryChange={handleCategoryChange}
            onSearch={handleSearch}
          />
          
          {/* Marketplace Grid */}
          <MarketplaceGrid filters={filters} />
          
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
    { value: 'all', label: 'All Models', icon: '🎯' },
    { value: 'machine-learning', label: 'Machine Learning', icon: '🤖' },
    { value: 'computer-vision', label: 'Computer Vision', icon: '👁️' },
    { value: 'nlp', label: 'Natural Language', icon: '💬' },
    { value: 'others', label: 'Others', icon: '⭐' },
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
    <div className="mb-12">
      {/* Search Bar - Full Width */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <HiMagnifyingGlass className="h-5 w-5 text-secondary-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search for AI models, datasets, or techniques..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="input pl-14 pr-6 py-4 text-lg shadow-soft focus:shadow-medium transition-shadow"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button 
              onClick={handleSearchSubmit}
              className="btn-primary btn-sm rounded-lg"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {categories.map((category) => (
          <button
            key={category.value}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-albert font-medium transition-all duration-200 ${
              activeCategory === category.value 
                ? 'bg-secondary-800 text-white shadow-soft' 
                : 'bg-surface-50 text-secondary-700 border border-border hover:bg-surface-100 hover:border-secondary-400 hover:text-secondary-800'
            }`}
            onClick={() => onCategoryChange(category.value)}
          >
            <span className="text-lg">{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MarketplaceGuide() {
  return (
    <div className="mt-16 pt-12 border-t border-border">
      <div className="card p-8 text-center bg-gradient-to-r from-secondary-50 to-secondary-100 border-secondary-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-600 text-white rounded-2xl mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-russo mb-4 text-secondary-800">Need Help Getting Started?</h3>
        <p className="text-secondary-600 mb-6 leading-relaxed max-w-2xl mx-auto">
          Learn how to verify AI models, understand TEE attestations, and make secure purchases in our comprehensive marketplace guide.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="btn-primary group">
            View Marketplace Guide
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="btn-ghost">
            Watch Tutorial Videos
          </button>
        </div>
      </div>
    </div>
  )
}