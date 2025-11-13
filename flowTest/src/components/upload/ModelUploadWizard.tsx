'use client'

import React, { useState, useEffect } from 'react'
import { RiCheckboxCircleFill, RiTimeLine, RiArrowRightLine, RiArrowLeftLine } from 'react-icons/ri'
import { TbUpload, TbShield, TbCoin, TbTag } from 'react-icons/tb'
import { IoWarning, IoSparkles, IoRocket } from 'react-icons/io5'
import { HiCurrencyDollar } from 'react-icons/hi2'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import FileUploadZone from './FileUploadZone'
import ProgressIndicator from './ProgressIndicator'
import UploadProgress from './UploadProgress'
import UploadStatus from './UploadStatus'
import { TEEVerificationStep } from './TEEVerificationStep'
import { useUpload, useUploadValidation } from '@/hooks'

interface ModelUploadData {
  // Basic Info
  title: string
  description: string
  category: string
  tags: string[]
  
  // Pricing
  price: string
  enableSample: boolean
  maxDownloads?: number
  
  // Files
  modelFile?: File
  thumbnailFile?: File
  sampleFile?: File
  modelBlobId?: string
  datasetBlobId?: string
  
  // Security
  enableEncryption: boolean
  policyType: string
  accessDuration?: number
  
  // TEE Verification
  teeAttestation?: any
  blockchainTxDigest?: string
  verificationStatus?: 'pending' | 'verified' | 'failed'
  
  // Advanced
  isPrivate: boolean
  allowedBuyers?: string[]
  expiryDays?: number
}

interface StepProps {
  data: ModelUploadData
  onChange: (data: Partial<ModelUploadData>) => void
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
  isValid: boolean
  validation?: any
  isWalletConnected?: boolean
  onCancel?: () => void
  onTbUpload?: () => Promise<void>
}

const CATEGORIES = [
  'Machine Learning',
  'Computer Vision',
  'Natural Language Processing',
  'Audio Processing',
  'Data Science',
  'Robotics',
  'Other'
]

const POLICY_TYPES = [
  { value: 'payment-gated', label: 'Payment Gated', description: 'Access after purchase' },
  { value: 'time-locked', label: 'Time Locked', description: 'Access after specific time' },
  { value: 'allowlist', label: 'Allowlist', description: 'Access for specific addresses' }
]

interface ModelUploadWizardProps {
  onUploadComplete?: (result: any) => void
  onCancel?: () => void
}

export default function ModelUploadWizard({ onUploadComplete, onCancel }: ModelUploadWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<ModelUploadData>({
    title: '',
    description: '',
    category: '',
    tags: [],
    price: '',
    enableSample: false,
    enableEncryption: true,
    policyType: 'payment-gated',
    accessDuration: 30,
    isPrivate: false
  })

  // Hooks for business logic
  const upload = useUpload()
  const currentAccount = useCurrentAccount()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const validation = useUploadValidation(data)

  const updateData = (updates: Partial<ModelUploadData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  // Wallet state derived from Mysten dapp kit
  const isWalletConnected = !!currentAccount?.address
  const walletAddress = currentAccount?.address || ''


  // Handle complete upload flow: SEAL + Walrus + Blockchain
  const handleUpload = async () => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      // TEMPORARY: Create keypair for testing Walrus SDK integration
      // Use connected wallet for transaction signing
      if (!currentAccount?.address) {
        throw new Error('Wallet not connected')
      }
      
      // Create wallet object that can sign transactions
      const walletObject = {
        address: currentAccount.address,
        signAndExecuteTransaction,
        toSuiAddress: () => currentAccount.address
      }

      console.log('Starting complete upload flow...')

      // Step 1: TbUpload file and encrypt with SEAL, upload to Walrus
      console.log('Step 1: SEAL encryption and Walrus upload...')
      const uploadResult = await upload.uploadModel(data, walletObject)
      
      if (!uploadResult.success) {
        throw new Error(`TbUpload failed: ${uploadResult.error}`)
      }

      console.log('✅ Model uploaded successfully!')
      console.log('TbUpload result:', uploadResult)
      
      alert(`✅ Model uploaded successfully!\n\n• File encrypted with SEAL ✓\n• TbUploaded to Walrus storage ✓\n• Marketplace listing created ✓\n\nListing ID: ${uploadResult.listingId || 'completed'}`)
      setCurrentStep(steps.length) // Go to result step
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(uploadResult)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Complete upload flow failed:', error)
      alert(`❌ TbUpload failed: ${errorMessage}`)
    }
  }

  const steps = [
    {
      title: 'Basic Information',
      description: 'Enter model details and metadata',
      component: BasicInfoStep,
      validate: () => validation.isStepValid('basicInfo')
    },
    {
      title: 'File TbUpload',
      description: 'TbUpload your model and optional files',
      component: FileUploadStep,
      validate: () => validation.isStepValid('files')
    },
    {
      title: 'Pricing & Access',
      description: 'Set pricing and access controls',
      component: PricingStep,
      validate: () => validation.isStepValid('pricing')
    },
    {
      title: 'Security & Privacy',
      description: 'Configure encryption and privacy settings',
      component: SecurityStep,
      validate: () => validation.isStepValid('security')
    },
    {
      title: 'TEE Verification',
      description: 'Verify model integrity with trusted execution environment',
      component: TEEVerificationStep,
      validate: () => data.verificationStatus === 'verified'
    },
    {
      title: 'Review & Submit',
      description: 'Review your model and submit to marketplace',
      component: ReviewStep,
      validate: () => validation.isValid
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Check if we're in upload progress or result mode
  if (upload.isUploading) {
    return (
      <div className="max-w-4xl mx-auto">
        <UploadProgress
          phases={upload.phases.map(phase => ({
            ...phase,
            icon: phase.id === 'validation' ? TbUpload :
                  phase.id === 'encryption' ? TbShield :
                  phase.id === 'upload' ? TbUpload :
                  phase.id === 'listing' ? RiCheckboxCircleFill : TbUpload
          }))}
          currentPhase={upload.currentPhase || undefined}
          overallProgress={upload.uploadProgress}
          onCancel={upload.cancelUpload}
          className="mt-8"
        />
      </div>
    )
  }

  if (upload.result || currentStep >= steps.length) {
    return (
      <div className="max-w-4xl mx-auto">
        <UploadStatus
          result={upload.result || { success: false, error: 'Unknown error' }}
          onReset={() => {
            upload.reset()
            setCurrentStep(0)
            setData({
              title: '',
              description: '',
              category: '',
              tags: [],
              price: '',
              enableSample: false,
              enableEncryption: true,
              policyType: 'payment-gated',
              accessDuration: 30,
              isPrivate: false
            })
          }}
          onViewListing={(listingId) => {
            window.location.href = `/model/${listingId}`
          }}
          className="mt-8"
        />
      </div>
    )
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-russo text-black mb-2">Upload Model</h1>
        <p className="text-gray-500">Share your AI model with the Satya marketplace</p>
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator
        steps={steps.map(step => ({ title: step.title, description: step.description }))}
        currentStep={currentStep}
        completedSteps={steps.slice(0, currentStep).map((_, index) => 
          steps[index].validate() ? index : -1
        ).filter(index => index !== -1)}
      />

      {/* Step Content */}
      <div className="mt-8">
        <CurrentStepComponent
          data={data}
          onChange={updateData}
          onNext={nextStep}
          onPrev={prevStep}
          isFirst={currentStep === 0}
          isLast={currentStep === steps.length - 1}
          isValid={steps[currentStep].validate()}
          validation={validation}
          isWalletConnected={isWalletConnected}
          onTbUpload={handleUpload}
          uploadedFiles={{
            modelBlobId: data.modelBlobId,
            datasetBlobId: data.datasetBlobId
          }}
          onCancel={onCancel}
        />
      </div>
    </div>
  )
}

function BasicInfoStep({ data, onChange, onNext, onPrev, isFirst, isValid, onCancel }: StepProps) {
  const [newTbTag, setNewTbTag] = useState('')

  const addTbTag = () => {
    if (newTbTag.trim() && !data.tags.includes(newTbTag.trim())) {
      onChange({ tags: [...data.tags, newTbTag.trim()] })
      setNewTbTag('')
    }
  }

  const removeTbTag = (tagToRemove: string) => {
    onChange({ tags: data.tags.filter(tag => tag !== tagToRemove) })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <TbTag className="h-5 w-5 mr-2 text-gray-600" />
          Model Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Title *
            </label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900"
              placeholder="Enter a descriptive title for your model"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900"
              placeholder="Describe what your model does, its accuracy, use cases, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={data.category}
                onChange={(e) => onChange({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add TbTags
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={newTbTag}
                  onChange={(e) => setNewTbTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTbTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900"
                  placeholder="Add a tag"
                />
                <button
                  onClick={addTbTag}
                  className="px-4 py-2 bg-black text-white rounded-r-md hover:bg-gray-800 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {data.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TbTags</label>
              <div className="flex flex-wrap gap-2">
                {data.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                    <button
                      onClick={() => removeTbTag(tag)}
                      className="ml-2 text-gray-600 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onPrev={onPrev}
        isFirst={isFirst}
        isValid={isValid}
        nextLabel="Continue to File TbUpload"
        onCancel={onCancel}
      />
    </div>
  )
}

function FileUploadStep({ data, onChange, onNext, onPrev, isFirst, isValid, onCancel }: StepProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleModelFileSelect = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      onChange({ modelFile: file })
      
      // Immediately upload to get blob ID for TEE verification
      setIsUploading(true)
      setUploadProgress(0)
      
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 100)
        
        // Create mock blob ID for now - in real implementation this would upload to Walrus
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        clearInterval(progressInterval)
        setUploadProgress(100)
        
        // Generate a mock blob ID for TEE verification
        const mockBlobId = `blob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        onChange({ 
          modelFile: file,
          modelBlobId: mockBlobId
        })
        
        setIsUploading(false)
      } catch (error) {
        console.error('File upload failed:', error)
        setIsUploading(false)
        alert('File upload failed. Please try again.')
      }
    }
  }

  const handleThumbnailSelect = (files: File[]) => {
    if (files.length > 0) {
      onChange({ thumbnailFile: files[0] })
    }
  }

  const handleSampleSelect = (files: File[]) => {
    if (files.length > 0) {
      onChange({ sampleFile: files[0] })
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <TbUpload className="h-5 w-5 mr-2 text-gray-600" />
          Upload Files
        </h3>
        
        <div className="space-y-6">
          {/* Model File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model File * (Required)
            </label>
            <FileUploadZone
              accept={{
                'application/octet-stream': ['.pkl', '.pt', '.pth', '.h5', '.onnx', '.pb'],
                'application/zip': ['.zip'],
                'application/x-tar': ['.tar', '.tar.gz']
              }}
              maxSize={1024 * 1024 * 1024} // 1GB
              onFileSelect={handleModelFileSelect}
              placeholder="Drop your model file here or click to browse"
              files={data.modelFile ? [data.modelFile] : []}
              onFileRemove={() => onChange({ modelFile: undefined, modelBlobId: undefined })}
              disabled={isUploading}
            />
            
            {isUploading && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <span className="text-sm font-medium text-blue-900">Uploading to Walrus storage...</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-200" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {data.modelBlobId && !isUploading && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-sm font-medium text-green-900">File uploaded successfully!</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Blob ID: {data.modelBlobId.substring(0, 20)}...
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: .pkl, .pt, .pth, .h5, .onnx, .pb, .zip, .tar
            </p>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail Image (Optional)
            </label>
            <FileUploadZone
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
              maxSize={10 * 1024 * 1024} // 10MB
              onFileSelect={handleThumbnailSelect}
              placeholder="Drop thumbnail image here or click to browse"
              files={data.thumbnailFile ? [data.thumbnailFile] : []}
              onFileRemove={() => onChange({ thumbnailFile: undefined })}
            />
          </div>

          {/* Sample File */}
          <div>
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={data.enableSample}
                onChange={(e) => onChange({ enableSample: e.target.checked })}
                className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Include Sample File
              </span>
            </label>
            
            {data.enableSample && (
              <FileUploadZone
                accept={{ '*/*': [] }}
                maxSize={100 * 1024 * 1024} // 100MB
                onFileSelect={handleSampleSelect}
                placeholder="Drop sample file here or click to browse"
                files={data.sampleFile ? [data.sampleFile] : []}
                onFileRemove={() => onChange({ sampleFile: undefined })}
              />
            )}
          </div>
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onPrev={onPrev}
        isFirst={isFirst}
        isValid={isValid}
        nextLabel="Continue to Pricing"
        onCancel={onCancel}
      />
    </div>
  )
}

function PricingStep({ data, onChange, onNext, onPrev, isFirst, isValid, onCancel }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <HiCurrencyDollar className="h-5 w-5 mr-2 text-gray-600" />
          Pricing & Access
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (SUI) *
            </label>
            <input
              type="number"
              value={data.price}
              onChange={(e) => onChange({ price: e.target.value })}
              min="0"
              step="0.001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900"
              placeholder="0.001"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum price: 0.001 SUI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Downloads (Optional)
              </label>
              <input
                type="number"
                value={data.maxDownloads || ''}
                onChange={(e) => onChange({ maxDownloads: e.target.value ? parseInt(e.target.value) : undefined })}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Duration (Days)
              </label>
              <input
                type="number"
                value={data.accessDuration || 30}
                onChange={(e) => onChange({ accessDuration: parseInt(e.target.value) })}
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onPrev={onPrev}
        isFirst={isFirst}
        isValid={isValid}
        nextLabel="Continue to Security"
        onCancel={onCancel}
      />
    </div>
  )
}

function SecurityStep({ data, onChange, onNext, onPrev, isFirst, isValid, onCancel }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <TbShield className="h-5 w-5 mr-2 text-gray-600" />
          Security & Privacy
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data.enableEncryption}
                onChange={(e) => onChange({ enableEncryption: e.target.checked })}
                className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable SEAL Encryption
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Recommended: Encrypts your model with policy-based access control
            </p>
          </div>

          {data.enableEncryption && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Policy
              </label>
              <div className="space-y-2">
                {POLICY_TYPES.map(policy => (
                  <label key={policy.value} className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="policyType"
                      value={policy.value}
                      checked={data.policyType === policy.value}
                      onChange={(e) => onChange({ policyType: e.target.value })}
                      className="mt-1 border-gray-300 text-gray-600 focus:ring-gray-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{policy.label}</div>
                      <div className="text-xs text-gray-500">{policy.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data.isPrivate}
                onChange={(e) => onChange({ isPrivate: e.target.checked })}
                className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Private Listing
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Only visible to specified addresses or through direct link
            </p>
          </div>
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        onPrev={onPrev}
        isFirst={isFirst}
        isValid={isValid}
        nextLabel="Review & Submit"
        onCancel={onCancel}
      />
    </div>
  )
}

function ReviewStep({ data, onPrev, isFirst, validation, isWalletConnected, onTbUpload }: StepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!onTbUpload) return
    
    setIsSubmitting(true)
    try {
      await onTbUpload()
    } catch (error) {
      console.error('TbUpload failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Model</h3>
        
        {/* Validation Summary */}
        {validation && (validation.hasErrors || validation.hasWarnings) && (
          <div className={`mb-4 p-4 rounded-lg border ${
            validation.hasErrors 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start">
              <IoWarning className={`h-5 w-5 mr-2 flex-shrink-0 mt-0.5 ${
                validation.hasErrors ? 'text-red-500' : 'text-yellow-500'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  validation.hasErrors ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {validation.hasErrors ? 'Fix Required Issues' : 'Review Warnings'}
                </p>
                <div className={`text-sm mt-1 ${
                  validation.hasErrors ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {validation.hasErrors && <p>• {validation.overallValidation.errorCount} errors must be fixed</p>}
                  {validation.hasWarnings && <p>• {validation.overallValidation.warningCount} warnings to review</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Connection Check */}
        {!isWalletConnected && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start">
              <IoWarning className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Wallet Not Connected</p>
                <p className="text-sm text-red-700 mt-1">Connect your wallet in the header to upload the model</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Title</p>
              <p className="text-sm text-gray-900">{data.title || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Category</p>
              <p className="text-sm text-gray-900">{data.category || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Price</p>
              <p className="text-sm text-gray-900">{data.price ? `${data.price} SUI` : 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Encryption</p>
              <p className="text-sm text-gray-900">{data.enableEncryption ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="text-sm text-gray-900">{data.description || 'Not specified'}</p>
          </div>

          {data.tags.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500">TbTags</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.tags.map(tag => (
                  <span key={tag} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-500">Files</p>
            <div className="text-sm text-gray-900 space-y-1">
              {data.modelFile ? (
                <p>• Model: {data.modelFile.name} ({(data.modelFile.size / 1024 / 1024).toFixed(1)} MB)</p>
              ) : (
                <p className="text-red-600">• Model file: Not selected</p>
              )}
              {data.thumbnailFile && <p>• Thumbnail: {data.thumbnailFile.name}</p>}
              {data.sampleFile && <p>• Sample: {data.sampleFile.name}</p>}
            </div>
          </div>

          {(data.maxDownloads || data.accessDuration || data.expiryDays) && (
            <div>
              <p className="text-sm font-medium text-gray-500">Access Settings</p>
              <div className="text-sm text-gray-900 space-y-1">
                {data.maxDownloads && <p>• Max downloads: {data.maxDownloads}</p>}
                {data.accessDuration && <p>• Access duration: {data.accessDuration} days</p>}
                {data.expiryDays && <p>• Expires in: {data.expiryDays} days</p>}
                {data.isPrivate && <p>• Private listing</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="flex items-center px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RiArrowLeftLine className="h-4 w-4 mr-2" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (validation?.hasErrors) || !isWalletConnected}
          className="flex items-center px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Uploading...
            </>
          ) : !isWalletConnected ? (
            <>
              <IoWarning className="h-4 w-4 mr-2" />
              Connect Wallet First
            </>
          ) : validation?.hasErrors ? (
            <>
              <IoWarning className="h-4 w-4 mr-2" />
              Fix Errors First
            </>
          ) : (
            <>
              Upload Model
              <RiArrowRightLine className="h-4 w-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function StepNavigation({ 
  onNext, 
  onPrev, 
  isFirst, 
  isValid, 
  nextLabel = "Continue",
  onCancel 
}: {
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isValid: boolean
  nextLabel?: string
  onCancel?: () => void
}) {
  return (
    <div className="flex justify-between">
      <div className="flex space-x-3">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="flex items-center px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RiArrowLeftLine className="h-4 w-4 mr-2" />
          Back
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
      <button
        onClick={onNext}
        disabled={!isValid}
        className="flex items-center px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {nextLabel}
        <RiArrowRightLine className="h-4 w-4 ml-2" />
      </button>
    </div>
  )
}