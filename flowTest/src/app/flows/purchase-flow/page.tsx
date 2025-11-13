'use client'

import React, { useState } from 'react';
import { PurchaseWizard } from '@/components/purchase';
import { ArrowLeft, ShoppingCart, Search, Filter, CheckCircle, Star } from 'lucide-react';
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
  seller: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  integrityHash: string;
  rating: number;
  downloads: number;
}

export default function PurchaseFlowPage() {
  const [selectedModel, setSelectedModel] = useState<ModelData | null>(null);
  const [purchasedModels, setPurchasedModels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Mock model data for purchase testing
  const mockModels: ModelData[] = [
    {
      id: 'model-1',
      name: 'Advanced Computer Vision Model',
      description: 'State-of-the-art image classification model trained on medical imaging data with 99.2% accuracy',
      category: 'Computer Vision',
      price: '2.5 SUI',
      size: '1.2 GB',
      seller: '0x1234...5678',
      verificationStatus: 'verified',
      integrityHash: 'sha256:a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
      rating: 4.8,
      downloads: 1247
    },
    {
      id: 'model-2',
      name: 'NLP Sentiment Analysis Model',
      description: 'Fine-tuned transformer model for sentiment analysis in financial texts with real-time processing',
      category: 'Natural Language Processing',
      price: '1.8 SUI',
      size: '856 MB',
      seller: '0xabcd...efgh',
      verificationStatus: 'verified',
      integrityHash: 'sha256:b2c3d4e5f6789012345678901234567890123456789012345678901234567890a1',
      rating: 4.6,
      downloads: 892
    },
    {
      id: 'model-3',
      name: 'Time Series Forecasting Model',
      description: 'LSTM-based model for stock price prediction with technical indicators and market sentiment analysis',
      category: 'Time Series Analysis',
      price: '3.2 SUI',
      size: '654 MB',
      seller: '0x9876...5432',
      verificationStatus: 'verified',
      integrityHash: 'sha256:c3d4e5f6789012345678901234567890123456789012345678901234567890a1b2',
      rating: 4.9,
      downloads: 634
    },
    {
      id: 'model-4',
      name: 'Fraud Detection Neural Network',
      description: 'Deep learning model for real-time fraud detection in financial transactions with low false positives',
      category: 'Security & Fraud Detection',
      price: '4.1 SUI',
      size: '2.1 GB',
      seller: '0xfedc...ba98',
      verificationStatus: 'verified',
      integrityHash: 'sha256:d4e5f6789012345678901234567890123456789012345678901234567890a1b2c3',
      rating: 4.7,
      downloads: 456
    },
    {
      id: 'model-5',
      name: 'Recommendation Engine',
      description: 'Collaborative filtering recommendation system for e-commerce with personalization features',
      category: 'Recommendation Systems',
      price: '2.8 SUI',
      size: '945 MB',
      seller: '0x1111...2222',
      verificationStatus: 'verified',
      integrityHash: 'sha256:e5f6789012345678901234567890123456789012345678901234567890a1b2c3d4',
      rating: 4.5,
      downloads: 723
    }
  ];

  const categories = ['all', 'Computer Vision', 'Natural Language Processing', 'Time Series Analysis', 'Security & Fraud Detection', 'Recommendation Systems'];

  const handlePurchaseComplete = (modelId: string, accessKey: string, licenseNFT: string) => {
    setPurchasedModels(prev => [...prev, modelId]);
    console.log('✅ Purchase completed:', { modelId, accessKey, licenseNFT });
    setSelectedModel(null);
  };

  const filteredModels = mockModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || model.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (model: ModelData) => {
    if (purchasedModels.includes(model.id)) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
          <CheckCircle className="w-4 h-4 mr-1" />
          Owned
        </span>
      );
    } else if (model.verificationStatus === 'verified') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-4 h-4 mr-1" />
          Verified
        </span>
      );
    }
    return null;
  };

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

  if (selectedModel) {
    return (
      <PurchaseWizard
        model={selectedModel}
        onPurchaseComplete={(accessKey, licenseNFT) => handlePurchaseComplete(selectedModel.id, accessKey, licenseNFT)}
        onCancel={() => setSelectedModel(null)}
      />
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
              <h1 className="text-2xl font-bold text-gray-900">Purchase Flow</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Flow Description */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Flow 3: Purchase Flow & Access Key Distribution</h2>
              <p className="text-gray-600 mb-4">
                This flow demonstrates the complete purchase process where buyers can purchase models and receive 
                SEAL-encrypted access keys and NFT licenses. The system handles payments, key generation, and 
                license management automatically.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Secure Payment</p>
                    <p className="text-xs text-gray-600">Blockchain escrow system</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">SEAL Access Keys</p>
                    <p className="text-xs text-gray-600">Encrypted with buyer's wallet</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">License NFT</p>
                    <p className="text-xs text-gray-600">Proof of ownership</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Instant Access</p>
                    <p className="text-xs text-gray-600">Immediate model download</p>
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
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                      {getStatusBadge(model)}
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        {renderStars(model.rating)}
                        <span className="text-sm text-gray-600 ml-2">{model.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">{model.downloads} downloads</span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{model.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <p className="text-gray-900">{model.category}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Size:</span>
                        <p className="text-gray-900">{model.size}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {model.price}
                  </div>
                  
                  <button
                    onClick={() => setSelectedModel(model)}
                    disabled={purchasedModels.includes(model.id)}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      purchasedModels.includes(model.id)
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {purchasedModels.includes(model.id) ? 'Owned' : 'Purchase'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
            <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
          </div>
        )}

        {/* Purchase Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Multiple License Types</h4>
              <p className="text-sm text-gray-600">Personal, Commercial, and Enterprise licensing options</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Instant Access</h4>
              <p className="text-sm text-gray-600">Immediate access keys and model download after purchase</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">SEAL Encryption</h4>
              <p className="text-sm text-gray-600">Access keys encrypted with your wallet signature</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">NFT License</h4>
              <p className="text-sm text-gray-600">Blockchain proof of ownership and usage rights</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {purchasedModels.length > 0 && (
          <div className="mt-8 bg-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Your Purchases</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{purchasedModels.length}</div>
                <div className="text-purple-700">Models Purchased</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {purchasedModels.reduce((total, modelId) => {
                    const model = mockModels.find(m => m.id === modelId);
                    return total + parseFloat(model?.price.replace(' SUI', '') || '0');
                  }, 0).toFixed(2)}
                </div>
                <div className="text-purple-700">Total Spent (SUI)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{purchasedModels.length}</div>
                <div className="text-purple-700">Active Licenses</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}