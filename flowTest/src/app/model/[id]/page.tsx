'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/ui/Header'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

interface ModelPageProps {
  params: Promise<{ id: string }>
}

export default function ModelPage({ params }: ModelPageProps) {
  const [id, setId] = useState<string>('')
  
  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  return (
    <div className="min-h-screen bg-white">
      <Header activeTab="marketplace" />
      <main className="relative z-10 py-6">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center py-20">
            <h1 className="text-3xl font-russo text-black mb-8">Model Details</h1>
            <p className="text-gray-600 text-lg">Model ID: {id}</p>
            <p className="text-gray-400 mt-4">This page is temporarily simplified during development</p>
          </div>
        </div>
      </main>
    </div>
  )
}