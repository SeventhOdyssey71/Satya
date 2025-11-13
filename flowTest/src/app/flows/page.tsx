'use client'

import React from 'react';
import Link from 'next/link';
import { Shield, Database, ShoppingCart, User, UserCheck, ArrowRight, CheckCircle } from 'lucide-react';

// Disable static generation to avoid Walrus WASM loading issues during build
export const dynamic = 'force-dynamic'

export default function FlowsIndexPage() {
  const flows = [
    {
      id: 1,
      title: 'Dataset Upload & Verification',
      description: 'Upload datasets and verify them using Nautilus TEE architecture for cryptographic proof of integrity.',
      icon: Shield,
      path: '/flows/dataset-verification',
      status: 'ready',
      features: ['Secure TEE processing', 'Cryptographic attestation', 'Integrity verification', 'AWS Nitro Enclave']
    },
    {
      id: 2,
      title: 'Model Verification & Attestation',
      description: 'Verify models with pre-generated attestations from AWS Nitro Enclave execution.',
      icon: CheckCircle,
      path: '/flows/model-verification',
      status: 'ready',
      features: ['Pre-generated attestations', 'On-chain verification', 'TEE execution proof', 'Buyer confidence']
    },
    {
      id: 3,
      title: 'Purchase Flow & Access Keys',
      description: 'Complete purchase flow where buyers get access keys to purchased models.',
      icon: ShoppingCart,
      path: '/flows/purchase-flow',
      status: 'ready',
      features: ['Secure payments', 'Access key distribution', 'License management', 'Escrow system']
    },
    {
      id: 4,
      title: 'Buyer End-to-End Journey',
      description: 'Complete buyer experience: View → Verify → Purchase → Access → Use Model.',
      icon: User,
      path: '/flows/buyer-journey',
      status: 'ready',
      features: ['Model discovery', 'Verification process', 'Seamless purchase', 'Model access']
    },
    {
      id: 5,
      title: 'Seller End-to-End Journey',
      description: 'Complete seller experience: Upload → Process → Verify → List → Monitor revenue.',
      icon: UserCheck,
      path: '/flows/seller-journey',
      status: 'ready',
      features: ['Model upload', 'TEE processing', 'Marketplace listing', 'Revenue tracking']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">ML Marketplace Flow Testing</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Test the five core flows of our secure ML marketplace built on the Sui stack with Walrus storage, 
              SEAL encryption, and Nautilus TEE verification.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Technology Stack Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Technology Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Database className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Walrus Storage</h3>
              <p className="text-sm text-gray-600">Decentralized storage with redundancy and efficient retrieval</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">SEAL Encryption</h3>
              <p className="text-sm text-gray-600">Programmable access control with identity-based encryption</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Nautilus TEE</h3>
              <p className="text-sm text-gray-600">Trusted execution in AWS Nitro Enclaves with attestation</p>
            </div>
          </div>
        </div>

        {/* Flow Cards */}
        <div className="space-y-6">
          {flows.map((flow) => {
            const IconComponent = flow.icon;
            
            return (
              <div key={flow.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            Flow {flow.id}: {flow.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            flow.status === 'ready' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {flow.status === 'ready' ? 'Ready' : 'In Development'}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{flow.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                          {flow.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-6">
                      <Link
                        href={flow.path}
                        className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                          flow.status === 'ready'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Test Flow
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Implementation Status */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Implementation Progress</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="font-medium text-gray-900">Flow 1: Dataset Upload & Verification</span>
              </div>
              <span className="text-green-600 font-medium">Completed</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                </div>
                <span className="font-medium text-gray-900">Flows 2-5: Implementation in Progress</span>
              </div>
              <span className="text-blue-600 font-medium">In Progress</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <strong>Note:</strong> Flow 1 is fully implemented and ready for testing. Flows 2-5 are being developed 
              based on the comprehensive research and implementation plans in the accelerator-redac folder.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/marketplace"
              className="text-center p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"
            >
              <p className="font-medium text-gray-900">Marketplace</p>
              <p className="text-sm text-gray-600">Browse models</p>
            </Link>
            <Link
              href="/upload"
              className="text-center p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"
            >
              <p className="font-medium text-gray-900">Upload</p>
              <p className="text-sm text-gray-600">Upload models</p>
            </Link>
            <Link
              href="/dashboard"
              className="text-center p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"
            >
              <p className="font-medium text-gray-900">Dashboard</p>
              <p className="text-sm text-gray-600">View activity</p>
            </Link>
            <Link
              href="/"
              className="text-center p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"
            >
              <p className="font-medium text-gray-900">Home</p>
              <p className="text-sm text-gray-600">Landing page</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}