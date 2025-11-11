'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Shield, 
  Lock, 
  DollarSign, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Wallet,
  ArrowRight
} from 'lucide-react'
import { ModelCard } from '@/components/marketplace'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  model: ModelCard
  onPurchaseConfirm: (paymentMethod: string, walletAddress?: string) => Promise<void>
  isProcessing?: boolean
  className?: string
}

interface WalletInfo {
  address: string
  balance: string
  isConnected: boolean
}

export default function PurchaseModal({
  isOpen,
  onClose,
  model,
  onPurchaseConfirm,
  isProcessing = false,
  className = ''
}: PurchaseModalProps) {
  const [step, setStep] = useState<'review' | 'payment' | 'processing' | 'success' | 'error'>('review')
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet')
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    address: '',
    balance: '0',
    isConnected: false
  })
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string>('')

  // Mock wallet connection - in real app, this would use wallet SDK
  useEffect(() => {
    if (isOpen) {
      // Simulate checking wallet connection
      setWalletInfo({
        address: '0x1234...5678',
        balance: '125.50',
        isConnected: true
      })
    }
  }, [isOpen])

  const formatPrice = (price: string) => {
    const num = parseFloat(price)
    if (isNaN(num)) return '0.00'
    return num.toFixed(2)
  }

  const calculateFees = () => {
    const modelPrice = parseFloat(model.price)
    const platformFee = modelPrice * 0.025 // 2.5% platform fee
    const networkFee = 0.001 // Fixed network fee in SUI
    const total = modelPrice + platformFee + networkFee
    
    return {
      modelPrice,
      platformFee,
      networkFee,
      total
    }
  }

  const fees = calculateFees()

  const handlePurchase = async () => {
    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }

    setStep('processing')
    setError('')

    try {
      await onPurchaseConfirm(paymentMethod, walletInfo.address)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
      setStep('error')
    }
  }

  const resetModal = () => {
    setStep('review')
    setPaymentMethod('wallet')
    setAgreedToTerms(false)
    setError('')
    setShowPrivateKey(false)
  }

  const handleClose = () => {
    if (step !== 'processing') {
      resetModal()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'review' && 'Review Purchase'}
            {step === 'payment' && 'Payment Method'}
            {step === 'processing' && 'Processing Payment'}
            {step === 'success' && 'Purchase Complete'}
            {step === 'error' && 'Purchase Failed'}
          </h2>
          <button
            onClick={handleClose}
            disabled={step === 'processing'}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'review' && (
            <div className="space-y-6">
              {/* Model Summary */}
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-gray-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{model.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">by {model.author}</p>
                  <div className="flex items-center gap-2">
                    {model.isVerified && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        Verified
                      </span>
                    )}
                    {model.isEncrypted && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        SEAL Encrypted
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Price Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model Price</span>
                    <span className="font-medium">{formatPrice(fees.modelPrice.toString())} SUI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee (2.5%)</span>
                    <span className="font-medium">{formatPrice(fees.platformFee.toString())} SUI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network Fee</span>
                    <span className="font-medium">{formatPrice(fees.networkFee.toString())} SUI</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(fees.total.toString())} SUI</span>
                  </div>
                </div>
              </div>

              {/* Wallet Status */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Wallet Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    walletInfo.isConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {walletInfo.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {walletInfo.isConnected && (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address</span>
                      <span className="font-mono">{walletInfo.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Balance</span>
                      <span className="font-medium">{walletInfo.balance} SUI</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={!agreedToTerms || !walletInfo.isConnected}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Purchase with Wallet
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600 mb-4">
                Please wait while we process your purchase. This may take a few moments.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-yellow-800 text-sm">
                    Do not close this window or refresh the page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Purchase Successful!</h3>
              <p className="text-gray-600 mb-6">
                Your model has been purchased successfully. You can now download and use it.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Navigate to downloads or model page
                    handleClose()
                  }}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  Go to Downloads
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Purchase Failed</h3>
              <p className="text-gray-600 mb-4">
                We encountered an error while processing your purchase.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              <div className="space-y-3">
                <button
                  onClick={() => setStep('review')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}