'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth, useWallet } from '@/hooks'

interface HeaderProps {
  activeTab: 'marketplace' | 'dashboard' | 'upload'
}

export default function Header({ activeTab }: HeaderProps) {
  const { isAuthenticated, user, logout } = useAuth()
  const { isConnected, wallet, connect, disconnect, isConnecting } = useWallet()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const getTabClass = (tab: string) => 
    `text-base font-medium font-albert cursor-pointer transition-colors ${
      activeTab === tab
        ? 'text-black'
        : 'text-gray-400 hover:text-gray-600'
    }`

  const handleConnectWallet = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      logout()
      setShowUserMenu(false)
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="relative z-10 border-b border-neutral-100">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-3xl font-russo text-cyan-950 cursor-pointer hover:opacity-80 transition-opacity">
                Satya
              </h1>
            </Link>
            <nav className="flex items-center gap-8">
              <Link href="/marketplace">
                <div className={getTabClass('marketplace')}>Marketplace</div>
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/dashboard">
                    <div className={getTabClass('dashboard')}>Dashboard</div>
                  </Link>
                  <Link href="/upload">
                    <div className={getTabClass('upload')}>Upload Model</div>
                  </Link>
                </>
              )}
            </nav>
          </div>
          
          {isConnected && isAuthenticated ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg shadow-sm border border-neutral-300 text-sm font-medium font-albert text-black hover:shadow-md transition-shadow"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>{wallet ? formatAddress(wallet.address) : 'Connected'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-xs text-gray-500">Wallet Address</div>
                    <div className="text-sm font-medium text-gray-900 font-mono">
                      {wallet ? formatAddress(wallet.address) : ''}
                    </div>
                  </div>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-xs text-gray-500">Balance</div>
                    <div className="text-sm font-medium text-gray-900">
                      {wallet ? `${parseFloat(wallet.balance) / 1000000000} SUI` : '0 SUI'}
                    </div>
                  </div>
                  <button 
                    onClick={handleDisconnect}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="px-5 py-2.5 bg-white rounded-lg shadow-sm border border-neutral-300 text-sm font-medium font-albert text-black hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  Connecting...
                </div>
              ) : (
                'Connect Wallet'
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}