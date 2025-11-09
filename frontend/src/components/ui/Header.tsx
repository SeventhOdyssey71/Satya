'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { useWallet } from '@/hooks'

interface HeaderProps {
  activeTab: 'marketplace' | 'dashboard' | 'upload'
}

export default function Header({ activeTab }: HeaderProps) {
  const { isConnected, wallet, disconnect, getBalance } = useWallet()
  const currentAccount = useCurrentAccount()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [balance, setBalance] = useState('0')

  const getTabClass = (tab: string) => 
    `text-base font-medium font-albert cursor-pointer transition-colors ${
      activeTab === tab
        ? 'text-black'
        : 'text-gray-400 hover:text-gray-600'
    }`

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setShowUserMenu(false)
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  useEffect(() => {
    const fetchBalance = async () => {
      if (getBalance && isConnected) {
        try {
          const bal = await getBalance()
          setBalance((parseFloat(bal) / 1000000000).toFixed(2))
        } catch (error) {
          console.error('Failed to fetch balance:', error)
        }
      }
    }

    if (isConnected) {
      fetchBalance()
    }
  }, [isConnected, getBalance])

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
              {isConnected && (
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
          
          {isConnected ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg shadow-sm border border-neutral-300 text-sm font-medium font-albert text-black hover:shadow-md transition-shadow"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>{currentAccount ? formatAddress(currentAccount.address) : 'Connected'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-xs text-gray-500">Wallet Address</div>
                    <div className="text-sm font-medium text-gray-900 font-mono">
                      {currentAccount ? formatAddress(currentAccount.address) : ''}
                    </div>
                  </div>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-xs text-gray-500">Balance</div>
                    <div className="text-sm font-medium text-gray-900">
                      {balance} SUI
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
            <div className="custom-connect-button">
              <ConnectButton 
                connectText="Connect Wallet"
                className="px-5 py-2.5 bg-white rounded-lg shadow-sm border border-neutral-300 text-sm font-medium font-albert text-black hover:shadow-md transition-shadow"
              />
            </div>
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