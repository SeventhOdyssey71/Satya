'use client'

import React, { useState, useEffect } from 'react'
import { HiCurrencyDollar, HiCalculator, HiInformationCircle } from 'react-icons/hi2'
import { IoWarning, IoCheckmarkCircle } from 'react-icons/io5'

interface PricingData {
 // Attestation Pricing (Calculated + Fixed)
 attestationFixedFee: number // Fixed component
 attestationVariableFee: number // Calculated based on size
 totalAttestationPrice: number
 
 // Model Pricing
 modelPrice: number
 
 // Security Fee (non-negotiable)
 securityFee: number
 
 // Total
 totalPrice: number
}

interface PricingStepProps {
 modelFile?: File
 datasetFile?: File
 modelPrice: string
 attestationPrice: string
 onPricingChange: (pricing: { modelPrice: string; attestationPrice: string; totalPrice: number }) => void
}

export default function PricingStep({ 
 modelFile, 
 datasetFile, 
 modelPrice, 
 attestationPrice,
 onPricingChange 
}: PricingStepProps) {
 const [pricing, setPricing] = useState<PricingData>({
  attestationFixedFee: 0.1, // Fixed 0.1 SUI
  attestationVariableFee: 0,
  totalAttestationPrice: 0.1,
  modelPrice: 0,
  securityFee: 0.05, // Fixed 0.05 SUI
  totalPrice: 0.15
 })

 // Calculate file sizes and pricing
 useEffect(() => {
  const calculatePricing = () => {
   const modelSize = modelFile ? modelFile.size : 0
   const datasetSize = datasetFile ? datasetFile.size : 0
   const totalSize = modelSize + datasetSize
   
   // Attestation variable fee calculation: 0.01 SUI per GB
   const totalSizeGB = totalSize / (1024 * 1024 * 1024)
   const variableFee = Math.max(0.01, Math.ceil(totalSizeGB * 100) / 100 * 0.01)
   
   const newPricing: PricingData = {
    attestationFixedFee: 0.1,
    attestationVariableFee: variableFee,
    totalAttestationPrice: 0.1 + variableFee,
    modelPrice: parseFloat(modelPrice) || 0,
    securityFee: 0.05,
    totalPrice: (0.1 + variableFee) + (parseFloat(modelPrice) || 0) + 0.05
   }
   
   setPricing(newPricing)
   
   // Notify parent component
   onPricingChange({
    modelPrice,
    attestationPrice: newPricing.totalAttestationPrice.toString(),
    totalPrice: newPricing.totalPrice
   })
  }

  calculatePricing()
 }, [modelFile, datasetFile, modelPrice, onPricingChange])

 const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
 }

 const totalFileSize = (modelFile?.size || 0) + (datasetFile?.size || 0)

 return (
  <div className="space-y-6">
   {/* Header */}
   <div>
    <h2 className="text-2xl font-russo text-black mb-2">Set Pricing</h2>
    <p className="text-gray-600">Configure pricing for attestation verification and model access</p>
   </div>

   {/* File Size Information */}
   <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
     <HiInformationCircle className="w-5 h-5 text-blue-600" />
     Upload Information
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
     <div>
      <span className="text-gray-500">Model File:</span>
      <p className="font-medium">{modelFile ? formatFileSize(modelFile.size) : 'Not selected'}</p>
     </div>
     <div>
      <span className="text-gray-500">Dataset:</span>
      <p className="font-medium">{datasetFile ? formatFileSize(datasetFile.size) : 'Not selected'}</p>
     </div>
     <div>
      <span className="text-gray-500">Total Size:</span>
      <p className="font-medium">{formatFileSize(totalFileSize)}</p>
     </div>
    </div>
   </div>

   {/* Attestation Pricing */}
   <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
     <HiCalculator className="w-5 h-5 text-purple-600" />
     Attestation Pricing (Calculated + Fixed)
    </h3>
    
    <div className="space-y-4">
     <div className="flex justify-between items-center">
      <span className="text-gray-700">Fixed Base Fee</span>
      <span className="font-medium">{pricing.attestationFixedFee} SUI</span>
     </div>
     
     <div className="flex justify-between items-center">
      <div className="flex flex-col">
       <span className="text-gray-700">Variable Fee (Size-based)</span>
       <span className="text-sm text-gray-500">
        {(totalFileSize / (1024 * 1024 * 1024)).toFixed(2)} GB × 0.01 SUI/GB
       </span>
      </div>
      <span className="font-medium">{pricing.attestationVariableFee.toFixed(3)} SUI</span>
     </div>
     
     <div className="border-t pt-3 flex justify-between items-center">
      <span className="font-medium text-gray-900">Total Attestation Price</span>
      <span className="font-bold text-lg text-purple-600">
       {pricing.totalAttestationPrice.toFixed(3)} SUI
      </span>
     </div>
    </div>

    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
     <p className="text-sm text-blue-800">
      <strong>Attestation Verification:</strong> This fee covers TEE computation and verification 
      services. Users will pay this price to verify your model's integrity before purchase.
     </p>
    </div>
   </div>

   {/* Model Pricing */}
   <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
     <HiCurrencyDollar className="w-5 h-5 text-green-600" />
     Model Pricing
    </h3>
    
    <div className="space-y-4">
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
       Model Access Price
      </label>
      <div className="relative">
       <input
        type="number"
        step="0.01"
        min="0"
        value={modelPrice}
        onChange={(e) => onPricingChange({
         modelPrice: e.target.value,
         attestationPrice: pricing.totalAttestationPrice.toString(),
         totalPrice: pricing.totalAttestationPrice + parseFloat(e.target.value || '0') + pricing.securityFee
        })}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter price in SUI"
       />
       <span className="absolute right-3 top-3 text-gray-500">SUI</span>
      </div>
      <p className="text-sm text-gray-500 mt-1">
       This is what users will pay to access and download your model after verification
      </p>
     </div>
    </div>
   </div>

   {/* Security + Pricing (Non-negotiable) */}
   <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
     <IoWarning className="w-5 h-5 text-yellow-600" />
     Security + Platform Fee (Non-negotiable)
    </h3>
    
    <div className="flex justify-between items-center">
     <div className="flex flex-col">
      <span className="text-gray-700">Security & Platform Fee</span>
      <span className="text-sm text-gray-500">
       SEAL encryption, Walrus storage, platform maintenance
      </span>
     </div>
     <span className="font-medium">{pricing.securityFee} SUI</span>
    </div>

    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
     <p className="text-sm text-yellow-800">
      <strong>Required Fee:</strong> This covers SEAL encryption, Walrus distributed storage, 
      and platform infrastructure. This fee is automatically applied to all uploads.
     </p>
    </div>
   </div>

   {/* Total Summary */}
   <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Summary</h3>
    
    <div className="space-y-3">
     <div className="flex justify-between items-center">
      <span className="text-gray-700">Attestation Verification</span>
      <span className="font-medium">{pricing.totalAttestationPrice.toFixed(3)} SUI</span>
     </div>
     
     <div className="flex justify-between items-center">
      <span className="text-gray-700">Model Access</span>
      <span className="font-medium">{pricing.modelPrice.toFixed(3)} SUI</span>
     </div>
     
     <div className="flex justify-between items-center">
      <span className="text-gray-700">Security & Platform</span>
      <span className="font-medium">{pricing.securityFee} SUI</span>
     </div>
     
     <div className="border-t pt-3 flex justify-between items-center">
      <span className="text-lg font-bold text-gray-900">Total Revenue per Sale</span>
      <span className="text-2xl font-bold text-blue-600">
       {pricing.totalPrice.toFixed(3)} SUI
      </span>
     </div>
    </div>

    <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
     <div className="flex items-center gap-2 mb-2">
      <IoCheckmarkCircle className="w-4 h-4 text-green-600" />
      <span className="text-sm font-medium text-gray-900">Revenue Breakdown</span>
     </div>
     <p className="text-sm text-gray-600">
      You'll receive {(pricing.modelPrice + pricing.totalAttestationPrice).toFixed(3)} SUI per complete sale 
      (verification + model purchase). The {pricing.securityFee} SUI security fee supports platform infrastructure.
     </p>
    </div>
   </div>

   {/* AWS Integration Note */}
   <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
    <h4 className="font-medium text-purple-900 mb-2">TEE Integration</h4>
    <p className="text-sm text-purple-800">
     Your model will be uploaded to AWS EC2 instances with Nitro Enclaves for secure 
     attestation generation. This ensures buyers can verify model integrity before purchase.
    </p>
   </div>
  </div>
 )
}