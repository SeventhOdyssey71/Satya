'use client'

import React, { useState } from 'react'
import { CheckCircle, Clock, ShoppingCart } from 'lucide-react'

interface ModelPurchaseFlowProps {
  model: any
  onComplete: () => void
}

export default function ModelPurchaseFlow({ model, onComplete }: ModelPurchaseFlowProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handlePurchase = async () => {
    setIsProcessing(true)
    
    // Simulate purchase process
    setTimeout(() => {
      setIsProcessing(false)
      setIsComplete(true)
      onComplete()
    }, 2000)
  }

  if (isComplete) {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Purchase Complete!</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            You now have access to this model
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
            <span className="text-sm font-medium">Processing Purchase...</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Completing blockchain transaction
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-800 mb-2">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Ready to Purchase</span>
        </div>
        <p className="text-sm text-green-700">
          Verification complete. You can now purchase this model.
        </p>
      </div>
      
      <button
        onClick={handlePurchase}
        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <ShoppingCart className="w-4 h-4" />
        Purchase Model ({model.price} SUI)
      </button>
    </div>
  )
}