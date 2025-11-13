'use client'

import React, { useState } from 'react'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface AttestationVerificationFlowProps {
  model: any
  onComplete: (attestationId: string) => void
}

export default function AttestationVerificationFlow({ model, onComplete }: AttestationVerificationFlowProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleVerification = async () => {
    setIsProcessing(true)
    
    // Simulate verification process
    setTimeout(() => {
      setIsProcessing(false)
      setIsComplete(true)
      const attestationId = `att_${Date.now()}`
      onComplete(attestationId)
    }, 3000)
  }

  if (isComplete) {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Verification Complete!</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Model attestation verified successfully
          </p>
        </div>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <Clock className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Processing Verification...</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Running TEE attestation checks
          </p>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center gap-2 text-purple-800 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">TEE Verification Required</span>
        </div>
        <p className="text-sm text-purple-700">
          This will verify model integrity using AWS Nitro Enclaves
        </p>
      </div>
      
      <button
        onClick={handleVerification}
        className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
      >
        Pay for Verification ({model.attestationPrice} SUI)
      </button>
    </div>
  )
}