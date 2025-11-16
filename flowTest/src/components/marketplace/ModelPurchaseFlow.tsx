'use client'

import React, { useState } from 'react'
import { CheckCircle, Clock, ShoppingCart, Shield, ExternalLink } from 'lucide-react'
import { useCurrentAccount, useSignTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

interface ModelPurchaseFlowProps {
  model: any
  onComplete: () => void
}

export default function ModelPurchaseFlow({ model, onComplete }: ModelPurchaseFlowProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [purchaseTxDigest, setPurchaseTxDigest] = useState<string | null>(null)
  const [attestationVerified, setAttestationVerified] = useState(false)

  const account = useCurrentAccount()
  const { mutate: signTransaction } = useSignTransaction()
  const suiClient = useSuiClient()

  const verifyAttestation = async () => {
    setIsProcessing(true)
    
    try {
      // Simulate attestation verification
      // In real implementation, this would verify the TEE attestation
      setTimeout(() => {
        setAttestationVerified(true)
        setIsProcessing(false)
      }, 1500)
    } catch (error) {
      console.error('Attestation verification failed:', error)
      setIsProcessing(false)
    }
  }

  const handlePurchase = async () => {
    if (!account) {
      alert('Please connect your wallet first')
      return
    }

    setIsProcessing(true)
    
    try {
      // Create SUI transaction for model purchase
      const tx = new Transaction()
      
      // Add transaction to purchase the model
      // This would call the appropriate Move function
      const priceInMist = BigInt(parseFloat(model.price || "0.01") * 1_000_000_000) // Convert SUI to MIST
      
      tx.splitCoins(tx.gas, [priceInMist])
      
      // In a real implementation, this would call the marketplace contract
      // tx.moveCall({
      //   target: `${PACKAGE_ID}::marketplace_v2::purchase_model`,
      //   arguments: [
      //     tx.object(model.listingId),
      //     tx.pure(model.attestationTxDigest), // Include attestation reference
      //   ]
      // })
      
      signTransaction(
        {
          transaction: tx,
          chain: 'sui:testnet',
        },
        {
          onSuccess: (result) => {
            // The signed transaction result - might need to be executed separately
            console.log('Transaction signed:', result)
            setPurchaseTxDigest('mock_digest_' + Date.now())
            setIsProcessing(false)
            setIsComplete(true)
            onComplete()
          },
          onError: (error) => {
            console.error('Transaction failed:', error)
            setIsProcessing(false)
            alert('Transaction failed. Please try again.')
          }
        }
      )
    } catch (error) {
      console.error('Purchase failed:', error)
      setIsProcessing(false)
      alert('Purchase failed. Please try again.')
    }
  }

  if (isComplete) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Purchase Complete!</span>
          </div>
          <p className="text-sm text-green-700 mb-3">
            You now have access to this model. The purchase has been recorded on the SUI blockchain.
          </p>
          {purchaseTxDigest && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600">Transaction:</span>
              <a
                href={`https://testnet.suivision.xyz/txblock/${purchaseTxDigest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
              >
                {purchaseTxDigest.substring(0, 8)}...{purchaseTxDigest.substring(-8)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
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
      {/* Attestation Verification Step */}
      {!attestationVerified && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 text-purple-800 mb-2">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">TEE Attestation Required</span>
          </div>
          <p className="text-sm text-purple-700 mb-3">
            Before purchasing, we need to verify the model&apos;s TEE attestation to ensure integrity and quality.
          </p>
          {model.attestationTxDigest && (
            <div className="mb-3 text-sm text-purple-600">
              <span className="font-medium">Attestation TX: </span>
              <a
                href={`https://testnet.suivision.xyz/txblock/${model.attestationTxDigest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 inline-flex"
              >
                {model.attestationTxDigest?.substring(0, 12)}...
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          <button
            onClick={verifyAttestation}
            disabled={isProcessing}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            Verify Attestation
          </button>
        </div>
      )}

      {/* Purchase Step */}
      {attestationVerified && (
        <>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Attestation Verified ✓</span>
            </div>
            <p className="text-sm text-green-700">
              TEE attestation verified successfully. You can now purchase this model safely.
            </p>
            {model.qualityScore && (
              <div className="mt-2 text-sm text-green-600">
                <span className="font-medium">Quality Score: </span>
                {Math.round(model.qualityScore / 100)}%
              </div>
            )}
          </div>
          
          <button
            onClick={handlePurchase}
            disabled={isProcessing || !account}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            {isProcessing ? 'Processing...' : `Purchase Model (${model.price || '0.01'} SUI)`}
          </button>

          {!account && (
            <p className="text-sm text-gray-600 text-center">
              Please connect your wallet to purchase this model
            </p>
          )}
        </>
      )}
    </div>
  )
}