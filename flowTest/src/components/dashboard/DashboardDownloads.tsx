'use client'

import React, { useState, useEffect } from 'react'
import { 
  IoDownload,
  IoEye,
  IoTime,
  IoCheckmarkCircle,
  IoDocument,
  IoLockClosed,
  IoLockOpen
} from 'react-icons/io5'

interface Download {
  id: string
  modelId: string
  modelTitle: string
  downloadDate: number
  fileSize: number
  attestationId?: string
  encrypted: boolean
  accessible: boolean
  creator: string
  price: string
}

export default function DashboardDownloads() {
  const [downloads, setDownloads] = useState<Download[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load user's downloads from localStorage or API
    loadDownloads()
  }, [])

  const loadDownloads = () => {
    // Simulate loading downloads - in production this would come from your backend/blockchain
    setTimeout(() => {
      const mockDownloads: Download[] = [
        {
          id: 'download-1',
          modelId: '0x5e980abccf8c42cd9d0bd745c5a617e094d2c886d71b455bda49c10df0841287',
          modelTitle: 'Advanced Weather Prediction Model',
          downloadDate: Date.now() - 86400000, // 1 day ago
          fileSize: 2.5 * 1024 * 1024 * 1024, // 2.5GB
          attestationId: 'att_weather_001',
          encrypted: true,
          accessible: true,
          creator: '0xce5e05...0dacbee',
          price: '5'
        },
        {
          id: 'download-2',
          modelId: '0x7f891bccdf9c53de8e1ea856d82c997f195e3d97e82f566ceb48e21e0f951398',
          modelTitle: 'Financial Sentiment Analysis',
          downloadDate: Date.now() - 172800000, // 2 days ago
          fileSize: 1.2 * 1024 * 1024 * 1024, // 1.2GB
          encrypted: true,
          accessible: true,
          creator: '0x3fb92f...8dc45ea',
          price: '3'
        }
      ]
      setDownloads(mockDownloads)
      setLoading(false)
    }, 1000)
  }

  const handleRedownload = (download: Download) => {
    // Simulate redownload
    console.log('Redownloading model:', download.modelId)
    // In production, this would trigger the decryption popup and download flow
  }

  const handleViewInMarketplace = (modelId: string) => {
    window.open(`/model/${modelId}`, '_blank')
  }

  const handleDecrypt = (download: Download) => {
    // This would open the decryption popup
    console.log('Decrypting model:', download.modelId)
    // In production, this would show the decryption interface
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
        <p className="ml-4 text-gray-600">Loading your downloads...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-gray-900">Your Downloads</h2>
          <p className="text-sm text-gray-600 mt-1">
            Access and re-download your purchased models anytime
          </p>
        </div>
        
        <div className="text-sm text-gray-600">
          Total Downloads: {downloads.length}
        </div>
      </div>

      {/* Downloads List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {downloads.length === 0 ? (
          <div className="text-center py-12">
            <IoDownload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No downloads yet</p>
            <p className="text-sm text-gray-400">
              Purchase models from the marketplace to see them here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {downloads.map((download) => (
              <div key={download.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Model Info */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <IoDocument className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1">{download.modelTitle}</h3>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>Creator: {download.creator}</span>
                          <span>•</span>
                          <span>{formatFileSize(download.fileSize)}</span>
                          <span>•</span>
                          <span>Purchased: {new Date(download.downloadDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{download.price} SUI</span>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            <IoCheckmarkCircle className="w-3 h-3" />
                            Purchased
                          </span>
                          
                          {download.encrypted && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              <IoLockClosed className="w-3 h-3" />
                              SEAL Encrypted
                            </span>
                          )}
                          
                          {download.attestationId && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                              <IoCheckmarkCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>

                        {download.attestationId && (
                          <div className="text-xs text-gray-500">
                            Attestation ID: {download.attestationId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewInMarketplace(download.modelId)}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      title="View in Marketplace"
                    >
                      <IoEye className="w-4 h-4" />
                    </button>

                    {download.accessible && download.encrypted && (
                      <button
                        onClick={() => handleDecrypt(download)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                        title="Decrypt and Access"
                      >
                        <IoLockOpen className="w-4 h-4" />
                        Decrypt
                      </button>
                    )}

                    <button
                      onClick={() => handleRedownload(download)}
                      className="px-3 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
                      title="Download Again"
                    >
                      <IoDownload className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Download Instructions */}
      {downloads.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Download Instructions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click "Decrypt" to access SEAL encrypted models in a secure popup</li>
            <li>• Use "Download" to get a fresh copy of your purchased models</li>
            <li>• All downloads are linked to your wallet address and remain accessible</li>
            <li>• Encrypted models require TEE verification for security</li>
          </ul>
        </div>
      )}
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