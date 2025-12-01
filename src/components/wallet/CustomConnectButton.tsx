'use client'

import { useState, useRef } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { WalletDropdown } from './WalletDropdown'

interface CustomConnectButtonProps {
  className?: string
  children?: React.ReactNode
}

export function CustomConnectButton({ className, children }: CustomConnectButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const account = useCurrentAccount()
  const buttonRef = useRef<HTMLButtonElement>(null)

  if (account) {
    return null // Don't show if already connected
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={className || "bg-black text-white border-black px-4 py-2 rounded-lg font-light text-base hover:bg-gray-800 transition-colors"}
      >
        {children || "Connect Wallet"}
      </button>
      
      <WalletDropdown 
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        buttonRef={buttonRef}
      />
    </div>
  )
}