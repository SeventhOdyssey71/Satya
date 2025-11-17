'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { errorInterceptor } from '@/lib/utils/error-interceptor';
import { safeUploadService } from '@/lib/services/safe-upload.service';

interface DebugLog {
 timestamp: string;
 level: 'info' | 'warning' | 'error' | 'success';
 message: string;
 data?: any;
}

interface UploadFormData {
 title: string;
 description: string;
 category: string;
 tags: string;
 price: string;
 maxDownloads: string;
 modelFile: File | null;
 datasetFile: File | null;
}

const CATEGORIES = [
 'AI/ML',
 'Computer Vision',
 'NLP',
 'Healthcare',
 'Finance',
 'Other'
];

export default function DebugUploadPage() {
 const currentAccount = useCurrentAccount();
 const [formData, setFormData] = useState<UploadFormData>({
  title: '',
  description: '',
  category: 'AI/ML',
  tags: '',
  price: '1.0',
  maxDownloads: '100',
  modelFile: null,
  datasetFile: null,
 });
 
 const [isUploading, setIsUploading] = useState(false);
 const [uploadProgress, setUploadProgress] = useState(0);
 const [uploadPhase, setUploadPhase] = useState('');
 const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
 const [uploadResult, setUploadResult] = useState<any>(null);
 
 const modelFileRef = useRef<HTMLInputElement>(null);
 const datasetFileRef = useRef<HTMLInputElement>(null);

 // Bulletproof logging function
 const addLog = useCallback((level: DebugLog['level'], message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const newLog: DebugLog = { timestamp, level, message, data };
  
  setDebugLogs(prev => [...prev, newLog]);
  
  // Safe console logging
  const safeData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, safeData);
 }, []);

 // Setup error interceptor
 useEffect(() => {
  const unsubscribe = errorInterceptor.onError((error) => {
   if (!error.suppressed) {
    addLog('warning', 'Intercepted Error', error);
   }
  });

  return () => {
   unsubscribe();
  };
 }, [addLog]);

 // Safe file handling
 const handleFileSelect = useCallback((fileType: 'model' | 'dataset') => {
  return (event: React.ChangeEvent<HTMLInputElement>) => {
   try {
    const file = event.target.files?.[0];
    if (file) {
     addLog('info', `Selected ${fileType} file`, {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
     });
     
     setFormData(prev => ({
      ...prev,
      [`${fileType}File`]: file
     }));
    }
   } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addLog('error', `File selection failed for ${fileType}`, { error: errorMessage });
   }
  };
 }, [addLog]);

 // Safe form input handling
 const handleInputChange = useCallback((field: keyof UploadFormData) => {
  return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
   try {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    addLog('info', `Updated ${field}`, { value });
   } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addLog('error', `Input change failed for ${field}`, { error: errorMessage });
   }
  };
 }, [addLog]);

 // Bulletproof upload function using safe service
 const handleUpload = useCallback(async () => {
  if (!currentAccount) {
   addLog('error', 'No wallet connected');
   return;
  }

  if (!formData.modelFile) {
   addLog('error', 'No model file selected');
   return;
  }

  setIsUploading(true);
  setUploadProgress(0);
  setUploadResult(null);
  setUploadPhase('Starting...');

  try {
   // Check wallet connection safely
   const walletCheck = safeUploadService.checkWalletConnection(currentAccount);
   if (!walletCheck.connected) {
    addLog('error', 'Wallet check failed', walletCheck);
    setIsUploading(false);
    return;
   }

   addLog('success', 'Wallet connected', { address: walletCheck.address });

   // Create test signer for upload
   const signerResult = await safeUploadService.createTestSigner();
   if (!signerResult.success) {
    addLog('error', 'Failed to create signer', signerResult);
    setIsUploading(false);
    return;
   }

   addLog('info', 'Test signer created successfully');

   // Prepare upload data
   const uploadData = {
    title: formData.title?.trim() || '',
    description: formData.description?.trim() || '',
    category: formData.category || 'AI/ML',
    tags: formData.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
    modelFile: formData.modelFile!,
    datasetFile: formData.datasetFile || undefined,
    price: formData.price || '1.0',
    maxDownloads: formData.maxDownloads ? parseInt(formData.maxDownloads) : undefined,
    policyType: 'STANDARD' as const,
    accessDuration: 30
   };

   addLog('info', 'Upload data prepared', uploadData);

   // Execute safe upload
   const uploadResult = await safeUploadService.uploadModel(
    uploadData,
    signerResult.signer!,
    (progress) => {
     setUploadPhase(progress.phase);
     setUploadProgress(progress.progress);
     addLog('info', `${progress.phase}: ${progress.message}`, {
      progress: progress.progress,
      details: progress.details
     });
    }
   );

   // Handle final result
   setUploadResult(uploadResult);
   setIsUploading(false);
   setUploadProgress(100);
   setUploadPhase(uploadResult.success ? 'Completed' : 'Failed');

   if (uploadResult.success) {
    addLog('success', 'Upload completed successfully!', uploadResult.data);
   } else {
    addLog('error', `Upload failed in phase: ${uploadResult.phase}`, {
     error: uploadResult.error,
     phase: uploadResult.phase
    });
   }

  } catch (error) {
   // This should never happen with safe upload, but just in case
   const errorMessage = error instanceof Error ? error.message : String(error);
   addLog('error', 'Unexpected upload error', { error: errorMessage });
   setUploadResult({ success: false, error: errorMessage });
   setIsUploading(false);
   setUploadPhase('Error');
  }
 }, [currentAccount, formData, addLog]);

 // Clear logs
 const clearLogs = useCallback(() => {
  setDebugLogs([]);
  setUploadResult(null);
  addLog('info', 'Debug logs cleared');
 }, [addLog]);

 // Clear form
 const clearForm = useCallback(() => {
  setFormData({
   title: '',
   description: '',
   category: 'AI/ML',
   tags: '',
   price: '1.0',
   maxDownloads: '100',
   modelFile: null,
   datasetFile: null,
  });
  
  if (modelFileRef.current) modelFileRef.current.value = '';
  if (datasetFileRef.current) datasetFileRef.current.value = '';
  
  addLog('info', 'Form cleared');
 }, [addLog]);

 return (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
   <div className="max-w-7xl mx-auto space-y-6">
    {/* Header */}
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
     <h1 className="text-2xl font-bold text-white flex items-center gap-2">
      Debug Upload Center
      <span className="text-sm text-gray-400 font-normal">
       Error-Free Upload Interface
      </span>
     </h1>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     {/* Upload Form */}
     <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">Upload Form</h2>
      <div className="space-y-4">
       {/* Basic Info */}
       <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
         Model Title *
        </label>
        <input
         type="text"
         value={formData.title}
         onChange={handleInputChange('title')}
         placeholder="Enter model name"
         className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
        />
       </div>

       <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
         Description *
        </label>
        <textarea
         value={formData.description}
         onChange={handleInputChange('description')}
         placeholder="Describe your model"
         rows={3}
         className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
        />
       </div>

       <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
         Category
        </label>
        <select 
         value={formData.category} 
         onChange={handleInputChange('category')}
         className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
        >
         {CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
         ))}
        </select>
       </div>

       <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
         Tags (comma-separated)
        </label>
        <input
         type="text"
         value={formData.tags}
         onChange={handleInputChange('tags')}
         placeholder="machine learning, neural network"
         className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
        />
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-medium text-gray-300 mb-1">
          Price (SUI)
         </label>
         <input
          type="number"
          value={formData.price}
          onChange={handleInputChange('price')}
          step="0.1"
          min="0.1"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
         />
        </div>

        <div>
         <label className="block text-sm font-medium text-gray-300 mb-1">
          Max Downloads
         </label>
         <input
          type="number"
          value={formData.maxDownloads}
          onChange={handleInputChange('maxDownloads')}
          min="1"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
         />
        </div>
       </div>

       {/* File Upload */}
       <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
         Model File * 
        </label>
        <input
         ref={modelFileRef}
         type="file"
         onChange={handleFileSelect('model')}
         accept=".json,.pkl,.onnx,.h5,.pt,.pth"
         className="block w-full text-sm text-gray-300
          file:mr-4 file:py-2 file:px-4
          file:rounded file:border-0
          file:bg-blue-600 file:text-white
          hover:file:bg-blue-700"
        />
        {formData.modelFile && (
         <p className="text-xs text-green-400 mt-1">
          ✓ {formData.modelFile.name} ({(formData.modelFile.size / 1024 / 1024).toFixed(2)} MB)
         </p>
        )}
       </div>

       <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
         Dataset File (Optional)
        </label>
        <input
         ref={datasetFileRef}
         type="file"
         onChange={handleFileSelect('dataset')}
         accept=".csv,.json,.zip,.tar,.gz"
         className="block w-full text-sm text-gray-300
          file:mr-4 file:py-2 file:px-4
          file:rounded file:border-0
          file:bg-green-600 file:text-white
          hover:file:bg-green-700"
        />
        {formData.datasetFile && (
         <p className="text-xs text-green-400 mt-1">
          ✓ {formData.datasetFile.name} ({(formData.datasetFile.size / 1024 / 1024).toFixed(2)} MB)
         </p>
        )}
       </div>

       {/* Upload Controls */}
       <div className="space-y-4 pt-4">
        {isUploading && (
         <div>
          <div className="flex justify-between text-sm text-gray-300 mb-1">
           <span>{uploadPhase}</span>
           <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
           <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
           ></div>
          </div>
         </div>
        )}

        <div className="flex gap-2">
         <button 
          onClick={handleUpload}
          disabled={isUploading || !currentAccount || !formData.modelFile}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded font-medium"
         >
          {isUploading ? 'Uploading...' : 'Upload Model'}
         </button>
         
         <button 
          onClick={clearForm}
          className="border border-gray-600 text-gray-300 hover:bg-gray-700 py-2 px-4 rounded"
         >
          🗑️ Clear
         </button>
        </div>
       </div>

       {/* Wallet Status */}
       <div className="pt-2 border-t border-gray-700">
        <p className="text-sm text-gray-400">
         Wallet: {currentAccount ? (
          <span className="text-green-400">
           ✓ Connected ({currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)})
          </span>
         ) : (
          <span className="text-yellow-400">Not Connected</span>
         )}
        </p>
       </div>
      </div>
     </div>

     {/* Debug Logs */}
     <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
       <h2 className="text-xl font-bold text-white">Debug Logs</h2>
       <button 
        onClick={clearLogs}
        className="border border-gray-600 text-gray-300 hover:bg-gray-700 py-1 px-3 rounded text-sm"
       >
        Clear Logs
       </button>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
       {debugLogs.length === 0 ? (
        <p className="text-gray-500 text-sm">No logs yet...</p>
       ) : (
        debugLogs.map((log, index) => (
         <div 
          key={index}
          className={`text-xs p-2 rounded border-l-4 ${
           log.level === 'error' ? 'bg-red-900/30 border-red-500' :
           log.level === 'warning' ? 'bg-yellow-900/30 border-yellow-500' :
           log.level === 'success' ? 'bg-green-900/30 border-green-500' :
           'bg-blue-900/30 border-blue-500'
          }`}
         >
          <div className="flex justify-between items-start mb-1">
           <span className={`font-medium ${
            log.level === 'error' ? 'text-red-400' :
            log.level === 'warning' ? 'text-yellow-400' :
            log.level === 'success' ? 'text-green-400' :
            'text-blue-400'
           }`}>
            {log.level.toUpperCase()}
           </span>
           <span className="text-gray-500 text-xs">
            {new Date(log.timestamp).toLocaleTimeString()}
           </span>
          </div>
          <p className="text-white">{log.message}</p>
          {log.data && (
           <details className="mt-1">
            <summary className="text-gray-400 cursor-pointer">Data</summary>
            <pre className="mt-1 text-xs text-gray-300 overflow-x-auto">
             {JSON.stringify(log.data, null, 2)}
            </pre>
           </details>
          )}
         </div>
        ))
       )}
      </div>
     </div>
    </div>

    {/* Upload Result */}
    {uploadResult && (
     <div className={`border rounded-lg p-6 ${
      uploadResult.success 
       ? 'bg-green-900/20 border-green-500' 
       : 'bg-red-900/20 border-red-500'
     }`}>
      <h2 className={`text-xl font-bold mb-4 ${uploadResult.success ? 'text-green-400' : 'text-red-400'}`}>
       {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
      </h2>
      <pre className="text-sm text-gray-300 overflow-x-auto">
       {JSON.stringify(uploadResult, null, 2)}
      </pre>
     </div>
    )}
   </div>
  </div>
 );
}