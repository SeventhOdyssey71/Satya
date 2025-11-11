'use client'

import { useState } from 'react'
import { useNautilus } from '@/hooks'
import type { NautilusComputeRequest, NautilusComputeResult } from '@/lib/types'

interface TEEComputeProps {
  modelId: string
  modelTitle: string
  onResult?: (result: NautilusComputeResult) => void
}

export default function TEECompute({ modelId, modelTitle, onResult }: TEEComputeProps) {
  const { submitComputation, pollComputationStatus, isSubmitting, isPolling, error } = useNautilus()
  
  const [inputData, setInputData] = useState('')
  const [computationType, setComputationType] = useState<'inference' | 'validation' | 'training'>('inference')
  const [jobId, setJobId] = useState<string | null>(null)
  const [result, setResult] = useState<NautilusComputeResult | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async () => {
    if (!inputData.trim()) {
      alert('Please provide input data for computation')
      return
    }

    try {
      let parsedInput
      try {
        parsedInput = JSON.parse(inputData)
      } catch {
        // If not valid JSON, treat as string
        parsedInput = inputData
      }

      const request: NautilusComputeRequest = {
        modelId,
        inputData: parsedInput,
        computationType,
        requirements: {
          memory: '4GB',
          cpu: '2 vCPU',
          timeout: 300, // 5 minutes
        },
      }

      const { jobId: newJobId } = await submitComputation(request)
      setJobId(newJobId)
      setResult(null)

      // Start polling for results
      const finalResult = await pollComputationStatus(newJobId, (intermediateResult) => {
        setResult(intermediateResult)
      })

      setResult(finalResult)
      onResult?.(finalResult)
      
    } catch (error: any) {
      console.error('TEE computation failed:', error)
      alert(`Computation failed: ${error.message}`)
    }
  }

  const handleClear = () => {
    setInputData('')
    setJobId(null)
    setResult(null)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-russo text-black flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Nautilus TEE Computation
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        Run secure computations on <span className="font-medium">{modelTitle}</span> using Trusted Execution Environment
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Computation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Computation Type
            </label>
            <select
              value={computationType}
              onChange={(e) => setComputationType(e.target.value as any)}
              className="w-full h-12 bg-white rounded-lg border border-gray-300 px-3 text-gray-600 text-sm font-albert outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
            >
              <option value="inference">Model Inference</option>
              <option value="validation">Data Validation</option>
              <option value="training">Model Training</option>
            </select>
          </div>

          {/* Input Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Data (JSON or Text)
            </label>
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder='{"input": "your data here"} or plain text'
              rows={4}
              className="w-full bg-white rounded-lg border border-gray-300 px-3 py-3 text-gray-600 text-sm font-albert outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 resize-none font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isPolling || !inputData.trim()}
              className="flex-1 bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : isPolling ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Computing...
                </div>
              ) : (
                'Run TEE Computation'
              )}
            </button>
            
            <button
              onClick={handleClear}
              disabled={isSubmitting || isPolling}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Job Status */}
          {jobId && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-1">TEE Job ID</div>
              <div className="text-sm text-blue-700 font-mono break-all">{jobId}</div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium text-gray-900">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Computation Results
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 mb-1">Status</div>
                  <div className={`text-sm font-medium ${
                    result.status === 'completed' ? 'text-green-600' : 
                    result.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                  </div>
                </div>

                {result.metrics && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-1">Execution Time</div>
                    <div className="text-sm font-medium text-gray-900">
                      {result.metrics.executionTime}ms
                    </div>
                  </div>
                )}
              </div>

              {/* Result Data */}
              {result.result && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Output</div>
                  <pre className="text-sm text-gray-900 font-mono whitespace-pre-wrap overflow-auto max-h-64">
                    {typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              )}

              {/* Attestation */}
              {result.attestation && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    TEE Attestation Verified
                  </div>
                  <div className="text-xs text-green-700 font-mono">
                    <div>PCR0: {result.attestation.pcr0.slice(0, 16)}...</div>
                    <div>PCR1: {result.attestation.pcr1.slice(0, 16)}...</div>
                    <div>PCR2: {result.attestation.pcr2.slice(0, 16)}...</div>
                  </div>
                </div>
              )}

              {/* Error */}
              {result.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="font-medium mb-1">Error</div>
                  {result.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}