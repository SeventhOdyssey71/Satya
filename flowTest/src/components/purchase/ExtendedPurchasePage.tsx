'use client'

import React, { useState, useEffect } from 'react'
import { SuiClient } from '@mysten/sui/client'
import { 
 Shield, 
 Lock, 
 Play,
 CheckCircle,
 AlertCircle,
 Loader2,
 ArrowRight,
 Download,
 Key,
 FileText,
 Clock,
 Cpu
} from 'lucide-react'
import { ModelCard } from '@/components/marketplace/ModelGrid'
import Header from '@/components/ui/Header'
import PurchaseVerificationService, { VerificationStep, ModelPurchaseData } from '@/lib/services/purchase-verification-service'
import { NautilusClient } from '@/lib/integrations/nautilus/client'
import { SealEncryptionService } from '@/lib/integrations/seal/services/encryption-service'
// WalrusStorageService will be dynamically imported
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useMemo } from 'react'

interface ExtendedPurchasePageProps {
 model: ModelCard
 onClose: () => void
 className?: string
}

type PurchaseStep = 'verify' | 'run' | 'success' | 'error'

interface AttestationResult {
 verified: boolean
 enclaveId: string
 timestamp: Date
 evidence: string[]
 accessKeys?: {
  encryptionKey: string;
  decryptionPolicy: string;
  sessionToken: string;
 }
}

export default function ExtendedPurchasePage({
 model,
 onClose,
 className = ''
}: ExtendedPurchasePageProps) {
 const [currentStep, setCurrentStep] = useState<PurchaseStep>('verify')
 const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([])
 const [attestationResult, setAttestationResult] = useState<AttestationResult | null>(null)
 const [isVerifying, setIsVerifying] = useState(false)
 const [isRunning, setIsRunning] = useState(false)
 const [error, setError] = useState<string>('')
 const currentAccount = useCurrentAccount()

 // Initialize services with dynamic imports
 const [services, setServices] = useState<PurchaseVerificationService | null>(null)

 useEffect(() => {
  async function initializeServices() {
   try {
    const suiClient = new SuiClient({ url: process.env.NEXT_PUBLIC_SUI_NETWORK_URL || 'https://fullnode.testnet.sui.io' })
    
    const nautilusClient = new NautilusClient({
     enclaveUrl: process.env.NEXT_PUBLIC_NAUTILUS_ENCLAVE_URL || 'http://localhost:8000',
     verificationApiUrl: process.env.NEXT_PUBLIC_NAUTILUS_VERIFICATION_URL || 'http://localhost:8001',
     attestationStorageUrl: process.env.NEXT_PUBLIC_NAUTILUS_ATTESTATION_URL || 'http://localhost:8002',
     network: 'testnet'
    })

    const sealService = new SealEncryptionService(suiClient)
    
    // Dynamic import for WalrusStorageService
    const { WalrusStorageService } = await import('@/lib/integrations/walrus/services/storage-service')
    const walrusService = new WalrusStorageService()
    
    const purchaseService = new PurchaseVerificationService(
     nautilusClient,
     sealService,
     walrusService,
     suiClient
    )
    
    setServices(purchaseService)
   } catch (error) {
    console.error('Failed to initialize services:', error)
    setError('Failed to initialize services')
   }
  }

  initializeServices()
 }, [])

 const runVerification = async () => {
  if (!currentAccount) {
   setError('Please connect your wallet first')
   return
  }

  if (!services) {
   setError('Services not yet initialized. Please try again.')
   return
  }

  setIsVerifying(true)
  setError('')

  try {
   // Create purchase data for verification
   const purchaseData: ModelPurchaseData = {
    modelId: model.id,
    buyerAddress: currentAccount.address,
    sellerAddress: 'mock-seller-address', // In real implementation, get from model metadata
    price: model.price,
    walrusBlobId: 'mock-blob-id', // In real implementation, get from model metadata
    attestationId: 'mock-attestation-id' // Optional: if model has existing attestation
   }

   // Run the verification process
   const result = await services.verifyPurchase(
    purchaseData,
    (steps) => setVerificationSteps(steps)
   )

   if (result.success) {
    setAttestationResult({
     verified: true,
     enclaveId: '0xabcd1234567890ef',
     timestamp: new Date(),
     evidence: ['nitro-document', 'signature-verification', 'blockchain-record'],
     accessKeys: result.accessKeys
    })
   } else {
    setError(result.error || 'Verification failed')
   }

  } catch (error) {
   console.error('Verification error:', error)
   setError(error instanceof Error ? error.message : 'Verification failed')
  } finally {
   setIsVerifying(false)
  }
 }

 const runModel = async () => {
  setIsRunning(true)
  setError('')

  try {
   // Simulate model execution
   await new Promise(resolve => setTimeout(resolve, 5000))
   setCurrentStep('success')
  } catch (err) {
   setError('Failed to execute model')
   setCurrentStep('error')
  } finally {
   setIsRunning(false)
  }
 }

 const canProceedToRun = attestationResult?.verified && !isVerifying

 return (
  <div className={`min-h-screen bg-gray-50 ${className}`}>
   {/* Main Satya Navigation */}
   <Header />
   
   {/* Top Navigation Bar */}
   <div className="bg-white border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-6 py-4">
     <div className="flex items-center justify-between">
      {/* Back Button */}
      <button
       onClick={onClose}
       className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
       </svg>
       Back
      </button>
      
      {/* Search Bar */}
      <div className="flex items-center gap-4">
       <div className="relative">
        <input
         type="text"
         placeholder="Type in your search here..."
         className="w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
        />
        <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
         </svg>
        </button>
       </div>
      </div>
     </div>
    </div>
   </div>

   {/* Main Content */}
   <div className="max-w-7xl mx-auto px-6 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
     {/* Model Preview - Left Side */}
     <div className="relative">
      <div className="aspect-[4/3] bg-black rounded-xl overflow-hidden relative">
       <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
        <div className="text-center text-gray-300">
         <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
          <Shield className="w-12 h-12 text-gray-400" />
         </div>
         <p className="text-lg font-medium">Model Preview</p>
         <p className="text-sm text-gray-400">Encrypted content will be available after verification</p>
        </div>
       </div>
       
       {/* Collapse View Button */}
       <div className="absolute bottom-4 left-4">
        <button className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2 hover:bg-white/30 transition-colors">
         Collapse View ✕
        </button>
       </div>
      </div>
     </div>

     {/* Content - Right Side */}
     <div className="space-y-6">
      {/* Title and Price */}
      <div className="flex items-start justify-between">
       <div className="flex-1">
        <h1 className="text-4xl font-russo text-black mb-2">{model.title}</h1>
        <p className="text-gray-600 text-sm leading-relaxed">
         {model.description}
        </p>
       </div>
       <button className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
       </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 py-4">
       <div className={`flex items-center ${currentStep === 'verify' ? 'text-black' : 'text-gray-400'}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
         currentStep === 'verify' || attestationResult?.verified 
          ? 'bg-black text-white' 
          : 'bg-gray-300 text-gray-600'
        }`}>
         1
        </div>
        <span className="ml-2 text-sm">Verify model (get attestation)</span>
       </div>
       
       <div className="flex-1 h-px bg-gray-300"></div>
       
       <div className={`flex items-center ${currentStep === 'run' || currentStep === 'success' ? 'text-black' : 'text-gray-400'}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
         currentStep === 'run' || currentStep === 'success'
          ? 'bg-black text-white' 
          : 'bg-gray-300 text-gray-600'
        }`}>
         2
        </div>
        <span className="ml-2 text-sm">Run model</span>
       </div>
      </div>

      {/* Verify Model Button and Price */}
      {currentStep === 'verify' && !attestationResult && (
       <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
         <div>
          <h3 className="font-russo text-xl text-black">Verify Model</h3>
          <p className="text-gray-600 text-sm mt-1">
           Start the verification process to ensure model integrity
          </p>
         </div>
         <div className="text-right">
          <div className="text-2xl font-russo text-black">${model.price}</div>
          <div className="text-xs text-gray-500">SUI</div>
         </div>
        </div>
        
        {!currentAccount ? (
         <div className="text-center py-4">
          <p className="text-amber-600 text-sm mb-3">Please connect your wallet to proceed with verification</p>
          <button className="px-6 py-2 border border-amber-500 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors">
           Connect Wallet
          </button>
         </div>
        ) : (
         <button
          onClick={runVerification}
          disabled={isVerifying}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
         >
          {isVerifying ? (
           <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Verifying Model...
           </>
          ) : (
           <>
            <Shield className="w-5 h-5" />
            Verify Model (${model.price})
           </>
          )}
         </button>
        )}
       </div>
      )}

      {/* Verification Steps */}
      {currentStep === 'verify' && isVerifying && (
       <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
        <h3 className="font-russo text-lg text-black">Verification in Progress</h3>

        <div className="space-y-3">
         {verificationSteps.map((step, index) => (
          <div key={step.id} className={`p-3 rounded-lg border ${
           step.status === 'completed' ? 'bg-green-50 border-green-200' :
           step.status === 'running' ? 'bg-blue-50 border-blue-200' :
           step.status === 'failed' ? 'bg-red-50 border-red-200' :
           'bg-gray-50 border-gray-200'
          }`}>
           <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
             {step.status === 'pending' && <Clock className="w-4 h-4 text-gray-400" />}
             {step.status === 'running' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
             {step.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
             {step.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-600" />}
            </div>
            <div className="flex-1">
             <h4 className="font-medium text-gray-900 text-sm">{step.title}</h4>
             <p className="text-xs text-gray-600">{step.description}</p>
            </div>
           </div>
          </div>
         ))}
        </div>
       </div>
      )}

      {/* Attestation Result */}
      {attestationResult && (
       <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
        <div className="flex items-center gap-2 mb-2">
         <CheckCircle className="w-5 h-5 text-green-600" />
         <h3 className="font-russo text-lg text-green-900">Verification Complete</h3>
        </div>
        <div className="text-sm space-y-2 bg-green-50 p-4 rounded-lg">
         <p><span className="text-gray-600">Enclave ID:</span> <span className="font-mono text-sm">{attestationResult.enclaveId}</span></p>
         <p><span className="text-gray-600">Verified at:</span> {attestationResult.timestamp.toLocaleString()}</p>
         {attestationResult.accessKeys && (
          <div className="mt-3 pt-3 border-t border-green-200">
           <p className="text-green-800 font-medium mb-2">🔑 Access Keys Generated</p>
           <p className="text-xs text-green-700">Your secure access keys have been generated and are ready for model access.</p>
          </div>
         )}
        </div>
        
        <button
         onClick={() => setCurrentStep('run')}
         className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium"
        >
         Proceed to Run Model
         <ArrowRight className="w-5 h-5" />
        </button>
       </div>
      )}

      {error && (
       <div className="bg-white rounded-lg p-6 border border-red-200 space-y-4">
        <div className="flex items-center gap-2">
         <AlertCircle className="w-5 h-5 text-red-600" />
         <h3 className="font-russo text-lg text-red-900">Verification Failed</h3>
        </div>
        <p className="text-red-700 text-sm bg-red-50 p-4 rounded-lg">{error}</p>
        <button
         onClick={() => {
          setError('')
          setVerificationSteps([])
          setAttestationResult(null)
         }}
         className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
         Try Again
        </button>
       </div>
      )}

      {currentStep === 'run' && (
       <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
        <div className="flex items-center justify-between mb-4">
         <h3 className="font-russo text-xl text-black">Execute Model</h3>
         <div className="flex items-center gap-2 text-sm text-green-600">
          <Cpu className="w-4 h-4" />
          TEE Environment Ready
         </div>
        </div>

        {!isRunning && currentStep === 'run' && (
         <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
           <Play className="w-8 h-8 text-gray-600" />
          </div>
          <h4 className="font-medium text-gray-900 mb-2">Ready to Execute</h4>
          <p className="text-gray-600 mb-6">
           The model has been verified and is ready for secure execution
          </p>
          <button
           onClick={runModel}
           className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium"
          >
           <Play className="w-5 h-5" />
           Execute Model
          </button>
         </div>
        )}

        {isRunning && (
         <div className="text-center py-8">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h4 className="font-medium text-gray-900 mb-2">Executing Model</h4>
          <p className="text-gray-600">
           Model is running in the secure enclave environment...
          </p>
         </div>
        )}
       </div>
      )}

      {currentStep === 'success' && (
       <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-6">
        <div className="text-center py-4">
         <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
         <h3 className="font-russo text-xl text-green-900 mb-2">
          Execution Complete
         </h3>
         <p className="text-gray-600">
          Your model has been successfully verified and executed
         </p>
        </div>

        {/* Results and Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
           <FileText className="w-5 h-5 text-gray-600" />
           <h4 className="font-medium text-gray-900">Execution Report</h4>
          </div>
          <p className="text-sm text-gray-600">
           Download detailed execution logs and performance metrics
          </p>
         </div>
         
         <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
           <Key className="w-5 h-5 text-gray-600" />
           <h4 className="font-medium text-gray-900">Access Keys</h4>
          </div>
          <p className="text-sm text-gray-600">
           Your secure access keys for continued model usage
          </p>
         </div>
        </div>

        <button
         onClick={() => {
          // Download functionality
         }}
         className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium"
        >
         <Download className="w-5 h-5" />
         Download Results
        </button>
       </div>
      )}

      {currentStep === 'error' && (
       <div className="bg-white rounded-lg p-6 border border-red-200 space-y-6">
        <div className="text-center py-4">
         <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
         <h3 className="font-russo text-xl text-red-900 mb-2">
          Execution Failed
         </h3>
         <p className="text-gray-600 mb-4">
          We encountered an error during model execution
         </p>
         {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
           <p className="text-red-700 text-sm">{error}</p>
          </div>
         )}
        </div>

        <button
         onClick={() => setCurrentStep('run')}
         className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
         Try Again
        </button>
       </div>
      )}
     </div>
    </div>
   </div>
  </div>
 )
}