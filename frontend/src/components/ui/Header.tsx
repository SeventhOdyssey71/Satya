'use client'

import React from 'react'
import Link from 'next/link'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'

interface HeaderProps {
  activeTab: 'marketplace' | 'dashboard' | 'upload'
}

export default function Header({ activeTab }: HeaderProps) {
  const currentAccount = useCurrentAccount()
  const isConnected = !!currentAccount?.address

  const getTabClass = (tab: string) => 
    `text-base font-medium font-albert cursor-pointer transition-colors ${
      activeTab === tab
        ? 'text-black'
        : 'text-gray-400 hover:text-gray-600'
    }`

  return (
    <header className="relative z-10 border-b border-neutral-100">
      <div className="container max-w-7xl mx-auto px-6 overflow-visible">
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
          
          <ConnectButton 
            connectText="Connect Wallet"
          />
        </div>
      </div>
    </header>
  )
}