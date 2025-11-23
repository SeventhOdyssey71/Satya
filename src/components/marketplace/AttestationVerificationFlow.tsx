'use client'

import React, { useState } from 'react'
import { CheckCircle, Clock, AlertCircle, Shield } from 'lucide-react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

interface AttestationVerificationFlowProps {
 model: any
 onComplete: (attestationId: string) => void
}

export default function AttestationVerificationFlow({ model, onComplete }: AttestationVerificationFlowProps) {
 const [isProcessing, setIsProcessing] = useState(false)
 const [isComplete, setIsComplete] = useState(false)
 const [verificationResult, setVerificationResult] = useState<any>(null)
 const [error, setError] = useState<string | null>(null)

 const account = useCurrentAccount()
 const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()

 const handleVerification = async () => {
  if (!account) {
   setError('Please connect your wallet first')
   return
  }

  setIsProcessing(true)
  setError(null)
  
  try {
   // Create verification transaction (pay for verification)
   const tx = new Transaction()
   
   // Add payment for verification (0.1 SUI)
   const [coin] = tx.splitCoins(tx.gas, [100_000_000]) // 0.1 SUI in MIST
   tx.transferObjects([coin], account.address)
   
   // Execute the verification payment transaction
   const result = await signAndExecuteTransaction({ 
    transaction: tx
   })

   if (result.digest) {
    // Call the actual TEE verification service
    const verificationResponse = await fetch('/api/tee-verification', {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json'
     },
     body: JSON.stringify({
      modelBlobId: model.id,
      datasetBlobId: model.datasetBlobId || null,
      transactionDigest: result.digest,
      userAddress: account.address
     })
    })

    if (verificationResponse.ok) {
     const verificationData = await verificationResponse.json()
     setVerificationResult(verificationData)
     setIsComplete(true)
     const attestationId = `att_${result.digest}_${Date.now()}`
     onComplete(attestationId)
    } else {
     const error = await verificationResponse.text()
     throw new Error(`Verification failed: ${error}`)
    }
   } else {
    throw new Error('Transaction failed')
   }
  } catch (error: any) {
   console.error('Verification failed:', error)
   setError(error.message || 'Verification failed. Please try again.')
  } finally {
   setIsProcessing(false)
  }
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
     {verificationResult && (
      <div className="mt-2 text-xs text-green-600">
       Quality Score: {verificationResult.quality_score}% | 
       Attestation ID: {verificationResult.attestation_id?.slice(0, 10)}...
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
   {error && (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
     <div className="flex items-center gap-2 text-red-800">
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm font-medium">Verification Error</span>
     </div>
     <p className="text-sm text-red-700 mt-1">{error}</p>
     <button
      onClick={() => setError(null)}
      className="text-xs text-red-600 hover:text-red-800 mt-1"
     >
      Dismiss
     </button>
    </div>
   )}
   
   <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
    <div className="flex items-center gap-2 text-purple-800 mb-2">
     <Shield className="w-4 h-4" />
     <span className="text-sm font-medium">TEE Verification Required</span>
    </div>
    <p className="text-sm text-purple-700">
     This will verify model integrity and quality using our TEE-based system
    </p>
   </div>
   
   <button
    onClick={handleVerification}
    disabled={isProcessing || !account}
    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
   >
    {isProcessing ? (
     <>
      <Clock className="w-4 h-4 animate-spin" />
      Processing...
     </>
    ) : (
     <>
      <Shield className="w-4 h-4" />
      Pay for Verification ({model.attestationPrice || '0.1'} SUI)
     </>
    )}
   </button>
  </div>
 )
}