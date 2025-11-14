'use client'

import React from 'react'
import Link from 'next/link'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { HiSparkles } from 'react-icons/hi2'

interface HeaderProps {
  activeTab: 'marketplace' | 'dashboard' | 'upload'
}

export default function Header({ activeTab }: HeaderProps) {
  const currentAccount = useCurrentAccount()
  const isConnected = !!currentAccount?.address

  const getTabClass = (tab: string) => 
    activeTab === tab ? 'nav-tab-active' : 'nav-tab'

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-50/80 border-b border-border/50">
      <div className="container-custom">
        <div className="flex items-center justify-between py-4">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-10">
            <Link href="/" className="group">
              <div className="flex items-center gap-3 transition-all duration-200 group-hover:scale-105">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-soft">
                    <HiSparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                </div>
                <h1 className="text-2xl font-russo text-gradient">
                  Satya
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center">
              <div className="flex items-center bg-surface-100 rounded-xl p-1 border border-border shadow-card">
                <Link href="/marketplace">
                  <div className={getTabClass('marketplace')}>
                    <span className="relative z-10">Marketplace</span>
                  </div>
                </Link>
                {isConnected && (
                  <>
                    <Link href="/dashboard">
                      <div className={getTabClass('dashboard')}>
                        <span className="relative z-10">Dashboard</span>
                      </div>
                    </Link>
                    <Link href="/upload">
                      <div className={getTabClass('upload')}>
                        <span className="relative z-10 flex items-center gap-2">
                          <HiSparkles className="w-4 h-4" />
                          Upload
                        </span>
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* User Status Indicator */}
            {isConnected && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-success-50 border border-success-200 rounded-lg">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-sm font-albert font-medium text-success-800">Connected</span>
              </div>
            )}
            
            {/* Connect Button with Custom Styling */}
            <div className="relative">
              <ConnectButton 
                connectText="Connect Wallet"
              />
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-lg border border-border bg-surface-50 hover:bg-surface-100 transition-colors">
              <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <nav className="flex flex-col gap-1 bg-surface-100 rounded-xl p-2 border border-border">
            <Link href="/marketplace">
              <div className={`${getTabClass('marketplace')} w-full text-left rounded-lg`}>
                Marketplace
              </div>
            </Link>
            {isConnected && (
              <>
                <Link href="/dashboard">
                  <div className={`${getTabClass('dashboard')} w-full text-left rounded-lg`}>
                    Dashboard
                  </div>
                </Link>
                <Link href="/upload">
                  <div className={`${getTabClass('upload')} w-full text-left rounded-lg flex items-center gap-2`}>
                    <HiSparkles className="w-4 h-4" />
                    Upload Model
                  </div>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}