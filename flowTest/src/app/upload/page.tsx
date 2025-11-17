'use client'

import Header from '@/components/ui/Header'
import { UploadProvider } from '@/contexts'
import { ModelUploadWizard } from '@/components/upload'

// Disable static generation to avoid Walrus WASM loading issues during build
export const dynamic = 'force-dynamic'

export default function UploadPage() {
 return (
  <div className="min-h-screen bg-white">
   <Header />
   <main className="relative z-10 py-6">
    <div className="container max-w-4xl mx-auto px-6">
     <UploadProvider>
      <ModelUploadWizard />
     </UploadProvider>
    </div>
   </main>
  </div>
 )
}