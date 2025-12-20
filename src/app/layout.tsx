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
 title: '0G Labs - Next-Gen Data Infrastructure',
 description: 'Modular blockchain infrastructure for verifiable AI and data markets with zero-knowledge proofs',
 icons: {
  icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%239200E1"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" font-weight="600" fill="white" text-anchor="middle" dy="0.35em">0G</text></svg>',
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