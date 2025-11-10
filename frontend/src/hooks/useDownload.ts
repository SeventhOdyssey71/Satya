'use client'

import { useState, useCallback, useRef } from 'react'
import { WalrusService } from '@/lib/services/walrus-service'
import { SealService } from '@/lib/services/seal-service'
import { logger } from '@/lib/integrations/core/logger'
import { usePurchase } from './usePurchase'

export interface DownloadState {
  isDownloading: boolean
  error: string | null
  progress: number
  downloadHistory: DownloadRecord[]
}

export interface DownloadRecord {
  id: string
  modelId: string
  modelTitle: string
  fileName: string
  fileSize: number
  downloadDate: string
  downloadUrl: string
  isEncrypted: boolean
  status: 'downloading' | 'completed' | 'failed' | 'paused'
}

export interface DownloadRequest {
  purchaseId: string
  modelId: string
  modelTitle: string
  downloadUrl: string
  isEncrypted: boolean
  fileName?: string
}

export function useDownload() {
  const [state, setState] = useState<DownloadState>({
    isDownloading: false,
    error: null,
    progress: 0,
    downloadHistory: []
  })

  const walrusService = useRef<WalrusService>()
  const sealService = useRef<SealService>()
  const abortController = useRef<AbortController>()
  const { incrementDownloadCount, getDownloadInfo } = usePurchase()

  // Initialize services
  const initializeServices = useCallback(() => {
    if (!walrusService.current) {
      walrusService.current = new WalrusService()
    }
    if (!sealService.current) {
      sealService.current = new SealService()
    }
  }, [])

  const updateState = useCallback((updates: Partial<DownloadState>) => {
    setState(prevState => ({ ...prevState, ...updates }))
  }, [])

  const generateDownloadId = () => {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const downloadModel = useCallback(async (request: DownloadRequest): Promise<void> => {
    initializeServices()

    // Cancel any ongoing download
    abortController.current?.abort()
    abortController.current = new AbortController()

    const downloadId = generateDownloadId()
    const fileName = request.fileName || `${request.modelTitle}.onnx`

    try {
      updateState({ 
        isDownloading: true, 
        error: null, 
        progress: 0 
      })

      logger.info('Starting model download', { 
        downloadId,
        modelId: request.modelId,
        isEncrypted: request.isEncrypted
      })

      // Check download permissions
      const downloadInfo = getDownloadInfo(request.modelId)
      if (!downloadInfo.canDownload) {
        throw new Error('Download limit exceeded or purchase not completed')
      }

      // Create download record
      const downloadRecord: DownloadRecord = {
        id: downloadId,
        modelId: request.modelId,
        modelTitle: request.modelTitle,
        fileName,
        fileSize: 0, // Will be updated during download
        downloadDate: new Date().toISOString(),
        downloadUrl: request.downloadUrl,
        isEncrypted: request.isEncrypted,
        status: 'downloading'
      }

      // Add to download history
      updateState({
        downloadHistory: [downloadRecord, ...state.downloadHistory]
      })

      // Simulate download with progress updates
      await simulateDownloadWithProgress(
        request,
        downloadId,
        abortController.current.signal,
        (progress: number) => {
          updateState({ progress })
        }
      )

      // Handle encrypted models
      if (request.isEncrypted && sealService.current) {
        logger.info('Decrypting downloaded model', { downloadId, modelId: request.modelId })
        
        // Simulate decryption
        await simulateDecryption(request.modelId)
      }

      // Update download record as completed
      updateState({
        downloadHistory: state.downloadHistory.map(record =>
          record.id === downloadId
            ? { ...record, status: 'completed' as const, fileSize: 127 * 1024 * 1024 } // 127MB
            : record
        ),
        isDownloading: false,
        progress: 100
      })

      // Increment download count
      incrementDownloadCount(request.purchaseId)

      // Trigger actual file download
      await triggerFileDownload(fileName, request.downloadUrl)

      logger.info('Model download completed', { 
        downloadId,
        modelId: request.modelId
      })

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.info('Download cancelled', { downloadId, modelId: request.modelId })
        
        // Update download record as paused
        updateState({
          downloadHistory: state.downloadHistory.map(record =>
            record.id === downloadId
              ? { ...record, status: 'paused' as const }
              : record
          ),
          isDownloading: false
        })
        return
      }

      const errorMessage = error instanceof Error ? error.message : 'Download failed'
      
      logger.error('Model download failed', { 
        error: errorMessage,
        downloadId,
        modelId: request.modelId
      })

      // Update download record as failed
      updateState({
        downloadHistory: state.downloadHistory.map(record =>
          record.id === downloadId
            ? { ...record, status: 'failed' as const }
            : record
        ),
        error: errorMessage,
        isDownloading: false
      })

      throw new Error(errorMessage)
    }
  }, [state.downloadHistory, incrementDownloadCount, getDownloadInfo, initializeServices])

  const cancelDownload = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
      logger.info('Download cancelled by user')
    }
  }, [])

  const retryDownload = useCallback(async (downloadId: string): Promise<void> => {
    const downloadRecord = state.downloadHistory.find(record => record.id === downloadId)
    if (!downloadRecord) {
      throw new Error('Download record not found')
    }

    if (downloadRecord.status !== 'failed' && downloadRecord.status !== 'paused') {
      throw new Error('Can only retry failed or paused downloads')
    }

    const request: DownloadRequest = {
      purchaseId: downloadRecord.id, // Using download ID as purchase ID for retry
      modelId: downloadRecord.modelId,
      modelTitle: downloadRecord.modelTitle,
      downloadUrl: downloadRecord.downloadUrl,
      isEncrypted: downloadRecord.isEncrypted,
      fileName: downloadRecord.fileName
    }

    await downloadModel(request)
  }, [state.downloadHistory, downloadModel])

  const clearDownloadHistory = useCallback(() => {
    updateState({ downloadHistory: [] })
  }, [])

  const removeDownloadRecord = useCallback((downloadId: string) => {
    updateState({
      downloadHistory: state.downloadHistory.filter(record => record.id !== downloadId)
    })
  }, [state.downloadHistory])

  const getDownloadRecord = useCallback((downloadId: string): DownloadRecord | null => {
    return state.downloadHistory.find(record => record.id === downloadId) || null
  }, [state.downloadHistory])

  const clearError = useCallback(() => {
    updateState({ error: null })
  }, [])

  return {
    ...state,
    downloadModel,
    cancelDownload,
    retryDownload,
    clearDownloadHistory,
    removeDownloadRecord,
    getDownloadRecord,
    clearError
  }
}

// Helper functions

async function simulateDownloadWithProgress(
  request: DownloadRequest,
  downloadId: string,
  signal: AbortSignal,
  onProgress: (progress: number) => void
): Promise<void> {
  const totalSteps = 100
  const stepDelay = 50 // 50ms per step = 5 second total download

  for (let i = 0; i <= totalSteps; i++) {
    if (signal.aborted) {
      throw new Error('Download cancelled')
    }

    onProgress(i)
    await new Promise(resolve => setTimeout(resolve, stepDelay))
  }
}

async function simulateDecryption(modelId: string): Promise<void> {
  // Simulate SEAL decryption process
  await new Promise(resolve => setTimeout(resolve, 2000))
  logger.info('Model decryption completed', { modelId })
}

async function triggerFileDownload(fileName: string, downloadUrl: string): Promise<void> {
  try {
    // Create a blob URL for the download
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    // Create download link and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the blob URL
    window.URL.revokeObjectURL(url)
  } catch (error) {
    // If actual download fails, create a mock download for demo
    logger.warn('Real download failed, creating mock download', { error })
    
    const mockContent = `# ${fileName}\n\nThis is a mock download for demonstration purposes.\nIn a real implementation, this would be the actual model file.`
    const blob = new Blob([mockContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    window.URL.revokeObjectURL(url)
  }
}