'use client'

import React, { useState } from 'react'
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  FolderOpen,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { useDownload } from '@/hooks/useDownload'
import DownloadProgress from './DownloadProgress'

interface DownloadManagerProps {
  className?: string
}

export default function DownloadManager({ className = '' }: DownloadManagerProps) {
  const {
    isDownloading,
    error,
    progress,
    downloadHistory,
    cancelDownload,
    retryDownload,
    clearDownloadHistory,
    removeDownloadRecord,
    clearError
  } = useDownload()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date')

  const filteredDownloads = downloadHistory
    .filter(download => {
      const matchesSearch = download.modelTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           download.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || download.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.downloadDate).getTime() - new Date(a.downloadDate).getTime()
        case 'name':
          return a.modelTitle.localeCompare(b.modelTitle)
        case 'size':
          return b.fileSize - a.fileSize
        default:
          return 0
      }
    })

  const getStatusCounts = () => {
    return {
      all: downloadHistory.length,
      downloading: downloadHistory.filter(d => d.status === 'downloading').length,
      completed: downloadHistory.filter(d => d.status === 'completed').length,
      failed: downloadHistory.filter(d => d.status === 'failed').length,
      paused: downloadHistory.filter(d => d.status === 'paused').length
    }
  }

  const statusCounts = getStatusCounts()

  const handleRetryDownload = async (downloadId: string) => {
    try {
      await retryDownload(downloadId)
    } catch (error) {
      console.error('Failed to retry download:', error)
    }
  }

  const handleClearCompleted = () => {
    const completedDownloads = downloadHistory.filter(d => d.status === 'completed')
    completedDownloads.forEach(download => {
      removeDownloadRecord(download.id)
    })
  }

  const handleClearFailed = () => {
    const failedDownloads = downloadHistory.filter(d => d.status === 'failed')
    failedDownloads.forEach(download => {
      removeDownloadRecord(download.id)
    })
  }

  const openDownloadsFolder = () => {
    // In a real implementation, this would open the downloads folder
    // For demo purposes, we'll just show an alert
    alert('Opening downloads folder...')
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Download Manager</h2>
            {isDownloading && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                Downloading...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openDownloadsFolder}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Open downloads folder"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <button
              onClick={clearDownloadHistory}
              disabled={downloadHistory.length === 0}
              className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Clear all downloads"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.downloading}</div>
            <div className="text-sm text-gray-600">Downloading</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.paused}</div>
            <div className="text-sm text-gray-600">Paused</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search downloads..."
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
              <option value="downloading">Downloading</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="paused">Paused</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        {(statusCounts.completed > 0 || statusCounts.failed > 0) && (
          <div className="flex gap-2 mt-4">
            {statusCounts.completed > 0 && (
              <button
                onClick={handleClearCompleted}
                className="flex items-center gap-2 px-3 py-1 text-sm text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Clear Completed ({statusCounts.completed})
              </button>
            )}
            {statusCounts.failed > 0 && (
              <button
                onClick={handleClearFailed}
                className="flex items-center gap-2 px-3 py-1 text-sm text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Clear Failed ({statusCounts.failed})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Download Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="p-1 text-red-500 hover:text-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Downloads List */}
      <div className="p-6">
        {filteredDownloads.length === 0 ? (
          <div className="text-center py-12">
            <Download className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'No matching downloads' 
                : 'No downloads yet'
              }
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Downloaded models will appear here'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDownloads.map((download) => (
              <DownloadProgress
                key={download.id}
                download={download}
                progress={download.status === 'downloading' ? progress : 100}
                onCancel={download.status === 'downloading' ? cancelDownload : undefined}
                onPause={download.status === 'downloading' ? cancelDownload : undefined}
                onResume={download.status === 'paused' ? () => handleRetryDownload(download.id) : undefined}
                onRetry={download.status === 'failed' ? () => handleRetryDownload(download.id) : undefined}
                onRemove={() => removeDownloadRecord(download.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredDownloads.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              Showing {filteredDownloads.length} of {downloadHistory.length} downloads
            </span>
            <span>
              Total downloaded: {downloadHistory.filter(d => d.status === 'completed').length} models
            </span>
          </div>
        </div>
      )}
    </div>
  )
}