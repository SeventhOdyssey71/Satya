'use client'

import { useState, useRef, useEffect } from 'react'
import { useConnectWallet, useWallets, useSuiClient } from '@mysten/dapp-kit'
import { PasskeyAuth } from '../../lib/auth/passkey-auth'

interface WalletDropdownProps {
  isOpen: boolean
  onClose: () => void
  buttonRef: React.RefObject<HTMLButtonElement>
}

export function WalletDropdown({ isOpen, onClose, buttonRef }: WalletDropdownProps) {
  const wallets = useWallets()
  const { mutate: connect } = useConnectWallet()
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [isPasskeyConnecting, setIsPasskeyConnecting] = useState(false)
  const [showWalletList, setShowWalletList] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const suiClient = useSuiClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, buttonRef])

  // Reset wallet list view when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setShowWalletList(false)
    }
  }, [isOpen])

  const handleConnectWallet = async (walletName: string) => {
    setIsConnecting(walletName)
    try {
      const wallet = wallets.find(w => w.name === walletName)
      if (wallet) {
        connect(
          { wallet },
          {
            onSuccess: () => {
              setIsConnecting(null)
              onClose()
            },
            onError: () => {
              setIsConnecting(null)
            }
          }
        )
      }
    } catch (error) {
      setIsConnecting(null)
    }
  }

  const handlePasskeyConnect = async () => {
    setIsPasskeyConnecting(true)
    
    try {
      const passkeyAuth = new PasskeyAuth(suiClient)
      
      // Check if passkey exists
      let result
      if (passkeyAuth.hasStoredPasskey()) {
        // Authenticate with existing passkey
        result = await passkeyAuth.authenticateWithPasskey()
      } else {
        // Create new passkey
        const username = `satya-user-${Date.now()}`
        result = await passkeyAuth.createPasskey(username)
      }

      if (result.success && result.keypair) {
        // Store the keypair for the session
        // Note: In a real app, you'd want to integrate this with your auth context
        console.log('Passkey authentication successful:', result.address)
        
        // You can create a custom wallet adapter here or use the keypair directly
        // For now, we'll just log success
        alert(`Passkey connected! Address: ${result.address}`)
        onClose()
      } else {
        console.error('Passkey connection failed:', result.error)
        alert(`Failed to connect with passkey: ${result.error}`)
      }
    } catch (error) {
      console.error('Passkey error:', error)
      alert('Passkey connection failed')
    } finally {
      setIsPasskeyConnecting(false)
    }
  }

  if (!isOpen) return null

  const supportedWallets = wallets.filter(wallet => 
    ['Sui Wallet', 'Suiet', 'Nightly'].includes(wallet.name)
  )

  // Map wallet names for display
  const getWalletDisplayName = (walletName: string) => {
    if (walletName === 'Sui Wallet') return 'Slush'
    return walletName
  }

  // Get wallet logos
  const getWalletLogo = (walletName: string) => {
    switch (walletName) {
      case 'Sui Wallet': // Slush
        return (
          <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4F46E5"/>
              <path d="M2 17L12 22L22 17" fill="#4F46E5"/>
              <path d="M2 12L12 17L22 12" fill="#4F46E5"/>
            </svg>
          </div>
        )
      case 'Suiet':
        return (
          <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">S</span>
          </div>
        )
      case 'Nightly':
        return (
          <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8 2.36a10.14 10.14 0 1 0 14.9 11.9 1 1 0 0 0-.26-1.26z"/>
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-gray-600 font-medium text-xs">{walletName.charAt(0)}</span>
          </div>
        )
    }
  }

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2"
    >
      {!showWalletList ? (
        <>
          {/* Use dApp Kit Button */}
          <button
            onClick={() => setShowWalletList(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            {/* Wallet Icon */}
            <div className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            
            {/* Text */}
            <div className="flex-1">
              <div className="font-medium text-gray-900 text-sm">Use dApp Kit</div>
            </div>

            {/* Arrow */}
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2" />
        </>
      ) : (
        <>
          {/* Back Button */}
          <button
            onClick={() => setShowWalletList(false)}
            className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm text-gray-600">Back</span>
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200 my-1" />

          {/* Wallet Options */}
          {supportedWallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleConnectWallet(wallet.name)}
              disabled={isConnecting === wallet.name}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Wallet Logo */}
              {getWalletLogo(wallet.name)}
              
              {/* Wallet Name */}
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">
                  {getWalletDisplayName(wallet.name)}
                </div>
              </div>

              {/* Loading Spinner */}
              {isConnecting === wallet.name && (
                <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          ))}

          {/* Divider */}
          <div className="border-t border-gray-200 my-2" />
        </>
      )}

      {/* Passkey Option */}
      <button
        onClick={handlePasskeyConnect}
        disabled={isPasskeyConnecting}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Simple Key Icon */}
        <div className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
          </svg>
        </div>
        
        {/* Passkey Text */}
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm">Use Passkeys</div>
        </div>

        {/* Loading Spinner or Status */}
        {isPasskeyConnecting ? (
          <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : PasskeyAuth.isSupported() ? (
          <span className="text-xs text-green-600">
            ✓
          </span>
        ) : (
          <span className="text-xs text-gray-400">
            N/A
          </span>
        )}
      </button>
    </div>
  )
}