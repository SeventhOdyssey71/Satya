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
  <header className="bg-white/95 backdrop-blur-xl sticky top-0 z-50 pt-2">
   <div className="container-custom">
    <div className="flex items-center justify-between py-3">
     {/* Logo */}
     <Link href="/" className="text-ocean hover:text-ocean/80 transition-colors">
      <h1 className="text-2xl font-russo tracking-tight">
       Satya
      </h1>
     </Link>

     {isHomepageRoute ? (
      /* Homepage: Get Started Button */
      <Link 
       href="/marketplace" 
       className="px-6 py-2 bg-ocean text-white hover:bg-deep-ocean active:bg-deep-ocean/90 transition-all duration-200 rounded-full font-albert font-normal text-[17px]"
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
           ? 'text-ocean' 
           : 'text-ocean/60 hover:text-ocean'
         }`}
        >
         Marketplace
        </Link>
        <Link 
         href="/dashboard"
         className={`text-[17px] font-albert font-normal transition-colors ${
          pathname === '/dashboard' 
           ? 'text-ocean' 
           : 'text-ocean/60 hover:text-ocean'
         }`}
        >
         Dashboard
        </Link>
        <Link 
         href="/upload"
         className={`text-[17px] font-albert font-normal transition-colors ${
          pathname === '/upload' 
           ? 'text-ocean' 
           : 'text-ocean/60 hover:text-ocean'
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
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-light"
         >
          <span className="text-sm">
           {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
         </button>
         
         {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-ocean/10 rounded-2xl shadow-lg z-10 overflow-hidden">
           <button
            onClick={() => {
             disconnect()
             setShowDropdown(false)
            }}
            className="w-full text-left px-4 py-2.5 text-[15px] font-albert font-normal text-ocean hover:bg-aqua/10 transition-colors"
           >
            Disconnect Wallet
           </button>
          </div>
         )}
        </div>
       ) : (
        <div className="[&>button]:!bg-black [&>button]:!text-white [&>button]:!border-black [&>button]:!px-4 [&>button]:!py-2 [&>button]:!rounded-lg [&>button]:!font-light [&>button]:!text-sm [&>button]:hover:!bg-gray-800 [&>button]:!transition-colors">
         <ConnectButton />
        </div>
       )}
      </div>
     )}
    </div>
   </div>
  </header>
 )
}