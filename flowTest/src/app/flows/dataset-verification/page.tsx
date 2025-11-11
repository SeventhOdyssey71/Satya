'use client'

import React, { useState } from 'react';
import { DatasetUploadWizard } from '@/components/dataset';
import { DatasetVerificationResult } from '@/lib/integrations/nautilus/client';
import { ArrowLeft, Shield, Database, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Disable static generation to avoid Walrus WASM loading issues during build
export const dynamic = 'force-dynamic'

export default function DatasetVerificationFlowPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [completedVerifications, setCompletedVerifications] = useState<DatasetVerificationResult[]>([]);

  const handleUploadComplete = (result: DatasetVerificationResult) => {
    if (result.success) {
      setCompletedVerifications(prev => [...prev, result]);
    }
    setShowWizard(false);
  };

  if (showWizard) {
    return (
      <DatasetUploadWizard
        onUploadComplete={handleUploadComplete}
        onCancel={() => setShowWizard(false)}
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
              <h1 className="text-2xl font-bold text-gray-900">Dataset Verification Flow</h1>
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
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Flow 1: Dataset Upload & Nautilus Verification</h2>
              <p className="text-gray-600 mb-4">
                This flow demonstrates secure dataset upload and verification using Nautilus TEE (Trusted Execution Environment) 
                technology. Datasets are processed in AWS Nitro Enclaves to ensure integrity and generate cryptographic attestations.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Database className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Secure Upload</p>
                    <p className="text-xs text-gray-600">Files processed in isolated enclave</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">TEE Verification</p>
                    <p className="text-xs text-gray-600">Cryptographic integrity proofs</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Attestation Storage</p>
                    <p className="text-xs text-gray-600">Permanent verification records</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Dataset Verification</h3>
            <p className="text-gray-600 mb-6">
              Upload a dataset file to begin the secure verification process
            </p>
            
            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Shield className="w-5 h-5 mr-2" />
              Upload & Verify Dataset
            </button>
          </div>
        </div>

        {/* Completed Verifications */}
        {completedVerifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Verifications</h3>
            
            <div className="space-y-4">
              {completedVerifications.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">Verification #{index + 1}</p>
                        <p className="text-sm text-gray-600">
                          Completed {new Date(result.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Verified
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Verification ID:</span>
                      <p className="font-mono text-xs text-gray-900 mt-1 break-all">
                        {result.verificationId}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Integrity Hash:</span>
                      <p className="font-mono text-xs text-gray-900 mt-1 break-all">
                        {result.integrity_hash}
                      </p>
                    </div>
                  </div>
                  
                  {result.attestationDocument && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="font-medium text-gray-700 mb-2">Attestation Details:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="font-medium">Module ID:</span>
                          <p className="font-mono text-gray-600 break-all">
                            {result.attestationDocument.moduleId}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">PCR0:</span>
                          <p className="font-mono text-gray-600 break-all">
                            {result.attestationDocument.pcr0.substring(0, 16)}...
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Timestamp:</span>
                          <p className="text-gray-600">
                            {new Date(result.attestationDocument.timestamp).toLocaleString()}
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

        {/* Technical Information */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Implementation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Security Features:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• AWS Nitro Enclave isolation</li>
                <li>• Cryptographic attestation generation</li>
                <li>• Integrity hash verification</li>
                <li>• PCR (Platform Configuration Register) validation</li>
                <li>• Tamper-proof execution environment</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Process Flow:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>1. Dataset upload to secure enclave</li>
                <li>2. Integrity hash calculation</li>
                <li>3. TEE-based verification process</li>
                <li>4. Attestation document generation</li>
                <li>5. Cryptographic proof storage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}