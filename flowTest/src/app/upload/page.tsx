'use client'

import Header from '@/components/ui/Header'
import { UploadProvider } from '@/contexts'
import { ModelUploadWizard } from '@/components/upload'

// Disable static generation to avoid Walrus WASM loading issues during build
export const dynamic = 'force-dynamic'

export default function UploadPage() {
 return (
  <div className="min-h-screen bg-white pt-16">
   <Header />
   <main className="relative z-10 py-6 pb-20">
    <div className="container max-w-4xl mx-auto px-6">
     <UploadProvider>
      <ModelUploadWizard />
     </UploadProvider>
    </div>
   </main>
   
   {/* Fixed Footer */}
   <footer className="fixed bottom-0 left-0 right-0 bg-white py-3">
    <div className="container-custom">
     <div className="flex justify-between items-center text-sm text-gray-500">
      <div>© 2025 Satya. All rights reserved.</div>
      <div className="flex gap-4">
       <a href="/docs" className="hover:text-gray-700 transition-colors">Docs</a>
       <a href="/help" className="hover:text-gray-700 transition-colors">Help</a>
      </div>
     </div>
    </div>
   </footer>
  </div>
 )
}