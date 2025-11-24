'use client'

import { useState } from 'react'
import { useToast } from '@/contexts/ToastContext'

export default function DebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const AWS_SERVER = 'http://3.235.226.216:3333'

  const testHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${AWS_SERVER}/health`)
      const data = await response.json()
      setResult({ test: 'Health Check', data })
      showToast('Health check successful!', 'success')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Health check failed: ${errorMsg}`)
      showToast(`Health check failed: ${errorMsg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const testModels = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${AWS_SERVER}/test_models`)
      const data = await response.json()
      setResult({ test: 'Available Models', data })
      showToast('Models loaded successfully!', 'success')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Models test failed: ${errorMsg}`)
      showToast(`Models test failed: ${errorMsg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const testHighQualityModel = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${AWS_SERVER}/test_evaluate/high_quality_model.pkl/high_quality_test.csv`)
      const data = await response.json()
      setResult({ test: 'High Quality Model Evaluation', data })
      showToast(`Quality Score: ${data.evaluation?.quality_score}%`, 'success')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`High quality test failed: ${errorMsg}`)
      showToast(`High quality test failed: ${errorMsg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const testLowQualityModel = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${AWS_SERVER}/test_evaluate/low_quality_model.pkl/low_quality_test.csv`)
      const data = await response.json()
      setResult({ test: 'Low Quality Model Evaluation', data })
      showToast(`Quality Score: ${data.evaluation?.quality_score}%`, 'success')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Low quality test failed: ${errorMsg}`)
      showToast(`Low quality test failed: ${errorMsg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const testCustomEvaluation = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${AWS_SERVER}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_blob_id: 'debug_test_model',
          dataset_blob_id: 'debug_test_dataset',
          use_walrus: false  // Use local test models
        })
      })
      const data = await response.json()
      setResult({ test: 'Custom Model Evaluation', data })
      if (data.success) {
        showToast(`Evaluation successful! Score: ${data.evaluation?.quality_score}%`, 'success')
      } else {
        showToast(`Evaluation failed: ${data.error}`, 'error')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Custom evaluation failed: ${errorMsg}`)
      showToast(`Custom evaluation failed: ${errorMsg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">
            AWS TEE Server Debug Panel
          </h1>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              Server: <code className="bg-gray-100 px-2 py-1 rounded">{AWS_SERVER}</code>
            </p>
            <p className="text-sm text-gray-600">
              This page directly tests the ML evaluation server running on AWS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={testHealth}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              {loading ? 'Testing...' : '1. Test Health'}
            </button>

            <button
              onClick={testModels}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              {loading ? 'Testing...' : '2. List Models'}
            </button>

            <button
              onClick={testHighQualityModel}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              {loading ? 'Testing...' : '3. Test High Quality'}
            </button>

            <button
              onClick={testLowQualityModel}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              {loading ? 'Testing...' : '4. Test Low Quality'}
            </button>

            <button
              onClick={testCustomEvaluation}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg md:col-span-2"
            >
              {loading ? 'Testing...' : '5. Custom Evaluation API'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 font-semibold mb-2">Error:</h3>
              <pre className="text-red-600 text-sm">{error}</pre>
            </div>
          )}

          {result && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-gray-800 font-semibold mb-2">
                Result: {result.test}
              </h3>
              <pre className="text-sm text-gray-600 overflow-auto max-h-96">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}