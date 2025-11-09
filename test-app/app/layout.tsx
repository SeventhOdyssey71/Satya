import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { WalletHeader } from "../components/wallet-header";

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
            <WalletHeader />
            <main>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
