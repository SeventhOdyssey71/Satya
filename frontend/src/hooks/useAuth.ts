import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { AuthSession, AuthChallenge, WalletInfo } from '@/lib/types'

interface UseAuthReturn {
  user: AuthSession['user'] | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (walletInfo: WalletInfo, signature: string) => Promise<void>
  logout: () => void
  refreshSession: () => Promise<void>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthSession['user'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!user

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const loadStoredAuth = useCallback(async () => {
    try {
      const profile = await apiClient.getProfile()
      setUser(profile)
    } catch (error) {
      console.log('No stored auth session')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (walletInfo: WalletInfo, signature: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const challenge = await apiClient.getChallenge(walletInfo.address)
      
      const session = await apiClient.verifySignature(
        walletInfo.address,
        signature,
        challenge.message
      )
      
      setUser(session.user)
    } catch (error: any) {
      const message = error?.message || 'Login failed'
      setError(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    apiClient.logout()
    setUser(null)
    setError(null)
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const session = await apiClient.refreshSession()
      setUser(session.user)
    } catch (error: any) {
      const message = error?.message || 'Session refresh failed'
      setError(message)
      logout()
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    loadStoredAuth()
  }, [loadStoredAuth])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshSession,
    clearError,
  }
}