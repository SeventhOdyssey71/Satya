import type { Metadata } from 'next'
import { Russo_One, Albert_Sans } from 'next/font/google'
import './globals.css'

const russo = Russo_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-russo',
})

const albert = Albert_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-albert',
})

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
    <html lang="en" className={`${russo.variable} ${albert.variable}`}>
      <body className="antialiased font-albert">
        {children}
      </body>
    </html>
  )
}