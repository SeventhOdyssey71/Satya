'use client'

import React from 'react'
import { 
  Download, 
  Pause, 
  Play, 
  X, 
  CheckCircle, 
  AlertCircle,
  Clock,
  FileText,
  Shield
} from 'lucide-react'
import type { DownloadRecord } from '@/hooks/useDownload'

interface DownloadProgressProps {
  download: DownloadRecord
  progress?: number
  onCancel?: () => void
  onPause?: () => void
  onResume?: () => void
  onRetry?: () => void
  onRemove?: () => void
  className?: string
}

export default function DownloadProgress({
  download,
  progress = 0,
  onCancel,
  onPause,
  onResume,
  onRetry,
  onRemove,
  className = ''
}: DownloadProgressProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = () => {
    switch (download.status) {
      case 'downloading':
        return <Download className="w-5 h-5 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (download.status) {
      case 'downloading':
        return 'text-blue-600 bg-blue-50'
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'paused':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = () => {
    switch (download.status) {
      case 'downloading':
        return 'Downloading'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      case 'paused':
        return 'Paused'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-start gap-4">
        {/* File Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-600" />
          </div>
        </div>

        {/* Download Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {download.modelTitle}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {download.fileName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {formatFileSize(download.fileSize)}
                </span>
                {download.isEncrypted && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Shield className="w-3 h-3" />
                    SEAL Encrypted
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              {getStatusText()}
            </div>
          </div>

          {/* Progress Bar */}
          {(download.status === 'downloading' || download.status === 'paused') && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>{progress}% complete</span>
                <span>{formatDate(download.downloadDate)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    download.status === 'downloading' 
                      ? 'bg-blue-600' 
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}

          {/* Completed/Failed Info */}
          {download.status === 'completed' && (
            <div className="mt-2 text-xs text-gray-500">
              Downloaded on {formatDate(download.downloadDate)}
            </div>
          )}

          {download.status === 'failed' && (
            <div className="mt-2 text-xs text-red-600">
              Download failed on {formatDate(download.downloadDate)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {download.status === 'downloading' && (
            <>
              {onPause && (
                <button
                  onClick={onPause}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Pause download"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Cancel download"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {download.status === 'paused' && (
            <>
              {onResume && (
                <button
                  onClick={onResume}
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Resume download"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Cancel download"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {download.status === 'failed' && (
            <>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              )}
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Remove from list"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {download.status === 'completed' && onRemove && (
            <button
              onClick={onRemove}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Remove from list"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}