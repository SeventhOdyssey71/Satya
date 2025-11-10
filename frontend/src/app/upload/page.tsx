'use client'

import Header from '@/components/ui/Header'
import ModelUploadWizard from '@/components/upload/ModelUploadWizard'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header activeTab="upload" />
      
      {/* Main Content */}
      <main className="relative z-10 py-6">
        <div className="container mx-auto px-6">
          <ModelUploadWizard />
        </div>
      </main>
    </div>
  )
}