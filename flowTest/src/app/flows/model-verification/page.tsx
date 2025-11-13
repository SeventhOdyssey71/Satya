'use client'

import React, { useState } from 'react';
import { ModelVerificationPanel } from '@/components/verification';
import { AttestationDocument } from '@/lib/integrations/nautilus/client';
import { ArrowLeft, CheckCircle, Shield, Search, Filter } from 'lucide-react';
import Link from 'next/link';

// Disable static generation to avoid Walrus WASM loading issues during build
export const dynamic = 'force-dynamic'

interface ModelData {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  size: string;
  uploadDate: string;
  seller: string;
  attestationId?: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  integrityHash: string;
}

export default function ModelVerificationFlowPage() {
  const [selectedModel, setSelectedModel] = useState<ModelData | null>(null);
  const [verifiedModels, setVerifiedModels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all');

  // Mock model data - in production this would come from the marketplace API
  const mockModels: ModelData[] = [
    {
      id: 'model-1',
      name: 'Advanced Computer Vision Model',
      description: 'State-of-the-art image classification model trained on medical imaging data',
      category: 'Computer Vision',
      price: '2.5 SUI',
      size: '1.2 GB',
      uploadDate: '2024-11-10',
      seller: '0x1234...5678',
      attestationId: 'att-cv-model-1',
      verificationStatus: 'unverified',
      integrityHash: 'sha256:a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
    },
    {
      id: 'model-2', 
      name: 'NLP Sentiment Analysis Model',
      description: 'Fine-tuned transformer model for sentiment analysis in financial texts',
      category: 'Natural Language Processing',
      price: '1.8 SUI',
      size: '856 MB',
      uploadDate: '2024-11-09',
      seller: '0xabcd...efgh',
      attestationId: 'att-nlp-model-2',
      verificationStatus: 'verified',
      integrityHash: 'sha256:b2c3d4e5f6789012345678901234567890123456789012345678901234567890a1'
    },
    {
      id: 'model-3',
      name: 'Time Series Forecasting Model',
      description: 'LSTM-based model for stock price prediction with technical indicators',
      category: 'Time Series Analysis',
      price: '3.2 SUI',
      size: '654 MB',
      uploadDate: '2024-11-08',
      seller: '0x9876...5432',
      attestationId: 'att-ts-model-3',
      verificationStatus: 'pending',
      integrityHash: 'sha256:c3d4e5f6789012345678901234567890123456789012345678901234567890a1b2'
    },
    {
      id: 'model-4',
      name: 'Fraud Detection Neural Network',
      description: 'Deep learning model for real-time fraud detection in financial transactions',
      category: 'Security & Fraud Detection',
      price: '4.1 SUI',
      size: '2.1 GB',
      uploadDate: '2024-11-07',
      seller: '0xfedc...ba98',
      attestationId: 'att-fraud-model-4',
      verificationStatus: 'unverified',
      integrityHash: 'sha256:d4e5f6789012345678901234567890123456789012345678901234567890a1b2c3'
    }
  ];

  const handleVerificationComplete = (modelId: string, attestation: AttestationDocument) => {
    setVerifiedModels(prev => [...prev, modelId]);
    console.log('✅ Model verification completed:', { modelId, attestation });
  };

  const filteredModels = mockModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'verified' && (model.verificationStatus === 'verified' || verifiedModels.includes(model.id))) ||
                         (filterStatus === 'unverified' && model.verificationStatus === 'unverified' && !verifiedModels.includes(model.id));
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (model: ModelData) => {
    if (verifiedModels.includes(model.id) || model.verificationStatus === 'verified') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </span>
      );
    } else if (model.verificationStatus === 'pending') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <Shield className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <Shield className="w-3 h-3 mr-1" />
          Unverified
        </span>
      );
    }
  };

  if (selectedModel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <button
              onClick={() => setSelectedModel(null)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Model List
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <ModelVerificationPanel
            model={selectedModel}
            onVerificationComplete={(attestation) => handleVerificationComplete(selectedModel.id, attestation)}
          />
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Model Verification Flow</h1>
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
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Flow 2: Model Verification with Pre-Generated Attestations</h2>
              <p className="text-gray-600 mb-4">
                This flow demonstrates model verification using pre-generated attestations from AWS Nitro Enclave execution.
                When sellers upload models, they are processed in secure enclaves and attestations are stored. Buyers can
                then retrieve and verify these attestations to ensure model integrity.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Pre-Generated Attestations</p>
                    <p className="text-xs text-gray-600">Created during model upload</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Instant Verification</p>
                    <p className="text-xs text-gray-600">No re-processing required</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Buyer Confidence</p>
                    <p className="text-xs text-gray-600">Cryptographic proof of integrity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search models by name, category, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'verified' | 'unverified')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="all">All Models</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Model List */}
        <div className="space-y-4">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedModel(model)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                    {getStatusBadge(model)}
                  </div>
                  
                  <p className="text-gray-600 mb-3">{model.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <p className="text-gray-900">{model.category}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Price:</span>
                      <p className="text-gray-900">{model.price}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Size:</span>
                      <p className="text-gray-900">{model.size}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Upload Date:</span>
                      <p className="text-gray-900">{model.uploadDate}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-6">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Verify Model
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filter settings.</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">{mockModels.length}</div>
            <div className="text-gray-600">Total Models</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {mockModels.filter(m => m.verificationStatus === 'verified').length + verifiedModels.length}
            </div>
            <div className="text-gray-600">Verified Models</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {mockModels.filter(m => m.verificationStatus === 'pending').length}
            </div>
            <div className="text-gray-600">Pending Verification</div>
          </div>
        </div>

        {/* Technical Information */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Pre-Generated Attestations Work</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Seller Upload Process:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>1. Model uploaded to secure enclave</li>
                <li>2. TEE processes model and generates attestation</li>
                <li>3. Attestation stored with cryptographic signature</li>
                <li>4. Model listed in marketplace with verification status</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Buyer Verification Process:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>1. Retrieve pre-generated attestation document</li>
                <li>2. Validate cryptographic signatures and PCRs</li>
                <li>3. Verify model integrity hash matches</li>
                <li>4. Confirm secure enclave execution environment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}