'use client'

import { useState, useCallback, useRef } from 'react'
import { getUploadService, getMarketplaceService } from '@/lib/services'
import { 
  UploadRequest as FileUploadRequest, 
  UploadProgress as FileUploadProgress, 
  UploadResult as FileUploadResult,
  ModelUploadRequest
} from '@/lib/services'
import { PolicyType } from '@/lib/integrations/seal/types'
import { useUploadActions } from '@/contexts/UploadContext'

interface UploadPhase {
  id: string
  name: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  progress?: number
  error?: string
}

interface ModelUploadData {
  title: string
  description: string
  category: string
  tags: string[]
  price: string
  enableSample: boolean
  maxDownloads?: number
  modelFile?: File
  thumbnailFile?: File
  sampleFile?: File
  enableEncryption: boolean
  policyType: string
  accessDuration?: number
  isPrivate: boolean
  allowedBuyers?: string[]
  expiryDays?: number
}

interface UploadResult {
  success: boolean
  modelId?: string
  listingId?: string
  blobId?: string
  transactionHash?: string
  error?: string
  warnings?: string[]
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [phases, setPhases] = useState<UploadPhase[]>([])
  const [currentPhase, setCurrentPhase] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const uploadService = getUploadService()
  const marketplaceService = getMarketplaceService()
  const abortController = useRef<AbortController | null>(null)
  
  // Upload context actions for global state management
  const { 
    addUploadTask, 
    updateUploadProgress: updateGlobalProgress,
    completeUploadTask,
    failUploadTask,
    cancelUploadTask
  } = useUploadActions()

  const initializePhases = useCallback((includeEncryption: boolean = true) => {
    const defaultPhases: UploadPhase[] = [
      {
        id: 'validation',
        name: 'File Validation',
        description: 'Validating file format, size, and metadata',
        status: 'pending'
      }
    ]

    if (includeEncryption) {
      defaultPhases.push({
        id: 'encryption',
        name: 'SEAL Encryption',
        description: 'Encrypting model with policy-based access control',
        status: 'pending'
      })
    }

    defaultPhases.push(
      {
        id: 'upload',
        name: 'Walrus Storage',
        description: 'Uploading to decentralized storage network',
        status: 'pending'
      },
      {
        id: 'listing',
        name: 'Marketplace Listing',
        description: 'Creating on-chain listing and finalizing',
        status: 'pending'
      }
    )

    setPhases(defaultPhases)
  }, [])

  const calculateOverallProgress = useCallback((phases: UploadPhase[]) => {
    const totalPhases = phases.length
    const completedPhases = phases.filter(p => p.status === 'completed').length
    const currentPhaseProgress = phases.find(p => p.status === 'in-progress')?.progress || 0
    
    return ((completedPhases + currentPhaseProgress / 100) / totalPhases) * 100
  }, [])

  const updatePhase = useCallback((phaseId: string, updates: Partial<UploadPhase>, taskId?: string) => {
    const updatedPhases = phases.map(phase => 
      phase.id === phaseId ? { ...phase, ...updates } : phase
    )
    setPhases(updatedPhases)
    
    // Update global context if taskId is provided
    if (taskId) {
      const overallProgress = calculateOverallProgress(updatedPhases)
      updateGlobalProgress(taskId, overallProgress, updatedPhases)
    }
  }, [phases, calculateOverallProgress, updateGlobalProgress])

  const uploadFile = useCallback(async (
    file: File,
    options: {
      encrypt?: boolean
      policyType?: PolicyType
      policyParams?: Record<string, any>
    } = {}
  ): Promise<FileUploadResult> => {
    const request: FileUploadRequest = {
      file,
      encrypt: options.encrypt,
      policyType: options.policyType,
      policyParams: options.policyParams
    }

    return await uploadService.uploadFile(request, (progress: FileUploadProgress) => {
      // Update phase based on progress phase
      const phaseMap: Record<string, string> = {
        'validation': 'validation',
        'encryption': 'encryption', 
        'upload': 'upload',
        'completed': 'upload'
      }

      const mappedPhase = phaseMap[progress.phase]
      if (mappedPhase) {
        setCurrentPhase(mappedPhase)
        updatePhase(mappedPhase, {
          status: progress.phase === 'completed' ? 'completed' : 
                  progress.phase === 'error' ? 'error' : 'in-progress',
          progress: progress.progress,
          error: progress.phase === 'error' ? progress.message : undefined
        })
      }

      setUploadProgress(calculateOverallProgress(phases))
    })
  }, [uploadService, updatePhase, phases, calculateOverallProgress])

  const uploadModel = useCallback(async (
    data: ModelUploadData,
    userKeypair: any
  ): Promise<UploadResult> => {
    if (!data.modelFile) {
      throw new Error('Model file is required')
    }

    let taskId: string | null = null

    try {
      setIsUploading(true)
      setError(null)
      setResult(null)
      setUploadProgress(0)
      
      // Initialize phases
      initializePhases(data.enableEncryption)
      
      // Add task to global upload context
      taskId = addUploadTask({
        title: data.title,
        fileName: data.modelFile.name,
        fileSize: data.modelFile.size,
        status: 'uploading',
        progress: 0,
        phases: phases
      })
      
      // Create abort controller for cancellation
      abortController.current = new AbortController()

      // Phase 1: Validation
      setCurrentPhase('validation')
      updatePhase('validation', { status: 'in-progress', progress: 50 }, taskId)

      // Validate inputs
      if (!data.title?.trim()) throw new Error('Title is required')
      if (!data.description?.trim()) throw new Error('Description is required')
      if (!data.category?.trim()) throw new Error('Category is required')
      if (!data.price || parseFloat(data.price) <= 0) throw new Error('Valid price is required')

      updatePhase('validation', { status: 'completed', progress: 100 }, taskId)

      // Prepare marketplace request
      const marketplaceRequest: ModelUploadRequest = {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        price: BigInt(Math.floor(parseFloat(data.price) * 1_000_000_000)), // Convert to MIST
        file: data.modelFile,
        sampleAvailable: data.enableSample,
        maxDownloads: data.maxDownloads,
        allowedBuyers: data.allowedBuyers,
        expiryDays: data.expiryDays
      }

      // Upload and list model using marketplace service
      const uploadResult = await marketplaceService.uploadAndListModel(
        marketplaceRequest,
        userKeypair
      )

      if (!uploadResult.success) {
        throw new Error(uploadResult.error?.message || 'Upload failed')
      }

      // Update final phase
      setCurrentPhase('listing')
      updatePhase('listing', { status: 'completed', progress: 100 }, taskId)
      setUploadProgress(100)

      // Prepare success result
      const successResult: UploadResult = {
        success: true,
        listingId: uploadResult.data?.listingId,
        blobId: uploadResult.data?.blobId,
        modelId: uploadResult.data?.listingId, // Use listingId as modelId for now
        warnings: []
      }

      // Add warnings based on file analysis
      if (data.modelFile.size > 100 * 1024 * 1024) { // 100MB
        successResult.warnings?.push('Large file size may affect download performance')
      }
      
      if (data.tags.length < 3) {
        successResult.warnings?.push('Consider adding more tags for better discoverability')
      }

      if (!data.enableEncryption) {
        successResult.warnings?.push('Model is not encrypted - consider enabling SEAL encryption for better security')
      }

      setResult(successResult)
      
      // Complete task in global context
      if (taskId) {
        completeUploadTask(taskId, successResult)
      }
      
      return successResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      
      // Update current phase with error
      if (currentPhase) {
        updatePhase(currentPhase, { status: 'error', error: errorMessage }, taskId || undefined)
      }

      const errorResult: UploadResult = {
        success: false,
        error: errorMessage
      }

      setResult(errorResult)
      
      // Fail task in global context
      if (taskId) {
        failUploadTask(taskId, errorMessage)
      }
      
      return errorResult

    } finally {
      setIsUploading(false)
      abortController.current = null
    }
  }, [
    initializePhases,
    updatePhase, 
    currentPhase,
    marketplaceService,
    addUploadTask,
    completeUploadTask,
    failUploadTask,
    phases
  ])

  const cancelUpload = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
      setIsUploading(false)
      setError('Upload cancelled by user')
      
      if (currentPhase) {
        updatePhase(currentPhase, { status: 'error', error: 'Upload cancelled' })
      }
    }
  }, [currentPhase, updatePhase])

  const reset = useCallback(() => {
    setIsUploading(false)
    setUploadProgress(0)
    setPhases([])
    setCurrentPhase(null)
    setResult(null)
    setError(null)
    abortController.current = null
  }, [])

  const getActiveUploads = useCallback(() => {
    return uploadService.getActiveUploadCount()
  }, [uploadService])

  const cancelAllUploads = useCallback(() => {
    return uploadService.cancelAllUploads()
  }, [uploadService])

  return {
    // State
    isUploading,
    uploadProgress,
    phases,
    currentPhase,
    result,
    error,

    // Actions
    uploadFile,
    uploadModel,
    cancelUpload,
    reset,

    // Utils
    getActiveUploads,
    cancelAllUploads,
    initializePhases
  }
}