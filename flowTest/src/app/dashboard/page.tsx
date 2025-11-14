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
        <Header />
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
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface-100/50 to-secondary-100/30">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-12">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-russo mb-4 animate-slide-up">
              Your <span className="text-gradient">AI Model</span> Dashboard
            </h1>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto animate-slide-up">
              Manage your uploads, track verification status, and monitor your AI model performance
            </p>
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <main className="relative z-10 pb-16">
        <div className="container-custom">
          {/* Dashboard Tabs */}
          <div className="mb-12">
            <div className="flex items-center justify-center">
              <div className="bg-surface-50 rounded-2xl p-2 border border-border shadow-card">
                <nav className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 rounded-xl font-albert font-medium transition-all duration-200 ${
                      activeTab === 'overview'
                        ? 'bg-secondary-800 text-white shadow-soft'
                        : 'text-secondary-600 hover:text-secondary-900 hover:bg-surface-100'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 rounded-xl font-albert font-medium transition-all duration-200 ${
                      activeTab === 'pending'
                        ? 'bg-secondary-800 text-white shadow-soft'
                        : 'text-secondary-600 hover:text-secondary-900 hover:bg-surface-100'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 rounded-xl font-albert font-medium transition-all duration-200 ${
                      activeTab === 'history'
                        ? 'bg-secondary-800 text-white shadow-soft'
                        : 'text-secondary-600 hover:text-secondary-900 hover:bg-surface-100'
                    }`}
                  >
                    History
                  </button>
                  <button
                    onClick={() => setActiveTab('downloads')}
                    className={`px-6 py-3 rounded-xl font-albert font-medium transition-all duration-200 ${
                      activeTab === 'downloads'
                        ? 'bg-secondary-800 text-white shadow-soft'
                        : 'text-secondary-600 hover:text-secondary-900 hover:bg-surface-100'
                    }`}
                  >
                    Downloads
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === 'overview' && <DashboardOverview onNewUpload={() => router.push('/upload')} />}
            {activeTab === 'pending' && <DashboardPending />}
            {activeTab === 'history' && <DashboardHistory />}
            {activeTab === 'downloads' && <DashboardDownloads />}
          </div>
        </div>
      </main>
    </div>
  )
}