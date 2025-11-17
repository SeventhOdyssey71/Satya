'use client'

import React, { useState } from 'react'
import { 
 IoTime,
 IoCheckmarkCircle,
 IoCloseCircle,
 IoRefresh,
 IoEye,
 IoTrash
} from 'react-icons/io5'
import { useUploadTasks, useUploadActions } from '@/contexts/UploadContext'

export default function DashboardHistory() {
 const { allTasks } = useUploadTasks()
 const { clearCompletedTasks } = useUploadActions()
 const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all')

 const filteredTasks = allTasks.filter(task => {
  if (filter === 'all') return true
  if (filter === 'pending') return task.status === 'pending' || task.status === 'uploading'
  if (filter === 'completed') return task.status === 'completed'
  if (filter === 'failed') return task.status === 'cancelled'
  return true
 })

 return (
  <div className="max-w-4xl space-y-6">
   {/* Filter Controls */}
   <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
     <h2 className="text-xl font-medium text-gray-900">Upload History</h2>
     <div className="flex items-center gap-2">
      <button
       onClick={() => setFilter('all')}
       className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        filter === 'all' 
         ? 'bg-black text-white' 
         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
       }`}
      >
       All ({allTasks.length})
      </button>
      <button
       onClick={() => setFilter('pending')}
       className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        filter === 'pending' 
         ? 'bg-blue-600 text-white' 
         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
       }`}
      >
       Pending ({allTasks.filter(t => t.status === 'pending' || t.status === 'uploading').length})
      </button>
      <button
       onClick={() => setFilter('completed')}
       className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        filter === 'completed' 
         ? 'bg-blue-600 text-white' 
         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
       }`}
      >
       Completed ({allTasks.filter(t => t.status === 'completed').length})
      </button>
      <button
       onClick={() => setFilter('failed')}
       className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        filter === 'failed' 
         ? 'bg-red-600 text-white' 
         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
       }`}
      >
       Failed ({allTasks.filter(t => t.status === 'cancelled').length})
      </button>
     </div>
    </div>

    {allTasks.filter(t => t.status === 'completed').length > 0 && (
     <button
      onClick={clearCompletedTasks}
      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
     >
      Clear Completed
     </button>
    )}
   </div>

   {/* History List */}
   <div className="bg-white border border-gray-200 rounded-lg">
    {filteredTasks.length === 0 ? (
     <div className="text-center py-12">
      <IoTime className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">
       {filter === 'all' 
        ? 'No uploads yet' 
        : `No ${filter} uploads`
       }
      </p>
     </div>
    ) : (
     <div className="divide-y divide-gray-200">
      {filteredTasks.map((task) => (
       <div key={task.id} className="p-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between">
         <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status Icon */}
          <div className="flex-shrink-0 pt-0.5">
           {task.status === 'completed' && (
            <IoCheckmarkCircle className="w-5 h-5 text-green-600" />
           )}
           {(task.status === 'pending' || task.status === 'uploading') && (
            <IoTime className="w-5 h-5 text-yellow-600" />
           )}
           {task.status === 'cancelled' && (
            <IoCloseCircle className="w-5 h-5 text-red-600" />
           )}
          </div>

          {/* Task Details */}
          <div className="min-w-0 flex-1">
           <h3 className="font-medium text-gray-900 text-sm truncate">{task.fileName}</h3>
           <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{formatFileSize(task.fileSize)}</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString()}</span>
            {task.status === 'completed' && (
             <>
              <span>•</span>
              <span>Duration: {formatDuration(60000)}</span>
             </>
            )}
           </div>
           {task.status === 'completed' && (
            <div className="mt-1 text-xs text-gray-600">
             <span className="font-medium">Blob ID:</span> {task.id?.slice(0, 8)}...
            </div>
           )}
           {task.error && (
            <div className="mt-1 text-xs text-red-600 truncate">
             Error: {task.error}
            </div>
           )}
          </div>
         </div>

         {/* Actions */}
         <div className="flex items-center gap-1 flex-shrink-0">
          {task.status === 'completed' && (
           <button
            onClick={() => window.open(`/model/${task.id}`, '_blank')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="View in Marketplace"
           >
            <IoEye className="w-4 h-4" />
           </button>
          )}
          
          {task.status === 'cancelled' && (
           <button
            onClick={() => console.log('Retry:', task.id)}
            className="p-2 text-yellow-600 hover:text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors"
            title="Retry Upload"
           >
            <IoRefresh className="w-4 h-4" />
           </button>
          )}

          <button
           onClick={() => console.log('Remove:', task.id)}
           className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
           title="Remove from History"
          >
           <IoTrash className="w-4 h-4" />
          </button>
         </div>
        </div>

        {/* Progress Bar for Active Uploads */}
        {(task.status === 'uploading' && task.progress !== undefined) && (
         <div className="mt-2 pl-8">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
           <span>Uploading...</span>
           <span>{Math.round(task.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
           <div 
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${task.progress}%` }}
           />
          </div>
         </div>
        )}
       </div>
      ))}
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

function formatDuration(ms: number): string {
 if (ms < 1000) return '< 1s'
 const seconds = Math.floor(ms / 1000)
 const minutes = Math.floor(seconds / 60)
 const hours = Math.floor(minutes / 60)
 
 if (hours > 0) return `${hours}h ${minutes % 60}m`
 if (minutes > 0) return `${minutes}m ${seconds % 60}s`
 return `${seconds}s`
}