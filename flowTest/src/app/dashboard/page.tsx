'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/ui/Header'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import DashboardPending from '@/components/dashboard/DashboardPending'
import DashboardHistory from '@/components/dashboard/DashboardHistory'
import DashboardDownloads from '@/components/dashboard/DashboardDownloads'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const [isConnected] = useState(true) // Simplified for now
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'history' | 'downloads'>('overview')
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
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-russo text-black mb-4">Dashboard</h1>
            <p className="text-gray-600">Manage your uploads, track verification status, and access your purchased models</p>
          </div>

          {/* Dashboard Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Verification
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('downloads')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'downloads'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Downloads
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && <DashboardOverview onNewUpload={() => router.push('/upload')} />}
          {activeTab === 'pending' && <DashboardPending />}
          {activeTab === 'history' && <DashboardHistory />}
          {activeTab === 'downloads' && <DashboardDownloads />}
        </div>
      </main>
    </div>
  )
}