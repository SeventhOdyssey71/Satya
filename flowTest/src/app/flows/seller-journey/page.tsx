'use client'

import React, { useState } from 'react';
import { ArrowLeft, UserCheck, Upload, Clock, CheckCircle, Shield, DollarSign, BarChart3, TrendingUp, Eye } from 'lucide-react';
import { DatasetUploadWizard } from '@/components/dataset';
import { ModelUploadWizard } from '@/components/upload';
import { DatasetVerificationResult } from '@/lib/integrations/nautilus/client';
import Link from 'next/link';

type SellerJourneyStep = 'prepare' | 'upload' | 'processing' | 'verification' | 'listing' | 'monitoring';

interface UploadedModel {
  id: string;
  name: string;
  category: string;
  price: string;
  status: 'processing' | 'verified' | 'listed' | 'failed';
  uploadDate: string;
  views: number;
  downloads: number;
  revenue: number;
  verificationId?: string;
}

export default function SellerJourneyPage() {
  const [currentStep, setCurrentStep] = useState<SellerJourneyStep>('prepare');
  const [uploadType, setUploadType] = useState<'model' | 'dataset' | null>(null);
  const [uploadedModels, setUploadedModels] = useState<UploadedModel[]>([
    // Mock existing models
    {
      id: 'model-1',
      name: 'Computer Vision Classifier',
      category: 'Computer Vision',
      price: '2.5 SUI',
      status: 'listed',
      uploadDate: '2024-11-08',
      views: 342,
      downloads: 28,
      revenue: 70
    },
    {
      id: 'model-2', 
      name: 'NLP Sentiment Model',
      category: 'Natural Language Processing',
      price: '1.8 SUI',
      status: 'listed',
      uploadDate: '2024-11-07',
      views: 256,
      downloads: 15,
      revenue: 27
    }
  ]);

  const journeySteps = [
    { id: 'prepare', title: 'Prepare Upload', description: 'Choose upload type', icon: Upload },
    { id: 'upload', title: 'Upload & Encrypt', description: 'SEAL + Walrus upload', icon: Shield },
    { id: 'processing', title: 'TEE Processing', description: 'AWS Nitro verification', icon: Clock },
    { id: 'verification', title: 'Verification', description: 'Attestation generated', icon: CheckCircle },
    { id: 'listing', title: 'Marketplace Listing', description: 'Model goes live', icon: BarChart3 },
    { id: 'monitoring', title: 'Monitor Revenue', description: 'Track performance', icon: TrendingUp }
  ];

  const handleDatasetUploadComplete = (result: DatasetVerificationResult) => {
    if (result.success) {
      const newModel: UploadedModel = {
        id: `dataset-${Date.now()}`,
        name: 'New Dataset Upload',
        category: 'Dataset',
        price: '0.5 SUI',
        status: 'processing',
        uploadDate: new Date().toISOString().split('T')[0],
        views: 0,
        downloads: 0,
        revenue: 0,
        verificationId: result.verificationId
      };
      
      setUploadedModels(prev => [...prev, newModel]);
      setCurrentStep('processing');
      
      // Simulate processing flow
      setTimeout(() => {
        setUploadedModels(prev => 
          prev.map(m => m.id === newModel.id ? { ...m, status: 'verified' } : m)
        );
        setCurrentStep('verification');
        
        setTimeout(() => {
          setUploadedModels(prev => 
            prev.map(m => m.id === newModel.id ? { ...m, status: 'listed' } : m)
          );
          setCurrentStep('listing');
          
          setTimeout(() => {
            setCurrentStep('monitoring');
          }, 2000);
        }, 3000);
      }, 5000);
    }
  };

  const handleModelUploadComplete = (result: any) => {
    const newModel: UploadedModel = {
      id: `model-${Date.now()}`,
      name: 'New Model Upload',
      category: 'Machine Learning',
      price: '3.0 SUI',
      status: 'processing',
      uploadDate: new Date().toISOString().split('T')[0],
      views: 0,
      downloads: 0,
      revenue: 0
    };
    
    setUploadedModels(prev => [...prev, newModel]);
    setCurrentStep('processing');
    
    // Simulate processing flow
    setTimeout(() => {
      setUploadedModels(prev => 
        prev.map(m => m.id === newModel.id ? { ...m, status: 'verified' } : m)
      );
      setCurrentStep('verification');
      
      setTimeout(() => {
        setUploadedModels(prev => 
          prev.map(m => m.id === newModel.id ? { ...m, status: 'listed' } : m)
        );
        setCurrentStep('listing');
        
        setTimeout(() => {
          setCurrentStep('monitoring');
        }, 2000);
      }, 3000);
    }, 5000);
  };

  const getTotalStats = () => {
    return {
      totalModels: uploadedModels.length,
      totalViews: uploadedModels.reduce((sum, model) => sum + model.views, 0),
      totalDownloads: uploadedModels.reduce((sum, model) => sum + model.downloads, 0),
      totalRevenue: uploadedModels.reduce((sum, model) => sum + model.revenue, 0)
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">Processing</span>;
      case 'verified':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Verified</span>;
      case 'listed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Listed</span>;
      case 'failed':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/flows"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Flows
              </Link>
              <div className="h-6 border-l border-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Seller End-to-End Journey</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Flow Description */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Flow 5: Complete Seller Journey</h2>
              <p className="text-gray-600 mb-4">
                This flow demonstrates the complete seller experience from uploading models/datasets to monitoring revenue.
                Follow the journey: Prepare → Upload → Process → Verify → List → Monitor.
              </p>
              
              {/* Progress Indicator */}
              <div className="mt-6">
                <div className="flex items-center space-x-4">
                  {journeySteps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 
                        ${currentStep === step.id ? 'bg-green-500 border-green-500 text-white' :
                          journeySteps.findIndex(s => s.id === currentStep) > index ? 'bg-green-500 border-green-500 text-white' :
                          'bg-gray-200 border-gray-300 text-gray-500'}
                      `}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      {index < journeySteps.length - 1 && (
                        <div className={`
                          w-16 h-1 mx-2
                          ${journeySteps.findIndex(s => s.id === currentStep) > index ? 'bg-green-500' : 'bg-gray-300'}
                        `} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  {journeySteps.map((step, index) => (
                    <div key={step.id} className="text-center" style={{ width: '120px' }}>
                      <p className="font-medium">{step.title}</p>
                      <p className="text-gray-500 text-xs">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Prepare Upload */}
        {currentStep === 'prepare' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Choose Upload Type</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dataset Upload */}
              <div className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
                uploadType === 'dataset' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              }`} onClick={() => setUploadType('dataset')}>
                <div className="text-center">
                  <Shield className="mx-auto h-12 w-12 text-green-600 mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Upload Dataset</h4>
                  <p className="text-gray-600 mb-4">
                    Upload and verify datasets using Nautilus TEE technology for integrity verification
                  </p>
                  <ul className="text-sm text-gray-600 text-left space-y-1">
                    <li>• Secure TEE processing</li>
                    <li>• Cryptographic attestation</li>
                    <li>• Integrity verification</li>
                    <li>• AWS Nitro Enclave</li>
                  </ul>
                </div>
              </div>

              {/* Model Upload */}
              <div className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
                uploadType === 'model' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              }`} onClick={() => setUploadType('model')}>
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Upload AI Model</h4>
                  <p className="text-gray-600 mb-4">
                    Upload AI models with SEAL encryption and Walrus decentralized storage
                  </p>
                  <ul className="text-sm text-gray-600 text-left space-y-1">
                    <li>• SEAL encryption</li>
                    <li>• Walrus storage</li>
                    <li>• Marketplace listing</li>
                    <li>• Revenue tracking</li>
                  </ul>
                </div>
              </div>
            </div>

            {uploadType && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start {uploadType === 'dataset' ? 'Dataset' : 'Model'} Upload
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Upload Process */}
        {currentStep === 'upload' && uploadType && (
          <div>
            {uploadType === 'dataset' ? (
              <DatasetUploadWizard
                onUploadComplete={handleDatasetUploadComplete}
                onCancel={() => setCurrentStep('prepare')}
              />
            ) : (
              <ModelUploadWizard
                onUploadComplete={handleModelUploadComplete}
                onCancel={() => setCurrentStep('prepare')}
              />
            )}
          </div>
        )}

        {/* Step 3: Processing */}
        {currentStep === 'processing' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Clock className="mx-auto h-20 w-20 text-blue-500 animate-pulse mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Processing in Secure Environment</h3>
            <p className="text-gray-600 mb-6">
              Your {uploadType} is being processed in an AWS Nitro Enclave for security verification
            </p>
            
            <div className="max-w-md mx-auto">
              <div className="space-y-4 text-left">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">File uploaded securely</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700">Running integrity checks...</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-gray-500">Generating attestation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-gray-500">Preparing for marketplace</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-sm text-gray-500">
              This process typically takes 3-5 minutes...
            </div>
          </div>
        )}

        {/* Step 4: Verification Complete */}
        {currentStep === 'verification' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Verification Complete!</h3>
            <p className="text-gray-600 mb-6">
              Your {uploadType} has been successfully verified with cryptographic attestation
            </p>
            
            <div className="bg-green-50 rounded-lg p-6 max-w-md mx-auto">
              <h4 className="font-semibold text-green-900 mb-3">Verification Results:</h4>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex justify-between">
                  <span>Integrity Check:</span>
                  <span className="font-medium">✅ Passed</span>
                </div>
                <div className="flex justify-between">
                  <span>Attestation:</span>
                  <span className="font-medium">✅ Generated</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Scan:</span>
                  <span className="font-medium">✅ Clean</span>
                </div>
                <div className="flex justify-between">
                  <span>Metadata:</span>
                  <span className="font-medium">✅ Validated</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-sm text-gray-500">
              Moving to marketplace listing...
            </div>
          </div>
        )}

        {/* Step 5: Marketplace Listing */}
        {currentStep === 'listing' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <BarChart3 className="mx-auto h-20 w-20 text-blue-500 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Listed on Marketplace!</h3>
            <p className="text-gray-600 mb-6">
              Your {uploadType} is now live on the Satya marketplace and available for purchase
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <Eye className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-blue-700">Views</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">Verified</div>
                <div className="text-sm text-green-700">Status</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <DollarSign className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">0 SUI</div>
                <div className="text-sm text-purple-700">Revenue</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Starting revenue monitoring...
            </div>
          </div>
        )}

        {/* Step 6: Revenue Monitoring */}
        {currentStep === 'monitoring' && (
          <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Seller Dashboard</h3>
              <p className="text-gray-600">Monitor your models' performance and revenue</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Models</p>
                    <p className="text-3xl font-bold text-gray-900">{getTotalStats().totalModels}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Views</p>
                    <p className="text-3xl font-bold text-gray-900">{getTotalStats().totalViews}</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Downloads</p>
                    <p className="text-3xl font-bold text-gray-900">{getTotalStats().totalDownloads}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">{getTotalStats().totalRevenue} SUI</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Models List */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900">Your Models</h4>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {uploadedModels.map((model) => (
                    <div key={model.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h5 className="font-semibold text-gray-900">{model.name}</h5>
                          {getStatusBadge(model.status)}
                        </div>
                        <span className="text-lg font-bold text-gray-900">{model.price}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Category:</span>
                          <p className="text-gray-900">{model.category}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Upload Date:</span>
                          <p className="text-gray-900">{model.uploadDate}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Views:</span>
                          <p className="text-gray-900">{model.views}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Revenue:</span>
                          <p className="text-gray-900">{model.revenue} SUI</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="text-center">
              <button
                onClick={() => {
                  setCurrentStep('prepare');
                  setUploadType(null);
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Upload Another Model
              </button>
            </div>
          </div>
        )}

        {/* Journey Summary */}
        <div className="mt-12 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Journey Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm">
            {journeySteps.map((step, index) => (
              <div key={step.id} className={`p-3 rounded-lg ${
                currentStep === step.id ? 'bg-green-100 border border-green-300' :
                journeySteps.findIndex(s => s.id === currentStep) > index ? 'bg-green-100' : 'bg-white'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <step.icon className="w-4 h-4" />
                  <span className="font-medium">{step.title}</span>
                </div>
                <p className="text-xs text-gray-600">{step.description}</p>
                {journeySteps.findIndex(s => s.id === currentStep) > index && (
                  <div className="mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}