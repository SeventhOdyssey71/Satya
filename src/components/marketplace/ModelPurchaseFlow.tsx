'use client'

import React, { useState } from 'react'
import { CheckCircle, Clock, ShoppingCart, Shield, ExternalLink } from 'lucide-react'
import { useCurrentAccount, useSignTransaction, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

interface ModelPurchaseFlowProps {
 model: any
 onComplete: () => void
}

export default function ModelPurchaseFlow({ model, onComplete }: ModelPurchaseFlowProps) {
 const [isProcessing, setIsProcessing] = useState(false)

 const account = useCurrentAccount()
 const { mutate: signTransaction } = useSignTransaction()
 const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
 const suiClient = useSuiClient()

 const handlePurchase = async () => {
  if (!account) {
   alert('Please connect your wallet first')
   return
  }

  setIsProcessing(true)
  
  try {
   // Create SUI transaction for model purchase
   const tx = new Transaction()
   
   // Convert price from SUI to MIST (1 SUI = 1,000,000,000 MIST)
   const priceInMist = Math.floor(parseFloat(model.price) * 1_000_000_000)
   
   // Split coins for payment
   const [coin] = tx.splitCoins(tx.gas, [priceInMist])
   
   // Transfer payment to the model creator (simulation)
   tx.transferObjects([coin], account.address)
   
   // Execute the purchase transaction
   const result = await signAndExecuteTransaction({ 
    transaction: tx
   })

   if (result.digest) {
    onComplete()
   } else {
    throw new Error('Purchase transaction failed')
   }
  } catch (error) {
   console.error('Purchase failed:', error)
   alert('Purchase failed. Please try again.')
  } finally {
   setIsProcessing(false)
  }
 }

 return (
  <button
   onClick={handlePurchase}
   disabled={isProcessing || !account}
   className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
  >
   {isProcessing ? (
    <>
     <Clock className="w-4 h-4 animate-spin" />
     Processing...
    </>
   ) : (
    <>
     <ShoppingCart className="w-4 h-4" />
     Purchase for {model.price} SUI
    </>
   )}
  </button>
 )
}