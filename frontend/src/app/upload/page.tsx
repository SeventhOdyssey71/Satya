'use client'

import Header from '@/components/ui/Header'
import { ModelUploadWizard } from '@/components/upload'
import { UploadProvider } from '@/contexts'
import { 
  Shield, 
  Upload, 
  Database,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'

// Disable static generation to avoid service initialization issues during build
export const dynamic = 'force-dynamic'

export default function UploadPage() {
  return (
    <UploadProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <Header activeTab="upload" />
        
        {/* Main Content */}
        <main className="relative z-10 py-6">
          <div className="container mx-auto px-6">
            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Model</h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Share your AI models with the marketplace. Your models are encrypted with SEAL 
                and stored securely on Walrus, coordinated by SUI smart contracts.
              </p>
            </div>

            {/* Security & Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">SEAL Encryption</h3>
                <p className="text-sm text-gray-600">
                  Models are encrypted using SEAL technology for privacy-preserving access
                </p>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Walrus Storage</h3>
                <p className="text-sm text-gray-600">
                  Decentralized storage ensures your models are always available
                </p>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Smart Contracts</h3>
                <p className="text-sm text-gray-600">
                  SUI blockchain manages ownership, pricing, and access rights
                </p>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-4xl mx-auto">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Before You Start</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ensure your wallet is connected and has sufficient SUI for gas fees</li>
                    <li>• Prepare your model file (ONNX format recommended)</li>
                    <li>• Have model metadata ready (title, description, tags)</li>
                    <li>• Consider whether you want encryption enabled for privacy</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload Wizard */}
            <div className="max-w-6xl mx-auto">
              <ModelUploadWizard />
            </div>
          </div>
        </main>
      </div>
    </UploadProvider>
  )
}