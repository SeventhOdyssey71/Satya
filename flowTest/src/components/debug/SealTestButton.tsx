'use client'

import { useState } from 'react'
import { testSealConfiguration, testSealWithH2ONodes, testSealClientOperations } from '@/lib/integrations/seal/utils/seal-test'

export default function SealTestButton() {
 const [testing, setTesting] = useState(false)
 const [results, setResults] = useState<any>(null)
 const [h2oResults, setH2oResults] = useState<any>(null)
 const [operationsResults, setOperationsResults] = useState<any>(null)

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

 const runH2OTest = async () => {
  setTesting(true)
  try {
   const testResults = await testSealWithH2ONodes()
   setH2oResults(testResults)
   console.log('H2O Nodes SEAL test completed:', testResults)
  } catch (error) {
   console.error('H2O Nodes SEAL test failed:', error)
   setH2oResults({ error: error instanceof Error ? error.message : String(error) })
  } finally {
   setTesting(false)
  }
 }

 const runOperationsTest = async () => {
  setTesting(true)
  try {
   const testResults = await testSealClientOperations()
   setOperationsResults(testResults)
   console.log('SEAL operations test completed:', testResults)
  } catch (error) {
   console.error('SEAL operations test failed:', error)
   setOperationsResults({ error: error instanceof Error ? error.message : String(error) })
  } finally {
   setTesting(false)
  }
 }

 if (process.env.NODE_ENV !== 'development') {
  return null // Only show in development
 }

 return (
  <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
   <h3 className="text-sm font-semibold mb-2">SEAL Debug</h3>
   <div className="grid grid-cols-2 gap-2">
    <button
     onClick={runTest}
     disabled={testing}
     className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
     {testing ? 'Testing...' : 'Fallback RPC'}
    </button>
    <button
     onClick={runH2OTest}
     disabled={testing}
     className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
    >
     {testing ? 'Testing...' : 'H2O Nodes'}
    </button>
    <button
     onClick={runOperationsTest}
     disabled={testing}
     className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 col-span-2"
    >
     {testing ? 'Testing...' : 'Full Operations Test'}
    </button>
   </div>
   
   {results && (
    <div className="mt-2 text-xs border-t pt-2">
     <div className="font-semibold text-blue-600">Fallback RPC Results:</div>
     {results.error ? (
      <div className="text-red-600">Error: {results.error}</div>
     ) : (
      <div>
       <div className={results.packageValid ? 'text-green-600' : 'text-red-600'}>
        Package: {results.packageValid ? '' : ''}
       </div>
       <div className={results.keyServersValid > 0 ? 'text-green-600' : 'text-red-600'}>
        Servers: {results.keyServersValid}/2
       </div>
       {results.rpcUsed && <div className="text-gray-600">RPC: {results.rpcUsed}</div>}
      </div>
     )}
    </div>
   )}

   {h2oResults && (
    <div className="mt-2 text-xs border-t pt-2">
     <div className="font-semibold text-green-600">H2O Nodes Results:</div>
     {h2oResults.error ? (
      <div className="text-red-600">Error: {h2oResults.error}</div>
     ) : (
      <div>
       <div className={h2oResults.success ? 'text-green-600' : 'text-red-600'}>
        Overall: {h2oResults.success ? '' : ''}
       </div>
       <div className={h2oResults.rpcWorking ? 'text-green-600' : 'text-red-600'}>
        RPC: {h2oResults.rpcWorking ? '' : ''}
       </div>
       <div className={h2oResults.sealPackageFound ? 'text-green-600' : 'text-red-600'}>
        Package: {h2oResults.sealPackageFound ? '' : ''}
       </div>
       <div className={h2oResults.keyServersValid > 0 ? 'text-green-600' : 'text-red-600'}>
        Servers: {h2oResults.keyServersValid}/2
       </div>
      </div>
     )}
    </div>
   )}

   {operationsResults && (
    <div className="mt-2 text-xs border-t pt-2">
     <div className="font-semibold text-purple-600">Operations Test Results:</div>
     {operationsResults.error ? (
      <div className="text-red-600">Error: {operationsResults.error}</div>
     ) : (
      <div>
       <div className={operationsResults.success ? 'text-green-600' : 'text-red-600'}>
        Overall: {operationsResults.success ? '' : ''}
       </div>
       <div className={operationsResults.clientInitialized ? 'text-green-600' : 'text-red-600'}>
        Client: {operationsResults.clientInitialized ? '' : ''}
       </div>
       <div className="text-gray-600">
        Key Servers: {operationsResults.keyServerTests?.length || 0}
       </div>
       <div className="text-gray-600">
        Sessions: {operationsResults.sessionTests?.sessionStats?.totalSessions || 0}
       </div>
      </div>
     )}
    </div>
   )}
  </div>
 )
}