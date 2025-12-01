'use client'

import { useState, useRef, useEffect } from 'react'
import { useConnectWallet, useWallets } from '@mysten/dapp-kit'

interface WalletDropdownProps {
  isOpen: boolean
  onClose: () => void
  buttonRef: React.RefObject<HTMLButtonElement>
}

export function WalletDropdown({ isOpen, onClose, buttonRef }: WalletDropdownProps) {
  const wallets = useWallets()
  const { mutate: connect } = useConnectWallet()
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handlePasskeyConnect = () => {
    // TODO: Implement zkLogin passkey integration
    console.log('Passkey connection coming soon...')
    onClose()
  }

  if (!isOpen) return null

  const supportedWallets = wallets.filter(wallet => 
    ['Sui Wallet', 'Suiet', 'Nightly'].includes(wallet.name)
  )

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2"
    >
      {/* Wallet Options */}
      {supportedWallets.map((wallet) => (
        <button
          key={wallet.name}
          onClick={() => handleConnectWallet(wallet.name)}
          disabled={isConnecting === wallet.name}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Simple Icon */}
          <div className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-gray-600 font-medium text-xs">
              {wallet.name === 'Sui Wallet' ? 'SW' : 
               wallet.name === 'Suiet' ? 'ST' : 
               wallet.name === 'Nightly' ? 'NT' : 
               wallet.name.charAt(0)}
            </span>
          </div>
          
          {/* Wallet Name */}
          <div className="flex-1">
            <div className="font-medium text-gray-900 text-sm">
              {wallet.name === 'Sui Wallet' ? 'Sui Wallet' :
               wallet.name === 'Suiet' ? 'Suiet' :
               wallet.name === 'Nightly' ? 'Nightly' :
               wallet.name}
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

      {/* Passkey Option */}
      <button
        onClick={handlePasskeyConnect}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Simple Key Icon */}
        <div className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        
        {/* Passkey Text */}
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm">Use Passkeys</div>
        </div>

        {/* Coming Soon */}
        <span className="text-xs text-gray-500">
          Soon
        </span>
      </button>
    </div>
  )
}