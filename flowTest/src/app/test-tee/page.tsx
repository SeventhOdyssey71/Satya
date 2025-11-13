'use client'

import { useState } from 'react'
import Header from '@/components/ui/Header'
import { MLProcessingSection, OnChainVerification } from '@/components/tee'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

export default function TestTEEPage() {
  const [teeResult, setTeeResult] = useState<any>(null)

  const serverStatus = {
    connected: true,
    enclave_id: 'nautilus-production-001',
    version: '1.0.0',
    timestamp: Date.now()
  }

  const handleTeeResult = (result: any) => {
    setTeeResult(result)
    console.log('TEE Result received:', result)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header activeTab="marketplace" />
      
      {/* Main Content */}
      <main className="relative z-10 py-6">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-russo text-black mb-4">TEE Integration Test</h1>
            <p className="text-gray-600">Test the complete TEE "Process in TEE" and "Verify on SUI Blockchain" functionality</p>
          </div>

          <div className="space-y-8">
            {/* ML Processing Section */}
            <MLProcessingSection
              serverStatus={serverStatus}
              onTeeResult={handleTeeResult}
              modelBlobId="blob_1699123456_abc123def"
              datasetBlobId="blob_1699123456_xyz789ghi"
            />

            {/* On-Chain Verification Section */}
            <OnChainVerification
              teeResult={teeResult}
              onVerificationComplete={(digest) => {
                console.log('Blockchain verification complete:', digest)
                alert(`Verification complete! Transaction: ${digest}`)
              }}
            />
          </div>

          {/* Instructions */}
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Test Instructions:</h2>
            <ol className="space-y-2 text-sm text-blue-800">
              <li>1. Click "Load Real Models" to fetch available models from the TEE server</li>
              <li>2. Select a model (tiny_lr, tiny_rf, or tiny_sentiment)</li>
              <li>3. Click "🚀 Process in TEE" to run ML inference and generate TEE attestation</li>
              <li>4. Once processing is complete, connect your SUI wallet</li>
              <li>5. Click "Verify on SUI Blockchain" to record the attestation on-chain</li>
              <li>6. Check the transaction link on SuiVision to confirm blockchain verification</li>
            </ol>
          </div>

          {/* Debug Info */}
          {teeResult && (
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Debug - TEE Result:</h2>
              <pre className="text-xs text-gray-700 bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(teeResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}