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
       <h1 className="text-3xl font-russo text-ocean mb-8">Dashboard</h1>
       <p className="text-ocean/70 text-lg">Please connect your wallet to access your dashboard</p>
      </div>
     </div>
    </main>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-white">
   {/* Header */}
   <Header />
   
   {/* Hero Section */}
   <section className="relative py-8">
    <div className="container-custom">
     <div className="text-center">
      <h1 className="text-2xl md:text-3xl font-medium mb-3 text-gray-900">
       Your AI Model Dashboard
      </h1>
      <p className="text-lg text-gray-600 max-w-xl mx-auto">
       Manage your uploads, track verification status, and monitor your AI model performance
      </p>
     </div>
    </div>
   </section>
   
   {/* Main Content */}
   <main className="relative z-10 pb-16">
    <div className="container-custom">
     {/* Dashboard Tabs */}
     <div className="mb-8">
      <div className="flex items-center justify-center">
       <div className="bg-white rounded-lg p-1 border border-gray-200">
        <nav className="flex space-x-1">
         <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
           activeTab === 'overview'
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
         >
          Overview
         </button>
         <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
           activeTab === 'pending'
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
         >
          Pending
         </button>
         <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
           activeTab === 'history'
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
         >
          History
         </button>
         <button
          onClick={() => setActiveTab('downloads')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
           activeTab === 'downloads'
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
         >
          Downloads
         </button>
        </nav>
       </div>
      </div>
     </div>

     {/* Tab Content */}
     <div>
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