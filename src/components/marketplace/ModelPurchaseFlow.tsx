'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, Clock, ShoppingCart, Shield, ExternalLink } from 'lucide-react'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { MARKETPLACE_CONFIG } from '@/lib/constants'

interface ModelPurchaseFlowProps {
 model: any
 onComplete: (transactionDigest?: string, purchaseRecordId?: string) => void
}

export default function ModelPurchaseFlow({ model, onComplete }: ModelPurchaseFlowProps) {
 const [isProcessing, setIsProcessing] = useState(false)

 const account = useCurrentAccount()
 const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
 const suiClient = useSuiClient()

 const handlePurchase = async () => {
  if (!account) {
   alert('Please connect your wallet first')
   return
  }

  // Validate model has necessary data
  if (!model.id) {
   alert('Model ID not available. Cannot process purchase.')
   return
  }

  // Check if user is trying to buy their own model
  if (model.creator && model.creator.toLowerCase() === account.address.toLowerCase()) {
   alert('You cannot purchase your own model.')
   return
  }

  setIsProcessing(true)

  try {
   console.log('Starting smart contract purchase...', {
    modelId: model.id,
    price: model.price,
    buyer: account.address,
    creator: model.creator
   })

   // Check if user has already purchased this model
   console.log('Checking for existing purchases...')
   const ownedObjects = await suiClient.getOwnedObjects({
    owner: account.address,
    filter: {
     StructType: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::PurchaseRecord`
    },
    options: {
     showContent: true
    }
   })

   // Check if any PurchaseRecord is for this model
   const existingPurchase = ownedObjects.data.find((obj: any) => {
    const content = obj.data?.content
    if (content?.type?.includes('PurchaseRecord')) {
     const fields = content.fields
     // Check if this PurchaseRecord is for the current model
     return fields?.model_id === model.id
    }
    return false
   })

   if (existingPurchase) {
    alert('You have already purchased this model.')
    setIsProcessing(false)
    return
   }

   console.log('✓ No existing purchase found, proceeding...')

   // Convert price from SUI to MIST (1 SUI = 1,000,000,000 MIST)
   const totalPriceInMist = Math.floor(parseFloat(model.price) * 1_000_000_000)

   // Create transaction that calls purchase_model smart contract
   const tx = new Transaction()
   tx.setGasBudget(100000000) // 0.1 SUI

   // Split coin for payment
   const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPriceInMist)])

   // Call purchase_model - this creates a PurchaseRecord on-chain
   // The smart contract handles payment splits internally
   const purchaseRecord = tx.moveCall({
    target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::purchase_model`,
    arguments: [
     tx.object(model.id), // MarketplaceModel object
     tx.object(MARKETPLACE_CONFIG.REGISTRY_ID), // Registry
     paymentCoin, // Payment coin
     tx.object('0x6'), // Clock
    ],
   })

   // Transfer PurchaseRecord to buyer (you!)
   tx.transferObjects([purchaseRecord], account.address)

   console.log('Executing purchase transaction...')

   // Execute the purchase transaction
   const result = await signAndExecuteTransaction({
    transaction: tx
   })

   if (result.digest) {
    console.log('✓ Purchase transaction successful:', result.digest)

    // Try to get the PurchaseRecord object ID from transaction effects
    // Use retry with exponential backoff for RPC indexing delays
    let purchaseRecordId: string | undefined

    const maxRetries = 5
    const baseDelay = 1000 // 1 second

    for (let attempt = 0; attempt < maxRetries; attempt++) {
     try {
      if (attempt > 0) {
       const delay = baseDelay * Math.pow(2, attempt - 1)
       console.log(`Waiting ${delay}ms before retry ${attempt}/${maxRetries}...`)
       await new Promise(resolve => setTimeout(resolve, delay))
      }

      // Query transaction to get created objects
      const txDetails = await suiClient.getTransactionBlock({
       digest: result.digest,
       options: {
        showEffects: true,
        showObjectChanges: true,
       },
      })

      // Find the PurchaseRecord object
      const createdObjects = txDetails.objectChanges?.filter(
       (change: any) => change.type === 'created'
      )

      const purchaseObj = createdObjects?.find(
       (obj: any) => obj.objectType?.includes('PurchaseRecord')
      ) as any

      if (purchaseObj) {
       purchaseRecordId = purchaseObj.objectId
       console.log('✓ PurchaseRecord created:', purchaseRecordId)
       console.log('  → You can now use this to decrypt the model!')
       break // Success, exit retry loop
      }
     } catch (queryError: any) {
      if (attempt === maxRetries - 1) {
       console.warn('Could not query purchase record ID after all retries:', queryError)
      } else {
       console.log(`Attempt ${attempt + 1} failed, will retry...`, queryError.message)
      }
     }
    }

    if (!purchaseRecordId) {
     alert('Purchase successful, but could not retrieve decryption key. Please wait a moment and refresh the page.')
    }

    onComplete(result.digest, purchaseRecordId)
   } else {
    throw new Error('Purchase transaction failed')
   }
  } catch (error) {
   console.error('Purchase failed:', error)

   // Provide more helpful error messages
   let errorMessage = 'Purchase failed. Please try again.'

   if (error instanceof Error) {
    if (error.message.includes('Insufficient')) {
     errorMessage = 'Insufficient SUI balance. Please add funds to your wallet.'
    } else if (error.message.includes('owned by account')) {
     errorMessage = 'This model is not available for purchase. It may be owned by you or already purchased.'
    } else if (error.message.includes('User rejected') || error.message.includes('cancelled')) {
     errorMessage = 'Transaction was cancelled.'
    } else {
     errorMessage = `Purchase failed: ${error.message}`
    }
   }

   alert(errorMessage)
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