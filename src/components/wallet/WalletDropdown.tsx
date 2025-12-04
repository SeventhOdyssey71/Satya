'use client'

import { useRef, useEffect } from 'react'
import { ConnectButton } from '@mysten/dapp-kit'
import { usePasskeyWallet } from '../../contexts/PasskeyWalletContext'

interface WalletDropdownProps {
  isOpen: boolean
  onClose: () => void
  buttonRef: React.RefObject<HTMLButtonElement>
}

export function WalletDropdown({ isOpen, onClose, buttonRef }: WalletDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hiddenConnectRef = useRef<HTMLDivElement>(null)
  const { connectPasskey, isLoading } = usePasskeyWallet()

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

  const handleDappKitClick = () => {
    onClose() // Close dropdown first
    // Programmatically click the hidden ConnectButton
    setTimeout(() => {
      const connectButton = hiddenConnectRef.current?.querySelector('button')
      if (connectButton) {
        connectButton.click()
      }
    }, 100)
  }

  const handlePasskeyConnect = async () => {
    // Prevent multiple simultaneous operations
    if (isLoading) return
    
    try {
      await connectPasskey()
      onClose()
    } catch (error) {
      console.error('Passkey connection failed:', error)
      alert('Passkey connection failed')
    }
  }

  return (
    <>
      {/* Simple Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2"
        >
          {/* Use dApp Kit Button */}
          <button
            onClick={handleDappKitClick}
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
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2" />

          {/* Passkey Option */}
          <button
            onClick={handlePasskeyConnect}
            disabled={isLoading}
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

            {/* Loading Spinner only */}
            {isLoading && (
              <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            )}
          </button>
        </div>
      )}

      {/* Always render hidden ConnectButton for programmatic clicking */}
      <div 
        ref={hiddenConnectRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}
      >
        <ConnectButton />
      </div>
    </>
  )
}