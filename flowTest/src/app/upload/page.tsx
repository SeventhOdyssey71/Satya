'use client'

import Header from '@/components/ui/Header'
import { UploadProvider } from '@/contexts'
import { ModelUploadWizard } from '@/components/upload'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header activeTab="upload" />
      <main className="py-8">
        <UploadProvider>
          <ModelUploadWizard />
        </UploadProvider>
      </main>
    </div>
  )
}