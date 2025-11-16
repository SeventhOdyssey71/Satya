'use client'

import React, { useState, useEffect } from 'react'
import { TbShieldX, TbShieldCheck, TbClockHour4, TbCertificate, TbRefresh } from 'react-icons/tb'
import { ModelVerificationFlow } from '@/components/tee'
import { useUploadTasks } from '@/contexts/UploadContext'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { MarketplaceContractService } from '@/lib/services/marketplace-contract.service'
import { ModelUploadService } from '@/lib/services/model-upload.service'

interface PendingModel {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  creator: string;
  modelBlobId: string;
  datasetBlobId?: string;
  encryptionPolicyId: string;
  price: string;
  maxDownloads?: number;
  status: number; // 0=pending, 1=verifying, 2=verified, 3=marketplace
  createdAt: number;
  updatedAt: number;
  verificationAttempts: number;
}

interface DashboardState {
  pendingModels: PendingModel[];
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

export default function DashboardPending() {
  const { allTasks } = useUploadTasks()
  const currentAccount = useCurrentAccount()
  
  const [state, setState] = useState<DashboardState>({
    pendingModels: [],
    isLoading: true,
    error: null,
    lastRefresh: null
  })

  const [contractService, setContractService] = useState<MarketplaceContractService | null>(null)
  const [uploadService, setUploadService] = useState<ModelUploadService | null>(null)

  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      try {
        const [contract, upload] = await Promise.all([
          MarketplaceContractService.createWithFallback(),
          ModelUploadService.createWithFallback()
        ]);
        setContractService(contract);
        setUploadService(upload);
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setState(prev => ({ ...prev, error: 'Failed to initialize services' }));
      }
    };

    initServices();
  }, []);

  // Load user's pending models
  const loadPendingModels = async () => {
    if (!contractService || !currentAccount?.address) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      console.log('Loading pending models for user:', currentAccount.address);
      
      const pendingModels = await contractService.getUserPendingModels(currentAccount.address);
      
      console.log('Loaded pending models:', pendingModels);

      // Transform contract data to component format
      const transformedModels: PendingModel[] = pendingModels.map(obj => {
        const content = obj.content as any;
        const fields = content?.fields || {};
        
        return {
          id: obj.id,
          title: fields.title || 'Untitled Model',
          description: fields.description || '',
          category: fields.category || 'Uncategorized',
          tags: fields.tags || [],
          creator: fields.creator || '',
          modelBlobId: fields.model_blob_id || '',
          datasetBlobId: fields.dataset_blob_id || undefined,
          encryptionPolicyId: fields.encryption_policy_id || '',
          price: fields.price || '0',
          maxDownloads: fields.max_downloads,
          status: parseInt(fields.status || '0'),
          createdAt: parseInt(fields.created_at || '0'),
          updatedAt: parseInt(fields.updated_at || '0'),
          verificationAttempts: parseInt(fields.verification_attempts || '0')
        };
      });

      setState(prev => ({
        ...prev,
        pendingModels: transformedModels,
        isLoading: false,
        lastRefresh: new Date()
      }));

    } catch (error) {
      console.error('Failed to load pending models:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load models',
        isLoading: false
      }));
    }
  };

  // Load models on mount and account change
  useEffect(() => {
    loadPendingModels();
  }, [contractService, currentAccount?.address]);

  // Categorize models by status
  const pendingVerification = state.pendingModels.filter(model => model.status === 0); // STATUS_PENDING
  const inVerification = state.pendingModels.filter(model => model.status === 1); // STATUS_VERIFYING  
  const verified = state.pendingModels.filter(model => model.status === 2); // STATUS_VERIFIED

  // Handle verification completion
  const handleVerificationComplete = async (modelId: string, verificationId: string, transactionDigest: string) => {
    try {
      console.log('Verification completed for model:', { modelId, verificationId, transactionDigest });
      
      // Refresh models to get updated status
      await loadPendingModels();
      
      alert(`Model verification completed!\nVerification ID: ${verificationId}\nTransaction: ${transactionDigest.slice(0, 20)}...`);
    } catch (error) {
      console.error('Failed to handle verification completion:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-russo text-secondary-900">Pending Verification</h2>
          <p className="text-secondary-600 font-albert mt-1">
            Manage your models awaiting TEE verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          {state.lastRefresh && (
            <span className="text-sm text-secondary-500">
              Last updated: {state.lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadPendingModels}
            disabled={state.isLoading}
            className="btn btn-secondary btn-sm flex items-center gap-2"
          >
            <TbRefresh className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-danger-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <div>
              <h5 className="font-albert font-semibold text-danger-800">Error Loading Models</h5>
              <p className="font-albert text-danger-700">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {state.isLoading && (
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent mx-auto mb-4" />
          <p className="text-secondary-600 font-albert">Loading your pending models...</p>
        </div>
      )}

      {/* Status Overview */}
      {!state.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-albert font-semibold text-lg text-secondary-700">Awaiting Verification</h3>
              <p className="text-4xl font-russo font-bold text-secondary-600 mt-3">{pendingVerification.length}</p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
              <TbClockHour4 className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-albert font-semibold text-lg text-secondary-700">In Verification</h3>
              <p className="text-4xl font-russo font-bold text-secondary-600 mt-3">{inVerification.length}</p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
              <TbShieldX className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-secondary-100 to-secondary-200 border-secondary-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-albert font-semibold text-lg text-secondary-800">Verified</h3>
              <p className="text-4xl font-russo font-bold text-secondary-700 mt-3">{verified.length}</p>
            </div>
            <div className="w-12 h-12 bg-white border border-secondary-300 rounded-xl flex items-center justify-center">
              <TbShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Pending Verification List */}
      {!state.isLoading && pendingVerification.length > 0 && (
        <div className="card p-8">
          <h3 className="text-2xl font-russo text-secondary-900 mb-8 flex items-center">
            <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center mr-3">
              <TbCertificate className="w-5 h-5 text-warning-600" />
            </div>
            Models Awaiting TEE Verification
            <span className="ml-3 badge bg-warning-100 text-warning-800">{pendingVerification.length}</span>
          </h3>
          
          <div className="space-y-8">
            {pendingVerification.map((model) => (
              <div key={model.id} className="card-hover p-6 border-l-4 border-l-warning-400">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-albert font-semibold text-secondary-900">{model.title}</h4>
                    <p className="text-secondary-600 font-albert mt-1">{model.description}</p>
                    <p className="text-secondary-500 font-albert text-sm mt-1">
                      Created: {new Date(model.createdAt).toLocaleDateString()} • 
                      Category: {model.category} • 
                      Price: {(parseFloat(model.price) / 1000000000).toFixed(4)} SUI
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="badge bg-primary-100 text-primary-800">
                        Model: {model.modelBlobId.substring(0, 12)}...
                      </span>
                      {model.datasetBlobId && (
                        <span className="badge bg-white text-secondary-800 border border-secondary-300 shadow-card">
                          Dataset: {model.datasetBlobId.substring(0, 12)}...
                        </span>
                      )}
                      {model.tags.length > 0 && model.tags.map(tag => (
                        <span key={tag} className="badge bg-surface-200 text-secondary-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="badge badge-warning">Needs Verification</span>
                    {model.verificationAttempts > 0 && (
                      <span className="text-xs text-secondary-500">
                        Attempts: {model.verificationAttempts}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-warning-50 border border-warning-200 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-warning-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                    <div>
                      <h5 className="font-albert font-semibold text-warning-800 mb-1">Action Required</h5>
                      <p className="font-albert text-warning-700 leading-relaxed">
                        Your model has been successfully uploaded to Walrus storage. 
                        To publish it to the marketplace, you must complete TEE attestation verification.
                      </p>
                    </div>
                  </div>
                </div>

                {model.modelBlobId ? (
                  <div>
                    <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <TbShieldCheck className="h-3 w-3 text-white" />
                        </div>
                        <p className="font-albert text-primary-700 font-medium">
                          TEE Verification Ready
                        </p>
                      </div>
                      <p className="font-albert text-primary-600 text-sm mt-1">
                        Click "Start Verification" to begin secure TEE attestation process
                      </p>
                    </div>

                    {/* Enhanced Verification Flow */}
                    <EnhancedVerificationFlow
                      pendingModelId={model.id}
                      modelBlobId={model.modelBlobId}
                      datasetBlobId={model.datasetBlobId}
                      encryptionPolicyId={model.encryptionPolicyId}
                      modelName={model.title}
                      category={model.category}
                      contractService={contractService}
                      uploadService={uploadService}
                      onVerificationComplete={(verificationId, transactionDigest) => {
                        handleVerificationComplete(model.id, verificationId, transactionDigest);
                      }}
                    />
                  </div>
                ) : (
                  <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-danger-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">!</span>
                      </div>
                      <div>
                        <p className="font-albert text-danger-800 font-medium">Invalid Model Data</p>
                        <p className="font-albert text-danger-700 text-sm">
                          No blob ID found - model data may be corrupted
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Models */}
      {verified.length > 0 && (
        <div className="card p-8">
          <h3 className="text-2xl font-russo text-secondary-900 mb-8 flex items-center">
            <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center mr-3">
              <TbShieldCheck className="w-5 h-5 text-success-600" />
            </div>
            Verified Models
          </h3>
          
          <div className="space-y-6">
            {verified.map((task) => (
              <div key={task.id} className="card-hover p-6 bg-gradient-to-r from-success-50 to-success-100 border-success-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-success-500 rounded-xl flex items-center justify-center">
                      <TbShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-albert font-semibold text-success-900 text-lg">{task.title}</p>
                      <p className="text-success-700 font-albert">
                        {task.category} • Verified • Ready for marketplace
                      </p>
                      <code className="text-xs bg-success-200 px-2 py-1 rounded text-success-800 font-mono mt-2 inline-block">
                        Model ID: {task.id.substring(0, 20)}...
                      </code>
                    </div>
                  </div>
                  <span className="badge badge-success">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!state.isLoading && state.pendingModels.length === 0 && !state.error && (
        <div className="card p-12 text-center">
          <div className="w-24 h-24 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TbCertificate className="w-12 h-12 text-secondary-400" />
          </div>
          <h3 className="text-2xl font-russo text-secondary-900 mb-3">No models pending verification</h3>
          <p className="text-secondary-600 font-albert max-w-md mx-auto leading-relaxed">
            Upload a model first, then it will appear here for TEE verification before marketplace publication.
          </p>
          <div className="mt-6">
            <a href="/upload" className="btn btn-primary">
              Upload Your First Model
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced Verification Flow Component
function EnhancedVerificationFlow({
  pendingModelId,
  modelBlobId,
  datasetBlobId,
  encryptionPolicyId,
  modelName,
  category,
  contractService,
  uploadService,
  onVerificationComplete
}: {
  pendingModelId: string;
  modelBlobId: string;
  datasetBlobId?: string;
  encryptionPolicyId: string;
  modelName: string;
  category: string;
  contractService: MarketplaceContractService | null;
  uploadService: ModelUploadService | null;
  onVerificationComplete: (verificationId: string, transactionDigest: string) => void;
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'ready' | 'submitting' | 'verifying' | 'listing' | 'completed' | 'error'>('ready');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const currentAccount = useCurrentAccount();

  const startVerification = async () => {
    if (!contractService || !uploadService || !currentAccount?.address) {
      setError('Services not ready or wallet not connected');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      setProgress(0);

      // Step 1: Submit for verification
      setVerificationStep('submitting');
      setStatusMessage('Submitting model for verification...');
      setProgress(20);

      const submitResult = await uploadService.submitForVerification(
        pendingModelId,
        {
          toSuiAddress: async () => currentAccount.address,
          signTransaction: async (tx: any) => tx
        } as any
      );

      if (!submitResult.success) {
        throw new Error(submitResult.error || 'Failed to submit for verification');
      }

      // Step 2: TEE Verification
      setVerificationStep('verifying');
      setStatusMessage('Performing TEE verification...');
      setProgress(50);

      const verificationResult = await uploadService.verifyModel(
        pendingModelId,
        modelBlobId,
        datasetBlobId,
        encryptionPolicyId,
        modelName,
        category,
        {
          toSuiAddress: async () => currentAccount.address,
          signTransaction: async (tx: any) => tx
        } as any
      );

      if (!verificationResult.success) {
        throw new Error(verificationResult.error || 'TEE verification failed');
      }

      // Step 3: List on marketplace
      setVerificationStep('listing');
      setStatusMessage('Listing on marketplace...');
      setProgress(80);

      const listingResult = await uploadService.listOnMarketplace(
        pendingModelId,
        verificationResult.verificationId!,
        {
          toSuiAddress: async () => currentAccount.address,
          signTransaction: async (tx: any) => tx
        } as any
      );

      if (!listingResult.success) {
        throw new Error(listingResult.error || 'Failed to list on marketplace');
      }

      // Step 4: Complete
      setVerificationStep('completed');
      setStatusMessage('Verification completed successfully!');
      setProgress(100);

      // Call completion callback
      onVerificationComplete(
        verificationResult.verificationId!,
        listingResult.transactionDigest!
      );

    } catch (error) {
      console.error('Verification flow failed:', error);
      setVerificationStep('error');
      setError(error instanceof Error ? error.message : 'Unknown error');
      setStatusMessage('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const getStepIcon = () => {
    switch (verificationStep) {
      case 'ready': return <TbShieldCheck className="h-5 w-5" />;
      case 'submitting': 
      case 'verifying': 
      case 'listing': return <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />;
      case 'completed': return <TbShieldCheck className="h-5 w-5" />;
      case 'error': return <TbShieldX className="h-5 w-5" />;
    }
  };

  const getStepColor = () => {
    switch (verificationStep) {
      case 'ready': return 'btn-primary';
      case 'submitting': 
      case 'verifying': 
      case 'listing': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      case 'error': return 'bg-red-500 text-white';
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TbShieldX className="h-5 w-5 text-danger-500" />
            <div>
              <p className="font-albert font-medium text-danger-800">Verification Failed</p>
              <p className="font-albert text-danger-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isVerifying && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
            <p className="font-albert font-medium text-blue-800">{statusMessage}</p>
          </div>
          <div className="bg-white rounded-full h-2 overflow-hidden">
            <div 
              className="h-2 bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={startVerification}
        disabled={isVerifying || !contractService || !uploadService}
        className={`btn w-full flex items-center justify-center gap-3 ${getStepColor()}`}
      >
        {getStepIcon()}
        <span className="font-medium">
          {verificationStep === 'ready' ? 'Start TEE Verification' :
           verificationStep === 'submitting' ? 'Submitting...' :
           verificationStep === 'verifying' ? 'Verifying in TEE...' :
           verificationStep === 'listing' ? 'Listing on Marketplace...' :
           verificationStep === 'completed' ? 'Verification Complete' :
           verificationStep === 'error' ? 'Verification Failed' : 'Start Verification'}
        </span>
      </button>

      {verificationStep === 'completed' && (
        <div className="bg-success-50 border border-success-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TbShieldCheck className="h-5 w-5 text-success-500" />
            <div>
              <p className="font-albert font-medium text-success-800">Model Successfully Verified</p>
              <p className="font-albert text-success-700 text-sm">
                Your model has been verified and listed on the marketplace
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}