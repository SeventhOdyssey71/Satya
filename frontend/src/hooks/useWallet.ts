import { useState, useCallback, useEffect } from 'react'
import type { WalletInfo, WalletSignature, SignedTransaction } from '@/lib/types'

interface UseWalletReturn {
  wallet: WalletInfo | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => Promise<WalletInfo>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<WalletSignature>
  signTransaction: (transaction: any) => Promise<SignedTransaction>
  getBalance: () => Promise<string>
  clearError: () => void
}

export function useWallet(): UseWalletReturn {
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConnected = !!wallet?.isConnected

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getSuiWallet = useCallback(() => {
    if (typeof window === 'undefined') {
      throw new Error('Wallet not available in server environment')
    }

    // @ts-ignore - Sui wallet extension
    const suiWallet = window?.suiWallet
    if (!suiWallet) {
      throw new Error('Sui Wallet extension not installed')
    }

    return suiWallet
  }, [])

  const connect = useCallback(async (): Promise<WalletInfo> => {
    try {
      setIsConnecting(true)
      setError(null)

      const suiWallet = getSuiWallet()
      
      const accounts = await suiWallet.getAccounts()
      if (!accounts || accounts.length === 0) {
        await suiWallet.requestPermissions({
          permissions: ['viewAccount', 'suggestTransactions'],
        })
        const newAccounts = await suiWallet.getAccounts()
        if (!newAccounts || newAccounts.length === 0) {
          throw new Error('No accounts available')
        }
      }

      const account = accounts[0]
      const balance = await getBalance()

      const walletInfo: WalletInfo = {
        address: account.address,
        balance,
        isConnected: true,
        walletType: 'sui-wallet',
      }

      setWallet(walletInfo)
      return walletInfo
    } catch (error: any) {
      const message = error?.message || 'Failed to connect wallet'
      setError(message)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      setWallet(null)
    } catch (error: any) {
      const message = error?.message || 'Failed to disconnect wallet'
      setError(message)
      throw error
    }
  }, [])

  const signMessage = useCallback(async (message: string): Promise<WalletSignature> => {
    try {
      setError(null)

      if (!wallet?.isConnected) {
        throw new Error('Wallet not connected')
      }

      const suiWallet = getSuiWallet()
      const result = await suiWallet.signPersonalMessage({
        message: new TextEncoder().encode(message),
        account: wallet.address,
      })

      return {
        signature: result.signature,
        publicKey: result.publicKey,
      }
    } catch (error: any) {
      const message = error?.message || 'Failed to sign message'
      setError(message)
      throw error
    }
  }, [wallet, getSuiWallet])

  const signTransaction = useCallback(async (transaction: any): Promise<SignedTransaction> => {
    try {
      setError(null)

      if (!wallet?.isConnected) {
        throw new Error('Wallet not connected')
      }

      const suiWallet = getSuiWallet()
      const result = await suiWallet.signTransaction({
        transaction,
        account: wallet.address,
      })

      return {
        transactionBytes: result.transactionBytes,
        signature: result.signature,
        publicKey: result.publicKey,
      }
    } catch (error: any) {
      const message = error?.message || 'Failed to sign transaction'
      setError(message)
      throw error
    }
  }, [wallet, getSuiWallet])

  const getBalance = useCallback(async (): Promise<string> => {
    try {
      if (!wallet?.address) {
        return '0'
      }

      const suiWallet = getSuiWallet()
      const balance = await suiWallet.getBalance({
        account: wallet.address,
      })

      return balance.totalBalance || '0'
    } catch (error: any) {
      console.warn('Failed to get balance:', error)
      return '0'
    }
  }, [wallet, getSuiWallet])

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (typeof window !== 'undefined') {
          // @ts-ignore
          const suiWallet = window?.suiWallet
          if (suiWallet) {
            const accounts = await suiWallet.getAccounts()
            if (accounts && accounts.length > 0) {
              const account = accounts[0]
              const balance = await getBalance()
              setWallet({
                address: account.address,
                balance,
                isConnected: true,
                walletType: 'sui-wallet',
              })
            }
          }
        }
      } catch (error) {
        console.log('No existing wallet connection')
      }
    }

    checkConnection()
  }, [])

  return {
    wallet,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    signMessage,
    signTransaction,
    getBalance,
    clearError,
  }
}