'use client'

import React, { useState } from 'react';
import { ArrowLeft, User, Search, Eye, Shield, ShoppingCart, Download, CheckCircle, Star, Filter } from 'lucide-react';
import { ModelVerificationPanel } from '@/components/verification';
import { PurchaseWizard } from '@/components/purchase';
import { AttestationDocument } from '@/lib/integrations/nautilus/client';
import Link from 'next/link';

interface ModelData {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  size: string;
  seller: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  integrityHash: string;
  rating: number;
  downloads: number;
  uploadDate: string;
}

type BuyerJourneyStep = 'discover' | 'view' | 'verify' | 'purchase' | 'access';

export default function BuyerJourneyPage() {
  const [currentStep, setCurrentStep] = useState<BuyerJourneyStep>('discover');
  const [selectedModel, setSelectedModel] = useState<ModelData | null>(null);
  const [verifiedModels, setVerifiedModels] = useState<string[]>([]);
  const [purchasedModels, setPurchasedModels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Mock comprehensive model data
  const mockModels: ModelData[] = [
    {
      id: 'model-1',
      name: 'Advanced Computer Vision Model',
      description: 'State-of-the-art image classification model trained on medical imaging data with 99.2% accuracy. Supports real-time inference and batch processing with optimized performance for healthcare applications.',
      category: 'Computer Vision',
      price: '2.5 SUI',
      size: '1.2 GB',
      seller: '0x1234...5678',
      verificationStatus: 'verified',
      integrityHash: 'sha256:a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
      rating: 4.8,
      downloads: 1247,
      uploadDate: '2024-11-10'
    },
    {
      id: 'model-2',
      name: 'NLP Sentiment Analysis Model',
      description: 'Fine-tuned transformer model for sentiment analysis in financial texts with real-time processing capabilities. Trained on millions of financial documents and news articles.',
      category: 'Natural Language Processing',
      price: '1.8 SUI',
      size: '856 MB',
      seller: '0xabcd...efgh',
      verificationStatus: 'verified',
      integrityHash: 'sha256:b2c3d4e5f6789012345678901234567890123456789012345678901234567890a1',
      rating: 4.6,
      downloads: 892,
      uploadDate: '2024-11-09'
    },
    {
      id: 'model-3',
      name: 'Time Series Forecasting Model',
      description: 'LSTM-based model for stock price prediction with technical indicators and market sentiment analysis. Includes feature engineering pipeline and risk assessment components.',
      category: 'Time Series Analysis',
      price: '3.2 SUI',
      size: '654 MB',
      seller: '0x9876...5432',
      verificationStatus: 'verified',
      integrityHash: 'sha256:c3d4e5f6789012345678901234567890123456789012345678901234567890a1b2',
      rating: 4.9,
      downloads: 634,
      uploadDate: '2024-11-08'
    }
  ];

  const categories = ['all', 'Computer Vision', 'Natural Language Processing', 'Time Series Analysis', 'Security & Fraud Detection'];

  const journeySteps = [
    { id: 'discover', title: 'Discover Models', description: 'Browse marketplace', icon: Search },
    { id: 'view', title: 'View Details', description: 'Examine model info', icon: Eye },
    { id: 'verify', title: 'Verify Model', description: 'Check attestation', icon: Shield },
    { id: 'purchase', title: 'Purchase', description: 'Buy with access keys', icon: ShoppingCart },
    { id: 'access', title: 'Access Model', description: 'Download and use', icon: Download }
  ];

  const handleModelSelect = (model: ModelData) => {
    setSelectedModel(model);
    setCurrentStep('view');
  };

  const handleVerificationComplete = (modelId: string, attestation: AttestationDocument) => {
    setVerifiedModels(prev => [...prev, modelId]);
    setCurrentStep('purchase');
  };

  const handlePurchaseComplete = (modelId: string, accessKey: string, licenseNFT: string) => {
    setPurchasedModels(prev => [...prev, modelId]);
    setCurrentStep('access');
  };

  const filteredModels = mockModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || model.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />);
    }
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    return stars;
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
              <h1 className="text-2xl font-bold text-gray-900">Buyer End-to-End Journey</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Flow Description */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Flow 4: Complete Buyer Journey</h2>
              <p className="text-gray-600 mb-4">
                This flow demonstrates the complete buyer experience from model discovery to download and usage.
                Follow the journey: Discover → View → Verify → Purchase → Access.
              </p>
              
              {/* Progress Indicator */}
              <div className="mt-6">
                <div className="flex items-center space-x-4">
                  {journeySteps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 
                        ${currentStep === step.id ? 'bg-blue-500 border-blue-500 text-white' :
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

        {/* Step 1: Model Discovery */}
        {currentStep === 'discover' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Discover Models</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search for AI models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Model Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleModelSelect(model)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">{model.name}</h3>
                      {model.verificationStatus === 'verified' && (
                        <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        {renderStars(model.rating)}
                        <span className="text-sm text-gray-600 ml-2">{model.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">{model.downloads} downloads</span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{model.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-lg font-bold text-blue-600">{model.price}</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {model.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Model Details */}
        {currentStep === 'view' && selectedModel && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Model Details</h3>
              <button
                onClick={() => setCurrentStep('discover')}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Back to Discovery
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Model Information */}
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{selectedModel.name}</h4>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    {renderStars(selectedModel.rating)}
                    <span className="text-gray-600 ml-2">{selectedModel.rating} ({selectedModel.downloads} downloads)</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">{selectedModel.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <p className="text-gray-900">{selectedModel.category}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Size:</span>
                    <p className="text-gray-900">{selectedModel.size}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Upload Date:</span>
                    <p className="text-gray-900">{selectedModel.uploadDate}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Seller:</span>
                    <p className="font-mono text-xs text-gray-900">{selectedModel.seller}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h5 className="font-semibold text-blue-900 mb-2">Price</h5>
                  <div className="text-3xl font-bold text-blue-600 mb-4">{selectedModel.price}</div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => setCurrentStep('verify')}
                      className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      Verify Model First
                    </button>
                    
                    <button
                      onClick={() => setCurrentStep('purchase')}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Purchase Directly
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">What you get:</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Full model file access</li>
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />SEAL encrypted download</li>
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Usage license NFT</li>
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Integrity verification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Model Verification */}
        {currentStep === 'verify' && selectedModel && (
          <ModelVerificationPanel
            model={selectedModel}
            onVerificationComplete={(attestation) => handleVerificationComplete(selectedModel.id, attestation)}
          />
        )}

        {/* Step 4: Purchase */}
        {currentStep === 'purchase' && selectedModel && (
          <PurchaseWizard
            model={selectedModel}
            onPurchaseComplete={(accessKey, licenseNFT) => handlePurchaseComplete(selectedModel.id, accessKey, licenseNFT)}
            onCancel={() => setCurrentStep('view')}
          />
        )}

        {/* Step 5: Access Model */}
        {currentStep === 'access' && selectedModel && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-8">
              <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Model Access Granted!</h3>
              <p className="text-gray-600">
                You now have full access to <strong>{selectedModel.name}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-4">Access Details</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>✅ Purchase completed successfully</li>
                  <li>✅ Access keys generated with SEAL encryption</li>
                  <li>✅ License NFT issued to your wallet</li>
                  <li>✅ Model ready for download</li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-4">Usage Rights</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Commercial use permitted</li>
                  <li>• No redistribution allowed</li>
                  <li>• Valid for 1 year</li>
                  <li>• Technical support included</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-4 justify-center">
              <button className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-5 h-5 mr-2" />
                Download Model
              </button>
              <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <CheckCircle className="w-5 h-5 mr-2" />
                View License
              </button>
              <button
                onClick={() => {
                  setCurrentStep('discover');
                  setSelectedModel(null);
                }}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                Browse More Models
              </button>
            </div>
          </div>
        )}

        {/* Journey Summary */}
        <div className="mt-12 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Journey Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            {journeySteps.map((step, index) => (
              <div key={step.id} className={`p-3 rounded-lg ${
                currentStep === step.id ? 'bg-blue-100 border border-blue-300' :
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