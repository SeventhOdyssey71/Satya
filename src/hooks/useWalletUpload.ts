'use client'

import { useState, useCallback, useEffect } from 'react'
import { getUserService } from '@/lib/services'
import { WalletConnection, UserProfile } from '@/lib/services'

interface WalletUploadState {
 isConnected: boolean
 isConnecting: boolean
 walletAddress?: string
 balance?: string
 network?: string
 user?: UserProfile
 error?: string
}

export function useWalletUpload() {
 const [state, setState] = useState<WalletUploadState>({
  isConnected: false,
  isConnecting: false
 })
 
 const userService = getUserService()

 const checkWalletConnection = useCallback(async () => {
  try {
   const currentUser = userService.getCurrentUser()
   const walletConnection = await userService.getWalletConnection()
   
   setState(prev => ({
    ...prev,
    isConnected: walletConnection.isConnected,
    walletAddress: walletConnection.address,
    balance: walletConnection.balance,
    network: walletConnection.network,
    user: currentUser || undefined,
    error: undefined
   }))
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Failed to check wallet connection'
   setState(prev => ({
    ...prev,
    error: errorMessage
   }))
  }
 }, [userService])

 // Check wallet connection status on mount
 useEffect(() => {
  checkWalletConnection()
 }, [checkWalletConnection])

 const connectWallet = useCallback(async (): Promise<boolean> => {
  try {
   setState(prev => ({ ...prev, isConnecting: true, error: undefined }))
   
   const result = await userService.connectWallet()
   
   if (result.success) {
    setState(prev => ({
     ...prev,
     isConnected: true,
     isConnecting: false,
     walletAddress: result.data?.wallet.address,
     balance: result.data?.wallet.balance,
     network: result.data?.wallet.network,
     user: result.data?.user,
     error: undefined
    }))
    return true
   } else {
    const errorMessage = result.error?.message || 'Failed to connect wallet'
    setState(prev => ({
     ...prev,
     isConnecting: false,
     error: errorMessage
    }))
    return false
   }
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Connection failed'
   setState(prev => ({
    ...prev,
    isConnecting: false,
    error: errorMessage
   }))
   return false
  }
 }, [userService])

 const disconnectWallet = useCallback(async () => {
  try {
   await userService.disconnectWallet()
   setState({
    isConnected: false,
    isConnecting: false,
    walletAddress: undefined,
    balance: undefined,
    network: undefined,
    user: undefined,
    error: undefined
   })
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect wallet'
   setState(prev => ({
    ...prev,
    error: errorMessage
   }))
  }
 }, [userService])

 const refreshWalletInfo = useCallback(async () => {
  await checkWalletConnection()
 }, [checkWalletConnection])

 const switchNetwork = useCallback(async (network: string): Promise<boolean> => {
  try {
   const result = await userService.switchNetwork(network)
   if (result.success) {
    await checkWalletConnection()
    return true
   } else {
    setState(prev => ({
     ...prev,
     error: result.error?.message || 'Failed to switch network'
    }))
    return false
   }
  } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Network switch failed'
   setState(prev => ({
    ...prev,
    error: errorMessage
   }))
   return false
  }
 }, [userService, checkWalletConnection])

 const validateUploadRequirements = useCallback((): { 
  canUpload: boolean
  issues: string[]
 } => {
  const issues: string[] = []

  if (!state.isConnected) {
   issues.push('Wallet not connected')
  }

  if (!state.walletAddress) {
   issues.push('No wallet address available')
  }

  if (state.balance && parseFloat(state.balance) === 0) {
   issues.push('Insufficient balance for transaction fees')
  }

  if (state.network && state.network !== 'testnet') {
   // For now we're working with testnet
   issues.push(`Connected to ${state.network}, but testnet is required`)
  }

  return {
   canUpload: issues.length === 0,
   issues
  }
 }, [state])

 const formatBalance = useCallback((balance?: string): string => {
  if (!balance) return '0 SUI'
  
  try {
   const balanceNum = parseFloat(balance)
   if (balanceNum >= 1_000_000_000) {
    return `${(balanceNum / 1_000_000_000).toFixed(2)} SUI`
   } else {
    return `${(balanceNum / 1_000_000_000).toFixed(6)} SUI`
   }
  } catch {
   return '0 SUI'
  }
 }, [])

 const formatAddress = useCallback((address?: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
 }, [])

 const clearError = useCallback(() => {
  setState(prev => ({ ...prev, error: undefined }))
 }, [])

 return {
  // State
  ...state,
  
  // Computed state
  formattedBalance: formatBalance(state.balance),
  formattedAddress: formatAddress(state.walletAddress),
  
  // Actions
  connectWallet,
  disconnectWallet,
  refreshWalletInfo,
  switchNetwork,
  checkWalletConnection,
  clearError,
  
  // Validation
  validateUploadRequirements,
  
  // Utilities
  formatBalance,
  formatAddress
 }
}