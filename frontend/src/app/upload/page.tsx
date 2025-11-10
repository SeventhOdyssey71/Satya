'use client'

import Header from '@/components/ui/Header'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header activeTab="upload" />
      
      {/* Main Content */}
      <main className="relative z-10 py-6">
        <div className="container mx-auto px-6">
          <div className="text-center py-20">
            <h1 className="text-3xl font-russo text-black mb-8">Upload Model</h1>
            <p className="text-gray-600 text-lg">Model upload functionality is being implemented</p>
            <p className="text-gray-400 mt-4">This page is temporarily simplified during development</p>
          </div>
        </div>
      </main>
    </div>
  )
}