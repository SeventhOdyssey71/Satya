'use client'

import React, { useState } from 'react'
import { 
 Search,
 Filter,
 X,
 ChevronDown,
 Star,
 DollarSign,
 Calendar,
 Tag,
 Shield,
 TrendingUp,
 Download
} from 'lucide-react'

export interface FilterState {
 search: string
 category: string
 priceRange: {
  min: number
  max: number
 }
 rating: number
 verified: boolean
 encrypted: boolean
 trending: boolean
 tags: string[]
 sortBy: string
 dateRange: string
 minDownloads: number
}

interface MarketplaceFiltersProps {
 filters: FilterState
 onFiltersChange: (filters: FilterState) => void
 categories: string[]
 popularTags: string[]
 onReset?: () => void
 className?: string
}

export default function MarketplaceFilters({
 filters,
 onFiltersChange,
 categories,
 popularTags,
 onReset,
 className = ''
}: MarketplaceFiltersProps) {
 const [isExpanded, setIsExpanded] = useState(false)
 const [showAdvanced, setShowAdvanced] = useState(false)

 const updateFilter = (key: keyof FilterState, value: any) => {
  onFiltersChange({
   ...filters,
   [key]: value
  })
 }

 const addTag = (tag: string) => {
  if (!filters.tags.includes(tag)) {
   updateFilter('tags', [...filters.tags, tag])
  }
 }

 const removeTag = (tag: string) => {
  updateFilter('tags', filters.tags.filter(t => t !== tag))
 }

 const hasActiveFilters = () => {
  return (
   filters.search ||
   filters.category ||
   filters.priceRange.min > 0 ||
   filters.priceRange.max < 10000 ||
   filters.rating > 0 ||
   filters.verified ||
   filters.encrypted ||
   filters.trending ||
   filters.tags.length > 0 ||
   filters.dateRange !== 'all' ||
   filters.minDownloads > 0
  )
 }

 const handleReset = () => {
  const defaultFilters: FilterState = {
   search: '',
   category: '',
   priceRange: { min: 0, max: 10000 },
   rating: 0,
   verified: false,
   encrypted: false,
   trending: false,
   tags: [],
   sortBy: 'newest',
   dateRange: 'all',
   minDownloads: 0
  }
  onFiltersChange(defaultFilters)
  onReset?.()
 }

 return (
  <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
   {/* Header */}
   <div className="p-4 border-b border-gray-100">
    <div className="flex items-center justify-between">
     <div className="flex items-center gap-2">
      <Filter className="w-5 h-5 text-gray-600" />
      <h3 className="font-medium text-gray-900">Filters</h3>
      {hasActiveFilters() && (
       <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
        Active
       </span>
      )}
     </div>
     
     <div className="flex items-center gap-2">
      {hasActiveFilters() && (
       <button
        onClick={handleReset}
        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
       >
        Clear all
       </button>
      )}
      <button
       onClick={() => setIsExpanded(!isExpanded)}
       className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
      >
       <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
     </div>
    </div>
   </div>

   {/* Search */}
   <div className="p-4 border-b border-gray-100">
    <div className="relative">
     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
     <input
      type="text"
      placeholder="Search models..."
      value={filters.search}
      onChange={(e) => updateFilter('search', e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
     />
    </div>
   </div>

   {/* Expandable Filters */}
   {isExpanded && (
    <div className="p-4 space-y-6">
     {/* Sort By */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
      <select
       value={filters.sortBy}
       onChange={(e) => updateFilter('sortBy', e.target.value)}
       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
       <option value="newest">Newest</option>
       <option value="oldest">Oldest</option>
       <option value="price-low">Price: Low to High</option>
       <option value="price-high">Price: High to Low</option>
       <option value="rating">Highest Rated</option>
       <option value="downloads">Most Downloaded</option>
       <option value="trending">Trending</option>
      </select>
     </div>

     {/* Category */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
      <select
       value={filters.category}
       onChange={(e) => updateFilter('category', e.target.value)}
       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
       <option value="">All Categories</option>
       {categories.map((category) => (
        <option key={category} value={category}>
         {category}
        </option>
       ))}
      </select>
     </div>

     {/* Price Range */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
       Price Range (SUI)
      </label>
      <div className="flex items-center gap-3">
       <div className="flex-1">
        <input
         type="number"
         placeholder="Min"
         value={filters.priceRange.min || ''}
         onChange={(e) => updateFilter('priceRange', {
          ...filters.priceRange,
          min: parseInt(e.target.value) || 0
         })}
         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
       </div>
       <span className="text-gray-500">to</span>
       <div className="flex-1">
        <input
         type="number"
         placeholder="Max"
         value={filters.priceRange.max === 10000 ? '' : filters.priceRange.max}
         onChange={(e) => updateFilter('priceRange', {
          ...filters.priceRange,
          max: parseInt(e.target.value) || 10000
         })}
         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
       </div>
      </div>
     </div>

     {/* Rating */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
       Minimum Rating
      </label>
      <div className="flex items-center gap-1">
       {[1, 2, 3, 4, 5].map((rating) => (
        <button
         key={rating}
         onClick={() => updateFilter('rating', filters.rating === rating ? 0 : rating)}
         className={`p-1 transition-colors ${
          rating <= filters.rating
           ? 'text-yellow-400'
           : 'text-gray-300 hover:text-yellow-300'
         }`}
        >
         <Star className="w-6 h-6 fill-current" />
        </button>
       ))}
       <span className="ml-2 text-sm text-gray-600">
        {filters.rating > 0 ? `${filters.rating}+ stars` : 'Any rating'}
       </span>
      </div>
     </div>

     {/* Quick Filters */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
      <div className="space-y-2">
       <label className="flex items-center gap-2 cursor-pointer">
        <input
         type="checkbox"
         checked={filters.verified}
         onChange={(e) => updateFilter('verified', e.target.checked)}
         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Shield className="w-4 h-4 text-green-600" />
        <span className="text-sm text-gray-700">Verified models only</span>
       </label>

       <label className="flex items-center gap-2 cursor-pointer">
        <input
         type="checkbox"
         checked={filters.encrypted}
         onChange={(e) => updateFilter('encrypted', e.target.checked)}
         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Shield className="w-4 h-4 text-blue-600" />
        <span className="text-sm text-gray-700">SEAL encrypted</span>
       </label>

       <label className="flex items-center gap-2 cursor-pointer">
        <input
         type="checkbox"
         checked={filters.trending}
         onChange={(e) => updateFilter('trending', e.target.checked)}
         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <TrendingUp className="w-4 h-4 text-orange-600" />
        <span className="text-sm text-gray-700">Trending</span>
       </label>
      </div>
     </div>

     {/* Popular Tags */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
      <div className="flex flex-wrap gap-2 mb-3">
       {popularTags.map((tag) => (
        <button
         key={tag}
         onClick={() => filters.tags.includes(tag) ? removeTag(tag) : addTag(tag)}
         className={`px-3 py-1 text-sm rounded-full border transition-colors ${
          filters.tags.includes(tag)
           ? 'bg-blue-100 border-blue-300 text-blue-700'
           : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
         }`}
        >
         {tag}
        </button>
       ))}
      </div>
      
      {filters.tags.length > 0 && (
       <div className="flex flex-wrap gap-2">
        {filters.tags.map((tag) => (
         <span
          key={tag}
          className="bg-blue-100 text-blue-700 px-2 py-1 text-sm rounded-full flex items-center gap-1"
         >
          {tag}
          <button
           onClick={() => removeTag(tag)}
           className="text-blue-600 hover:text-blue-800"
          >
           <X className="w-3 h-3" />
          </button>
         </span>
        ))}
       </div>
      )}
     </div>

     {/* Advanced Filters */}
     <div>
      <button
       onClick={() => setShowAdvanced(!showAdvanced)}
       className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
       <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
       Advanced Filters
      </button>

      {showAdvanced && (
       <div className="mt-4 space-y-4 pt-4 border-t border-gray-100">
        {/* Date Range */}
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-2">
          Date Added
         </label>
         <select
          value={filters.dateRange}
          onChange={(e) => updateFilter('dateRange', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
         >
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
         </select>
        </div>

        {/* Minimum Downloads */}
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Downloads
         </label>
         <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-gray-400" />
          <input
           type="number"
           placeholder="0"
           value={filters.minDownloads || ''}
           onChange={(e) => updateFilter('minDownloads', parseInt(e.target.value) || 0)}
           className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
         </div>
        </div>
       </div>
      )}
     </div>
    </div>
   )}
  </div>
 )
}

// Helper component for filter pills/chips
export function ActiveFilterChips({ 
 filters, 
 onFiltersChange,
 categories 
}: {
 filters: FilterState
 onFiltersChange: (filters: FilterState) => void
 categories: string[]
}) {
 const updateFilter = (key: keyof FilterState, value: any) => {
  onFiltersChange({
   ...filters,
   [key]: value
  })
 }

 const removeTag = (tag: string) => {
  updateFilter('tags', filters.tags.filter(t => t !== tag))
 }

 const activeFilters = []

 if (filters.search) {
  activeFilters.push({
   label: `"${filters.search}"`,
   onRemove: () => updateFilter('search', '')
  })
 }

 if (filters.category) {
  activeFilters.push({
   label: filters.category,
   onRemove: () => updateFilter('category', '')
  })
 }

 if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) {
  activeFilters.push({
   label: `${filters.priceRange.min} - ${filters.priceRange.max} SUI`,
   onRemove: () => updateFilter('priceRange', { min: 0, max: 10000 })
  })
 }

 if (filters.rating > 0) {
  activeFilters.push({
   label: `${filters.rating}+ stars`,
   onRemove: () => updateFilter('rating', 0)
  })
 }

 if (filters.verified) {
  activeFilters.push({
   label: 'Verified',
   onRemove: () => updateFilter('verified', false)
  })
 }

 if (filters.encrypted) {
  activeFilters.push({
   label: 'Encrypted',
   onRemove: () => updateFilter('encrypted', false)
  })
 }

 if (filters.trending) {
  activeFilters.push({
   label: 'Trending',
   onRemove: () => updateFilter('trending', false)
  })
 }

 if (activeFilters.length === 0 && filters.tags.length === 0) {
  return null
 }

 return (
  <div className="flex flex-wrap gap-2 mb-4">
   {activeFilters.map((filter, index) => (
    <span
     key={index}
     className="bg-blue-100 text-blue-700 px-3 py-1 text-sm rounded-full flex items-center gap-2"
    >
     {filter.label}
     <button
      onClick={filter.onRemove}
      className="text-blue-600 hover:text-blue-800 transition-colors"
     >
      <X className="w-3 h-3" />
     </button>
    </span>
   ))}
   
   {filters.tags.map((tag) => (
    <span
     key={tag}
     className="bg-gray-100 text-gray-700 px-3 py-1 text-sm rounded-full flex items-center gap-2"
    >
     <Tag className="w-3 h-3" />
     {tag}
     <button
      onClick={() => removeTag(tag)}
      className="text-gray-600 hover:text-gray-800 transition-colors"
     >
      <X className="w-3 h-3" />
     </button>
    </span>
   ))}
  </div>
 )
}