'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/ui/Header'
import { Shield, Upload, Database } from 'lucide-react'

// Dynamically import upload components to avoid SSR issues
const UploadProvider = dynamic(() => import('@/contexts').then(mod => ({ default: mod.UploadProvider })), {
  ssr: false
})

const ModelUploadWizard = dynamic(() => import('@/components/upload').then(mod => ({ default: mod.ModelUploadWizard })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
})

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab="upload" />
      <main className="relative z-10 py-6">
        <div className="container mx-auto px-6">
          {/* Security & Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg border border-blue-200">
              <div className="flex items-center mb-3">
                <Shield className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">SEAL Encryption</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Policy-based access control with secure encryption ensuring only authorized buyers can access your models.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-purple-200">
              <div className="flex items-center mb-3">
                <Database className="w-8 h-8 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Walrus Storage</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Decentralized blob storage with redundancy and high availability for your valuable ML assets.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-green-200">
              <div className="flex items-center mb-3">
                <Upload className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Smart Contracts</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Automated payment processing and access control powered by Sui blockchain smart contracts.
              </p>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            <Suspense fallback={
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }>
              <UploadProvider>
                <ModelUploadWizard />
              </UploadProvider>
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}