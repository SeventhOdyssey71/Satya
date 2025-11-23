'use client'

import React, { useState, useEffect } from 'react'
import { 
 Wallet, 
 ExternalLink, 
 Copy, 
 CheckCircle, 
 AlertCircle,
 Loader2,
 RefreshCw,
 DollarSign,
 Activity,
 Shield
} from 'lucide-react'

interface WalletInfo {
 address: string
 balance: string
 network: string
 isConnected: boolean
}

interface WalletConnectionProps {
 onWalletConnect?: (walletInfo: WalletInfo) => void
 onWalletDisconnect?: () => void
 className?: string
}

export default function WalletConnection({
 onWalletConnect,
 onWalletDisconnect,
 className = ''
}: WalletConnectionProps) {
 const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
 const [isConnecting, setIsConnecting] = useState(false)
 const [error, setError] = useState<string>('')
 const [showQRCode, setShowQRCode] = useState(false)
 const [copied, setCopied] = useState(false)

 // Mock wallet detection and connection
 const availableWallets = [
  {
   name: 'Sui Wallet',
   icon: '🦊',
   isInstalled: true,
   isRecommended: true
  },
  {
   name: 'Ethos Wallet', 
   icon: '🔷',
   isInstalled: false,
   isRecommended: false
  },
  {
   name: 'Suiet Wallet',
   icon: '🦄',
   isInstalled: true,
   isRecommended: false
  }
 ]

 const connectWallet = async (walletName: string) => {
  setIsConnecting(true)
  setError('')

  try {
   // Simulate wallet connection
   await new Promise(resolve => setTimeout(resolve, 2000))

   // Mock wallet info
   const mockWalletInfo: WalletInfo = {
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    balance: '125.50',
    network: 'testnet',
    isConnected: true
   }

   setWalletInfo(mockWalletInfo)
   onWalletConnect?.(mockWalletInfo)
  } catch (err) {
   setError(err instanceof Error ? err.message : 'Failed to connect wallet')
  } finally {
   setIsConnecting(false)
  }
 }

 const disconnectWallet = () => {
  setWalletInfo(null)
  setError('')
  onWalletDisconnect?.()
 }

 const copyAddress = async () => {
  if (walletInfo?.address) {
   await navigator.clipboard.writeText(walletInfo.address)
   setCopied(true)
   setTimeout(() => setCopied(false), 2000)
  }
 }

 const refreshBalance = async () => {
  if (!walletInfo) return

  try {
   // Simulate balance refresh
   await new Promise(resolve => setTimeout(resolve, 1000))
   
   // Mock updated balance
   const updatedInfo = {
    ...walletInfo,
    balance: (parseFloat(walletInfo.balance) + Math.random() * 10).toFixed(2)
   }
   
   setWalletInfo(updatedInfo)
   onWalletConnect?.(updatedInfo)
  } catch (err) {
   setError('Failed to refresh balance')
  }
 }

 const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
 }

 if (walletInfo?.isConnected) {
  return (
   <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
     <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
       <Wallet className="w-5 h-5 text-green-600" />
      </div>
      <div>
       <h3 className="font-semibold text-gray-900">Wallet Connected</h3>
       <p className="text-sm text-gray-500">Sui Wallet</p>
      </div>
     </div>
     <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
      Connected
     </span>
    </div>

    {/* Wallet Details */}
    <div className="space-y-4">
     {/* Address */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Wallet Address
      </label>
      <div className="flex items-center gap-2">
       <div className="flex-1 bg-gray-50 rounded-lg p-3 font-mono text-sm">
        {formatAddress(walletInfo.address)}
       </div>
       <button
        onClick={copyAddress}
        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        title="Copy address"
       >
        {copied ? (
         <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
         <Copy className="w-4 h-4" />
        )}
       </button>
       <a
        href={`https://explorer.sui.io/address/${walletInfo.address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        title="View on explorer"
       >
        <ExternalLink className="w-4 h-4" />
       </a>
      </div>
     </div>

     {/* Balance */}
     <div>
      <div className="flex items-center justify-between mb-1">
       <label className="text-sm font-medium text-gray-700">Balance</label>
       <button
        onClick={refreshBalance}
        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
       >
        <RefreshCw className="w-3 h-3" />
        Refresh
       </button>
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
       <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-gray-600" />
        <span className="text-lg font-semibold text-gray-900">
         {walletInfo.balance} SUI
        </span>
       </div>
       <p className="text-xs text-gray-500 mt-1">
        Network: {walletInfo.network}
       </p>
      </div>
     </div>

     {/* Quick Actions */}
     <div className="grid grid-cols-2 gap-3">
      <a
       href="https://discord.gg/sui"
       target="_blank"
       rel="noopener noreferrer"
       className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
      >
       <DollarSign className="w-4 h-4 text-gray-600" />
       Get Testnet SUI
      </a>
      <a
       href={`https://explorer.sui.io/address/${walletInfo.address}`}
       target="_blank"
       rel="noopener noreferrer"
       className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
      >
       <Activity className="w-4 h-4 text-gray-600" />
       View Activity
      </a>
     </div>

     {/* Disconnect Button */}
     <button
      onClick={disconnectWallet}
      className="w-full p-2 text-red-600 hover:text-red-700 text-sm transition-colors"
     >
      Disconnect Wallet
     </button>
    </div>
   </div>
  )
 }

 return (
  <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
   <div className="text-center mb-6">
    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
     <Wallet className="w-8 h-8 text-blue-600" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
     Connect Your Wallet
    </h3>
    <p className="text-gray-600">
     Connect your Sui wallet to purchase models and access your downloads
    </p>
   </div>

   {error && (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
     <div className="flex items-start gap-2">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
      <div>
       <p className="text-red-800 font-medium">Connection Failed</p>
       <p className="text-red-700 text-sm">{error}</p>
      </div>
     </div>
    </div>
   )}

   {/* Available Wallets */}
   <div className="space-y-3">
    {availableWallets.map((wallet) => (
     <button
      key={wallet.name}
      onClick={() => connectWallet(wallet.name)}
      disabled={!wallet.isInstalled || isConnecting}
      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
       wallet.isInstalled
        ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
      } ${isConnecting ? 'opacity-50' : ''}`}
     >
      <div className="flex items-center gap-3">
       <span className="text-2xl">{wallet.icon}</span>
       <div className="text-left">
        <div className="flex items-center gap-2">
         <span className="font-medium text-gray-900">{wallet.name}</span>
         {wallet.isRecommended && (
          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
           Recommended
          </span>
         )}
        </div>
        <span className={`text-sm ${
         wallet.isInstalled ? 'text-gray-600' : 'text-red-600'
        }`}>
         {wallet.isInstalled ? 'Installed' : 'Not Installed'}
        </span>
       </div>
      </div>
      
      {isConnecting ? (
       <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      ) : wallet.isInstalled ? (
       <span className="text-blue-600 text-sm font-medium">Connect</span>
      ) : (
       <span className="text-gray-400 text-sm">Install</span>
      )}
     </button>
    ))}
   </div>

   {/* Help Text */}
   <div className="mt-6 p-4 bg-blue-50 rounded-lg">
    <div className="flex items-start gap-2">
     <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
     <div className="text-sm text-blue-800">
      <p className="font-medium mb-1">New to Sui wallets?</p>
      <p className="mb-2">
       We recommend starting with Sui Wallet for the best experience.
      </p>
      <a
       href="https://chrome.google.com/webstore/detail/sui-wallet"
       target="_blank"
       rel="noopener noreferrer"
       className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 underline"
      >
       Install Sui Wallet
       <ExternalLink className="w-3 h-3" />
      </a>
     </div>
    </div>
   </div>
  </div>
 )
}