'use client';

import { useState } from 'react';
import { TEEAttestationCard, TEEAttestationData } from './TEEAttestationCard';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

interface ModelVerificationFlowProps {
  modelBlobId: string;
  datasetBlobId?: string;
  modelName: string;
  onVerificationComplete?: (attestationData: TEEAttestationData, txDigest: string) => void;
}

export function ModelVerificationFlow({
  modelBlobId,
  datasetBlobId,
  modelName,
  onVerificationComplete
}: ModelVerificationFlowProps) {
  const [isGeneratingAttestation, setIsGeneratingAttestation] = useState(false);
  const [attestationData, setAttestationData] = useState<TEEAttestationData | null>(null);
  const [isVerifyingOnChain, setIsVerifyingOnChain] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();

  const PACKAGE_ID = "0x3bb585bfbc7c637bbfce62b92c8711bcbd752f48117d80477f4260f7dd9448fd"; // SUI testnet

  const uploadToMarketplace = async (attestationData: TEEAttestationData, txDigest: string) => {
    console.log('Uploading verified model to marketplace...');
    
    // Create marketplace listing with verified model data
    const listingData = {
      title: modelName,
      description: `Verified AI model with TEE attestation. Quality Score: ${(attestationData.ml_processing_result.quality_score * 100).toFixed(2)}%. Verified on SUI blockchain.`,
      category: 'Machine Learning',
      modelBlobId: modelBlobId,
      datasetBlobId: datasetBlobId,
      teeAttestation: attestationData,
      blockchainTxDigest: txDigest,
      verificationStatus: 'verified' as const,
      price: '1.0', // Default price - should be configurable
      isEncrypted: true,
      tags: ['AI', 'TEE-Verified', 'Blockchain-Attested']
    };

    // Upload to marketplace API
    const response = await fetch('/api/marketplace/create-listing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Marketplace upload failed');
    }

    const result = await response.json();
    console.log('Model successfully uploaded to marketplace:', result);
    return result;
  };

  const generateTEEAttestation = async () => {
    setIsGeneratingAttestation(true);
    setError(null);

    try {
      console.log('Starting real TEE verification for blobs:', { modelBlobId, datasetBlobId });

      // Step 1: Decrypt blobs and process in TEE using real blob IDs
      const decryptResponse = await fetch('/api/decrypt-blobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_blob_id: modelBlobId,
          dataset_blob_id: datasetBlobId
        }),
      });

      if (!decryptResponse.ok) {
        throw new Error('Failed to decrypt blobs from Walrus storage');
      }

      const { decrypted_model_data, decrypted_dataset_data } = await decryptResponse.json();
      console.log('Successfully decrypted blobs');

      // Step 2: Process decrypted data in TEE
      const teeResponse = await fetch('http://localhost:5001/complete_verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decrypted_model_data,
          decrypted_dataset_data,
          model_blob_id: modelBlobId,
          dataset_blob_id: datasetBlobId,
          assessment_type: 'marketplace_verification',
          use_decrypted_data: true
        }),
      });

      if (!teeResponse.ok) {
        throw new Error('TEE attestation generation failed');
      }

      const attestation = await teeResponse.json();
      console.log('Real TEE attestation generated:', attestation);
      setAttestationData(attestation);

    } catch (err) {
      console.error('Attestation generation failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGeneratingAttestation(false);
    }
  };

  const verifyOnChain = async () => {
    if (!account || !attestationData) {
      setError('Please connect wallet and generate attestation first');
      return;
    }

    setIsVerifyingOnChain(true);
    setError(null);

    try {
      const transaction = new Transaction();
      
      // Convert quality score to basis points
      const qualityScoreBP = Math.floor(attestationData.ml_processing_result.quality_score * 10000);
      
      // Convert hex strings to vector<u8> format
      const pcr0 = Array.from(Buffer.from(attestationData.tee_attestation.pcr0, 'hex'));
      const pcr1 = Array.from(Buffer.from(attestationData.tee_attestation.pcr1, 'hex'));
      const pcr2 = Array.from(Buffer.from(attestationData.tee_attestation.pcr2, 'hex'));
      const pcr8 = Array.from(Buffer.from(attestationData.tee_attestation.pcr8, 'hex'));
      const attestationSig = Array.from(Buffer.from(attestationData.tee_attestation.signature, 'hex'));
      const mlSig = Array.from(Buffer.from(attestationData.ml_processing_result.signature, 'hex'));
      
      const attestationTimestamp = Math.floor(new Date(attestationData.tee_attestation.timestamp).getTime() / 1000);
      
      transaction.moveCall({
        target: `${PACKAGE_ID}::tee_verification::complete_verification`,
        arguments: [
          transaction.pure.vector('u8', pcr0),
          transaction.pure.vector('u8', pcr1),
          transaction.pure.vector('u8', pcr2),
          transaction.pure.vector('u8', pcr8),
          transaction.pure.vector('u8', attestationSig),
          transaction.pure.u64(attestationTimestamp),
          transaction.pure.string(attestationData.ml_processing_result.request_id),
          transaction.pure.string(attestationData.ml_processing_result.model_hash),
          transaction.pure.u64(qualityScoreBP),
          transaction.pure.vector('u8', mlSig),
          transaction.pure.u64(Math.floor(Date.now() / 1000))
        ],
      });

      signAndExecuteTransaction(
        { transaction },
        {
          onSuccess: async (result) => {
            console.log('On-chain verification successful:', result);
            setVerificationResult(result);
            
            // Step 3: Upload verified model to marketplace
            try {
              await uploadToMarketplace(attestationData, result.digest);
              
              // Call completion callback
              if (onVerificationComplete) {
                onVerificationComplete(attestationData, result.digest);
              }
            } catch (error) {
              console.error('Marketplace upload failed:', error);
              setError(`Verification successful, but marketplace upload failed: ${error.message}`);
            }
          },
          onError: (error) => {
            console.error('On-chain verification failed:', error);
            setError(`Transaction failed: ${error.message}`);
          },
        }
      );
    } catch (err) {
      console.error('Error preparing transaction:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsVerifyingOnChain(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Model Verification</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Model:</span>
              <span className="ml-2 text-gray-600">{modelName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Model Blob ID:</span>
              <span className="ml-2 font-mono text-gray-600 break-all">{modelBlobId.substring(0, 16)}...</span>
            </div>
            {datasetBlobId && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Dataset Blob ID:</span>
                <span className="ml-2 font-mono text-gray-600 break-all">{datasetBlobId.substring(0, 16)}...</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={generateTEEAttestation}
              disabled={isGeneratingAttestation || !!attestationData}
              className={`w-full px-4 py-3 rounded-lg font-medium text-white transition-colors ${
                isGeneratingAttestation || !!attestationData
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isGeneratingAttestation ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing in TEE...</span>
                </div>
              ) : attestationData ? (
                '✅ TEE Processing Complete'
              ) : (
                '🧠 Process in TEE'
              )}
            </button>

            {attestationData && !verificationResult && (
              <button
                onClick={verifyOnChain}
                disabled={isVerifyingOnChain || !account}
                className={`w-full px-4 py-3 rounded-lg font-medium text-white transition-colors ${
                  isVerifyingOnChain || !account
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isVerifyingOnChain ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying on SUI Blockchain...</span>
                  </div>
                ) : !account ? (
                  '🔒 Connect Wallet to Verify'
                ) : (
                  '🔗 Verify on SUI Blockchain'
                )}
              </button>
            )}

            {verificationResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-green-600">✅</span>
                  <span className="font-medium">Blockchain Verification Complete!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <TEEAttestationCard
        attestationData={attestationData}
        isVerified={!!verificationResult}
        onVerifyOnChain={verifyOnChain}
        isVerifying={isVerifyingOnChain}
      />

      {verificationResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2">✅ Blockchain Verification Complete!</h4>
          <div className="text-xs text-green-700 space-y-1">
            <div>Transaction Digest: {verificationResult.digest}</div>
            <div>
              <a 
                href={`https://explorer.sui.io/txblock/${verificationResult.digest}?network=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View on SUI Explorer
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}