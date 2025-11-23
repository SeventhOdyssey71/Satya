'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
 Download, 
 Calendar, 
 DollarSign,
 Shield,
 Lock,
 CheckCircle,
 Clock,
 AlertCircle,
 RefreshCw,
 ExternalLink,
 Filter,
 Search
} from 'lucide-react'

interface Purchase {
 id: string
 modelId: string
 modelTitle: string
 modelAuthor: string
 modelCategory: string
 price: string
 purchaseDate: string
 status: 'completed' | 'processing' | 'failed' | 'refunded'
 transactionHash: string
 downloadUrl?: string
 isEncrypted: boolean
 isVerified: boolean
 downloadCount: number
 maxDownloads: number
}

interface PurchaseHistoryProps {
 purchases?: Purchase[]
 isLoading?: boolean
 onRefresh?: () => void
 onDownload?: (purchase: Purchase) => void
 className?: string
}

export default function PurchaseHistory({
 purchases = [],
 isLoading = false,
 onRefresh,
 onDownload,
 className = ''
}: PurchaseHistoryProps) {
 const [searchTerm, setSearchTerm] = useState('')
 const [statusFilter, setStatusFilter] = useState<string>('all')
 const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date')

 // Mock data for demonstration
 const mockPurchases: Purchase[] = [
  {
   id: 'purchase-1',
   modelId: 'model-1',
   modelTitle: 'Advanced Image Classification Model v2.1',
   modelAuthor: 'AI Research Lab',
   modelCategory: 'computer-vision',
   price: '12.99',
   purchaseDate: '2024-01-20T10:30:00Z',
   status: 'completed',
   transactionHash: '0xabc123...def456',
   downloadUrl: '/downloads/model-1',
   isEncrypted: true,
   isVerified: true,
   downloadCount: 3,
   maxDownloads: 10
  },
  {
   id: 'purchase-2',
   modelId: 'model-2',
   modelTitle: 'Object Detection Pro',
   modelAuthor: 'VisionTech Inc',
   modelCategory: 'computer-vision',
   price: '25.50',
   purchaseDate: '2024-01-18T14:15:00Z',
   status: 'completed',
   transactionHash: '0x789xyz...123abc',
   downloadUrl: '/downloads/model-2',
   isEncrypted: false,
   isVerified: true,
   downloadCount: 1,
   maxDownloads: 5
  },
  {
   id: 'purchase-3',
   modelId: 'model-3',
   modelTitle: 'Natural Language Processor',
   modelAuthor: 'NLP Solutions',
   modelCategory: 'natural-language',
   price: '35.00',
   purchaseDate: '2024-01-15T09:20:00Z',
   status: 'processing',
   transactionHash: '0x456def...789ghi',
   isEncrypted: true,
   isVerified: true,
   downloadCount: 0,
   maxDownloads: 3
  }
 ]

 const allPurchases = purchases.length > 0 ? purchases : mockPurchases

 const filteredPurchases = allPurchases
  .filter(purchase => {
   const matchesSearch = purchase.modelTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
              purchase.modelAuthor.toLowerCase().includes(searchTerm.toLowerCase())
   const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter
   return matchesSearch && matchesStatus
  })
  .sort((a, b) => {
   switch (sortBy) {
    case 'date':
     return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    case 'price':
     return parseFloat(b.price) - parseFloat(a.price)
    case 'name':
     return a.modelTitle.localeCompare(b.modelTitle)
    default:
     return 0
   }
  })

 const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
   year: 'numeric',
   month: 'short',
   day: 'numeric',
   hour: '2-digit',
   minute: '2-digit'
  })
 }

 const formatPrice = (price: string) => {
  const num = parseFloat(price)
  if (isNaN(num)) return '0.00'
  return num.toFixed(2)
 }

 const getStatusIcon = (status: Purchase['status']) => {
  switch (status) {
   case 'completed':
    return <CheckCircle className="w-5 h-5 text-green-500" />
   case 'processing':
    return <Clock className="w-5 h-5 text-yellow-500" />
   case 'failed':
    return <AlertCircle className="w-5 h-5 text-red-500" />
   case 'refunded':
    return <RefreshCw className="w-5 h-5 text-gray-500" />
   default:
    return <Clock className="w-5 h-5 text-gray-500" />
  }
 }

 const getStatusText = (status: Purchase['status']) => {
  switch (status) {
   case 'completed':
    return 'Completed'
   case 'processing':
    return 'Processing'
   case 'failed':
    return 'Failed'
   case 'refunded':
    return 'Refunded'
   default:
    return 'Unknown'
  }
 }

 const getStatusColor = (status: Purchase['status']) => {
  switch (status) {
   case 'completed':
    return 'text-green-700 bg-green-100'
   case 'processing':
    return 'text-yellow-700 bg-yellow-100'
   case 'failed':
    return 'text-red-700 bg-red-100'
   case 'refunded':
    return 'text-gray-700 bg-gray-100'
   default:
    return 'text-gray-700 bg-gray-100'
  }
 }

 return (
  <div className={className}>
   <div className="bg-white rounded-lg border border-gray-200">
    {/* Header */}
    <div className="p-6 border-b border-gray-100">
     <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-900">Purchase History</h2>
      {onRefresh && (
       <button
        onClick={onRefresh}
        disabled={isLoading}
        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        title="Refresh"
       >
        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
       </button>
      )}
     </div>

     {/* Filters and Search */}
     <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
       <input
        type="text"
        placeholder="Search purchases..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
       />
      </div>
      
      <div className="flex gap-2">
       <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
       >
        <option value="all">All Status</option>
        <option value="completed">Completed</option>
        <option value="processing">Processing</option>
        <option value="failed">Failed</option>
        <option value="refunded">Refunded</option>
       </select>

       <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'name')}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
       >
        <option value="date">Sort by Date</option>
        <option value="price">Sort by Price</option>
        <option value="name">Sort by Name</option>
       </select>
      </div>
     </div>
    </div>

    {/* Purchase List */}
    <div className="divide-y divide-gray-100">
     {isLoading ? (
      <div className="p-8 text-center">
       <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
       <p className="text-gray-500">Loading purchase history...</p>
      </div>
     ) : filteredPurchases.length === 0 ? (
      <div className="p-8 text-center">
       <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
       <h3 className="text-lg font-medium text-gray-700 mb-2">
        {searchTerm || statusFilter !== 'all' ? 'No matching purchases' : 'No purchases yet'}
       </h3>
       <p className="text-gray-500 mb-4">
        {searchTerm || statusFilter !== 'all' 
         ? 'Try adjusting your search or filters'
         : 'Start exploring the marketplace to find models you need'
        }
       </p>
       {(!searchTerm && statusFilter === 'all') && (
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
      filteredPurchases.map((purchase) => (
       <div key={purchase.id} className="p-6 hover:bg-gray-50">
        <div className="flex items-start justify-between">
         <div className="flex-1">
          {/* Model Info */}
          <div className="flex items-start gap-4 mb-3">
           <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
            <Shield className="w-6 h-6 text-gray-500" />
           </div>
           
           <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
             <div>
              <Link
               href={`/models/${purchase.modelId}`}
               className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
              >
               {purchase.modelTitle}
              </Link>
              <p className="text-gray-600 text-sm">by {purchase.modelAuthor}</p>
              <p className="text-gray-500 text-xs capitalize">{purchase.modelCategory}</p>
             </div>
             
             <div className="text-right flex-shrink-0">
              <div className="text-lg font-semibold text-gray-900">
               ${formatPrice(purchase.price)}
              </div>
              <div className="text-xs text-gray-500">
               {formatDate(purchase.purchaseDate)}
              </div>
             </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-2">
             <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(purchase.status)}`}>
              {getStatusIcon(purchase.status)}
              {getStatusText(purchase.status)}
             </div>
             
             {purchase.isVerified && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
               Verified
              </span>
             )}
             
             {purchase.isEncrypted && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
               <Lock className="w-3 h-3" />
               SEAL
              </span>
             )}
            </div>
           </div>
          </div>

          {/* Download Progress and Actions */}
          <div className="flex items-center justify-between mt-4">
           <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Downloads: {purchase.downloadCount}/{purchase.maxDownloads}</span>
            <a
             href={`https://explorer.sui.io/txblock/${purchase.transactionHash}`}
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
             View Transaction
             <ExternalLink className="w-3 h-3" />
            </a>
           </div>

           <div className="flex items-center gap-2">
            {purchase.status === 'completed' && purchase.downloadUrl && (
             <button
              onClick={() => onDownload?.(purchase)}
              disabled={purchase.downloadCount >= purchase.maxDownloads}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
             >
              <Download className="w-4 h-4" />
              Download
             </button>
            )}
            
            {purchase.status === 'processing' && (
             <span className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
              <Clock className="w-4 h-4" />
              Processing
             </span>
            )}
            
            {purchase.status === 'failed' && (
             <button className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Retry
             </button>
            )}
           </div>
          </div>
         </div>
        </div>
       </div>
      ))
     )}
    </div>

    {/* Summary Footer */}
    {filteredPurchases.length > 0 && (
     <div className="p-6 border-t border-gray-100 bg-gray-50">
      <div className="flex items-center justify-between text-sm">
       <span className="text-gray-600">
        Showing {filteredPurchases.length} of {allPurchases.length} purchases
       </span>
       <span className="text-gray-600">
        Total spent: ${allPurchases.reduce((sum, p) => sum + parseFloat(p.price), 0).toFixed(2)}
       </span>
      </div>
     </div>
    )}
   </div>
  </div>
 )
}