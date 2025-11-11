'use client'

import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, Eye } from 'lucide-react'

interface UploadResult {
  success: boolean
  modelId?: string
  listingId?: string
  blobId?: string
  transactionHash?: string
  error?: string
  warnings?: string[]
}

interface UploadStatusProps {
  result: UploadResult
  onReset?: () => void
  onViewListing?: (listingId: string) => void
  className?: string
}

export default function UploadStatus({
  result,
  onReset,
  onViewListing,
  className = ''
}: UploadStatusProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
    alert(`${label} copied to clipboard`)
  }

  if (result.success) {
    return (
      <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
        {/* Success Header */}
        <div className="p-6 border-b">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Model Uploaded Successfully!
              </h3>
              <p className="text-sm text-gray-600">
                Your model has been uploaded to the marketplace
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {result.modelId && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Model ID</p>
                <p className="text-sm text-gray-600 font-mono">{result.modelId}</p>
              </div>
              <button
                onClick={() => copyToClipboard(result.modelId!, 'Model ID')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
              >
                <Copy className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          )}

          {result.listingId && (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Listing ID</p>
                <p className="text-sm text-gray-600 font-mono">{result.listingId}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(result.listingId!, 'Listing ID')}
                  className="p-2 hover:bg-green-100 rounded transition-colors"
                >
                  <Copy className="h-4 w-4 text-gray-500" />
                </button>
                {onViewListing && (
                  <button
                    onClick={() => onViewListing(result.listingId!)}
                    className="p-2 hover:bg-green-100 rounded transition-colors"
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          )}

          {result.blobId && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Storage Blob ID</p>
                <p className="text-sm text-gray-600 font-mono">{result.blobId}</p>
              </div>
              <button
                onClick={() => copyToClipboard(result.blobId!, 'Blob ID')}
                className="p-2 hover:bg-blue-100 rounded transition-colors"
              >
                <Copy className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          )}

          {result.transactionHash && (
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Transaction Hash</p>
                <p className="text-sm text-gray-600 font-mono">{result.transactionHash}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(result.transactionHash!, 'Transaction Hash')}
                  className="p-2 hover:bg-purple-100 rounded transition-colors"
                >
                  <Copy className="h-4 w-4 text-gray-500" />
                </button>
                <a
                  href={`https://suiscan.xyz/transaction/${result.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-purple-100 rounded transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                </a>
              </div>
            </div>
          )}

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Warnings</p>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    {result.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          {onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Upload Another Model
            </button>
          )}
          
          <div className="flex space-x-3">
            {result.listingId && onViewListing && (
              <button
                onClick={() => onViewListing(result.listingId!)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                View Listing
              </button>
            )}
            <button
              onClick={() => window.location.href = '/marketplace'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Error Header */}
      <div className="p-6 border-b">
        <div className="flex items-center">
          <XCircle className="h-8 w-8 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Upload Failed
            </h3>
            <p className="text-sm text-gray-600">
              There was an error uploading your model
            </p>
          </div>
        </div>
      </div>

      {/* Error Details */}
      <div className="p-6">
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-800">{result.error}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t bg-gray-50 flex justify-between">
        {onReset && (
          <button
            onClick={onReset}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.href = '/support'}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Get Help
        </button>
      </div>
    </div>
  )
}

// Example usage component
export function UploadStatusExample() {
  const successResult: UploadResult = {
    success: true,
    modelId: 'model_123456789',
    listingId: 'listing_987654321',
    blobId: 'blob_abcdef123456',
    transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
    warnings: ['Model file is larger than recommended size', 'Consider adding more tags for better discoverability']
  }

  const errorResult: UploadResult = {
    success: false,
    error: 'Network connection failed during upload. Please check your internet connection and try again.'
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Success Example</h2>
        <UploadStatus 
          result={successResult}
          onReset={() => alert('Reset clicked')}
          onViewListing={(id) => alert(`View listing: ${id}`)}
        />
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Error Example</h2>
        <UploadStatus 
          result={errorResult}
          onReset={() => alert('Try again clicked')}
        />
      </div>
    </div>
  )
}