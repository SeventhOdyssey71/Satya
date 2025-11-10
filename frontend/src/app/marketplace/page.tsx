'use client'

import { useState } from 'react'
import Header from '@/components/ui/Header'
import { MarketplaceGrid } from '@/components/marketplace/MarketplaceGrid'

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header activeTab="marketplace" />
      
      {/* Main Content */}
      <main className="relative z-10 py-6">
        <div className="container max-w-7xl mx-auto px-6">
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
    { value: 'all', label: 'All' },
    { value: 'machine-learning', label: 'Machine Learning' },
    { value: 'computer-vision', label: 'Computer Vision' },
    { value: 'nlp', label: 'NLP' },
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