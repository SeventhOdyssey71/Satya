'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NautilusClient, NautilusConfig, AttestationDocument } from './client';

interface NautilusContextType {
  client: NautilusClient | null;
  isInitialized: boolean;
  error: string | null;
  verificationHistory: VerificationHistoryItem[];
  addVerificationToHistory: (item: VerificationHistoryItem) => void;
}

interface VerificationHistoryItem {
  id: string;
  datasetName: string;
  status: 'pending' | 'verified' | 'failed';
  timestamp: number;
  attestationId?: string;
  error?: string;
}

const NautilusContext = createContext<NautilusContextType | null>(null);

export function NautilusProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<NautilusClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryItem[]>([]);

  useEffect(() => {
    initializeNautilusClient();
  }, []);

  const initializeNautilusClient = async () => {
    try {
      const config: NautilusConfig = {
        enclaveUrl: process.env.NEXT_PUBLIC_NAUTILUS_ENCLAVE_URL || 'https://nautilus-enclave-testnet.sui.io',
        verificationApiUrl: process.env.NEXT_PUBLIC_NAUTILUS_VERIFICATION_URL || 'https://nautilus-verify-testnet.sui.io',
        attestationStorageUrl: process.env.NEXT_PUBLIC_NAUTILUS_ATTESTATION_URL || 'https://nautilus-attestation-testnet.sui.io',
        network: (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet') || 'testnet'
      };

      const nautilusClient = new NautilusClient(config);
      setClient(nautilusClient);
      setIsInitialized(true);
      setError(null);
      
      console.log('✅ Nautilus client initialized successfully');
      
    } catch (err) {
      console.error('❌ Failed to initialize Nautilus client:', err);
      setError(err instanceof Error ? err.message : 'Initialization failed');
      setIsInitialized(false);
    }
  };

  const addVerificationToHistory = (item: VerificationHistoryItem) => {
    setVerificationHistory(prev => [item, ...prev].slice(0, 50)); // Keep last 50 items
  };

  const value: NautilusContextType = {
    client,
    isInitialized,
    error,
    verificationHistory,
    addVerificationToHistory
  };

  return (
    <NautilusContext.Provider value={value}>
      {children}
    </NautilusContext.Provider>
  );
}

export function useNautilusContext() {
  const context = useContext(NautilusContext);
  if (!context) {
    throw new Error('useNautilusContext must be used within a NautilusProvider');
  }
  return context;
}