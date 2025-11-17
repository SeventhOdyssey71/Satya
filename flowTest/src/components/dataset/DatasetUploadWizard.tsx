'use client'

import React, { useState } from 'react';
import { Upload, Shield, CheckCircle, AlertCircle, Clock, Database, Lock } from 'lucide-react';
import { useNautilusVerification } from '@/lib/integrations/nautilus/hooks';
import { DatasetUploadData, DatasetVerificationResult } from '@/lib/integrations/nautilus/client';

interface DatasetUploadWizardProps {
 onUploadComplete?: (result: DatasetVerificationResult) => void;
 onCancel?: () => void;
}

const DatasetUploadWizard: React.FC<DatasetUploadWizardProps> = ({
 onUploadComplete,
 onCancel
}) => {
 const [currentStep, setCurrentStep] = useState(0);
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [metadata, setMetadata] = useState<DatasetUploadData>({
  name: '',
  description: '',
  category: '',
  format: '',
  size: 0,
  checksum: '',
  metadata: {},
  tags: []
 });
 const [newTag, setNewTag] = useState('');
 const [verificationResult, setVerificationResult] = useState<DatasetVerificationResult | null>(null);

 const { verifyDataset, isVerifying, verificationProgress } = useNautilusVerification();

 const steps = [
  { title: 'Select Dataset', description: 'Choose your dataset file', icon: Upload },
  { title: 'Add Metadata', description: 'Provide dataset information', icon: Database },
  { title: 'TEE Verification', description: 'Verify with Nautilus', icon: Shield },
  { title: 'Completion', description: 'Review verification results', icon: CheckCircle }
 ];

 const categories = [
  'Machine Learning',
  'Medical Research',
  'Financial Data',
  'Scientific Research',
  'Image Recognition',
  'Natural Language',
  'Time Series',
  'Geospatial Data',
  'Other'
 ];

 const formats = [
  'CSV',
  'JSON',
  'Parquet',
  'HDF5',
  'NPY',
  'TXT',
  'XML',
  'SQL',
  'Other'
 ];

 const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
   setSelectedFile(file);
   setMetadata(prev => ({
    ...prev,
    size: file.size,
    format: file.name.split('.').pop()?.toUpperCase() || 'Unknown'
   }));
  }
 };

 const addTag = () => {
  if (newTag.trim() && !metadata.tags.includes(newTag.trim())) {
   setMetadata(prev => ({
    ...prev,
    tags: [...prev.tags, newTag.trim()]
   }));
   setNewTag('');
  }
 };

 const removeTag = (tag: string) => {
  setMetadata(prev => ({
   ...prev,
   tags: prev.tags.filter(t => t !== tag)
  }));
 };

 const calculateChecksum = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
 };

 const handleVerification = async () => {
  if (!selectedFile) return;

  try {
   setCurrentStep(2); // Move to verification step
   
   // Calculate checksum
   const checksum = await calculateChecksum(selectedFile);
   const finalMetadata = { ...metadata, checksum };
   
   const result = await verifyDataset(selectedFile, finalMetadata);
   setVerificationResult(result);
   
   if (result.success) {
    setCurrentStep(3); // Move to completion step
    onUploadComplete?.(result);
   }
  } catch (error) {
   console.error('Verification failed:', error);
  }
 };

 const isStepValid = (step: number): boolean => {
  switch (step) {
   case 0: return selectedFile !== null;
   case 1: return metadata.name.trim() !== '' && metadata.description.trim() !== '' && metadata.category !== '';
   case 2: return verificationResult?.success || false;
   default: return false;
  }
 };

 return (
  <div className="max-w-4xl mx-auto p-6">
   {/* Header */}
   <div className="mb-8">
    <h1 className="text-3xl font-bold text-black mb-2">Dataset Upload & Verification</h1>
    <p className="text-gray-600">Upload and verify your dataset using Nautilus TEE technology</p>
   </div>

   {/* Progress Indicator */}
   <div className="mb-8">
    <div className="flex items-center justify-between">
     {steps.map((step, index) => (
      <div key={index} className="flex items-center">
       <div className={`
        flex items-center justify-center w-12 h-12 rounded-full border-2 
        ${currentStep > index ? 'bg-green-500 border-green-500 text-white' : 
         currentStep === index ? 'bg-blue-500 border-blue-500 text-white' : 
         'bg-gray-200 border-gray-300 text-gray-500'}
       `}>
        {currentStep > index ? (
         <CheckCircle className="w-6 h-6" />
        ) : (
         <step.icon className="w-6 h-6" />
        )}
       </div>
       {index < steps.length - 1 && (
        <div className={`
         w-24 h-1 mx-4
         ${currentStep > index ? 'bg-green-500' : 'bg-gray-300'}
        `} />
       )}
      </div>
     ))}
    </div>
    <div className="flex justify-between mt-4">
     {steps.map((step, index) => (
      <div key={index} className="text-center" style={{ width: '150px' }}>
       <p className="font-medium text-sm">{step.title}</p>
       <p className="text-xs text-gray-500">{step.description}</p>
      </div>
     ))}
    </div>
   </div>

   {/* Step Content */}
   <div className="bg-white rounded-lg border p-6">
    {/* Step 0: File Selection */}
    {currentStep === 0 && (
     <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Dataset File</h3>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
       <input
        type="file"
        id="dataset-file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".csv,.json,.parquet,.h5,.hdf5,.npy,.txt,.xml,.sql"
       />
       
       {selectedFile ? (
        <div className="space-y-4">
         <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
         <div>
          <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
          <p className="text-sm text-gray-500">
           Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <p className="text-sm text-gray-500">
           Type: {selectedFile.type || 'Unknown'}
          </p>
         </div>
         <button
          onClick={() => setSelectedFile(null)}
          className="text-blue-500 hover:text-blue-700 text-sm"
         >
          Choose different file
         </button>
        </div>
       ) : (
        <div className="space-y-4">
         <Upload className="mx-auto h-12 w-12 text-gray-400" />
         <div>
          <p className="text-lg font-medium text-gray-900">Upload your dataset</p>
          <p className="text-sm text-gray-500">
           Supported formats: CSV, JSON, Parquet, HDF5, NPY, TXT, XML, SQL
          </p>
         </div>
         <label
          htmlFor="dataset-file"
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
         >
          <Upload className="w-4 h-4 mr-2" />
          Choose File
         </label>
        </div>
       )}
      </div>
     </div>
    )}

    {/* Step 1: Metadata */}
    {currentStep === 1 && (
     <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Dataset Metadata</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
         Dataset Name *
        </label>
        <input
         type="text"
         value={metadata.name}
         onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
         placeholder="Enter dataset name"
        />
       </div>

       <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
         Category *
        </label>
        <select
         value={metadata.category}
         onChange={(e) => setMetadata(prev => ({ ...prev, category: e.target.value }))}
         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
         <option value="">Select category</option>
         {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
         ))}
        </select>
       </div>
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Description *
       </label>
       <textarea
        value={metadata.description}
        onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        placeholder="Describe your dataset, its contents, and potential use cases"
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Tags
       </label>
       <div className="flex gap-2 mb-2">
        <input
         type="text"
         value={newTag}
         onChange={(e) => setNewTag(e.target.value)}
         onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
         className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
         placeholder="Add a tag"
        />
        <button
         onClick={addTag}
         className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
         Add
        </button>
       </div>
       {metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
         {metadata.tags.map(tag => (
          <span
           key={tag}
           className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
          >
           {tag}
           <button
            onClick={() => removeTag(tag)}
            className="ml-2 text-gray-600 hover:text-gray-800"
           >
            ×
           </button>
          </span>
         ))}
        </div>
       )}
      </div>
     </div>
    )}

    {/* Step 2: Verification */}
    {currentStep === 2 && (
     <div className="space-y-6 text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Nautilus TEE Verification</h3>
      
      {isVerifying ? (
       <div className="space-y-6">
        <div className="flex justify-center">
         <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
        
        <div>
         <p className="text-lg font-medium text-gray-900 mb-2">
          Verifying dataset in secure enclave...
         </p>
         <p className="text-sm text-gray-600">
          This process ensures data integrity and generates cryptographic attestation
         </p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
         <div 
          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
          style={{ width: `${verificationProgress}%` }}
         />
        </div>
        <p className="text-sm text-gray-500">{verificationProgress}% complete</p>
       </div>
      ) : verificationResult ? (
       verificationResult.success ? (
        <div className="space-y-4">
         <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
         <div>
          <p className="text-lg font-medium text-green-700">
           Dataset verified successfully!
          </p>
          <p className="text-sm text-gray-600">
           Cryptographic attestation generated and stored securely
          </p>
         </div>
         
         <div className="bg-green-50 rounded-lg p-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
           <div>
            <span className="font-medium">Verification ID:</span>
            <p className="font-mono text-xs break-all">{verificationResult.verificationId}</p>
           </div>
           <div>
            <span className="font-medium">Integrity Hash:</span>
            <p className="font-mono text-xs break-all">{verificationResult.integrity_hash}</p>
           </div>
          </div>
         </div>
        </div>
       ) : (
        <div className="space-y-4">
         <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
         <div>
          <p className="text-lg font-medium text-red-700">
           Verification failed
          </p>
          <p className="text-sm text-gray-600">
           {verificationResult.error || 'Unknown error occurred'}
          </p>
         </div>
        </div>
       )
      ) : (
       <div className="space-y-6">
        <Lock className="mx-auto h-16 w-16 text-blue-500" />
        <div>
         <p className="text-lg font-medium text-gray-900 mb-2">
          Ready to verify dataset
         </p>
         <p className="text-sm text-gray-600">
          Your dataset will be processed in a secure AWS Nitro Enclave
         </p>
        </div>
        
        <button
         onClick={handleVerification}
         className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
         Start Verification
        </button>
       </div>
      )}
     </div>
    )}

    {/* Step 3: Completion */}
    {currentStep === 3 && verificationResult?.success && (
     <div className="space-y-6 text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Verification Complete</h3>
      
      <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
      
      <div>
       <p className="text-lg font-medium text-gray-900 mb-2">
        Dataset successfully verified!
       </p>
       <p className="text-sm text-gray-600">
        Your dataset has been verified in a secure environment and is ready for marketplace listing
       </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 text-left">
       <h4 className="font-semibold text-gray-900 mb-4">Verification Details</h4>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
         <span className="font-medium text-gray-700">Dataset:</span>
         <p className="text-gray-900">{metadata.name}</p>
        </div>
        <div>
         <span className="font-medium text-gray-700">Category:</span>
         <p className="text-gray-900">{metadata.category}</p>
        </div>
        <div>
         <span className="font-medium text-gray-700">Size:</span>
         <p className="text-gray-900">{(metadata.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <div>
         <span className="font-medium text-gray-700">Verification ID:</span>
         <p className="font-mono text-xs text-gray-900 break-all">{verificationResult.verificationId}</p>
        </div>
        <div className="md:col-span-2">
         <span className="font-medium text-gray-700">Attestation Status:</span>
         <p className="text-green-600">Verified with cryptographic proof</p>
        </div>
       </div>
      </div>
     </div>
    )}
   </div>

   {/* Navigation */}
   <div className="flex justify-between mt-8">
    <button
     onClick={() => {
      if (currentStep > 0) {
       setCurrentStep(currentStep - 1);
      } else {
       onCancel?.();
      }
     }}
     className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
    >
     {currentStep === 0 ? 'Cancel' : 'Back'}
    </button>

    {currentStep < 2 && (
     <button
      onClick={() => setCurrentStep(currentStep + 1)}
      disabled={!isStepValid(currentStep)}
      className={`px-6 py-2 rounded-lg transition-colors ${
       isStepValid(currentStep)
        ? 'bg-blue-500 text-white hover:bg-blue-600'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
     >
      {currentStep === 1 ? 'Start Verification' : 'Next'}
     </button>
    )}

    {currentStep === 3 && (
     <button
      onClick={onCancel}
      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
     >
      Done
     </button>
    )}
   </div>
  </div>
 );
};

export default DatasetUploadWizard;