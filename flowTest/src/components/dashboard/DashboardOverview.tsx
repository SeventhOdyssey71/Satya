'use client'

import React from 'react'
import { 
 IoTime,
 IoCheckmarkCircle,
 IoCloseCircle,
 IoCloudUpload,
 IoStatsChart,
 IoDownload
} from 'react-icons/io5'
import { useUploadTasks, useUploadActions } from '@/contexts/UploadContext'

interface DashboardOverviewProps {
 onNewUpload?: () => void
}

export default function DashboardOverview({ onNewUpload }: DashboardOverviewProps) {
 const { allTasks } = useUploadTasks()
 const { clearFailedTasks } = useUploadActions()

 // Calculate status counts based on the new flow requirements
 const statusCounts = {
  pending: allTasks.filter(task => task.status === 'pending' || task.status === 'uploading').length,
  completed: allTasks.filter(task => task.status === 'completed').length,
  failed: allTasks.filter(task => task.status === 'cancelled').length
 }

 return (
  <div className="space-y-12">
   {/* Status Overview Cards */}
   <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="flex items-center justify-center gap-12">
     {/* Pending */}
     <div className="text-center">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
       <IoTime className="w-5 h-5 text-blue-600" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">Pending</h3>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{statusCounts.pending}</p>
      <p className="text-xs text-gray-600">Processing uploads</p>
     </div>

     {/* Completed */}
     <div className="text-center">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
       <IoCheckmarkCircle className="w-5 h-5 text-blue-600" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">Completed</h3>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{statusCounts.completed}</p>
      <p className="text-xs text-gray-600">Available in marketplace</p>
     </div>

     {/* Failed */}
     <div className="text-center">
      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
       <IoCloseCircle className="w-5 h-5 text-red-500" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">Failed</h3>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{statusCounts.failed}</p>
      <p className="text-xs text-gray-600">Requires attention</p>
      {statusCounts.failed > 0 && (
       <button 
        onClick={clearFailedTasks}
        className="mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
       >
        Clear Failed
       </button>
      )}
     </div>
    </div>
   </div>

   {/* Quick Stats */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
     <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
      <IoStatsChart className="w-5 h-5 text-blue-600" />
     </div>
     <p className="text-sm text-gray-600 mb-1">Total Uploads</p>
     <p className="text-2xl font-semibold text-gray-900 mb-1">{allTasks.length}</p>
     <div className="text-xs text-gray-500">
      {allTasks.length > 0 ? '+2 this week' : 'Get started!'}
     </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
     <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
      <IoDownload className="w-5 h-5 text-blue-600" />
     </div>
     <p className="text-sm text-gray-600 mb-1">Total Size</p>
     <p className="text-2xl font-semibold text-gray-900 mb-1">
      {formatFileSize(allTasks.reduce((sum, task) => sum + task.fileSize, 0))}
     </p>
     <div className="text-xs text-gray-500">
      Across all models
     </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
     <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
     </div>
     <p className="text-sm text-gray-600 mb-1">Avg. Speed</p>
     <p className="text-2xl font-semibold text-gray-900 mb-1">2.4 MB/s</p>
     <div className="text-xs text-gray-500">
      Upload speed
     </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
     <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
      <IoCheckmarkCircle className="w-5 h-5 text-blue-600" />
     </div>
     <p className="text-sm text-gray-600 mb-1">Success Rate</p>
     <p className="text-2xl font-semibold text-gray-900 mb-1">
      {allTasks.length ? Math.round((statusCounts.completed / allTasks.length) * 100) : 0}%
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
      {statusCounts.failed > 0 && (
       <button
        onClick={clearFailedTasks}
        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
       >
        Clear Failed ({statusCounts.failed})
       </button>
      )}
      <button
       onClick={onNewUpload}
       className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
       <IoCloudUpload className="w-4 h-4" />
       New Upload
      </button>
     </div>
    </div>
    
    {allTasks.length === 0 ? (
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
       className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
       Upload Your First Model
      </button>
     </div>
    ) : (
     <div className="space-y-3">
      {allTasks.slice(0, 5).map((task, index) => (
       <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group">
        <div className="flex items-center gap-3 flex-1">
         <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)} ${task.status === 'pending' || task.status === 'uploading' ? 'animate-pulse' : ''}`} />
         <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
           <p className="font-medium text-gray-900">{task.fileName}</p>
           {task.status === 'completed' && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
             <IoCheckmarkCircle className="w-3 h-3" />
             Verified
            </div>
           )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
           <span>{formatFileSize(task.fileSize)}</span>
           <span>•</span>
           <span>{new Date().toLocaleDateString()}</span>
           {task.status === 'uploading' && (
            <>
             <span>•</span>
             <div className="flex items-center gap-2">
              <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 rounded-full w-2/3 animate-pulse"></div>
              </div>
              <span>67%</span>
             </div>
            </>
           )}
          </div>
         </div>
        </div>
        <div className="flex items-center gap-2">
         <span className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusBadge(task.status)}`}>
          {task.status === 'uploading' ? 'uploading' : 
           task.status === 'pending' ? 'verifying' : 
           task.status === 'completed' ? 'completed' : 
           task.status}
         </span>
         <button className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
         </button>
        </div>
       </div>
      ))}
      
      {allTasks.length > 5 && (
       <div className="pt-3 text-center">
        <button className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm">
         View All {allTasks.length} Uploads
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
  case 'completed':
   return 'bg-blue-500'
  case 'pending':
  case 'uploading':
   return 'bg-blue-400'
  case 'failed':
  case 'error':
   return 'bg-red-500'
  default:
   return 'bg-gray-500'
 }
}

function getStatusBadge(status: string): string {
 switch (status) {
  case 'completed':
   return 'bg-blue-100 text-blue-800'
  case 'pending':
  case 'uploading':
   return 'bg-blue-100 text-blue-700'
  case 'failed':
  case 'error':
   return 'bg-red-100 text-red-800'
  default:
   return 'bg-gray-100 text-gray-700'
 }
}