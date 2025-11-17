import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { 
 ModelListing, 
 ModelUpload, 
 ModelFilters, 
 SearchResult, 
 PurchaseRequest,
 TransactionRequest,
 TransactionResult 
} from '@/lib/types'

interface UseMarketplaceReturn {
 models: ModelListing[]
 currentModel: ModelListing | null
 isLoading: boolean
 error: string | null
 searchModels: (filters?: ModelFilters) => Promise<SearchResult<ModelListing>>
 getModel: (id: string) => Promise<ModelListing>
 uploadModel: (model: ModelUpload) => Promise<TransactionRequest>
 submitModelListing: (transactionBytes: string, signature: string, modelData: Partial<ModelUpload>) => Promise<TransactionResult>
 purchaseModel: (request: PurchaseRequest) => Promise<TransactionRequest>
 submitModelPurchase: (transactionBytes: string, signature: string, purchaseData: PurchaseRequest) => Promise<TransactionResult>
 getUserModels: (status?: 'uploaded' | 'downloaded') => Promise<ModelListing[]>
 clearError: () => void
}

export function useMarketplace(): UseMarketplaceReturn {
 const [models, setModels] = useState<ModelListing[]>([])
 const [currentModel, setCurrentModel] = useState<ModelListing | null>(null)
 const [isLoading, setIsLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const clearError = useCallback(() => {
  setError(null)
 }, [])

 const searchModels = useCallback(async (filters?: ModelFilters): Promise<SearchResult<ModelListing>> => {
  try {
   setIsLoading(true)
   setError(null)

   const result = await apiClient.getModels(filters)
   setModels(result.items)
   return result
  } catch (error: any) {
   const message = error?.message || 'Failed to search models'
   setError(message)
   throw error
  } finally {
   setIsLoading(false)
  }
 }, [])

 const getModel = useCallback(async (id: string): Promise<ModelListing> => {
  try {
   setIsLoading(true)
   setError(null)

   const model = await apiClient.getModel(id)
   setCurrentModel(model)
   return model
  } catch (error: any) {
   const message = error?.message || 'Failed to get model'
   setError(message)
   throw error
  } finally {
   setIsLoading(false)
  }
 }, [])

 const uploadModel = useCallback(async (model: ModelUpload): Promise<TransactionRequest> => {
  try {
   setIsLoading(true)
   setError(null)

   const transactionRequest = await apiClient.createListing(model)
   return transactionRequest
  } catch (error: any) {
   const message = error?.message || 'Failed to upload model'
   setError(message)
   throw error
  } finally {
   setIsLoading(false)
  }
 }, [])

 const submitModelListing = useCallback(async (
  transactionBytes: string, 
  signature: string, 
  modelData: Partial<ModelUpload>
 ): Promise<TransactionResult> => {
  try {
   setIsLoading(true)
   setError(null)

   const result = await apiClient.submitSignedListing(transactionBytes, signature, modelData)
   return result
  } catch (error: any) {
   const message = error?.message || 'Failed to submit model listing'
   setError(message)
   throw error
  } finally {
   setIsLoading(false)
  }
 }, [])

 const purchaseModel = useCallback(async (request: PurchaseRequest): Promise<TransactionRequest> => {
  try {
   setIsLoading(true)
   setError(null)

   const transactionRequest = await apiClient.createPurchase(request)
   return transactionRequest
  } catch (error: any) {
   const message = error?.message || 'Failed to create purchase'
   setError(message)
   throw error
  } finally {
   setIsLoading(false)
  }
 }, [])

 const submitModelPurchase = useCallback(async (
  transactionBytes: string,
  signature: string,
  purchaseData: PurchaseRequest
 ): Promise<TransactionResult> => {
  try {
   setIsLoading(true)
   setError(null)

   const result = await apiClient.submitSignedPurchase(transactionBytes, signature, purchaseData)
   return result
  } catch (error: any) {
   const message = error?.message || 'Failed to submit purchase'
   setError(message)
   throw error
  } finally {
   setIsLoading(false)
  }
 }, [])

 const getUserModels = useCallback(async (status?: 'uploaded' | 'downloaded'): Promise<ModelListing[]> => {
  try {
   setIsLoading(true)
   setError(null)

   const userModels = await apiClient.getUserModels(status)
   return userModels
  } catch (error: any) {
   const message = error?.message || 'Failed to get user models'
   setError(message)
   throw error
  } finally {
   setIsLoading(false)
  }
 }, [])

 return {
  models,
  currentModel,
  isLoading,
  error,
  searchModels,
  getModel,
  uploadModel,
  submitModelListing,
  purchaseModel,
  submitModelPurchase,
  getUserModels,
  clearError,
 }
}