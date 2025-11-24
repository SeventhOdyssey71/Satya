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
 const [showMobileDropdown, setShowMobileDropdown] = useState(false)
 const [showMobileMenu, setShowMobileMenu] = useState(false)
 const dropdownRef = useRef<HTMLDivElement>(null)
 const mobileDropdownRef = useRef<HTMLDivElement>(null)
 const mobileMenuRef = useRef<HTMLDivElement>(null)

 // Close dropdowns when clicking outside
 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
   if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
    setShowDropdown(false)
   }
   if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
    setShowMobileDropdown(false)
   }
   if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
    setShowMobileMenu(false)
   }
  }

  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
 }, [])

 return (
  <header className="bg-white/95 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 pt-2">
   <div className="container-custom">
    <div className="flex items-center justify-between py-3">
     {/* Logo */}
     <Link href="/" className="hover:opacity-80 transition-opacity">
      <img 
       src="/images/SatyaNav.png" 
       alt="Satya" 
       className="h-8"
      />
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
      <>
       {/* Desktop Navigation */}
       <div className="hidden md:flex items-center justify-between flex-1">
        <div className="flex-1"></div>
        <nav className="flex items-center gap-8">
         <Link 
          href="/marketplace"
          className={`transition-colors text-base ${
           pathname === '/marketplace' 
            ? 'text-black font-medium' 
            : 'text-gray-500 font-light hover:text-gray-700'
          }`}
         >
          Marketplace
         </Link>
         <Link 
          href="/dashboard"
          className={`transition-colors text-base ${
           pathname === '/dashboard' 
            ? 'text-black font-medium' 
            : 'text-gray-500 font-light hover:text-gray-700'
          }`}
         >
          Dashboard
         </Link>
         <Link 
          href="/upload"
          className={`transition-colors text-base ${
           pathname === '/upload' 
            ? 'text-black font-medium' 
            : 'text-gray-500 font-light hover:text-gray-700'
          }`}
         >
          Upload
         </Link>
         <Link 
          href="/agent"
          className={`transition-colors text-base ${
           pathname === '/agent' 
            ? 'text-black font-medium' 
            : 'text-gray-500 font-light hover:text-gray-700'
          }`}
         >
          Agent
         </Link>
         <Link 
          href="/debug"
          className={`transition-colors text-base ${
           pathname === '/debug' 
            ? 'text-black font-medium' 
            : 'text-gray-500 font-light hover:text-gray-700'
          }`}
         >
          Debug
         </Link>
        </nav>
        
        <div className="flex-1 flex justify-end">
        {/* Wallet Connection */}
        {account ? (
         <div className="relative" ref={dropdownRef}>
          <button 
           onClick={() => setShowDropdown(!showDropdown)}
           className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-light"
          >
           <span className="text-base">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
           </span>
          </button>
          
          {showDropdown && (
           <div className="absolute right-0 mt-2 w-48 bg-white border border-ocean/10 rounded-2xl shadow-lg z-10 overflow-hidden">
            <button
             onClick={async () => {
              try {
               await disconnect()
               setShowDropdown(false)
              } catch (error) {
               console.error('Failed to disconnect wallet:', error)
               setShowDropdown(false)
              }
             }}
             className="w-full text-left px-4 py-2.5 text-[15px] font-albert font-normal text-ocean hover:bg-aqua/10 transition-colors"
            >
             Disconnect Wallet
            </button>
           </div>
          )}
         </div>
        ) : (
         <div className="[&>button]:!bg-black [&>button]:!text-white [&>button]:!border-black [&>button]:!px-4 [&>button]:!py-2 [&>button]:!rounded-lg [&>button]:!font-light [&>button]:!text-base [&>button]:hover:!bg-gray-800 [&>button]:!transition-colors">
          <ConnectButton />
         </div>
        )}
        </div>
       </div>

       {/* Mobile Navigation */}
       <div className="md:hidden flex items-center gap-3">
        {/* Mobile Wallet */}
        {account ? (
         <div className="relative" ref={mobileDropdownRef}>
          <button 
           onClick={() => setShowMobileDropdown(!showMobileDropdown)}
           className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-light text-sm"
          >
           <span>
            {account.address.slice(0, 4)}...{account.address.slice(-3)}
           </span>
          </button>
          
          {showMobileDropdown && (
           <div className="absolute right-0 mt-2 w-40 bg-white border border-ocean/10 rounded-xl shadow-lg z-10 overflow-hidden">
            <button
             onClick={async () => {
              try {
               await disconnect()
               setShowMobileDropdown(false)
              } catch (error) {
               console.error('Failed to disconnect wallet:', error)
               setShowMobileDropdown(false)
              }
             }}
             className="w-full text-left px-3 py-2 text-sm font-albert font-normal text-ocean hover:bg-aqua/10 transition-colors"
            >
             Disconnect
            </button>
           </div>
          )}
         </div>
        ) : (
         <div className="[&>button]:!bg-black [&>button]:!text-white [&>button]:!border-black [&>button]:!px-3 [&>button]:!py-1.5 [&>button]:!rounded-lg [&>button]:!font-light [&>button]:!text-sm [&>button]:hover:!bg-gray-800 [&>button]:!transition-colors">
          <ConnectButton />
         </div>
        )}

        {/* Hamburger Menu */}
        <button 
         onClick={() => setShowMobileMenu(!showMobileMenu)}
         className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
         <svg 
          className="w-6 h-6 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
         >
          {showMobileMenu ? (
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
         </svg>
        </button>
       </div>
      </>
     )}
    </div>

    {/* Mobile Menu */}
    {!isHomepageRoute && showMobileMenu && (
     <div 
      ref={mobileMenuRef}
      className="md:hidden bg-white border-t border-gray-100 py-4"
     >
      <nav className="flex flex-col space-y-3">
       <Link 
        href="/marketplace"
        onClick={() => setShowMobileMenu(false)}
        className={`px-4 py-2 transition-colors text-base ${
         pathname === '/marketplace' 
          ? 'text-black font-medium bg-gray-50' 
          : 'text-gray-500 font-light hover:text-gray-700 hover:bg-gray-50'
        }`}
       >
        Marketplace
       </Link>
       <Link 
        href="/dashboard"
        onClick={() => setShowMobileMenu(false)}
        className={`px-4 py-2 transition-colors text-base ${
         pathname === '/dashboard' 
          ? 'text-black font-medium bg-gray-50' 
          : 'text-gray-500 font-light hover:text-gray-700 hover:bg-gray-50'
        }`}
       >
        Dashboard
       </Link>
       <Link 
        href="/upload"
        onClick={() => setShowMobileMenu(false)}
        className={`px-4 py-2 transition-colors text-base ${
         pathname === '/upload' 
          ? 'text-black font-medium bg-gray-50' 
          : 'text-gray-500 font-light hover:text-gray-700 hover:bg-gray-50'
        }`}
       >
        Upload
       </Link>
       <Link 
        href="/agent"
        onClick={() => setShowMobileMenu(false)}
        className={`px-4 py-2 transition-colors text-base ${
         pathname === '/agent' 
          ? 'text-black font-medium bg-gray-50' 
          : 'text-gray-500 font-light hover:text-gray-700 hover:bg-gray-50'
        }`}
       >
        Agent
       </Link>
       <Link 
        href="/debug"
        onClick={() => setShowMobileMenu(false)}
        className={`px-4 py-2 transition-colors text-base ${
         pathname === '/debug' 
          ? 'text-black font-medium bg-gray-50' 
          : 'text-gray-500 font-light hover:text-gray-700 hover:bg-gray-50'
        }`}
       >
        Debug
       </Link>
      </nav>
     </div>
    )}
   </div>
  </header>
 )
}