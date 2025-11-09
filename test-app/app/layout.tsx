import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ConnectButton } from '@mysten/dapp-kit';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Satya Test App",
  description: "Test Walrus and Seal integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-bold text-gray-900">Satya Marketplace</h1>
                  </div>
                  <ConnectButton />
                </div>
              </div>
            </header>
            <main>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
