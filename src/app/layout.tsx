import type { Metadata } from 'next'
// 0G Labs fonts are imported via CSS in globals.css
import { WalletProviders } from '@/providers/WalletProvider'
import { UploadProvider } from '@/contexts/UploadContext'
import { NautilusProvider } from '@/lib/integrations/nautilus/context'
import { ToastProvider } from '@/contexts/ToastContext'
import { PasskeyWalletProvider } from '@/contexts/PasskeyWalletContext'
import GlobalUploadProgress from '@/components/upload/GlobalUploadProgress'
import '@mysten/dapp-kit/dist/index.css'
import './globals.css'

// Font variables removed - using CSS imports in globals.css

export const metadata: Metadata = {
 title: 'Satya - Verifiable AI & Data Marketplace',
 description: 'Secure AI models and datasets with zero-knowledge proofs, encrypted storage, and blockchain transparency',
 icons: {
  icon: '/images/satya icon black.svg',
 },
}

export default function RootLayout({
 children,
}: {
 children: React.ReactNode
}) {
 return (
  <html lang="en">
   <body className="antialiased">
    <WalletProviders>
     <PasskeyWalletProvider>
      <UploadProvider>
       <NautilusProvider>
        <ToastProvider>
         {children}
         <GlobalUploadProgress />
        </ToastProvider>
       </NautilusProvider>
      </UploadProvider>
     </PasskeyWalletProvider>
    </WalletProviders>
   </body>
  </html>
 )
}