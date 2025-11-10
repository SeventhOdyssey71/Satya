import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { NautilusComputeRequest, NautilusComputeResult } from '@/lib/types'

interface UseNautilusReturn {
  isSubmitting: boolean
  isPolling: boolean
  error: string | null
  submitComputation: (request: NautilusComputeRequest) => Promise<{ jobId: string }>
  getComputationStatus: (jobId: string) => Promise<NautilusComputeResult>
  getComputationResult: (jobId: string) => Promise<NautilusComputeResult>
  pollComputationStatus: (jobId: string, onUpdate?: (result: NautilusComputeResult) => void) => Promise<NautilusComputeResult>
  clearError: () => void
}

export function useNautilus(): UseNautilusReturn {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const submitComputation = useCallback(async (
    request: NautilusComputeRequest
  ): Promise<{ jobId: string }> => {
    try {
      setIsSubmitting(true)
      setError(null)

      const result = await apiClient.submitTEEComputation(request)
      return result
    } catch (error: any) {
      const message = error?.message || 'Failed to submit TEE computation'
      setError(message)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const getComputationStatus = useCallback(async (jobId: string): Promise<NautilusComputeResult> => {
    try {
      setError(null)
      const result = await apiClient.getTEEComputationStatus(jobId)
      return result
    } catch (error: any) {
      const message = error?.message || 'Failed to get computation status'
      setError(message)
      throw error
    }
  }, [])

  const getComputationResult = useCallback(async (jobId: string): Promise<NautilusComputeResult> => {
    try {
      setError(null)
      const result = await apiClient.getTEEComputationResult(jobId)
      return result
    } catch (error: any) {
      const message = error?.message || 'Failed to get computation result'
      setError(message)
      throw error
    }
  }, [])

  const pollComputationStatus = useCallback(async (
    jobId: string,
    onUpdate?: (result: NautilusComputeResult) => void
  ): Promise<NautilusComputeResult> => {
    return new Promise((resolve, reject) => {
      setIsPolling(true)
      setError(null)

      const pollInterval = setInterval(async () => {
        try {
          const result = await getComputationStatus(jobId)
          onUpdate?.(result)

          if (result.status === 'completed') {
            clearInterval(pollInterval)
            setIsPolling(false)
            resolve(result)
          } else if (result.status === 'failed') {
            clearInterval(pollInterval)
            setIsPolling(false)
            const errorMessage = result.error || 'Computation failed'
            setError(errorMessage)
            reject(new Error(errorMessage))
          }
        } catch (error: any) {
          clearInterval(pollInterval)
          setIsPolling(false)
          const message = error?.message || 'Failed to poll computation status'
          setError(message)
          reject(error)
        }
      }, 2000) // Poll every 2 seconds

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        setIsPolling(false)
        const timeoutError = new Error('Computation polling timed out')
        setError(timeoutError.message)
        reject(timeoutError)
      }, 10 * 60 * 1000)
    })
  }, [getComputationStatus])

  return {
    isSubmitting,
    isPolling,
    error,
    submitComputation,
    getComputationStatus,
    getComputationResult,
    pollComputationStatus,
    clearError,
  }
}