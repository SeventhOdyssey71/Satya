'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/ui/Header'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import DashboardPending from '@/components/dashboard/DashboardPending'
import DashboardHistory from '@/components/dashboard/DashboardHistory'
import DashboardDownloads from '@/components/dashboard/DashboardDownloads'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

function DashboardContent() {
 const [isConnected] = useState(true) // Simplified for now
 const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'history' | 'downloads'>('overview')
 const [pendingRefresh, setPendingRefresh] = useState(false)
 const router = useRouter()
 const searchParams = useSearchParams()

 // Handle refresh parameter from upload redirect
 useEffect(() => {
  const refresh = searchParams.get('refresh')
  if (refresh === 'true') {
   // Switch to pending tab and trigger refresh
   setActiveTab('pending')
   setPendingRefresh(true)
   
   // Clean up URL parameter
   router.replace('/dashboard', { scroll: false })
  }
 }, [searchParams, router])

 if (!isConnected) {
  return (
   <div className="min-h-screen bg-white">
    <Header />
    <main className="relative z-10 py-6">
     <div className="container max-w-7xl mx-auto px-6">
      <div className="max-w-4xl mx-auto text-center py-20">
       <h1 className="text-3xl font-albert font-bold text-ocean mb-8">Dashboard</h1>
       <p className="text-ocean/70 text-lg">Please connect your wallet to access your dashboard</p>
      </div>
     </div>
    </main>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-white pt-16">
   {/* Header */}
   <Header />
   
   {/* Hero Section */}
   <section className="relative py-8">
    <div className="container-custom">
     <div className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-albert font-semibold leading-tight mb-3 text-gray-900">
       Your AI Model Dashboard
      </h1>
      <p className="text-gray-600 mb-2">
       Manage your uploads, track verification status, and monitor your AI model performance
      </p>
     </div>
    </div>
   </section>
   
   {/* Main Content */}
   <main className="relative z-10 pb-8">
    <div className="container-custom">
     {/* Dashboard Tabs */}
     <div className="mb-8">
      <div className="flex items-start">
       <div className="bg-white rounded-lg p-1 border border-gray-200">
        <nav className="flex space-x-1">
         <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
           activeTab === 'overview'
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
         >
          Overview
         </button>
         <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
           activeTab === 'pending'
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
         >
          Pending
         </button>
         <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
           activeTab === 'history'
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
         >
          History
         </button>
         <button
          onClick={() => setActiveTab('downloads')}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
           activeTab === 'downloads'
            ? 'bg-gray-900 text-white'
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
      {activeTab === 'pending' && (
       <DashboardPending 
        triggerRefresh={pendingRefresh}
        onRefreshComplete={() => setPendingRefresh(false)}
       />
      )}
      {activeTab === 'history' && <DashboardHistory />}
      {activeTab === 'downloads' && <DashboardDownloads />}
     </div>
    </div>
   </main>
  </div>
 )
}

export default function DashboardPage() {
 return (
  <Suspense fallback={<div>Loading dashboard...</div>}>
   <DashboardContent />
  </Suspense>
 )
}