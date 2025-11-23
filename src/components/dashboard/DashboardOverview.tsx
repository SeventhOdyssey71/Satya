'use client'

import React from 'react'
import { 
 IoTime,
 IoCheckmarkCircle,
 IoCloseCircle,
 IoCloudUpload,
 IoStatsChart,
 IoDownload,
 IoRefresh
} from 'react-icons/io5'
import { usePendingModels } from '@/hooks/usePendingModels'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useState, useEffect } from 'react'
import { MarketplaceContractService } from '@/lib/services/marketplace-contract.service'

interface DashboardOverviewProps {
 onNewUpload?: () => void
}

export default function DashboardOverview({ onNewUpload }: DashboardOverviewProps) {
 const { pendingModels, statusCounts, isLoading, refresh } = usePendingModels()
 const currentAccount = useCurrentAccount()
 const [completedCount, setCompletedCount] = useState(0)
 const [isLoadingCompleted, setIsLoadingCompleted] = useState(true)

 // Load completed models (marketplace models) count
 const loadCompletedCount = async () => {
  if (!currentAccount?.address) {
   setIsLoadingCompleted(false)
   return
  }
  
  setIsLoadingCompleted(true)
  try {
   const contractService = new MarketplaceContractService()
   await contractService.initialize()
   
   const marketplaceModels = await contractService.getMarketplaceModels()
   const userModels = marketplaceModels.filter(model => 
    model.data?.content?.fields?.creator === currentAccount.address
   )
   
   setCompletedCount(userModels.length)
  } catch (error) {
   console.error('Failed to load completed models count:', error)
  } finally {
   setIsLoadingCompleted(false)
  }
 }

 useEffect(() => {
  loadCompletedCount()
 }, [currentAccount?.address])

 // Removed auto-refresh to prevent random refreshing
 // Load completed count only on initial mount and manual refresh

 // Calculate status counts based on pending models from smart contract
 const displayCounts = {
  pending: statusCounts.pending + statusCounts.verifying, // Combine pending and verifying
  completed: completedCount, // Use marketplace models count
  failed: statusCounts.failed
 }

 // Show loading state while data is being fetched
 if (isLoading || isLoadingCompleted) {
  return (
   <div className="space-y-8">
    {/* Loading Status Cards */}
    <div className="bg-white border border-gray-200 rounded-lg p-4">
     <div className="grid grid-cols-3 gap-6">
      {[...Array(3)].map((_, index) => (
       <div key={index} className="text-center">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2 animate-pulse">
         <div className="w-5 h-5 bg-gray-300 rounded"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded mb-1 animate-pulse"></div>
        <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
       </div>
      ))}
     </div>
    </div>
    
    {/* Loading Stats Cards */}
    <div className="grid grid-cols-4 gap-4">
     {[...Array(4)].map((_, index) => (
      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
       <div className="text-center">
        <div className="w-8 h-8 bg-gray-200 rounded-lg mx-auto mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded mb-1 animate-pulse"></div>
        <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
       </div>
      </div>
     ))}
    </div>
    
    {/* Loading Recent Activity */}
    <div className="bg-white border border-gray-200 rounded-lg">
     <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
       <div>
        <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-100 rounded w-48 animate-pulse"></div>
       </div>
       <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
     </div>
     <div className="p-4">
      <div className="space-y-3">
       {[...Array(3)].map((_, index) => (
        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
         <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
          <div>
           <div className="h-4 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
           <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"></div>
          </div>
         </div>
         <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
       ))}
      </div>
     </div>
    </div>
   </div>
  )
 }

 return (
  <div className="space-y-8">
   {/* Status Overview Cards */}
   <div className="bg-white border border-gray-200 rounded-lg p-4">
    <div className="grid grid-cols-3 gap-6">
     {/* Pending */}
     <div className="text-center">
      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
       <IoTime className="w-5 h-5 text-yellow-700" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">Pending</h3>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{displayCounts.pending}</p>
      <p className="text-xs text-gray-600">Awaiting verification</p>
     </div>

     {/* Completed */}
     <div className="text-center">
      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
       <IoCheckmarkCircle className="w-5 h-5 text-green-700" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">Completed</h3>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{displayCounts.completed}</p>
      <p className="text-xs text-gray-600">Available in marketplace</p>
     </div>

     {/* Failed */}
     <div className="text-center">
      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
       <IoCloseCircle className="w-5 h-5 text-red-500" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">Failed</h3>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{displayCounts.failed}</p>
      <p className="text-xs text-gray-600">Requires attention</p>
      {displayCounts.failed > 0 && (
       <button 
        onClick={refresh}
        className="mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
       >
        <IoRefresh className="w-3 h-3 inline mr-1" />
        Refresh
       </button>
      )}
     </div>
    </div>
   </div>

   {/* Quick Stats */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
     <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
      <IoStatsChart className="w-5 h-5 text-gray-600" />
     </div>
     <p className="text-sm text-gray-600 mb-1">Total Models</p>
     <p className="text-2xl font-semibold text-gray-900 mb-1">{statusCounts.total}</p>
     <div className="text-xs text-gray-500">
      {statusCounts.total > 0 ? 'In your dashboard' : 'Get started!'}
     </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
     <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
      <IoDownload className="w-5 h-5 text-gray-600" />
     </div>
     <p className="text-sm text-gray-600 mb-1">Verification Rate</p>
     <p className="text-2xl font-semibold text-gray-900 mb-1">
      {statusCounts.total ? Math.round((statusCounts.verified / statusCounts.total) * 100) : 0}%
     </p>
     <div className="text-xs text-gray-500">
      Models verified
     </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
     <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
     </div>
     <p className="text-sm text-gray-600 mb-1">Avg. Speed</p>
     <p className="text-2xl font-semibold text-gray-900 mb-1">2.4</p>
     <div className="text-xs text-gray-500">
      Minutes per verification
     </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
     <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
      <IoCheckmarkCircle className="w-5 h-5 text-gray-600" />
     </div>
     <p className="text-sm text-gray-600 mb-1">Success Rate</p>
     <p className="text-2xl font-semibold text-gray-900 mb-1">
      {statusCounts.total ? Math.round((statusCounts.verified / statusCounts.total) * 100) : 0}%
     </p>
     <div className="text-xs text-gray-500">
      Verification rate
     </div>
    </div>
   </div>

   {/* Recent Activity */}
   <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="flex items-center justify-between mb-6">
     <div>
      <h3 className="text-xl font-medium text-gray-900 mb-1">Recent Activity</h3>
      <p className="text-gray-600 text-sm">Track your latest model uploads and verifications</p>
     </div>
     <div className="flex items-center gap-2">
      <button
       onClick={refresh}
       className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
       <IoRefresh className="w-4 h-4" />
       Refresh
      </button>
      <button
       onClick={onNewUpload}
       className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
      >
       <IoCloudUpload className="w-4 h-4" />
       New Upload
      </button>
     </div>
    </div>
    
    {pendingModels.length === 0 ? (
     <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
       <IoCloudUpload className="w-8 h-8 text-gray-400" />
      </div>
      <h4 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h4>
      <p className="text-gray-600 mb-6 leading-relaxed max-w-md mx-auto">
       Start by uploading your first AI model. Our TEE verification system will ensure it's secure and ready for the marketplace.
      </p>
      <button 
       onClick={onNewUpload}
       className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
      >
       Upload Your First Model
      </button>
     </div>
    ) : (
     <div className="space-y-3">
      {pendingModels.slice(0, 5).map((model) => (
       <div key={model.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group">
        <div className="flex items-center gap-3 flex-1">
         <div className={`w-2 h-2 rounded-full ${getStatusColor(model.status)} ${model.status === 'pending' || model.status === 'verifying' ? 'animate-pulse' : ''}`} />
         <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
           <p className="font-medium text-gray-900">{model.title}</p>
           {model.status === 'verified' && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
             <IoCheckmarkCircle className="w-3 h-3" />
             Verified
            </div>
           )}
           {model.status === 'failed' && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs">
             <IoCloseCircle className="w-3 h-3" />
             Failed
            </div>
           )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
           <span>{model.category}</span>
           <span>•</span>
           <span>{new Date(model.createdAt).toLocaleDateString()}</span>
           {model.status === 'verifying' && (
            <>
             <span>•</span>
             <div className="flex items-center gap-2">
              <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 rounded-full w-2/3 animate-pulse"></div>
              </div>
              <span>Verifying...</span>
             </div>
            </>
           )}
          </div>
         </div>
        </div>
        <div className="flex items-center gap-2">
         <span className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusBadge(model.status)}`}>
          {model.status === 'verifying' ? 'verifying' : 
           model.status === 'pending' ? 'pending' : 
           model.status === 'verified' ? 'verified' : 
           model.status}
         </span>
         <button className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
         </button>
        </div>
       </div>
      ))}
      
      {pendingModels.length > 5 && (
       <div className="pt-3 text-center">
        <button className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm">
         View All {pendingModels.length} Models
        </button>
       </div>
      )}
     </div>
    )}
   </div>
  </div>
 )
}

function formatFileSize(bytes: number): string {
 if (bytes === 0) return '0 Bytes'
 const k = 1024
 const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
 const i = Math.floor(Math.log(bytes) / Math.log(k))
 return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function getStatusColor(status: string): string {
 switch (status) {
  case 'verified':
   return 'bg-green-500'
  case 'pending':
  case 'verifying':
   return 'bg-yellow-500'
  case 'failed':
   return 'bg-red-500'
  default:
   return 'bg-gray-500'
 }
}

function getStatusBadge(status: string): string {
 switch (status) {
  case 'verified':
   return 'bg-green-100 text-green-800'
  case 'pending':
   return 'bg-yellow-100 text-yellow-800'
  case 'verifying':
   return 'bg-blue-100 text-blue-700'
  case 'failed':
   return 'bg-red-100 text-red-800'
  default:
   return 'bg-gray-100 text-gray-700'
 }
}