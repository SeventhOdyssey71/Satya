'use client'

import { useState } from 'react'
import Header from '@/components/ui/Header'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const [isConnected] = useState(false) // Temporary simplification

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
          <DashboardContent />
        </div>
      </main>
    </div>
  )
}


function DashboardContent() {
  const [activeTab, setActiveTab] = useState<'uploaded' | 'downloaded' | 'computations'>('uploaded')

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-russo text-black mb-12">Dashboard</h1>
      
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-8">
        {activeTab === 'uploaded' && <ModelList status="uploaded" />}
        {activeTab === 'downloaded' && <ModelList status="downloaded" />}
        {activeTab === 'computations' && <TEEComputationHistory />}
      </div>
    </div>
  )
}

function DashboardTabs({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: string
  onTabChange: (tab: 'uploaded' | 'downloaded' | 'computations') => void
}) {
  return (
    <div className="flex gap-8 border-b border-gray-200">
      <TabButton 
        active={activeTab === 'uploaded'} 
        onClick={() => onTabChange('uploaded')}
      >
        Uploaded Models
      </TabButton>
      <TabButton 
        active={activeTab === 'downloaded'} 
        onClick={() => onTabChange('downloaded')}
      >
        Downloaded Models
      </TabButton>
      <TabButton 
        active={activeTab === 'computations'} 
        onClick={() => onTabChange('computations')}
      >
        TEE Computations
      </TabButton>
    </div>
  )
}

function TabButton({ 
  children, 
  active = false, 
  onClick 
}: { 
  children: React.ReactNode
  active?: boolean
  onClick: () => void
}) {
  return (
    <button 
      onClick={onClick}
      className={`pb-3 text-base font-medium font-albert transition-colors ${
        active 
          ? 'text-black border-b-2 border-black' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function ModelList({ status }: { status: 'uploaded' | 'downloaded' }) {
  const [models] = useState([]) // Temporary simplification
  const [error] = useState(null)
  const isLoading = false

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        <button 
          onClick={() => {}}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">
          No {status === 'uploaded' ? 'uploaded' : 'downloaded'} models found
        </div>
        <p className="text-gray-400">
          {status === 'uploaded' 
            ? 'Start by uploading your first model' 
            : 'Browse the marketplace to download models'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {models.map((model: any, index: number) => (
        <ModelCard key={index} model={model} />
      ))}
    </div>
  )
}

function ModelCard({ model }: { model: any }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    return isNaN(numPrice) ? price : `${numPrice} SUI`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-medium font-albert text-black">{model.title}</h3>
            {model.isVerified && (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500 mb-2">
            <span>Category: {model.category}</span>
            <span>Downloads: {model.downloads}</span>
            <span>Price: {formatPrice(model.price)}</span>
          </div>
          <div className="text-sm text-gray-500">
            Created: {formatDate(model.createdAt)}
          </div>
          {model.isEncrypted && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                SEAL Encrypted
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <a 
            href={`/model/${model.id}`}
            className="px-4 py-2 text-sm font-medium font-albert text-gray-600 hover:text-gray-800 transition-colors"
          >
            View Details
          </a>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            model.isVerified 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {model.isVerified ? 'Active' : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  )
}

function TEEComputationHistory() {
  // Mock data for TEE computations - in real app this would come from an API
  const computations = [
    {
      id: '1',
      jobId: 'job_abc123',
      modelId: 'model_1',
      modelTitle: 'Healthcare AI Model v2.1',
      computationType: 'inference' as const,
      status: 'completed' as const,
      createdAt: '2025-11-09T10:30:00Z',
      executionTime: 1250,
      result: 'Classification: Positive (confidence: 94.2%)'
    },
    {
      id: '2', 
      jobId: 'job_def456',
      modelId: 'model_2',
      modelTitle: 'Financial Prediction Model',
      computationType: 'validation' as const,
      status: 'failed' as const,
      createdAt: '2025-11-09T09:15:00Z',
      executionTime: null,
      error: 'Input validation failed: Missing required fields'
    },
    {
      id: '3',
      jobId: 'job_ghi789',
      modelId: 'model_3', 
      modelTitle: 'Image Classification Model',
      computationType: 'inference' as const,
      status: 'running' as const,
      createdAt: '2025-11-09T11:45:00Z',
      executionTime: null,
      result: null
    }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'  
      case 'running': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (computations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">No TEE computations found</div>
        <p className="text-gray-400">Start by running computations on model detail pages</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {computations.map((computation) => (
        <div key={computation.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-medium text-black">{computation.modelTitle}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(computation.status)}`}>
                  {computation.status.charAt(0).toUpperCase() + computation.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-2">
                <span>Type: {computation.computationType}</span>
                <span>Job ID: {computation.jobId}</span>
                {computation.executionTime && <span>Execution: {computation.executionTime}ms</span>}
              </div>
              <div className="text-sm text-gray-500">
                Created: {formatDate(computation.createdAt)}
              </div>
            </div>
          </div>

          {computation.result && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-900 mb-1">Result</div>
              <div className="text-sm text-green-700 font-mono">{computation.result}</div>
            </div>
          )}

          {computation.error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <div className="text-sm font-medium text-red-900 mb-1">Error</div>
              <div className="text-sm text-red-700">{computation.error}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

