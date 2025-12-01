'use client'

import { useState } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { WalletConnectionModal } from './WalletConnectionModal'

interface CustomConnectButtonProps {
  className?: string
  children?: React.ReactNode
}

export function CustomConnectButton({ className, children }: CustomConnectButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const account = useCurrentAccount()

  if (account) {
    return null // Don't show if already connected
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className || "bg-black text-white border-black px-4 py-2 rounded-lg font-light text-base hover:bg-gray-800 transition-colors"}
      >
        {children || "Connect Wallet"}
      </button>
      
      <WalletConnectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}