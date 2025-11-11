'use client'

import React from 'react'
import { 
  Package, 
  ShoppingCart, 
  Edit, 
  Clock,
  User,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { useRecentActivity } from '@/hooks/useEvents'
import { MarketplaceEvent } from '@/lib/services/event-service'

interface ActivityItemProps {
  event: MarketplaceEvent
}

function ActivityItem({ event }: ActivityItemProps) {
  const getEventDetails = () => {
    switch (event.type) {
      case 'ListingCreated':
        return {
          icon: <Package className="w-5 h-5 text-blue-600" />,
          title: 'Model Listed',
          description: `${event.title || 'Untitled Model'} listed by ${event.creator.slice(0, 6)}...${event.creator.slice(-4)}`,
          price: event.downloadPrice,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      
      case 'ListingPurchased':
        return {
          icon: <ShoppingCart className="w-5 h-5 text-green-600" />,
          title: 'Model Purchased',
          description: `Purchase by ${event.buyer.slice(0, 6)}...${event.buyer.slice(-4)} from ${event.creator.slice(0, 6)}...${event.creator.slice(-4)}`,
          price: event.pricePaid,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      
      case 'ListingUpdated':
        return {
          icon: <Edit className="w-5 h-5 text-orange-600" />,
          title: 'Model Updated',
          description: `Model updated by ${event.creator.slice(0, 6)}...${event.creator.slice(-4)}`,
          price: event.newPrice,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        }
      
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-gray-600" />,
          title: 'Unknown Event',
          description: 'Unknown marketplace activity',
          price: '0',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const details = getEventDetails()
  const timeAgo = getTimeAgo(event.timestamp)
  const formattedPrice = details.price ? parseFloat(details.price).toFixed(2) : '0.00'

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border ${details.borderColor} ${details.bgColor}`}>
      <div className="flex-shrink-0 mt-1">
        {details.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-gray-900">{details.title}</h4>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-1">{details.description}</p>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="font-mono">
              ID: {event.listingId ? `${event.listingId.slice(0, 8)}...` : 'N/A'}
            </span>
            {event.transactionDigest && (
              <span className="font-mono">
                TX: {event.transactionDigest.slice(0, 8)}...
              </span>
            )}
          </div>
          
          {details.price && parseFloat(details.price) > 0 && (
            <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
              <DollarSign className="w-4 h-4" />
              {formattedPrice} SUI
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

interface RecentActivityProps {
  limit?: number
  showHeader?: boolean
  className?: string
}

export default function RecentActivity({ 
  limit = 10, 
  showHeader = true, 
  className = '' 
}: RecentActivityProps) {
  const { activities, isLoading, error } = useRecentActivity(limit)

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Activity</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {showHeader && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            {activities.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {activities.length} events
              </span>
            )}
          </div>
        </div>
      )}

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 animate-pulse">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Recent Activity</h3>
            <p className="text-gray-500">
              Marketplace activity will appear here as events occur.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((event, index) => (
              <ActivityItem key={`${event.transactionDigest}-${index}`} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { ActivityItem }