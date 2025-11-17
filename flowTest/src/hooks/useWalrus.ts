import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { WalrusUploadResult } from '@/lib/types'

interface UploadProgress {
 loaded: number
 total: number
 percentage: number
}

interface UseWalrusReturn {
 isUploading: boolean
 isDownloading: boolean
 uploadProgress: UploadProgress | null
 error: string | null
 uploadFile: (file: File, metadata?: Record<string, any>, onProgress?: (progress: UploadProgress) => void) => Promise<WalrusUploadResult>
 downloadFile: (blobId: string) => Promise<Blob>
 getFileInfo: (blobId: string) => Promise<{ size: number; contentType: string }>
 clearError: () => void
}

export function useWalrus(): UseWalrusReturn {
 const [isUploading, setIsUploading] = useState(false)
 const [isDownloading, setIsDownloading] = useState(false)
 const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
 const [error, setError] = useState<string | null>(null)

 const clearError = useCallback(() => {
  setError(null)
 }, [])

 const uploadFile = useCallback(async (
  file: File,
  metadata?: Record<string, any>,
  onProgress?: (progress: UploadProgress) => void
 ): Promise<WalrusUploadResult> => {
  try {
   setIsUploading(true)
   setError(null)
   setUploadProgress(null)

   // Simulate progress tracking (since fetch doesn't provide upload progress directly)
   const progressInterval = setInterval(() => {
    setUploadProgress(prev => {
     if (!prev) {
      const initial = { loaded: 0, total: file.size, percentage: 0 }
      onProgress?.(initial)
      return initial
     }
     
     if (prev.percentage < 90) {
      const newLoaded = Math.min(prev.loaded + file.size * 0.1, file.size * 0.9)
      const newProgress = {
       loaded: newLoaded,
       total: file.size,
       percentage: Math.round((newLoaded / file.size) * 100)
      }
      onProgress?.(newProgress)
      return newProgress
     }
     
     return prev
    })
   }, 500)

   const result = await apiClient.uploadToWalrus(file, metadata)

   clearInterval(progressInterval)
   
   const finalProgress = { loaded: file.size, total: file.size, percentage: 100 }
   setUploadProgress(finalProgress)
   onProgress?.(finalProgress)

   return result
  } catch (error: any) {
   const message = error?.message || 'Failed to upload file to Walrus'
   setError(message)
   throw error
  } finally {
   setIsUploading(false)
  }
 }, [])

 const downloadFile = useCallback(async (blobId: string): Promise<Blob> => {
  try {
   setIsDownloading(true)
   setError(null)

   const blob = await apiClient.downloadFromWalrus(blobId)
   return blob
  } catch (error: any) {
   const message = error?.message || 'Failed to download file from Walrus'
   setError(message)
   throw error
  } finally {
   setIsDownloading(false)
  }
 }, [])

 const getFileInfo = useCallback(async (blobId: string): Promise<{ size: number; contentType: string }> => {
  try {
   setError(null)
   const info = await apiClient.getWalrusInfo(blobId)
   return info
  } catch (error: any) {
   const message = error?.message || 'Failed to get file info'
   setError(message)
   throw error
  }
 }, [])

 return {
  isUploading,
  isDownloading,
  uploadProgress,
  error,
  uploadFile,
  downloadFile,
  getFileInfo,
  clearError,
 }
}