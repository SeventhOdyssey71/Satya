'use client'

import React from 'react'
import Link from 'next/link'

export default function Header() {
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

          {/* Get Started Button */}
          <Link 
            href="/marketplace" 
            className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors rounded-md font-medium"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}