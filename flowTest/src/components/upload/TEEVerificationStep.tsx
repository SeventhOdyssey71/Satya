'use client';

import React, { useState } from 'react';
import { TbShieldCheck, TbCertificate } from 'react-icons/tb';
import { ModelVerificationFlow, TEEAttestationData } from '@/components/tee';

interface TEEVerificationStepProps {
  data: any;
  onChange: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  isValid: boolean;
  onCancel: () => void;
  uploadedFiles?: {
    modelBlobId?: string;
    datasetBlobId?: string;
  };
}

interface StepNavigationProps {
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isValid: boolean;
  nextLabel?: string;
  onCancel?: () => void;
}

// Stub for StepNavigation - should be imported from the main file
function StepNavigation({ onNext, onPrev, isFirst, isValid, nextLabel = "Continue", onCancel }: StepNavigationProps) {
  return (
    <div className="flex justify-between pt-6">
      <div className="flex space-x-3">
        {!isFirst && (
          <button
            type="button"
            onClick={onPrev}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Previous
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!isValid}
        className={`px-4 py-2 text-sm font-medium rounded-md ${
          isValid
            ? 'text-white bg-gray-900 hover:bg-gray-800'
            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
        }`}
      >
        {nextLabel}
      </button>
    </div>
  );
}

export function TEEVerificationStep({
  data,
  onChange,
  onNext,
  onPrev,
  isFirst,
  isLast,
  isValid,
  onCancel,
  uploadedFiles
}: TEEVerificationStepProps) {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [attestationData, setAttestationData] = useState<TEEAttestationData | null>(null);
  const [blockchainTxDigest, setBlockchainTxDigest] = useState<string | null>(null);

  const handleVerificationComplete = (attestation: TEEAttestationData, txDigest: string) => {
    setAttestationData(attestation);
    setBlockchainTxDigest(txDigest);
    setVerificationStatus('verified');
    
    // Store verification data in the upload data
    onChange({
      teeAttestation: attestation,
      blockchainTxDigest: txDigest,
      verificationStatus: 'verified'
    });
  };

  const isStepValid = verificationStatus === 'verified' && !!blockchainTxDigest;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <TbShieldCheck className="h-5 w-5 mr-2 text-gray-600" />
          TEE Verification
        </h3>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <TbCertificate className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Required for Marketplace</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Your model must be verified using Trusted Execution Environment (TEE) attestation
                  before it can be published to the marketplace. This ensures model integrity and builds buyer trust.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4">
            <div>
              <span className="font-medium text-gray-700">Verification Process:</span>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• Model quality assessment</li>
                <li>• Cryptographic attestation</li>
                <li>• Blockchain verification</li>
              </ul>
            </div>
            <div>
              <span className="font-medium text-gray-700">Benefits:</span>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• Higher buyer confidence</li>
                <li>• Premium marketplace placement</li>
                <li>• Immutable proof of quality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {uploadedFiles?.modelBlobId ? (
        <ModelVerificationFlow
          modelBlobId={uploadedFiles.modelBlobId}
          datasetBlobId={uploadedFiles.datasetBlobId}
          modelName={data.title || 'Uploaded Model'}
          onVerificationComplete={handleVerificationComplete}
        />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Please complete the file upload step first to proceed with TEE verification.
          </p>
        </div>
      )}

      {verificationStatus === 'verified' && blockchainTxDigest && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <TbShieldCheck className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-green-900">Verification Complete!</h4>
              <p className="text-sm text-green-800 mt-1">
                Your model has been successfully verified and recorded on the SUI blockchain.
                It's ready to be published to the marketplace.
              </p>
            </div>
          </div>
        </div>
      )}

      <StepNavigation
        onNext={onNext}
        onPrev={onPrev}
        isFirst={isFirst}
        isValid={isStepValid}
        nextLabel="Continue to Review"
        onCancel={onCancel}
      />
    </div>
  );
}