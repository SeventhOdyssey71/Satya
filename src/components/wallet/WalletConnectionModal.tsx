'use client'

import { useState } from 'react'
import { useConnectWallet, useWallets } from '@mysten/dapp-kit'

interface WalletConnectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletConnectionModal({ isOpen, onClose }: WalletConnectionModalProps) {
  const wallets = useWallets()
  const { mutate: connect } = useConnectWallet()
  const [isConnecting, setIsConnecting] = useState<string | null>(null)

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
  }

  if (!isOpen) return null

  const supportedWallets = wallets.filter(wallet => 
    ['Sui Wallet', 'Suiet', 'Nightly'].includes(wallet.name)
  )

  const getWalletIcon = (walletName: string) => {
    switch (walletName) {
      case 'Sui Wallet':
        return (
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          </div>
        )
      case 'Suiet':
        return (
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">S</span>
          </div>
        )
      case 'Nightly':
        return (
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8 2.36a10.14 10.14 0 1 0 14.9 11.9 1 1 0 0 0-.26-1.26z"/>
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {walletName.charAt(0)}
            </span>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Connect Wallet</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Wallet Options */}
        <div className="space-y-3 mb-4">
          {supportedWallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleConnectWallet(wallet.name)}
              disabled={isConnecting === wallet.name}
              className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Wallet Icon */}
              {getWalletIcon(wallet.name)}
              
              {/* Wallet Info */}
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">
                  {wallet.name === 'Sui Wallet' ? 'Sui Wallet' :
                   wallet.name === 'Suiet' ? 'Suiet' :
                   wallet.name === 'Nightly' ? 'Nightly' :
                   wallet.name}
                </div>
                <div className="text-sm text-gray-500">
                  {wallet.name === 'Sui Wallet' ? 'Official Sui Wallet' :
                   wallet.name === 'Suiet' ? 'Multi-chain wallet' :
                   wallet.name === 'Nightly' ? 'Developer-focused wallet' :
                   'Connect to ' + wallet.name}
                </div>
              </div>

              {/* Loading Spinner */}
              {isConnecting === wallet.name && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Passkey Option */}
        <button
          onClick={handlePasskeyConnect}
          className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          {/* Passkey Icon */}
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          
          {/* Passkey Info */}
          <div className="flex-1 text-left">
            <div className="font-medium text-gray-900">Use Passkeys</div>
            <div className="text-sm text-gray-500">Secure authentication with biometrics</div>
          </div>

          {/* Beta Badge */}
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            Coming Soon
          </span>
        </button>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By connecting a wallet, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}