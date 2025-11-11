'use client'

import React, { createContext, useContext, useCallback, useEffect } from 'react'
import { usePurchase, useWallet } from '@/hooks'
import { logger } from '@/lib/integrations/core/logger'
import type { Purchase, PurchaseRequest, PurchaseResult } from '@/hooks/usePurchase'
import type { WalletInfo } from '@/lib/types'

interface PurchaseContextValue {
  // Purchase state
  isProcessing: boolean
  error: string | null
  purchases: Purchase[]
  isLoading: boolean
  lastPurchase: Purchase | null

  // Purchase actions
  purchaseModel: (request: Omit<PurchaseRequest, 'buyerAddress'>) => Promise<PurchaseResult>
  retryPurchase: (purchaseId: string) => Promise<PurchaseResult>
  loadPurchaseHistory: () => Promise<void>
  clearError: () => void
  
  // Purchase queries
  isPurchased: (modelId: string) => boolean
  getPurchaseByModelId: (modelId: string) => Purchase | null
  getDownloadInfo: (modelId: string) => {
    canDownload: boolean
    downloadUrl: string | null
    remainingDownloads: number
    downloadCount?: number
    maxDownloads?: number
  }
  
  // Download actions
  downloadModel: (purchaseId: string) => Promise<void>
  
  // Wallet integration
  wallet: WalletInfo | null
  isWalletConnected: boolean
}

const PurchaseContext = createContext<PurchaseContextValue | null>(null)

interface PurchaseProviderProps {
  children: React.ReactNode
}

export function PurchaseProvider({ children }: PurchaseProviderProps) {
  const {
    isProcessing,
    error,
    purchases,
    isLoading,
    lastPurchase,
    createPurchase,
    retryPurchase: retryPurchaseHook,
    loadPurchaseHistory: loadPurchaseHistoryHook,
    isPurchased,
    getPurchaseByModelId,
    getDownloadInfo,
    incrementDownloadCount,
    clearError: clearPurchaseError
  } = usePurchase()

  const {
    wallet,
    isConnected: isWalletConnected
  } = useWallet()

  // Auto-load purchase history when wallet connects
  useEffect(() => {
    if (isWalletConnected && wallet?.address && purchases.length === 0) {
      loadPurchaseHistoryHook(wallet.address).catch(error => {
        logger.error('Failed to auto-load purchase history', { error })
      })
    }
  }, [isWalletConnected, wallet?.address, purchases.length, loadPurchaseHistoryHook])

  const purchaseModel = useCallback(async (
    request: Omit<PurchaseRequest, 'buyerAddress'>
  ): Promise<PurchaseResult> => {
    if (!isWalletConnected || !wallet?.address) {
      throw new Error('Wallet not connected')
    }

    const fullRequest: PurchaseRequest = {
      ...request,
      buyerAddress: wallet.address
    }

    logger.info('Starting model purchase', { 
      modelId: request.modelId,
      price: request.price,
      walletAddress: wallet.address
    })

    try {
      const result = await createPurchase(fullRequest)
      
      if (result.success) {
        logger.info('Model purchase completed successfully', { 
          modelId: request.modelId,
          purchaseId: result.purchaseId,
          transactionHash: result.transactionHash
        })
      }

      return result
    } catch (error) {
      logger.error('Model purchase failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        modelId: request.modelId 
      })
      throw error
    }
  }, [isWalletConnected, wallet?.address, createPurchase])

  const retryPurchase = useCallback(async (purchaseId: string): Promise<PurchaseResult> => {
    logger.info('Retrying purchase', { purchaseId })
    
    try {
      const result = await retryPurchaseHook(purchaseId)
      
      if (result.success) {
        logger.info('Purchase retry completed successfully', { 
          purchaseId,
          transactionHash: result.transactionHash
        })
      }

      return result
    } catch (error) {
      logger.error('Purchase retry failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        purchaseId 
      })
      throw error
    }
  }, [retryPurchaseHook])

  const loadPurchaseHistory = useCallback(async (): Promise<void> => {
    if (!isWalletConnected || !wallet?.address) {
      throw new Error('Wallet not connected')
    }

    logger.info('Loading purchase history', { walletAddress: wallet.address })

    try {
      await loadPurchaseHistoryHook(wallet.address)
      logger.info('Purchase history loaded successfully')
    } catch (error) {
      logger.error('Failed to load purchase history', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        walletAddress: wallet.address
      })
      throw error
    }
  }, [isWalletConnected, wallet?.address, loadPurchaseHistoryHook])

  const downloadModel = useCallback(async (purchaseId: string): Promise<void> => {
    const purchase = getPurchaseByModelId(purchaseId)
    if (!purchase) {
      throw new Error('Purchase not found')
    }

    const downloadInfo = getDownloadInfo(purchase.modelId)
    if (!downloadInfo.canDownload) {
      throw new Error('Download limit exceeded or purchase not completed')
    }

    if (!downloadInfo.downloadUrl) {
      throw new Error('Download URL not available')
    }

    logger.info('Starting model download', { 
      purchaseId,
      modelId: purchase.modelId,
      remainingDownloads: downloadInfo.remainingDownloads
    })

    try {
      // Simulate download process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create download link and trigger download
      const link = document.createElement('a')
      link.href = downloadInfo.downloadUrl
      link.download = `${purchase.modelTitle}.onnx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Increment download count
      incrementDownloadCount(purchaseId)

      logger.info('Model download completed', { 
        purchaseId,
        modelId: purchase.modelId
      })
    } catch (error) {
      logger.error('Model download failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        purchaseId,
        modelId: purchase.modelId
      })
      throw error
    }
  }, [getPurchaseByModelId, getDownloadInfo, incrementDownloadCount])

  const clearError = useCallback(() => {
    clearPurchaseError()
  }, [clearPurchaseError])

  const contextValue: PurchaseContextValue = {
    // Purchase state
    isProcessing,
    error,
    purchases,
    isLoading,
    lastPurchase,

    // Purchase actions
    purchaseModel,
    retryPurchase,
    loadPurchaseHistory,
    clearError,

    // Purchase queries
    isPurchased,
    getPurchaseByModelId,
    getDownloadInfo,

    // Download actions
    downloadModel,

    // Wallet integration
    wallet,
    isWalletConnected
  }

  return (
    <PurchaseContext.Provider value={contextValue}>
      {children}
    </PurchaseContext.Provider>
  )
}

export function usePurchaseContext(): PurchaseContextValue {
  const context = useContext(PurchaseContext)
  if (!context) {
    throw new Error('usePurchaseContext must be used within a PurchaseProvider')
  }
  return context
}

export { PurchaseContext }