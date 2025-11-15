'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCurrentAccount, ConnectButton, useDisconnectWallet } from '@mysten/dapp-kit'

interface HeaderProps {
  isHomepage?: boolean
}

export default function Header({ isHomepage = false }: HeaderProps) {
  const pathname = usePathname()
  const isHomepageRoute = isHomepage || pathname === '/'
  const account = useCurrentAccount()
  const { mutate: disconnect } = useDisconnectWallet()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="text-gray-900 hover:text-gray-700 transition-colors">
            <h1 className="text-2xl font-russo tracking-tight">
              Satya
            </h1>
          </Link>

          {isHomepageRoute ? (
            /* Homepage: Get Started Button */
            <Link 
              href="/marketplace" 
              className="px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 rounded-full font-albert font-normal text-[17px]"
            >
              Get Started
            </Link>
          ) : (
            /* Other pages: Navigation + Wallet */
            <div className="flex items-center gap-8">
              <nav className="flex items-center gap-6">
                <Link 
                  href="/marketplace"
                  className={`text-[17px] font-albert font-normal transition-colors ${
                    pathname === '/marketplace' 
                      ? 'text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Marketplace
                </Link>
                <Link 
                  href="/dashboard"
                  className={`text-[17px] font-albert font-normal transition-colors ${
                    pathname === '/dashboard' 
                      ? 'text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/upload"
                  className={`text-[17px] font-albert font-normal transition-colors ${
                    pathname === '/upload' 
                      ? 'text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Upload
                </Link>
              </nav>
              
              {/* Wallet Connection */}
              {account ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100/50 active:bg-gray-100 transition-colors rounded-full"
                  >
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-[15px] text-gray-900 font-mono font-normal">
                      {account.address.slice(0, 6)}...{account.address.slice(-4)}
                    </span>
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-lg z-10 overflow-hidden">
                      <button
                        onClick={() => {
                          disconnect()
                          setShowDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2.5 text-[15px] font-albert font-normal text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <ConnectButton 
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 rounded-full font-albert font-normal text-[17px]"
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