import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { SealEncryptionResult } from '@/lib/types'

interface UseSealReturn {
 isEncrypting: boolean
 isDecrypting: boolean
 error: string | null
 encryptData: (data: ArrayBuffer, policyType: string) => Promise<SealEncryptionResult>
 decryptData: (policyId: string, encryptedData: string) => Promise<ArrayBuffer>
 clearError: () => void
}

export function useSeal(): UseSealReturn {
 const [isEncrypting, setIsEncrypting] = useState(false)
 const [isDecrypting, setIsDecrypting] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const clearError = useCallback(() => {
  setError(null)
 }, [])

 const encryptData = useCallback(async (
  data: ArrayBuffer,
  policyType: string
 ): Promise<SealEncryptionResult> => {
  try {
   setIsEncrypting(true)
   setError(null)

   const result = await apiClient.encryptWithSeal(data, policyType)
   return result
  } catch (error: any) {
   const message = error?.message || 'Failed to encrypt data with SEAL'
   setError(message)
   throw error
  } finally {
   setIsEncrypting(false)
  }
 }, [])

 const decryptData = useCallback(async (
  policyId: string,
  encryptedData: string
 ): Promise<ArrayBuffer> => {
  try {
   setIsDecrypting(true)
   setError(null)

   const result = await apiClient.decryptWithSeal(policyId, encryptedData)
   return result
  } catch (error: any) {
   const message = error?.message || 'Failed to decrypt data with SEAL'
   setError(message)
   throw error
  } finally {
   setIsDecrypting(false)
  }
 }, [])

 return {
  isEncrypting,
  isDecrypting,
  error,
  encryptData,
  decryptData,
  clearError,
 }
}