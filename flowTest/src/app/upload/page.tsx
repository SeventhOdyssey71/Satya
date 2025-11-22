'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/ui/Header'
import { UploadProvider } from '@/contexts'
import { ModelUploadWizard } from '@/components/upload'

// Disable static generation to avoid Walrus WASM loading issues during build
export const dynamic = 'force-dynamic'

export default function UploadPage() {
 const router = useRouter()

 const handleUploadComplete = (result: any) => {
  if (result.success) {
   // Add a small delay to ensure the blockchain transaction is processed
   setTimeout(() => {
    // Redirect to dashboard with a refresh trigger
    router.push('/dashboard?refresh=true')
   }, 2000)
  }
 }

 return (
  <div className="min-h-screen bg-white pt-16">
   <Header />
   <main className="relative z-10 py-6 pb-8">
    <div className="container-custom">
     <UploadProvider>
      <ModelUploadWizard onUploadComplete={handleUploadComplete} />
     </UploadProvider>
    </div>
   </main>
  </div>
 )
}