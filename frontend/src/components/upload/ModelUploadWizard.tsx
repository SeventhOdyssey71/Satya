'use client'

import React, { useState } from 'react'
import { CheckCircle, Clock, ArrowRight, ArrowLeft, Upload, Shield, DollarSign, Tag } from 'lucide-react'
import FileUploadZone from './FileUploadZone'
import ProgressIndicator from './ProgressIndicator'

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
  
  // Security
  enableEncryption: boolean
  policyType: string
  accessDuration?: number
  
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

export default function ModelUploadWizard() {
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

  const updateData = (updates: Partial<ModelUploadData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const steps = [
    {
      title: 'Basic Information',
      description: 'Enter model details and metadata',
      component: BasicInfoStep,
      validate: (data: ModelUploadData) => 
        !!(data.title && data.description && data.category)
    },
    {
      title: 'File Upload',
      description: 'Upload your model and optional files',
      component: FileUploadStep,
      validate: (data: ModelUploadData) => !!data.modelFile
    },
    {
      title: 'Pricing & Access',
      description: 'Set pricing and access controls',
      component: PricingStep,
      validate: (data: ModelUploadData) => !!data.price
    },
    {
      title: 'Security & Privacy',
      description: 'Configure encryption and privacy settings',
      component: SecurityStep,
      validate: () => true
    },
    {
      title: 'Review & Submit',
      description: 'Review your model and submit to marketplace',
      component: ReviewStep,
      validate: () => true
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

  const CurrentStepComponent = steps[currentStep].component

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Model</h1>
        <p className="text-gray-600">Share your AI model with the Satya marketplace</p>
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator
        steps={steps.map(step => ({ title: step.title, description: step.description }))}
        currentStep={currentStep}
        completedSteps={steps.slice(0, currentStep).map((_, index) => 
          steps[index].validate(data) ? index : -1
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
          isValid={steps[currentStep].validate(data)}
        />
      </div>
    </div>
  )
}

function BasicInfoStep({ data, onChange, onNext, onPrev, isFirst, isValid }: StepProps) {
  const [newTag, setNewTag] = useState('')

  const addTag = () => {
    if (newTag.trim() && !data.tags.includes(newTag.trim())) {
      onChange({ tags: [...data.tags, newTag.trim()] })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange({ tags: data.tags.filter(tag => tag !== tagToRemove) })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Tag className="h-5 w-5 mr-2 text-blue-600" />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Tags
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {data.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {data.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
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
        nextLabel="Continue to File Upload"
      />
    </div>
  )
}

function FileUploadStep({ data, onChange, onNext, onPrev, isFirst, isValid }: StepProps) {
  const handleModelFileSelect = (files: File[]) => {
    if (files.length > 0) {
      onChange({ modelFile: files[0] })
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
          <Upload className="h-5 w-5 mr-2 text-blue-600" />
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
              onFileRemove={() => onChange({ modelFile: undefined })}
            />
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
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
      />
    </div>
  )
}

function PricingStep({ data, onChange, onNext, onPrev, isFirst, isValid }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      />
    </div>
  )
}

function SecurityStep({ data, onChange, onNext, onPrev, isFirst, isValid }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          Security & Privacy
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data.enableEncryption}
                onChange={(e) => onChange({ enableEncryption: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      className="mt-1 border-gray-300 text-blue-600 focus:ring-blue-500"
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
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
      />
    </div>
  )
}

function ReviewStep({ data, onChange, onNext, onPrev, isFirst }: StepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // TODO: Implement actual upload logic
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    alert('Model uploaded successfully!')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Model</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Title</p>
              <p className="text-sm text-gray-900">{data.title}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Category</p>
              <p className="text-sm text-gray-900">{data.category}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Price</p>
              <p className="text-sm text-gray-900">{data.price} SUI</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Encryption</p>
              <p className="text-sm text-gray-900">{data.enableEncryption ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="text-sm text-gray-900">{data.description}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Files</p>
            <div className="text-sm text-gray-900 space-y-1">
              {data.modelFile && <p>• Model: {data.modelFile.name}</p>}
              {data.thumbnailFile && <p>• Thumbnail: {data.thumbnailFile.name}</p>}
              {data.sampleFile && <p>• Sample: {data.sampleFile.name}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="flex items-center px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Uploading...
            </>
          ) : (
            <>
              Upload Model
              <ArrowRight className="h-4 w-4 ml-2" />
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
  nextLabel = "Continue" 
}: {
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isValid: boolean
  nextLabel?: string
}) {
  return (
    <div className="flex justify-between">
      <button
        onClick={onPrev}
        disabled={isFirst}
        className="flex items-center px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>
      <button
        onClick={onNext}
        disabled={!isValid}
        className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {nextLabel}
        <ArrowRight className="h-4 w-4 ml-2" />
      </button>
    </div>
  )
}