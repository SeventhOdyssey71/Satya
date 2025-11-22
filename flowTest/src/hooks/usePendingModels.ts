'use client'

import { useState, useEffect } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { MarketplaceContractService } from '@/lib/services/marketplace-contract.service'
import { logger } from '@/lib/integrations/core/logger'

export interface PendingModel {
 id: string
 title: string
 description: string
 category: string
 tags: string[]
 creator: string
 modelBlobId: string
 datasetBlobId?: string
 encryptionPolicyId: string
 createdAt: number
 price: number
 status: 'pending' | 'verifying' | 'verified' | 'failed'
}

interface UsePendingModelsState {
 pendingModels: PendingModel[]
 isLoading: boolean
 error: string | null
 lastUpdated: number
}

export function usePendingModels() {
 const currentAccount = useCurrentAccount()
 const [state, setState] = useState<UsePendingModelsState>({
  pendingModels: [],
  isLoading: false,
  error: null,
  lastUpdated: 0
 })
 
 const [contractService, setContractService] = useState<MarketplaceContractService | null>(null)

 // Initialize services
 useEffect(() => {
  const initServices = async () => {
   try {
    const marketplace = new MarketplaceContractService()
    await marketplace.initialize()
    setContractService(marketplace)
   } catch (error) {
    console.error('Failed to initialize marketplace service:', error)
    setState(prev => ({ ...prev, error: 'Failed to initialize services' }))
   }
  }

  initServices()
 }, [])

 // Load user's pending models
 const loadPendingModels = async () => {
  if (!contractService || !currentAccount) {
   setState(prev => ({ ...prev, isLoading: false }))
   return
  }

  try {
   setState(prev => ({ ...prev, isLoading: true, error: null }))

   console.log('Loading pending models for user:', currentAccount)
   
   const pendingModels = await contractService.getUserPendingModels(currentAccount.address)
   
   console.log('Loaded pending models:', pendingModels)

   // Transform contract data to component format
   const transformedModels: PendingModel[] = pendingModels.map(obj => {
    const content = obj.content as any
    const fields = content?.fields || {}
    
    return {
     id: obj.id,
     title: fields.title || 'Untitled Model',
     description: fields.description || '',
     category: fields.category || 'Uncategorized',
     tags: fields.tags || [],
     creator: fields.creator || '',
     modelBlobId: fields.model_blob_id || '',
     datasetBlobId: fields.dataset_blob_id || undefined,
     encryptionPolicyId: fields.encryption_policy_id || '',
     createdAt: fields.created_at || Date.now(),
     price: fields.price || 0,
     status: fields.verification_status === 'verified' ? 'verified' : 
            fields.verification_status === 'failed' ? 'failed' :
            fields.verification_status === 'verifying' ? 'verifying' : 'pending'
    }
   })

   setState(prev => ({ 
    ...prev, 
    pendingModels: transformedModels, 
    isLoading: false,
    lastUpdated: Date.now()
   }))

  } catch (error) {
   console.error('Failed to load pending models:', error)
   logger.error('Failed to load pending models', {
    error: error instanceof Error ? error.message : String(error),
    userAddress: currentAccount
   })
   setState(prev => ({ 
    ...prev, 
    error: error instanceof Error ? error.message : 'Unknown error',
    isLoading: false 
   }))
  }
 }

 // Auto-load on mount and when dependencies change
 useEffect(() => {
  loadPendingModels()
 }, [contractService, currentAccount])

 // Listen for model upload events
 useEffect(() => {
  const handleModelUpload = () => {
   console.log('Model upload detected, refreshing pending models...')
   setTimeout(() => {
    loadPendingModels()
   }, 1000) // Delay to ensure blockchain has processed
  }

  window.addEventListener('model-uploaded', handleModelUpload)
  window.addEventListener('pending-models-refresh', handleModelUpload)

  return () => {
   window.removeEventListener('model-uploaded', handleModelUpload)
   window.removeEventListener('pending-models-refresh', handleModelUpload)
  }
 }, [contractService, currentAccount])

 // Set up polling for automatic refresh every 5 seconds (more frequent)
 useEffect(() => {
  if (!contractService || !currentAccount) return

  const interval = setInterval(() => {
   loadPendingModels()
  }, 5000) // 5 seconds for better responsiveness

  return () => clearInterval(interval)
 }, [contractService, currentAccount])

 // Refresh function for manual updates
 const refresh = () => {
  loadPendingModels()
 }

 // Get status counts
 const statusCounts = {
  pending: state.pendingModels.filter(model => model.status === 'pending').length,
  verifying: state.pendingModels.filter(model => model.status === 'verifying').length,
  verified: state.pendingModels.filter(model => model.status === 'verified').length,
  failed: state.pendingModels.filter(model => model.status === 'failed').length,
  total: state.pendingModels.length
 }

 return {
  ...state,
  statusCounts,
  refresh
 }
}