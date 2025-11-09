import { useState, useCallback } from 'react'
import { useWallet } from './useWallet'
import { apiClient } from '@/lib/api-client'
import type { TransactionRequest, SignedTransaction, TransactionResult } from '@/lib/types'

interface UseSmartContractReturn {
  isExecuting: boolean
  error: string | null
  executeTransaction: (transactionData: any) => Promise<TransactionResult>
  estimateGas: (transactionData: any) => Promise<{ gasEstimate: string }>
  clearError: () => void
}

export function useSmartContract(): UseSmartContractReturn {
  const { signTransaction, isConnected } = useWallet()
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const estimateGas = useCallback(async (transactionData: any): Promise<{ gasEstimate: string }> => {
    try {
      setError(null)
      
      if (!isConnected) {
        throw new Error('Wallet not connected')
      }

      const gasEstimate = await apiClient.estimateGas(transactionData)
      return gasEstimate
    } catch (error: any) {
      const message = error?.message || 'Failed to estimate gas'
      setError(message)
      throw error
    }
  }, [isConnected])

  const executeTransaction = useCallback(async (transactionData: any): Promise<TransactionResult> => {
    try {
      setIsExecuting(true)
      setError(null)
      
      if (!isConnected) {
        throw new Error('Wallet not connected')
      }

      console.log('Preparing transaction...', transactionData)
      
      // Get gas estimate first
      const gasEstimate = await estimateGas(transactionData)
      console.log('Gas estimate:', gasEstimate)
      
      // Create transaction request
      const transactionRequest: TransactionRequest = {
        type: transactionData.type || 'transfer',
        data: transactionData,
        gasEstimate: {
          amount: gasEstimate.gasEstimate,
          price: '1000', // Default gas price
          total: gasEstimate.gasEstimate,
        },
      }

      console.log('Signing transaction...')
      
      // Sign the transaction with the wallet
      const signedTransaction: SignedTransaction = await signTransaction(transactionRequest)
      
      console.log('Transaction signed, submitting to blockchain...')
      
      // Submit the signed transaction through the API
      const result = await submitSignedTransaction(signedTransaction, transactionData)
      
      console.log('Transaction submitted successfully:', result)
      
      return result
    } catch (error: any) {
      console.error('Transaction execution failed:', error)
      const message = error?.message || 'Failed to execute transaction'
      setError(message)
      throw error
    } finally {
      setIsExecuting(false)
    }
  }, [isConnected, signTransaction, estimateGas])

  // Helper function to submit signed transaction based on type
  const submitSignedTransaction = async (
    signedTransaction: SignedTransaction,
    transactionData: any
  ): Promise<TransactionResult> => {
    const { transactionBytes, signature } = signedTransaction

    switch (transactionData.type) {
      case 'listing':
        return await apiClient.submitSignedListing(transactionBytes, signature, transactionData.modelData)
      
      case 'purchase':
        return await apiClient.submitSignedPurchase(transactionBytes, signature, transactionData.purchaseData)
      
      default:
        throw new Error(`Unsupported transaction type: ${transactionData.type}`)
    }
  }

  return {
    isExecuting,
    error,
    executeTransaction,
    estimateGas,
    clearError,
  }
}