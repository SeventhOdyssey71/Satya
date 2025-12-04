'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useSuiClient } from '@mysten/dapp-kit'
import { PasskeyWallet } from '../lib/auth/PasskeyWallet'
import { APP_CONFIG } from '../lib/auth/types'

interface PasskeyWalletState {
  address: string | null
  publicKey: string | null
  isConnected: boolean
  type: 'passkey'
}

interface PasskeyWalletContextType {
  passkeyWallet: PasskeyWalletState | null
  walletInstance: PasskeyWallet | null
  isLoading: boolean
  connectPasskey: () => Promise<void>
  disconnectPasskey: () => void
  signPersonalMessage: (message: string) => Promise<string>
}

const PasskeyWalletContext = createContext<PasskeyWalletContextType | null>(null)

export function PasskeyWalletProvider({ children }: { children: React.ReactNode }) {
  const suiClient = useSuiClient()
  const [passkeyWallet, setPasskeyWalletState] = useState<PasskeyWalletState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Memoize wallet instance to prevent unnecessary recreations
  const walletInstance = useMemo(() => {
    return new PasskeyWallet(suiClient, APP_CONFIG.APP_NAME)
  }, [suiClient])

  // Check for existing passkey wallet on mount
  useEffect(() => {
    const initializeWallet = async () => {
      if (!walletInstance) return
      
      // Use wallet's method to check stored data
      const storedAddress = walletInstance.getAddress()
      const storedPublicKey = walletInstance.getPublicKey()
      
      if (storedAddress && storedPublicKey) {
        setPasskeyWalletState({
          address: storedAddress,
          publicKey: storedPublicKey,
          isConnected: true,
          type: 'passkey'
        })
      }
    }
    
    initializeWallet()
  }, [walletInstance])

  const connectPasskey = useCallback(async () => {
    if (!walletInstance) {
      throw new Error('Wallet instance not initialized')
    }

    setIsLoading(true)
    try {
      const result = await walletInstance.connect()
      
      if (result.success && result.address) {
        const walletState: PasskeyWalletState = {
          address: result.address,
          publicKey: result.publicKey || null,
          isConnected: true,
          type: 'passkey'
        }
        
        setPasskeyWalletState(walletState)
      } else {
        throw new Error(result.error || 'Failed to connect passkey wallet')
      }
    } catch (error) {
      console.error('Passkey connection failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [walletInstance])

  const disconnectPasskey = useCallback(() => {
    if (walletInstance) {
      walletInstance.disconnect()
    }
    setPasskeyWalletState(null)
  }, [walletInstance])

  const signPersonalMessage = useCallback(async (message: string): Promise<string> => {
    if (!walletInstance) {
      throw new Error('Wallet instance not initialized')
    }
    if (!passkeyWallet?.isConnected) {
      throw new Error('Wallet not connected')
    }
    return await walletInstance.signPersonalMessage(message)
  }, [walletInstance, passkeyWallet?.isConnected])

  return (
    <PasskeyWalletContext.Provider value={{
      passkeyWallet,
      walletInstance,
      isLoading,
      connectPasskey,
      disconnectPasskey,
      signPersonalMessage
    }}>
      {children}
    </PasskeyWalletContext.Provider>
  )
}

export function usePasskeyWallet() {
  const context = useContext(PasskeyWalletContext)
  if (!context) {
    throw new Error('usePasskeyWallet must be used within a PasskeyWalletProvider')
  }
  return context
}