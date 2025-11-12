'use client'

import React, { useState } from 'react'
import { X, Download, Lock, Unlock, CheckCircle } from 'lucide-react'

interface DecryptionModalProps {
  model: any
  onClose: () => void
}

export default function DecryptionModal({ model, onClose }: DecryptionModalProps) {
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const handleDecrypt = async () => {
    setIsDecrypting(true)
    
    // Simulate decryption process
    setTimeout(() => {
      setIsDecrypting(false)
      setIsComplete(true)
      setDownloadUrl(`https://example.com/download/${model.id}`)
    }, 3000)
  }

  const handleDownload = () => {
    // Simulate download
    const link = document.createElement('a')
    link.href = downloadUrl || '#'
    link.download = `${model.title}.zip`
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Access Model</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {isComplete ? (
                <Unlock className="w-8 h-8 text-green-600" />
              ) : (
                <Lock className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h3 className="font-medium text-gray-900 mb-2">{model.title}</h3>
            <p className="text-sm text-gray-600">
              {isComplete 
                ? 'Model decrypted successfully!'
                : isDecrypting 
                  ? 'Decrypting model with SEAL...'
                  : 'Click to decrypt and access your purchased model'
              }
            </p>
          </div>

          {isDecrypting && (
            <div className="space-y-2">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Using SEAL encryption to securely decrypt...
              </p>
            </div>
          )}

          {isComplete && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Decryption Complete</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your model is ready for download
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {!isComplete && !isDecrypting && (
              <button
                onClick={handleDecrypt}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Decrypt Model
              </button>
            )}
            
            {isComplete && (
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isComplete ? 'Close' : 'Cancel'}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Secure Access:</strong> This model is encrypted with SEAL technology 
              and verified through TEE attestation. Your download is secure and authenticated.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}