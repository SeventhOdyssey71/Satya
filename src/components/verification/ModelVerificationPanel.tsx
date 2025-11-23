'use client'

import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Clock, Download, ExternalLink, Lock, Key } from 'lucide-react';
import { useNautilusVerification } from '@/lib/integrations/nautilus/hooks';
import { AttestationDocument } from '@/lib/integrations/nautilus/client';

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

interface ModelVerificationPanelProps {
 model: ModelData;
 onVerificationComplete?: (attestation: AttestationDocument) => void;
}

const ModelVerificationPanel: React.FC<ModelVerificationPanelProps> = ({
 model,
 onVerificationComplete
}) => {
 const [isVerifying, setIsVerifying] = useState(false);
 const [verificationResult, setVerificationResult] = useState<{
  status: 'success' | 'error' | null;
  attestation: AttestationDocument | null;
  error?: string;
 }>({ status: null, attestation: null });

 const { validateAttestation, checkDatasetIntegrity } = useNautilusVerification();

 // Mock attestation data - in production this would come from the actual Nautilus service
 const mockAttestationDocument: AttestationDocument = {
  moduleId: `model-${model.id}-verification`,
  pcr0: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f",
  pcr1: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f", 
  pcr2: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f",
  public_key: "030123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01",
  user_data: model.integrityHash,
  nonce: "1234567890abcdef",
  timestamp: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
  signature: "3045022100891234567890abcdef0123456789abcdef0123456789abcdef0123456789abcdef0102200987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba09",
  certificate: "-----BEGIN CERTIFICATE-----\nMIICXjCCAUYCAQAwDQYJKoZIhvcNAQELBQAwEjEQMA4GA1UEAwwHcm9vdC1jYTAeFw0yMzExMTEwNTAwMDBaFw0zMzExMTEwNTAwMDBaMBIxEDAOBgNVBAMMB3Jvb3QtY2EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC8\n-----END CERTIFICATE-----"
 };

 const handleVerifyModel = async () => {
  setIsVerifying(true);
  setVerificationResult({ status: null, attestation: null });

  try {
   // Simulate API call delay
   await new Promise(resolve => setTimeout(resolve, 2000));

   // Step 1: Retrieve pre-generated attestation
   console.log('Retrieving pre-generated attestation...');
   
   // In production, this would fetch from Nautilus attestation storage
   const attestation = mockAttestationDocument;

   // Step 2: Validate attestation document
   console.log('Validating attestation document...');
   const isValid = await validateAttestation(attestation);
   
   if (!isValid) {
    throw new Error('Attestation validation failed - invalid signature or PCR values');
   }

   // Step 3: Verify integrity hash matches
   console.log('Verifying model integrity...');
   const integrityResult = await checkDatasetIntegrity(
    model.attestationId || model.id,
    model.integrityHash
   );

   if (!integrityResult.valid) {
    throw new Error(integrityResult.error || 'Model integrity verification failed');
   }

   console.log('Model verification successful!');
   
   setVerificationResult({
    status: 'success',
    attestation: attestation
   });

   onVerificationComplete?.(attestation);

  } catch (error) {
   console.error('Model verification failed:', error);
   
   setVerificationResult({
    status: 'error',
    attestation: null,
    error: error instanceof Error ? error.message : 'Verification failed'
   });
  } finally {
   setIsVerifying(false);
  }
 };

 const getVerificationStatusIcon = () => {
  if (isVerifying) {
   return <Clock className="w-6 h-6 text-blue-500 animate-spin" />;
  }
  
  switch (verificationResult.status) {
   case 'success':
    return <CheckCircle className="w-6 h-6 text-green-500" />;
   case 'error':
    return <AlertCircle className="w-6 h-6 text-red-500" />;
   default:
    return model.verificationStatus === 'verified' 
     ? <CheckCircle className="w-6 h-6 text-green-500" />
     : <Shield className="w-6 h-6 text-gray-400" />;
  }
 };

 const getVerificationStatusText = () => {
  if (isVerifying) return 'Verifying model...';
  
  switch (verificationResult.status) {
   case 'success':
    return 'Model verified successfully';
   case 'error':
    return verificationResult.error || 'Verification failed';
   default:
    return model.verificationStatus === 'verified' 
     ? 'Previously verified'
     : 'Not verified';
  }
 };

 const formatPCRValue = (pcr: string) => {
  return `${pcr.substring(0, 8)}...${pcr.substring(pcr.length - 8)}`;
 };

 return (
  <div className="bg-white rounded-lg border shadow-sm p-6">
   {/* Header */}
   <div className="flex items-center justify-between mb-6">
    <div className="flex items-center space-x-3">
     <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
      <Shield className="w-6 h-6 text-blue-600" />
     </div>
     <div>
      <h3 className="text-lg font-semibold text-gray-900">Model Verification</h3>
      <p className="text-sm text-gray-600">Verify model integrity with TEE attestation</p>
     </div>
    </div>
    
    <div className="flex items-center space-x-2">
     {getVerificationStatusIcon()}
     <span className={`text-sm font-medium ${
      verificationResult.status === 'success' || model.verificationStatus === 'verified'
       ? 'text-green-700'
       : verificationResult.status === 'error'
       ? 'text-red-700'
       : 'text-gray-600'
     }`}>
      {getVerificationStatusText()}
     </span>
    </div>
   </div>

   {/* Model Information */}
   <div className="bg-gray-50 rounded-lg p-4 mb-6">
    <h4 className="font-medium text-gray-900 mb-3">Model Information</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
     <div>
      <span className="font-medium text-gray-700">Name:</span>
      <p className="text-gray-900">{model.name}</p>
     </div>
     <div>
      <span className="font-medium text-gray-700">Category:</span>
      <p className="text-gray-900">{model.category}</p>
     </div>
     <div>
      <span className="font-medium text-gray-700">Size:</span>
      <p className="text-gray-900">{model.size}</p>
     </div>
     <div>
      <span className="font-medium text-gray-700">Upload Date:</span>
      <p className="text-gray-900">{model.uploadDate}</p>
     </div>
     <div className="md:col-span-2">
      <span className="font-medium text-gray-700">Integrity Hash:</span>
      <p className="font-mono text-xs text-gray-900 mt-1 break-all">{model.integrityHash}</p>
     </div>
    </div>
   </div>

   {/* Verification Action */}
   {!verificationResult.status && model.verificationStatus !== 'verified' && (
    <div className="text-center py-6">
     <p className="text-gray-600 mb-4">
      This model was processed in a secure AWS Nitro Enclave. Click below to retrieve and verify the attestation.
     </p>
     
     <button
      onClick={handleVerifyModel}
      disabled={isVerifying}
      className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
       isVerifying
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
     >
      {isVerifying ? (
       <>
        <Clock className="w-5 h-5 mr-2 animate-spin" />
        Verifying...
       </>
      ) : (
       <>
        <Shield className="w-5 h-5 mr-2" />
        Verify Model
       </>
      )}
     </button>
    </div>
   )}

   {/* Verification Results */}
   {(verificationResult.status === 'success' || model.verificationStatus === 'verified') && (
    <div className="space-y-4">
     <div className="bg-green-50 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
       <CheckCircle className="w-5 h-5 text-green-500" />
       <span className="font-medium text-green-700">Verification Successful</span>
      </div>
      <p className="text-green-700 text-sm">
       This model has been verified to have executed in a secure AWS Nitro Enclave with cryptographic proof of integrity.
      </p>
     </div>

     {verificationResult.attestation && (
      <div className="border border-gray-200 rounded-lg p-4">
       <h4 className="font-medium text-gray-900 mb-3">Attestation Details</h4>
       
       <div className="space-y-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
          <span className="font-medium text-gray-700">Module ID:</span>
          <p className="font-mono text-xs text-gray-900 mt-1">
           {verificationResult.attestation.moduleId}
          </p>
         </div>
         <div>
          <span className="font-medium text-gray-700">Timestamp:</span>
          <p className="text-gray-900">
           {new Date(verificationResult.attestation.timestamp).toLocaleString()}
          </p>
         </div>
        </div>

        <div>
         <span className="font-medium text-gray-700">Platform Configuration Registers (PCRs):</span>
         <div className="mt-2 space-y-1 text-xs">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
           <span className="font-medium">PCR0 (Image):</span>
           <span className="font-mono">{formatPCRValue(verificationResult.attestation.pcr0)}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
           <span className="font-medium">PCR1 (Kernel):</span>
           <span className="font-mono">{formatPCRValue(verificationResult.attestation.pcr1)}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
           <span className="font-medium">PCR2 (Application):</span>
           <span className="font-mono">{formatPCRValue(verificationResult.attestation.pcr2)}</span>
          </div>
         </div>
        </div>

        <div>
         <span className="font-medium text-gray-700">Public Key:</span>
         <p className="font-mono text-xs text-gray-900 mt-1 break-all">
          {verificationResult.attestation.public_key}
         </p>
        </div>

        <div>
         <span className="font-medium text-gray-700">Signature:</span>
         <p className="font-mono text-xs text-gray-900 mt-1 break-all">
          {verificationResult.attestation.signature.substring(0, 64)}...
         </p>
        </div>
       </div>

       {/* Action Buttons */}
       <div className="flex space-x-3 mt-6">
        <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
         <Download className="w-4 h-4 mr-2" />
         Download Attestation
        </button>
        <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
         <ExternalLink className="w-4 h-4 mr-2" />
         View Certificate
        </button>
       </div>
      </div>
     )}
    </div>
   )}

   {/* Error State */}
   {verificationResult.status === 'error' && (
    <div className="bg-red-50 rounded-lg p-4">
     <div className="flex items-center space-x-2 mb-2">
      <AlertCircle className="w-5 h-5 text-red-500" />
      <span className="font-medium text-red-700">Verification Failed</span>
     </div>
     <p className="text-red-700 text-sm mb-3">
      {verificationResult.error}
     </p>
     <button
      onClick={handleVerifyModel}
      className="text-red-600 hover:text-red-700 text-sm font-medium"
     >
      Try Again
     </button>
    </div>
   )}

   {/* Security Information */}
   <div className="mt-6 pt-6 border-t border-gray-200">
    <h4 className="font-medium text-gray-900 mb-3">Security Guarantees</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
     <div className="flex items-start space-x-3">
      <Lock className="w-5 h-5 text-gray-400 mt-0.5" />
      <div>
       <p className="font-medium text-gray-700">Isolated Execution</p>
       <p className="text-gray-600">Model processed in AWS Nitro Enclave</p>
      </div>
     </div>
     <div className="flex items-start space-x-3">
      <Key className="w-5 h-5 text-gray-400 mt-0.5" />
      <div>
       <p className="font-medium text-gray-700">Cryptographic Proof</p>
       <p className="text-gray-600">Hardware-signed attestation document</p>
      </div>
     </div>
     <div className="flex items-start space-x-3">
      <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
      <div>
       <p className="font-medium text-gray-700">Integrity Verified</p>
       <p className="text-gray-600">Model hash matches execution result</p>
      </div>
     </div>
     <div className="flex items-start space-x-3">
      <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
      <div>
       <p className="font-medium text-gray-700">Tamper-Proof</p>
       <p className="text-gray-600">Execution environment cannot be modified</p>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
};

export default ModelVerificationPanel;