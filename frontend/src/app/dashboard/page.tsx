'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/ui/Header'
import UploadDashboard from '@/components/upload/UploadDashboard'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const [isConnected] = useState(true) // Simplified for now
  const router = useRouter()

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <Header activeTab="dashboard" />
        <main className="relative z-10 py-6">
          <div className="container max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center py-20">
              <h1 className="text-3xl font-russo text-black mb-8">Dashboard</h1>
              <p className="text-gray-600 text-lg">Please connect your wallet to access your dashboard</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header activeTab="dashboard" />
      
      {/* Main Content */}
      <main className="relative z-10 py-6">
        <div className="container max-w-7xl mx-auto px-6">
          <UploadDashboard 
            showNewUploadButton={true}
            onNewUpload={() => router.push('/upload')}
          />
        </div>
      </main>
    </div>
  )
}