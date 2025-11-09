import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Satya Data Marketplace',
  description: 'Secure ML model and dataset marketplace with TEE verification',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}