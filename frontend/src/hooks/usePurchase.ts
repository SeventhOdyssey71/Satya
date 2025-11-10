'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { getMarketplaceService } from '@/lib/services'
import { logger } from '@/lib/integrations/core/logger'

export interface PurchaseState {
  isProcessing: boolean
  error: string | null
  lastPurchase: Purchase | null
  purchases: Purchase[]
  isLoading: boolean
}

export interface Purchase {
  id: string
  modelId: string
  modelTitle: string
  modelAuthor: string
  price: string
  purchaseDate: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  transactionHash?: string
  downloadUrl?: string
  downloadCount: number
  maxDownloads: number
  buyerAddress: string
  sellerAddress: string
}

export interface PurchaseRequest {
  modelId: string
  modelTitle: string
  modelAuthor: string
  price: string
  sellerAddress: string
  buyerAddress: string
  paymentMethod: 'wallet' | 'card'
}

export interface PurchaseResult {
  success: boolean
  transactionHash?: string
  purchaseId?: string
  error?: string
}

export function usePurchase() {
  const [state, setState] = useState<PurchaseState>({
    isProcessing: false,
    error: null,
    lastPurchase: null,
    purchases: [],
    isLoading: false
  })

  const marketplaceService = getMarketplaceService()
  const abortController = useRef<AbortController>()

  const updateState = useCallback((updates: Partial<PurchaseState>) => {
    setState(prevState => ({ ...prevState, ...updates }))
  }, [])

  const generatePurchaseId = () => {
    return `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const createPurchase = useCallback(async (request: PurchaseRequest): Promise<PurchaseResult> => {
    // Marketplace service is available through singleton

    // Cancel any ongoing purchase
    abortController.current?.abort()
    abortController.current = new AbortController()

    try {
      updateState({ 
        isProcessing: true, 
        error: null 
      })

      logger.info('Starting purchase process', { 
        modelId: request.modelId, 
        price: request.price,
        paymentMethod: request.paymentMethod 
      })

      // Validate purchase request
      if (!request.modelId || !request.price || !request.buyerAddress || !request.sellerAddress) {
        throw new Error('Invalid purchase request: missing required fields')
      }

      // Check buyer balance (mock for now)
      const buyerBalance = await mockGetBalance(request.buyerAddress)
      const totalCost = parseFloat(request.price) + 0.001 // Add gas fee
      
      if (buyerBalance < totalCost) {
        throw new Error('Insufficient balance to complete purchase')
      }

      // Simulate smart contract interaction
      const transactionHash = await simulatePurchaseTransaction(request)

      // Create purchase record
      const purchase: Purchase = {
        id: generatePurchaseId(),
        modelId: request.modelId,
        modelTitle: request.modelTitle,
        modelAuthor: request.modelAuthor,
        price: request.price,
        purchaseDate: new Date().toISOString(),
        status: 'completed',
        transactionHash,
        buyerAddress: request.buyerAddress,
        sellerAddress: request.sellerAddress,
        downloadUrl: `/downloads/${request.modelId}`,
        downloadCount: 0,
        maxDownloads: 10
      }

      // Update state with new purchase
      updateState({
        lastPurchase: purchase,
        purchases: state.purchases.concat(purchase),
        isProcessing: false
      })

      logger.info('Purchase completed successfully', { 
        purchaseId: purchase.id,
        transactionHash 
      })

      return {
        success: true,
        transactionHash,
        purchaseId: purchase.id
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Purchase failed'
      
      logger.error('Purchase failed', { 
        error: errorMessage, 
        modelId: request.modelId 
      })

      updateState({
        error: errorMessage,
        isProcessing: false
      })

      return {
        success: false,
        error: errorMessage
      }
    }
  }, [state.purchases])

  const retryPurchase = useCallback(async (purchaseId: string): Promise<PurchaseResult> => {
    const purchase = state.purchases.find(p => p.id === purchaseId)
    if (!purchase) {
      throw new Error('Purchase not found')
    }

    if (purchase.status !== 'failed') {
      throw new Error('Can only retry failed purchases')
    }

    const request: PurchaseRequest = {
      modelId: purchase.modelId,
      modelTitle: purchase.modelTitle,
      modelAuthor: purchase.modelAuthor,
      price: purchase.price,
      buyerAddress: purchase.buyerAddress,
      sellerAddress: purchase.sellerAddress,
      paymentMethod: 'wallet' // Default to wallet for retry
    }

    return createPurchase(request)
  }, [state.purchases, createPurchase])

  const loadPurchaseHistory = useCallback(async (userAddress: string): Promise<void> => {
    // Marketplace service is available through singleton

    try {
      updateState({ isLoading: true, error: null })

      logger.info('Loading purchase history', { userAddress })

      // Mock purchase history - in real app, this would query blockchain/API
      const mockPurchases: Purchase[] = [
        {
          id: 'purchase_1',
          modelId: 'model_1',
          modelTitle: 'Advanced Image Classification Model',
          modelAuthor: 'AI Research Lab',
          price: '12.99',
          purchaseDate: '2024-01-20T10:30:00Z',
          status: 'completed',
          transactionHash: '0xabc123...def456',
          buyerAddress: userAddress,
          sellerAddress: '0xseller1...addr',
          downloadUrl: '/downloads/model_1',
          downloadCount: 3,
          maxDownloads: 10
        },
        {
          id: 'purchase_2',
          modelId: 'model_2',
          modelTitle: 'Object Detection Pro',
          modelAuthor: 'VisionTech Inc',
          price: '25.50',
          purchaseDate: '2024-01-18T14:15:00Z',
          status: 'completed',
          transactionHash: '0x789xyz...123abc',
          buyerAddress: userAddress,
          sellerAddress: '0xseller2...addr',
          downloadUrl: '/downloads/model_2',
          downloadCount: 1,
          maxDownloads: 5
        }
      ]

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      updateState({
        purchases: mockPurchases,
        isLoading: false
      })

      logger.info('Purchase history loaded', { 
        count: mockPurchases.length,
        userAddress 
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load purchase history'
      
      logger.error('Failed to load purchase history', { 
        error: errorMessage, 
        userAddress 
      })

      updateState({
        error: errorMessage,
        isLoading: false
      })

      throw error
    }
  }, [])

  const getPurchaseByModelId = useCallback((modelId: string): Purchase | null => {
    return state.purchases.find(purchase => 
      purchase.modelId === modelId && purchase.status === 'completed'
    ) || null
  }, [state.purchases])

  const isPurchased = useCallback((modelId: string): boolean => {
    return getPurchaseByModelId(modelId) !== null
  }, [getPurchaseByModelId])

  const getDownloadInfo = useCallback((modelId: string) => {
    const purchase = getPurchaseByModelId(modelId)
    if (!purchase) {
      return { canDownload: false, downloadUrl: null, remainingDownloads: 0 }
    }

    const remainingDownloads = purchase.maxDownloads - purchase.downloadCount
    const canDownload = remainingDownloads > 0

    return {
      canDownload,
      downloadUrl: purchase.downloadUrl || null,
      remainingDownloads,
      downloadCount: purchase.downloadCount,
      maxDownloads: purchase.maxDownloads
    }
  }, [getPurchaseByModelId])

  const incrementDownloadCount = useCallback((purchaseId: string) => {
    setState(prevState => ({
      ...prevState,
      purchases: prevState.purchases.map(purchase =>
        purchase.id === purchaseId
          ? { ...purchase, downloadCount: purchase.downloadCount + 1 }
          : purchase
      )
    }))
  }, [])

  const clearError = useCallback(() => {
    updateState({ error: null })
  }, [])

  const clearPurchases = useCallback(() => {
    updateState({ 
      purchases: [], 
      lastPurchase: null, 
      error: null 
    })
  }, [])

  return {
    ...state,
    createPurchase,
    retryPurchase,
    loadPurchaseHistory,
    getPurchaseByModelId,
    isPurchased,
    getDownloadInfo,
    incrementDownloadCount,
    clearError,
    clearPurchases
  }
}

// Helper functions

async function mockGetBalance(address: string): Promise<number> {
  // Simulate checking wallet balance
  await new Promise(resolve => setTimeout(resolve, 500))
  return 125.50 // Mock balance in SUI
}

async function simulatePurchaseTransaction(request: PurchaseRequest): Promise<string> {
  // Simulate blockchain transaction
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock transaction hash
  return `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 8)}`
}