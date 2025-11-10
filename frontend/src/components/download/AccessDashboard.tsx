'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Download, 
  Shield, 
  Lock, 
  Star,
  Calendar,
  ExternalLink,
  Folder,
  Play,
  FileText,
  Filter,
  Search,
  Grid,
  List,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { usePurchaseContext } from '@/contexts/PurchaseContext'
import { Purchase } from '@/hooks/usePurchase'

interface AccessDashboardProps {
  className?: string
}

type ViewMode = 'grid' | 'list'
type AccessFilter = 'all' | 'recent' | 'encrypted' | 'verified'

export default function AccessDashboard({ className = '' }: AccessDashboardProps) {
  const {
    purchases,
    isLoading,
    error,
    downloadModel,
    getDownloadInfo
  } = usePurchaseContext()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'downloads'>('date')

  // Only show completed purchases
  const availableModels = purchases.filter(purchase => purchase.status === 'completed')

  const filteredModels = availableModels
    .filter(purchase => {
      const matchesSearch = purchase.modelTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           purchase.modelAuthor.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = (() => {
        switch (accessFilter) {
          case 'recent':
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            return new Date(purchase.purchaseDate) > threeDaysAgo
          case 'encrypted':
            // Note: This would need to be added to Purchase interface in real implementation
            return purchase.transactionHash?.includes('encrypted') || false
          case 'verified':
            // Note: This would need to be added to Purchase interface in real implementation
            return purchase.transactionHash?.includes('verified') || false
          default:
            return true
        }
      })()
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        case 'name':
          return a.modelTitle.localeCompare(b.modelTitle)
        case 'downloads':
          return b.downloadCount - a.downloadCount
        default:
          return 0
      }
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatPrice = (price: string) => {
    const num = parseFloat(price)
    if (isNaN(num)) return '0.00'
    return num.toFixed(2)
  }

  const handleDownload = async (purchase: Purchase) => {
    try {
      await downloadModel(purchase.id)
    } catch (error) {
      console.error('Failed to download model:', error)
      alert('Download failed. Please try again.')
    }
  }

  const getFilterCounts = () => {
    return {
      all: availableModels.length,
      recent: availableModels.filter(p => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        return new Date(p.purchaseDate) > threeDaysAgo
      }).length,
      encrypted: availableModels.filter(p => p.transactionHash?.includes('encrypted')).length,
      verified: availableModels.filter(p => p.transactionHash?.includes('verified')).length
    }
  }

  const filterCounts = getFilterCounts()

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Access Dashboard</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Folder className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">My Models</h2>
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {availableModels.length} available
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{filterCounts.all}</div>
            <div className="text-sm text-gray-600">Total Models</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{filterCounts.recent}</div>
            <div className="text-sm text-gray-600">Recent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{filterCounts.verified}</div>
            <div className="text-sm text-gray-600">Verified</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{filterCounts.encrypted}</div>
            <div className="text-sm text-gray-600">Encrypted</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search your models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value as AccessFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Models</option>
              <option value="recent">Recent</option>
              <option value="verified">Verified</option>
              <option value="encrypted">Encrypted</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'downloads')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="downloads">Sort by Downloads</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-gray-500">Loading your models...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {searchTerm || accessFilter !== 'all' 
                ? 'No matching models found' 
                : 'No models purchased yet'
              }
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || accessFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Browse the marketplace to find and purchase models'
              }
            </p>
            {(!searchTerm && accessFilter === 'all') && (
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Marketplace
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
            {filteredModels.map((purchase) => {
              const downloadInfo = getDownloadInfo(purchase.modelId)
              
              return viewMode === 'grid' ? (
                // Grid View Card
                <div
                  key={purchase.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {purchase.modelTitle}
                      </h3>
                      <div className="flex flex-col gap-1 ml-2 flex-shrink-0">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full text-center">
                          Owned
                        </span>
                        {purchase.transactionHash?.includes('verified') && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full text-center">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">by {purchase.modelAuthor}</p>
                    
                    <div className="space-y-2 text-xs text-gray-500 mb-4">
                      <div className="flex justify-between">
                        <span>Purchased</span>
                        <span>{formatDate(purchase.purchaseDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price Paid</span>
                        <span>${formatPrice(purchase.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Downloads</span>
                        <span>{purchase.downloadCount}/{purchase.maxDownloads}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(purchase)}
                        disabled={!downloadInfo.canDownload}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <Link
                        href={`/models/${purchase.modelId}`}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="View model details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                // List View Row
                <div
                  key={purchase.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {purchase.modelTitle}
                    </h3>
                    <p className="text-gray-600 text-sm">by {purchase.modelAuthor}</p>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
                    <div className="text-center">
                      <div className="text-gray-900">${formatPrice(purchase.price)}</div>
                      <div>Price Paid</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-900">{purchase.downloadCount}/{purchase.maxDownloads}</div>
                      <div>Downloads</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-900">{formatDate(purchase.purchaseDate)}</div>
                      <div>Purchased</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(purchase)}
                      disabled={!downloadInfo.canDownload}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <Link
                      href={`/models/${purchase.modelId}`}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title="View model details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredModels.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              Showing {filteredModels.length} of {availableModels.length} models
            </span>
            <Link
              href="/purchase-history"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Full History
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}