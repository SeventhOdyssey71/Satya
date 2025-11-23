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

  // Get model creator address and platform treasury
  const creatorAddress = model.creator || model.author
  const treasuryAddress = '0xcb4a3c693a334fe1be0161f446471a923c462178ef279b20f847f23c225a8d09'
  
  if (!creatorAddress || creatorAddress === 'Unknown' || creatorAddress.includes('...')) {
   alert('Model creator address not available. Cannot process purchase.')
   return
  }

  setIsProcessing(true)
  
  try {
   // Create SUI transaction for model purchase with proper payment splits
   const tx = new Transaction()
   
   // Convert price from SUI to MIST (1 SUI = 1,000,000,000 MIST)
   const totalPriceInMist = Math.floor(parseFloat(model.price) * 1_000_000_000)
   
   // Calculate platform fee (2.5% = 250 basis points)
   const platformFeePercentage = 250 // 2.5%
   const feeDenominator = 10000
   const platformFeeInMist = Math.floor((totalPriceInMist * platformFeePercentage) / feeDenominator)
   const creatorPaymentInMist = totalPriceInMist - platformFeeInMist
   
   // Split coins for payments
   const [creatorCoin] = tx.splitCoins(tx.gas, [creatorPaymentInMist])
   const [platformCoin] = tx.splitCoins(tx.gas, [platformFeeInMist])
   
   // Transfer payment to creator
   tx.transferObjects([creatorCoin], creatorAddress)
   
   // Transfer platform fee to treasury
   tx.transferObjects([platformCoin], treasuryAddress)
   
   // Set gas budget
   tx.setGasBudget(100000000) // 0.1 SUI
   
   // Execute the purchase transaction
   const result = await signAndExecuteTransaction({ 
    transaction: tx
   })

   if (result.digest) {
    console.log('Purchase transaction successful:', result.digest)
    console.log(`Paid ${(creatorPaymentInMist / 1_000_000_000).toFixed(9)} SUI to creator: ${creatorAddress}`)
    console.log(`Paid ${(platformFeeInMist / 1_000_000_000).toFixed(9)} SUI platform fee to: ${treasuryAddress}`)
    onComplete()
   } else {
    throw new Error('Purchase transaction failed')
   }
  } catch (error) {
   console.error('Purchase failed:', error)
   alert(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
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