'use client';

import { ConnectButton } from '@mysten/dapp-kit';

export function WalletHeader() {
  return (
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
  );
}