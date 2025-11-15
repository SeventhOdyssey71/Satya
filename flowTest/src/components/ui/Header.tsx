'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit'

interface HeaderProps {
  isHomepage?: boolean
}

export default function Header({ isHomepage = false }: HeaderProps) {
  const pathname = usePathname()
  const isHomepageRoute = isHomepage || pathname === '/'
  const account = useCurrentAccount()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container-custom">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="text-black hover:text-gray-700 transition-colors">
            <h1 className="text-2xl font-bold">
              Satya
            </h1>
          </Link>

          {isHomepageRoute ? (
            /* Homepage: Get Started Button */
            <Link 
              href="/marketplace" 
              className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors rounded-md font-medium"
            >
              Get Started
            </Link>
          ) : (
            /* Other pages: Navigation + Wallet */
            <div className="flex items-center space-x-8">
              <nav className="flex items-center space-x-6">
                <Link 
                  href="/marketplace"
                  className={`text-gray-600 hover:text-black transition-colors ${
                    pathname === '/marketplace' ? 'text-black font-medium' : ''
                  }`}
                >
                  Marketplace
                </Link>
                <Link 
                  href="/dashboard"
                  className={`text-gray-600 hover:text-black transition-colors ${
                    pathname === '/dashboard' ? 'text-black font-medium' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/upload"
                  className={`text-gray-600 hover:text-black transition-colors ${
                    pathname === '/upload' ? 'text-black font-medium' : ''
                  }`}
                >
                  Upload
                </Link>
              </nav>
              
              {/* Wallet Connection */}
              {account ? (
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  <span className="text-sm text-gray-600">Connected</span>
                  <span className="text-sm text-black font-mono">
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </span>
                </div>
              ) : (
                <ConnectButton 
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-md font-medium"
                >
                  Connect Wallet
                </ConnectButton>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}