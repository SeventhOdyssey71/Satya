'use client'

import React, { useState } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  Pause, 
  Play,
  Trash2,
  Download,
  FileText,
  AlertCircle
} from 'lucide-react'
import { useUploadTasks, useUploadActions, UploadTask } from '@/contexts/UploadContext'

interface UploadHistoryProps {
  maxHeight?: string
  showStats?: boolean
}

export default function UploadHistory({ 
  maxHeight = 'max-h-96', 
  showStats = true 
}: UploadHistoryProps) {
  const { allTasks, taskCount } = useUploadTasks()
  const { clearCompletedTasks, clearAllTasks, removeUploadTask, cancelUploadTask } = useUploadActions()
  
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest')

  // Filter and sort tasks
  const filteredTasks = allTasks
    .filter(task => {
      switch (filter) {
        case 'active':
          return task.status === 'uploading' || task.status === 'pending'
        case 'completed':
          return task.status === 'completed'
        case 'failed':
          return task.status === 'failed' || task.status === 'cancelled'
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.updatedAt.getTime() - a.updatedAt.getTime()
        case 'oldest':
          return a.updatedAt.getTime() - b.updatedAt.getTime()
        case 'name':
          return a.title.localeCompare(b.title)
        case 'size':
          return b.fileSize - a.fileSize
        default:
          return 0
      }
    })

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return '< 1s'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getStatusIcon = (status: UploadTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'uploading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: UploadTask['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'failed':
      case 'cancelled':
        return 'text-red-600'
      case 'uploading':
        return 'text-blue-600'
      case 'pending':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload History</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={clearCompletedTasks}
            disabled={taskCount.completed === 0}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Completed
          </button>
          <button
            onClick={clearAllTasks}
            disabled={taskCount.total === 0}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{taskCount.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{taskCount.active}</div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{taskCount.completed}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{taskCount.failed}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className={`${maxHeight} overflow-y-auto`}>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No uploads found</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                View all uploads
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <UploadTaskItem
                key={task.id}
                task={task}
                onCancel={() => cancelUploadTask(task.id)}
                onRemove={() => removeUploadTask(task.id)}
                formatFileSize={formatFileSize}
                formatDuration={formatDuration}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface UploadTaskItemProps {
  task: UploadTask
  onCancel: () => void
  onRemove: () => void
  formatFileSize: (bytes: number) => string
  formatDuration: (ms: number) => string
  getStatusIcon: (status: UploadTask['status']) => React.ReactNode
  getStatusColor: (status: UploadTask['status']) => string
}

function UploadTaskItem({
  task,
  onCancel,
  onRemove,
  formatFileSize,
  formatDuration,
  getStatusIcon,
  getStatusColor
}: UploadTaskItemProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const duration = task.updatedAt.getTime() - task.createdAt.getTime()
  const isActive = task.status === 'uploading' || task.status === 'pending'
  const canCancel = task.status === 'uploading' || task.status === 'pending'
  const canRemove = !isActive

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      {/* Main task info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getStatusIcon(task.status)}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
              <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{task.fileName}</span>
              <span>{formatFileSize(task.fileSize)}</span>
              {!isActive && duration > 0 && (
                <span>Duration: {formatDuration(duration)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {/* Progress indicator for active uploads */}
          {isActive && (
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{task.progress}%</div>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {canCancel && (
              <button
                onClick={onCancel}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                title="Cancel upload"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            
            {canRemove && (
              <button
                onClick={onRemove}
                className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove from history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title={showDetails ? 'Hide details' : 'Show details'}
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress phases for active uploads */}
      {isActive && task.phases && task.phases.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="space-y-2">
            {task.phases.map((phase) => (
              <div key={phase.id} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  phase.status === 'completed' ? 'bg-green-500' :
                  phase.status === 'in-progress' ? 'bg-blue-500' :
                  phase.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm text-gray-600">{phase.name}</span>
                {phase.status === 'in-progress' && phase.progress !== undefined && (
                  <span className="text-sm text-gray-500">({phase.progress}%)</span>
                )}
                {phase.status === 'error' && phase.error && (
                  <span className="text-sm text-red-600">- {phase.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed information */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Created:</span>{' '}
              <span className="text-gray-900">{task.createdAt.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Updated:</span>{' '}
              <span className="text-gray-900">{task.updatedAt.toLocaleString()}</span>
            </div>
            
            {task.result?.modelId && (
              <div>
                <span className="text-gray-500">Model ID:</span>{' '}
                <span className="text-gray-900 font-mono text-xs">{task.result.modelId}</span>
              </div>
            )}
            
            {task.result?.listingId && (
              <div>
                <span className="text-gray-500">Listing ID:</span>{' '}
                <span className="text-gray-900 font-mono text-xs">{task.result.listingId}</span>
              </div>
            )}
          </div>

          {/* Error details */}
          {(task.status === 'failed' || task.status === 'cancelled') && task.error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <span className="font-medium">Error: </span>
              {task.error}
            </div>
          )}

          {/* Warnings */}
          {task.result?.warnings && task.result.warnings.length > 0 && (
            <div className="mt-2">
              <div className="text-sm text-gray-600 mb-1">Warnings:</div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {task.result.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}