'use client'

import { useState } from 'react'
import Header from '@/components/ui/Header'
import { FormField, FormRow, FormInput, FormSelect, FormTextarea } from '@/components/ui/FormField'
import { useAuth, useWallet, useMarketplace, useWalrus, useSeal } from '@/hooks'
import type { ModelUpload } from '@/lib/types'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <Header activeTab="upload" />
      
      {/* Main Content */}
      <main className="relative z-10 py-6">
        <div className="container max-w-7xl mx-auto px-6">
          {/* Upload Form */}
          <UploadForm />
        </div>
      </main>
    </div>
  )
}


function UploadForm() {
  const { isAuthenticated } = useAuth()
  const { wallet, isConnected } = useWallet()
  const { uploadModel, isLoading: isUploading, error: marketplaceError } = useMarketplace()
  const { uploadFile, isUploading: isWalrusUploading, uploadProgress, error: walrusError } = useWalrus()
  const { encryptData, isEncrypting, error: sealError } = useSeal()
  
  const [formData, setFormData] = useState<Partial<ModelUpload>>({
    title: '',
    description: '',
    category: '',
    price: '',
    tags: [],
    isPrivate: false,
    enableSealEncryption: false,
    metadata: {}
  })
  
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof ModelUpload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (file: File | null, type: 'model' | 'thumbnail') => {
    if (type === 'model') {
      setModelFile(file)
    } else {
      setThumbnailFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!isAuthenticated || !isConnected || !modelFile) {
      alert('Please connect your wallet and select a model file')
      return
    }

    if (!formData.title || !formData.description || !formData.category || !formData.price) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)

      let processedFile = modelFile
      let sealPolicyId: string | undefined

      // Handle SEAL encryption if enabled
      if (formData.enableSealEncryption) {
        try {
          console.log('Encrypting model with SEAL...')
          
          // Convert file to ArrayBuffer for encryption
          const fileArrayBuffer = await modelFile.arrayBuffer()
          
          // Encrypt the model data using SEAL
          const encryptionResult = await encryptData(fileArrayBuffer, 'threshold')
          sealPolicyId = encryptionResult.policyId
          
          // Create new file with encrypted data
          const encryptedBuffer = new TextEncoder().encode(encryptionResult.encryptedData)
          processedFile = new File([encryptedBuffer], `encrypted_${modelFile.name}`, {
            type: 'application/octet-stream'
          })
          
          console.log('Model encrypted successfully with SEAL policy:', sealPolicyId)
        } catch (encryptionError) {
          console.error('SEAL encryption failed:', encryptionError)
          alert('Failed to encrypt model. Please try again or disable encryption.')
          return
        }
      }

      const modelUpload: ModelUpload = {
        ...formData,
        file: processedFile,
        thumbnail: thumbnailFile || undefined,
        metadata: {
          ...formData.metadata,
          ...(sealPolicyId && { sealPolicyId }),
          originalFileName: modelFile.name,
          isEncrypted: !!formData.enableSealEncryption
        }
      } as ModelUpload

      await uploadModel(modelUpload)
      
      alert('Model uploaded successfully!')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        tags: [],
        isPrivate: false,
        enableSealEncryption: false,
        metadata: {}
      })
      setModelFile(null)
      setThumbnailFile(null)
      
    } catch (error: any) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <h1 className="text-3xl font-russo text-black mb-8">Upload to Marketplace</h1>
        <p className="text-gray-600 text-lg">Please connect your wallet to upload models</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-russo text-black mb-12">Upload to Marketplace</h1>
      
      {(marketplaceError || walrusError || sealError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {marketplaceError || walrusError || sealError}
        </div>
      )}
      
      <div className="flex gap-10">
        <div className="flex-shrink-0">
          <ImageUpload 
            file={thumbnailFile} 
            onChange={(file) => handleFileChange(file, 'thumbnail')} 
          />
        </div>
        
        <div className="flex-1 max-w-3xl space-y-8">
          <FormRow>
            <FormField label="Model Name *">
              <FormInput 
                placeholder="Enter model name here..." 
                value={formData.title || ''} 
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </FormField>
            <FormField label="Category *">
              <FormSelect 
                value={formData.category || ''} 
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="designs">Designs</option>
                <option value="machine-learning">Machine Learning</option>
                <option value="healthcare">HealthCare</option>
                <option value="education">Education</option>
                <option value="others">Others</option>
              </FormSelect>
            </FormField>
          </FormRow>
          
          <FormField label="Description *">
            <FormTextarea 
              placeholder="Explain what your model does and its use cases..." 
              value={formData.description || ''} 
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </FormField>
          
          <FormRow>
            <FormField label="Dataset File *">
              <FileUpload 
                placeholder="Choose File" 
                file={modelFile} 
                onChange={(file) => handleFileChange(file, 'model')}
                progress={uploadProgress}
              />
            </FormField>
            <FormField label="Listing Price * (SUI)">
              <FormInput 
                placeholder="Enter Price (e.g., 100)" 
                value={formData.price || ''} 
                onChange={(e) => handleInputChange('price', e.target.value)}
                type="number"
              />
            </FormField>
          </FormRow>
          
          {/* SEAL Encryption Options */}
          <div className="space-y-6">
            <h3 className="text-lg font-russo text-black">Security & Privacy Options</h3>
            
            <FormRow>
              <FormField label="Encryption">
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableSealEncryption || false}
                      onChange={(e) => handleInputChange('enableSealEncryption', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-albert text-gray-700">Enable SEAL Encryption</span>
                  </label>
                  {formData.enableSealEncryption && (
                    <div className="ml-7 text-sm text-gray-600">
                      Your model will be encrypted using threshold encryption for enhanced security
                    </div>
                  )}
                </div>
              </FormField>
              
              <FormField label="Visibility">
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate || false}
                      onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-albert text-gray-700">Private Listing</span>
                  </label>
                  {formData.isPrivate && (
                    <div className="ml-7 text-sm text-gray-600">
                      Your model will only be visible to users you share the link with
                    </div>
                  )}
                </div>
              </FormField>
            </FormRow>
          </div>
          
          <div className="flex justify-center pt-10">
            <UploadButton 
              onClick={handleSubmit} 
              isLoading={isSubmitting || isUploading || isWalrusUploading || isEncrypting}
              disabled={!modelFile || !formData.title || !formData.description || !formData.category || !formData.price}
              isEncrypting={isEncrypting}
              isUploading={isUploading || isWalrusUploading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ImageUpload({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null
    onChange(selectedFile)
  }

  return (
    <div className="w-80 h-80 bg-white rounded-lg shadow-sm border border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        id="image-upload"
        onChange={handleFileChange}
      />
      <label htmlFor="image-upload" className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
        {file ? (
          <div className="relative w-full h-full">
            <img 
              src={URL.createObjectURL(file)} 
              alt="Thumbnail preview" 
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
              <span className="text-white text-sm">Click to change</span>
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto mb-3 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-gray-700 text-lg font-albert">Upload Image File</div>
            <div className="text-gray-500 text-sm font-albert mt-1">Click to browse</div>
          </>
        )}
      </label>
    </div>
  )
}


function FileUpload({ 
  placeholder, 
  file, 
  onChange, 
  progress 
}: { 
  placeholder: string
  file: File | null
  onChange: (file: File | null) => void
  progress?: { loaded: number; total: number; percentage: number } | null
}) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null
    onChange(selectedFile)
  }

  return (
    <div className="relative">
      <input 
        type="file" 
        className="hidden" 
        id="dataset-upload"
        onChange={handleFileChange}
      />
      <label 
        htmlFor="dataset-upload"
        className="w-full h-14 bg-white rounded-lg shadow-sm border border-gray-300 px-4 flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 flex items-center">
          <span className="text-gray-600 text-base font-light font-albert">
            {file ? file.name : placeholder}
          </span>
        </div>
        {file && (
          <div className="text-gray-500 text-sm ml-2">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        )}
      </label>
      
      {progress && progress.percentage > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function UploadButton({ 
  onClick, 
  isLoading, 
  disabled,
  isEncrypting = false,
  isUploading = false 
}: { 
  onClick: () => void
  isLoading: boolean
  disabled: boolean
  isEncrypting?: boolean
  isUploading?: boolean
}) {
  const getLoadingText = () => {
    if (isEncrypting) return 'Encrypting...'
    if (isUploading) return 'Uploading...'
    return 'Processing...'
  }

  return (
    <button 
      className={`w-60 h-12 rounded-full text-white text-lg font-albert transition-colors ${
        disabled 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-black hover:bg-gray-800'
      }`}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          {getLoadingText()}
        </div>
      ) : (
        'Upload Model'
      )}
    </button>
  )
}