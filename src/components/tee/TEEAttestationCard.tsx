'use client';

import { useState } from 'react';

export interface TEEAttestationData {
 request_id: string;
 tee_attestation: {
  pcr0: string;
  pcr1: string;
  pcr2: string;
  pcr8: string;
  signature: string;
  timestamp: string;
  enclave_id: string;
 };
 ml_processing_result: {
  request_id: string;
  model_hash: string;
  quality_score: number;
  predictions: number[];
  confidence: number;
  signature: string;
 };
 verification_metadata: {
  enclave_id: string;
  source: string;
  timestamp: string;
  model_path?: string;
  attestation_type: string;
 };
}

interface TEEAttestationCardProps {
 attestationData: TEEAttestationData | null;
 isVerified?: boolean;
 onVerifyOnChain?: () => void;
 isVerifying?: boolean;
}

export function TEEAttestationCard({ 
 attestationData, 
 isVerified = false, 
 onVerifyOnChain,
 isVerifying = false 
}: TEEAttestationCardProps) {
 
 if (!attestationData) {
  return (
   <div className="bg-secondary-50 rounded-lg border border-secondary-200 p-6">
    <h3 className="text-lg font-semibold text-secondary-800 mb-2">TEE Attestation</h3>
    <p className="text-secondary-600">Run model verification to generate attestation data</p>
   </div>
  );
 }

 const qualityPercent = (attestationData.ml_processing_result.quality_score * 100).toFixed(1);

 return (
  <div className="bg-white rounded-lg border border-secondary-200 p-6 space-y-4">
   <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-secondary-900">TEE Attestation Data</h3>
    {isVerified && (
     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-secondary-300 text-secondary-800">
      Verified
     </span>
    )}
   </div>

   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
    <div className="space-y-2">
     <div>
      <span className="font-medium text-secondary-700">Request ID:</span>
      <span className="ml-2 font-mono text-secondary-600">{attestationData.request_id}</span>
     </div>
     
     <div>
      <span className="font-medium text-secondary-700">Enclave ID:</span>
      <span className="ml-2 font-mono text-secondary-600">{attestationData.verification_metadata.enclave_id}</span>
     </div>

     <div>
      <span className="font-medium text-secondary-700">Model Hash:</span>
      <span className="ml-2 font-mono text-secondary-600 break-all">
       {attestationData.ml_processing_result.model_hash.substring(0, 32)}...
      </span>
     </div>
    </div>

    <div className="space-y-2">
     <div>
      <span className="font-medium text-secondary-700">Quality Score:</span>
      <span className="ml-2 font-semibold text-secondary-800">{qualityPercent}%</span>
     </div>

     <div>
      <span className="font-medium text-secondary-700">PCR0:</span>
      <span className="ml-2 font-mono text-secondary-600">
       {attestationData.tee_attestation.pcr0.substring(0, 16)}...
      </span>
     </div>

     <div>
      <span className="font-medium text-secondary-700">Source:</span>
      <span className="ml-2 text-secondary-600">{attestationData.verification_metadata.source}</span>
     </div>
    </div>
   </div>

   <div className="bg-secondary-50 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-secondary-800 mb-2">Cryptographic Signatures</h4>
    <div className="space-y-1 text-xs">
     <div>
      <span className="font-medium text-secondary-700">TEE Signature:</span>
      <span className="ml-2 font-mono text-secondary-600 break-all">
       {attestationData.tee_attestation.signature.substring(0, 32)}...
      </span>
     </div>
     <div>
      <span className="font-medium text-secondary-700">ML Signature:</span>
      <span className="ml-2 font-mono text-secondary-600 break-all">
       {attestationData.ml_processing_result.signature.substring(0, 32)}...
      </span>
     </div>
    </div>
   </div>

   {onVerifyOnChain && !isVerified && (
    <button
     onClick={onVerifyOnChain}
     disabled={isVerifying}
     className={`w-full px-4 py-2 rounded-lg font-medium text-white transition-colors ${
      isVerifying
       ? 'bg-secondary-400 cursor-not-allowed'
       : 'bg-black hover:bg-secondary-900'
     }`}
    >
     {isVerifying ? (
      <div className="flex items-center justify-center space-x-2">
       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
       <span>Submitting to SUI Blockchain...</span>
      </div>
     ) : (
      'Verify on SUI Blockchain'
     )}
    </button>
   )}

   {isVerified && (
    <div className="bg-secondary-100 border border-secondary-200 rounded-lg p-3">
     <p className="text-sm text-secondary-800 font-medium">
      Successfully verified on SUI blockchain
     </p>
    </div>
   )}
  </div>
 );
}