'use client'

import { useState } from 'react'
import { testSealConfiguration } from '@/lib/integrations/seal/utils/seal-test'

export default function SealTestButton() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runTest = async () => {
    setTesting(true)
    try {
      const testResults = await testSealConfiguration()
      setResults(testResults)
      console.log('SEAL test completed:', testResults)
    } catch (error) {
      console.error('SEAL test failed:', error)
      setResults({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      setTesting(false)
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-semibold mb-2">SEAL Debug</h3>
      <button
        onClick={runTest}
        disabled={testing}
        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Test SEAL Config'}
      </button>
      
      {results && (
        <div className="mt-2 text-xs">
          {results.error ? (
            <div className="text-red-600">Error: {results.error}</div>
          ) : (
            <div>
              <div className={results.packageValid ? 'text-green-600' : 'text-red-600'}>
                Package: {results.packageValid ? '✅' : '❌'}
              </div>
              <div className={results.keyServersValid > 0 ? 'text-green-600' : 'text-red-600'}>
                Servers: {results.keyServersValid}/2
              </div>
              {results.errors.length > 0 && (
                <div className="text-red-600 mt-1">
                  {results.errors.map((error: string, i: number) => (
                    <div key={i}>• {error}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}