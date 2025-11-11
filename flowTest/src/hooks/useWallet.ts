import { useCallback, useMemo } from 'react'
import { useCurrentAccount, useConnectWallet, useDisconnectWallet, useSignPersonalMessage, useSignTransaction, useSuiClient, useWallets } from '@mysten/dapp-kit'
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
  const currentAccount = useCurrentAccount()
  const { mutateAsync: connectWallet, isPending: isConnecting } = useConnectWallet()
  const { mutateAsync: disconnectWallet } = useDisconnectWallet()
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage()
  const { mutateAsync: signTransactionMutation } = useSignTransaction()
  const suiClient = useSuiClient()
  const wallets = useWallets()

  const isConnected = !!currentAccount?.address

  const wallet = useMemo((): WalletInfo | null => {
    if (!currentAccount?.address) return null
    
    return {
      address: currentAccount.address,
      balance: '0', // Will be updated via getBalance
      isConnected: true,
      walletType: 'sui-wallet',
    }
  }, [currentAccount])

  const clearError = useCallback(() => {
    // Error handling is managed by the dApp kit
  }, [])

  const getBalance = useCallback(async (): Promise<string> => {
    try {
      if (!currentAccount?.address) {
        return '0'
      }

      const balance = await suiClient.getBalance({
        owner: currentAccount.address,
      })

      return balance.totalBalance || '0'
    } catch (error: any) {
      console.warn('Failed to get balance:', error)
      return '0'
    }
  }, [currentAccount, suiClient])

  const connect = useCallback(async (): Promise<WalletInfo> => {
    try {
      // Try to connect to the first available wallet
      const availableWallet = wallets.find(wallet => wallet.name.includes('Sui'))
      if (!availableWallet) {
        throw new Error('No Sui wallet found. Please install a Sui wallet extension.')
      }

      await connectWallet({ wallet: availableWallet })
      
      if (!currentAccount?.address) {
        throw new Error('Failed to connect wallet')
      }

      const balance = await getBalance()
      
      return {
        address: currentAccount.address,
        balance,
        isConnected: true,
        walletType: 'sui-wallet',
      }
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to connect wallet')
    }
  }, [connectWallet, currentAccount, getBalance, wallets])

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await disconnectWallet()
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to disconnect wallet')
    }
  }, [disconnectWallet])

  const signMessage = useCallback(async (message: string): Promise<WalletSignature> => {
    try {
      if (!currentAccount?.address) {
        throw new Error('Wallet not connected')
      }

      const result = await signPersonalMessage({
        message: new TextEncoder().encode(message),
        account: currentAccount,
      })

      return {
        signature: result.signature,
        publicKey: result.bytes || '', // Using bytes as fallback for publicKey
      }
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to sign message')
    }
  }, [signPersonalMessage, currentAccount])

  const signTransaction = useCallback(async (transaction: any): Promise<SignedTransaction> => {
    try {
      if (!currentAccount?.address) {
        throw new Error('Wallet not connected')
      }

      const result = await signTransactionMutation({
        transaction,
        account: currentAccount,
      })

      return {
        transactionBytes: result.bytes || '', // Using bytes property from the result
        signature: result.signature,
        publicKey: '', // Mysten dApp Kit doesn't return publicKey in transaction signing
      }
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to sign transaction')
    }
  }, [signTransactionMutation, currentAccount])

  return {
    wallet,
    isConnected,
    isConnecting,
    error: null, // Error handling is managed by the dApp kit
    connect,
    disconnect,
    signMessage,
    signTransaction,
    getBalance,
    clearError,
  }
}