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
import { useUpload, useUploadValidation } from '@/hooks'
import { PolicyType } from '@/lib/integrations/seal/types'

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
  datasetFile?: File
  thumbnailFile?: File
  sampleFile?: File
  modelBlobId?: string
  datasetBlobId?: string
  
  // Security
  policyType: string
  accessDuration?: number
  
  // TEE Verification (handled in Dashboard)
  teeAttestation?: any
  blockchainTxDigest?: string
  verificationStatus: 'pending' | 'verified' | 'failed'
  
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
    policyType: 'payment-gated',
    accessDuration: 30,
    isPrivate: false,
    verificationStatus: 'pending' // Default to pending - verification happens in Dashboard
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
      const uploadResult = await upload.uploadModel({...data, enableEncryption: true}, walletObject)
      
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
                        policyType: 'payment-gated',
              accessDuration: 30,
              isPrivate: false,
              verificationStatus: 'pending'
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
      <div className="mb-12">
        <h1 className="text-5xl font-russo text-secondary-900 mb-3">Upload Model</h1>
        <p className="text-xl font-albert text-secondary-600">Share your AI model with the Satya marketplace</p>
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
          onCancel={onCancel}
          onTbUpload={handleUpload}
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
    <div className="space-y-8">
      <div className="form-section">
        <h3 className="text-xl font-albert font-semibold text-secondary-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
            <TbTag className="h-5 w-5 text-primary-600" />
          </div>
          Model Information
        </h3>
        
        <div className="space-y-6">
          <div className="form-group">
            <label className="form-label">
              Model Title *
            </label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="input"
              placeholder="Enter a descriptive title for your model"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Description *
            </label>
            <textarea
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={4}
              className="input min-h-[120px] resize-none"
              placeholder="Describe what your model does, its accuracy, use cases, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">
                Category *
              </label>
              <select
                value={data.category}
                onChange={(e) => onChange({ category: e.target.value })}
                className="input"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Add Tags
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={newTbTag}
                  onChange={(e) => setNewTbTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTbTag())}
                  className="flex-1 input rounded-r-none border-r-0"
                  placeholder="Add a tag"
                />
                <button
                  onClick={addTbTag}
                  className="btn btn-primary px-6 rounded-l-none"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {data.tags.length > 0 && (
            <div className="form-group">
              <label className="form-label">Tags</label>
              <div className="flex flex-wrap gap-3">
                {data.tags.map(tag => (
                  <span
                    key={tag}
                    className="badge bg-primary-100 text-primary-800 flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => removeTbTag(tag)}
                      className="text-primary-600 hover:text-primary-800 font-bold"
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
      
      // Upload to Walrus with Seal encryption
      setIsUploading(true)
      setUploadProgress(0)
      
      try {
        const uploadService = await import('@/lib/services').then(m => m.getUploadService())
        
        const uploadResult = await uploadService.uploadFile(
          {
            file,
            encrypt: true,
            policyType: PolicyType.PAYMENT_GATED,
            policyParams: {},
            storageOptions: {
              epochs: 5
            }
          },
          (progress) => {
            setUploadProgress(progress.progress)
          }
        )
        
        if (uploadResult.success) {
          onChange({ 
            modelFile: file,
            modelBlobId: uploadResult.blobId
          })
        } else {
          throw new Error(uploadResult.error || 'Upload failed')
        }
        
        setIsUploading(false)
      } catch (error) {
        console.error('Model file upload failed:', error)
        setIsUploading(false)
        alert(`Model file upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleDatasetFileSelect = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      onChange({ datasetFile: file })
      
      // Upload to Walrus WITHOUT encryption (dataset is not encrypted)
      setIsUploading(true)
      setUploadProgress(0)
      
      try {
        const uploadService = await import('@/lib/services').then(m => m.getUploadService())
        
        const uploadResult = await uploadService.uploadFile(
          {
            file,
            encrypt: false, // Dataset is NOT encrypted
            storageOptions: {
              epochs: 5
            }
          },
          (progress) => {
            setUploadProgress(progress.progress)
          }
        )
        
        if (uploadResult.success) {
          onChange({ 
            datasetFile: file,
            datasetBlobId: uploadResult.blobId
          })
        } else {
          throw new Error(uploadResult.error || 'Upload failed')
        }
        
        setIsUploading(false)
      } catch (error) {
        console.error('Dataset file upload failed:', error)
        setIsUploading(false)
        alert(`Dataset file upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }


  return (
    <div className="space-y-8">
      <div className="form-section">
        <h3 className="text-xl font-albert font-semibold text-secondary-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
            <TbUpload className="h-5 w-5 text-primary-600" />
          </div>
          Upload Files
        </h3>
        
        <div className="space-y-8">
          {/* Model File */}
          <div className="form-group">
            <label className="form-label">
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
              <div className="mt-4 bg-primary-50 border border-primary-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"></div>
                  <span className="font-albert font-medium text-primary-900">Uploading to Walrus storage...</span>
                </div>
                <div className="w-full bg-primary-200 rounded-full h-3">
                  <div 
                    className="bg-primary-600 h-3 rounded-full transition-all duration-200" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {data.modelBlobId && !isUploading && (
              <div className="mt-4 bg-success-50 border border-success-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="font-albert font-medium text-success-900">File uploaded successfully!</span>
                </div>
                <code className="text-xs bg-success-200 px-2 py-1 rounded text-success-700 font-mono mt-2 inline-block">
                  Blob ID: {data.modelBlobId.substring(0, 20)}...
                </code>
              </div>
            )}
            <p className="form-help mt-3">
              Supported formats: .pkl, .pt, .pth, .h5, .onnx, .pb, .zip, .tar
            </p>
          </div>

          {/* Dataset File */}
          <div className="form-group">
            <label className="form-label">
              Dataset File * (Required)
            </label>
            <FileUploadZone
              accept={{
                'application/octet-stream': ['.csv', '.json', '.parquet', '.pkl'],
                'text/csv': ['.csv'],
                'application/json': ['.json'],
                'application/zip': ['.zip'],
                'application/x-tar': ['.tar', '.tar.gz']
              }}
              maxSize={1024 * 1024 * 1024} // 1GB
              onFileSelect={handleDatasetFileSelect}
              placeholder="Drop your dataset file here or click to browse"
              files={data.datasetFile ? [data.datasetFile] : []}
              onFileRemove={() => onChange({ datasetFile: undefined, datasetBlobId: undefined })}
              disabled={isUploading}
            />
            
            {data.datasetBlobId && !isUploading && (
              <div className="mt-4 bg-success-50 border border-success-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="font-albert font-medium text-success-900">Dataset uploaded successfully!</span>
                </div>
                <code className="text-xs bg-success-200 px-2 py-1 rounded text-success-700 font-mono mt-2 inline-block">
                  Blob ID: {data.datasetBlobId.substring(0, 20)}...
                </code>
              </div>
            )}
            <p className="form-help mt-3">
              Supported formats: .csv, .json, .parquet, .pkl, .zip, .tar
            </p>
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
    <div className="space-y-8">
      <div className="form-section">
        <h3 className="text-xl font-albert font-semibold text-secondary-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center mr-3">
            <HiCurrencyDollar className="h-5 w-5 text-accent-600" />
          </div>
          Pricing & Access
        </h3>
        
        <div className="space-y-6">
          <div className="form-group">
            <label className="form-label">
              Price (SUI) *
            </label>
            <input
              type="number"
              value={data.price}
              onChange={(e) => onChange({ price: e.target.value })}
              min="0"
              step="0.001"
              className="input"
              placeholder="0.001"
            />
            <p className="form-help mt-2">
              Minimum price: 0.001 SUI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">
                Maximum Downloads (Optional)
              </label>
              <input
                type="number"
                value={data.maxDownloads || ''}
                onChange={(e) => onChange({ maxDownloads: e.target.value ? parseInt(e.target.value) : undefined })}
                min="1"
                className="input"
                placeholder="Unlimited"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Access Duration (Days)
              </label>
              <input
                type="number"
                value={data.accessDuration || 30}
                onChange={(e) => onChange({ accessDuration: parseInt(e.target.value) })}
                min="1"
                max="365"
                className="input"
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
    <div className="space-y-8">
      <div className="form-section">
        <h3 className="text-xl font-albert font-semibold text-secondary-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
            <TbShield className="h-5 w-5 text-primary-600" />
          </div>
          Security & Privacy
        </h3>
        
        <div className="space-y-8">
          <div className="form-group">
            <div className="flex items-center space-x-3 p-4 bg-primary-50 rounded-xl border border-primary-200">
              <div className="w-5 h-5 rounded bg-primary-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="form-label mb-0">
                  SEAL Encryption Enabled
                </span>
                <p className="form-help mt-1">
                  Your model will be encrypted with policy-based access control for maximum security
                </p>
              </div>
            </div>
          </div>

          <div className="form-group">
              <label className="form-label">
                Access Policy
              </label>
              <div className="space-y-4">
                {POLICY_TYPES.map(policy => (
                  <label key={policy.value} className="flex items-start space-x-4 p-4 border border-border rounded-xl hover:bg-surface-100 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="policyType"
                      value={policy.value}
                      checked={data.policyType === policy.value}
                      onChange={(e) => onChange({ policyType: e.target.value })}
                      className="mt-1 w-5 h-5 border-border text-primary-600 focus:ring-primary-500/20"
                    />
                    <div>
                      <div className="font-albert font-medium text-secondary-900">{policy.label}</div>
                      <div className="form-help">{policy.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

          <div className="form-group border-t border-border pt-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={data.isPrivate}
                onChange={(e) => onChange({ isPrivate: e.target.checked })}
                className="w-5 h-5 rounded border-border text-primary-600 focus:ring-primary-500/20"
              />
              <span className="form-label mb-0">
                Private Listing
              </span>
            </label>
            <p className="form-help mt-2 ml-8">
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
    <div className="space-y-8">
      <div className="form-section">
        <h3 className="text-2xl font-russo text-secondary-900 mb-6">Review Your Model</h3>
        
        {/* Validation Summary */}
        {validation && (validation.hasErrors || validation.hasWarnings) && (
          <div className={`mb-6 p-6 rounded-xl border ${
            validation.hasErrors 
              ? 'bg-danger-50 border-danger-200' 
              : 'bg-warning-50 border-warning-200'
          }`}>
            <div className="flex items-start">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3 ${
                validation.hasErrors ? 'bg-danger-500' : 'bg-warning-500'
              }`}>
                <IoWarning className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className={`font-albert font-semibold ${
                  validation.hasErrors ? 'text-danger-800' : 'text-warning-800'
                }`}>
                  {validation.hasErrors ? 'Fix Required Issues' : 'Review Warnings'}
                </p>
                <div className={`font-albert mt-2 ${
                  validation.hasErrors ? 'text-danger-700' : 'text-warning-700'
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
          <div className="mb-6 p-6 bg-danger-50 rounded-xl border border-danger-200">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-danger-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                <IoWarning className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-albert font-semibold text-danger-800">Wallet Not Connected</p>
                <p className="font-albert text-danger-700 mt-1">Connect your wallet in the header to upload the model</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="form-label">Title</p>
              <p className="font-albert text-secondary-800">{data.title || 'Not specified'}</p>
            </div>
            <div>
              <p className="form-label">Category</p>
              <p className="font-albert text-secondary-800">{data.category || 'Not specified'}</p>
            </div>
            <div>
              <p className="form-label">Price</p>
              <p className="font-albert text-secondary-800">{data.price ? `${data.price} SUI` : 'Not specified'}</p>
            </div>
            <div>
              <p className="form-label">Encryption</p>
              <p className="font-albert text-secondary-800 text-green-600">✓ SEAL Encryption Enabled</p>
            </div>
          </div>
          
          <div>
            <p className="form-label">Description</p>
            <p className="font-albert text-secondary-800 leading-relaxed">{data.description || 'Not specified'}</p>
          </div>

          {data.tags.length > 0 && (
            <div>
              <p className="form-label">Tags</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {data.tags.map(tag => (
                  <span key={tag} className="badge bg-primary-100 text-primary-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Upload Information & File Sizes */}
          <div className="bg-surface-100 border border-border rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">💾</span>
              </div>
              <h4 className="font-albert font-semibold text-secondary-900">Upload Information & File Sizes</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="form-help mb-2">Model Size:</div>
                <div className="font-albert font-semibold text-secondary-900">
                  {data.modelFile ? `${(data.modelFile.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="form-help mb-2">Dataset Size:</div>
                <div className="font-albert font-semibold text-secondary-900">
                  {data.datasetFile ? `${(data.datasetFile.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="form-help mb-2">Total Size:</div>
                <div className="font-albert font-semibold text-secondary-900">
                  {(data.modelFile && data.datasetFile) ? 
                    `${((data.modelFile.size + data.datasetFile.size) / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="form-help mb-2">Created:</div>
                <div className="font-albert font-semibold text-secondary-900">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <span className="badge bg-primary-100 text-primary-800">🤖 AI</span>
              <span className="badge bg-success-100 text-success-800">🔒 SEAL Encrypted</span>
              <span className="badge bg-accent-100 text-accent-800">⛓️ Blockchain</span>
              <span className="badge bg-warning-100 text-warning-800">🌍 Decentralized</span>
            </div>
          </div>

          {/* Blob Info */}
          {(data.modelBlobId || data.datasetBlobId) && (
            <div>
              <p className="form-label">Blob Info</p>
              <div className="font-albert text-secondary-800 space-y-2 mt-3">
                {data.modelBlobId && (
                  <p>• Model Blob ID (Encrypted): <code className="bg-white border border-secondary-300 px-2 py-1 rounded text-secondary-700 font-mono text-xs">{data.modelBlobId}</code></p>
                )}
                {data.datasetBlobId && (
                  <p>• Dataset Blob ID (Unencrypted): <code className="bg-white border border-secondary-300 px-2 py-1 rounded text-secondary-700 font-mono text-xs">{data.datasetBlobId}</code></p>
                )}
              </div>
            </div>
          )}

          {/* Verification Status */}
          <div>
            <p className="form-label">Verification Status</p>
            <div className="mt-3">
              <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-warning-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">⏳</span>
                  </div>
                  <span className="font-albert font-semibold text-warning-900">Pending Verification</span>
                </div>
                <p className="font-albert text-warning-700 mt-2">
                  Model will be pending until you verify it in your Dashboard using TEE attestation.
                </p>
              </div>
            </div>
          </div>

          {(data.maxDownloads || data.accessDuration || data.expiryDays) && (
            <div>
              <p className="form-label">Access Settings</p>
              <div className="font-albert text-secondary-800 space-y-2 mt-3">
                {data.maxDownloads && <p>• Max downloads: {data.maxDownloads}</p>}
                {data.accessDuration && <p>• Access duration: {data.accessDuration} days</p>}
                {data.expiryDays && <p>• Expires in: {data.expiryDays} days</p>}
                {data.isPrivate && <p>• Private listing</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <button
          onClick={onPrev}
          className="btn btn-secondary"
        >
          <RiArrowLeftLine className="h-5 w-5 mr-2" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (validation?.hasErrors) || !isWalletConnected}
          className={`btn btn-lg ${
            isSubmitting || validation?.hasErrors || !isWalletConnected
              ? 'opacity-50 cursor-not-allowed bg-secondary-400'
              : 'btn-primary'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
              <span className="font-albert font-medium">Uploading...</span>
            </>
          ) : !isWalletConnected ? (
            <>
              <IoWarning className="h-5 w-5 mr-3" />
              <span className="font-albert font-medium">Connect Wallet First</span>
            </>
          ) : validation?.hasErrors ? (
            <>
              <IoWarning className="h-5 w-5 mr-3" />
              <span className="font-albert font-medium">Fix Errors First</span>
            </>
          ) : (
            <>
              <span className="font-albert font-medium">🚀 Upload Model</span>
              <RiArrowRightLine className="h-5 w-5 ml-3" />
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
    <div className="flex justify-between pt-8">
      <div className="flex space-x-3">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RiArrowLeftLine className="h-5 w-5 mr-2" />
          Back
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="btn btn-ghost text-danger-600 hover:bg-danger-50 border-danger-300"
          >
            Cancel
          </button>
        )}
      </div>
      <button
        onClick={onNext}
        disabled={!isValid}
        className="btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="font-albert font-medium">{nextLabel}</span>
        <RiArrowRightLine className="h-5 w-5 ml-2" />
      </button>
    </div>
  )
}