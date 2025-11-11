'use client'

import React from 'react'
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Activity,
  Package,
  Star,
  Download
} from 'lucide-react'
import { useMarketplaceStats } from '@/hooks/useEvents'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  description?: string
}

function StatCard({ title, value, change, changeType = 'neutral', icon, description }: StatCardProps) {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {change && (
          <div className={`text-sm ${changeColor} font-medium`}>
            {change}
          </div>
        )}
      </div>
      {description && (
        <p className="mt-3 text-sm text-gray-500">{description}</p>
      )}
    </div>
  )
}

interface CategoryBreakdownProps {
  categories: Record<string, number>
}

function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  const totalModels = Object.values(categories).reduce((sum, count) => sum + count, 0)
  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  if (totalModels === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
      <div className="space-y-4">
        {sortedCategories.map(([category, count]) => {
          const percentage = Math.round((count / totalModels) * 100)
          return (
            <div key={category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface MarketplaceStatsProps {
  timeRange?: { start: number; end: number }
  className?: string
}

export default function MarketplaceStats({ timeRange, className = '' }: MarketplaceStatsProps) {
  const { stats, isLoading, error } = useMarketplaceStats(timeRange)

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <Activity className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Statistics</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Statistics Available</h3>
          <p className="text-gray-500">Statistics will appear when marketplace activity begins.</p>
        </div>
      </div>
    )
  }

  const formatPrice = (price: string) => {
    const num = parseFloat(price)
    if (isNaN(num)) return '0'
    return num.toFixed(2)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Listings"
          value={stats.totalListings.toLocaleString()}
          icon={<Package className="w-6 h-6 text-blue-600" />}
          description="Models available in marketplace"
        />
        
        <StatCard
          title="Total Sales"
          value={stats.totalPurchases.toLocaleString()}
          icon={<ShoppingCart className="w-6 h-6 text-green-600" />}
          description="Completed purchases"
        />
        
        <StatCard
          title="Total Volume"
          value={`${formatPrice(stats.totalVolume)} SUI`}
          icon={<DollarSign className="w-6 h-6 text-purple-600" />}
          description="Total transaction volume"
        />
        
        <StatCard
          title="Average Price"
          value={`${formatPrice(stats.averagePrice)} SUI`}
          icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
          description="Average model price"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Sellers"
          value={stats.uniqueSellers.toLocaleString()}
          icon={<Users className="w-6 h-6 text-indigo-600" />}
          description="Unique sellers in marketplace"
        />
        
        <StatCard
          title="Active Buyers"
          value={stats.uniqueBuyers.toLocaleString()}
          icon={<Users className="w-6 h-6 text-teal-600" />}
          description="Unique buyers in marketplace"
        />
        
        <StatCard
          title="Conversion Rate"
          value={stats.totalListings > 0 ? `${Math.round((stats.totalPurchases / stats.totalListings) * 100)}%` : '0%'}
          icon={<Star className="w-6 h-6 text-yellow-600" />}
          description="Purchase to listing ratio"
        />
      </div>

      {/* Category Breakdown */}
      <CategoryBreakdown categories={stats.categoryBreakdown || {}} />
    </div>
  )
}

export { StatCard, CategoryBreakdown }