'use client';

import { useState } from 'react';
import { TEEAttestationCard, TEEAttestationData } from './TEEAttestationCard';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

interface ModelVerificationFlowProps {
 modelBlobId: string;
 datasetBlobId?: string;
 modelName: string;
 modelFileSize?: number;
 datasetFileSize?: number;
 onVerificationComplete?: (attestationData: TEEAttestationData, txDigest: string) => void;
}

export function ModelVerificationFlow({
 modelBlobId,
 datasetBlobId,
 modelName,
 modelFileSize,
 datasetFileSize,
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
   modelFileSize: modelFileSize,
   datasetFileSize: datasetFileSize,
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
       setError(`Verification successful, but marketplace upload failed: ${error instanceof Error ? error.message : String(error)}`);
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
  <div className="space-y-8">
   <div className="card p-8">
    <h2 className="text-2xl font-russo text-secondary-900 mb-6">Model Verification</h2>
    
    <div className="space-y-6">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-surface-100 rounded-xl border border-border">
      <div className="flex flex-col space-y-1">
       <span className="form-label">Model Name</span>
       <span className="text-secondary-800 font-albert font-medium">{modelName}</span>
      </div>
      <div className="flex flex-col space-y-1">
       <span className="form-label">Model Blob ID</span>
       <div className="flex items-center space-x-2">
        <code className="text-xs bg-white border border-secondary-300 px-2 py-1 rounded-lg text-secondary-700 font-mono">
         {modelBlobId.substring(0, 16)}...
        </code>
       </div>
      </div>
      {datasetBlobId && (
       <div className="md:col-span-2 flex flex-col space-y-1">
        <span className="form-label">Dataset Blob ID</span>
        <code className="text-xs bg-white border border-secondary-300 px-2 py-1 rounded-lg text-secondary-700 font-mono w-fit">
         {datasetBlobId.substring(0, 16)}...
        </code>
       </div>
      )}
     </div>

     <div className="space-y-4">
      <button
       onClick={generateTEEAttestation}
       disabled={isGeneratingAttestation || !!attestationData}
       className={`w-full btn btn-lg ${
        isGeneratingAttestation || !!attestationData
         ? 'opacity-50 cursor-not-allowed bg-secondary-400'
         : 'btn-primary'
       }`}
      >
       {isGeneratingAttestation ? (
        <div className="flex items-center justify-center space-x-3">
         <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
         <span className="font-albert font-medium">Processing in TEE...</span>
        </div>
       ) : attestationData ? (
        <span className="font-albert font-medium">TEE Processing Complete</span>
       ) : (
        <span className="font-albert font-medium">Process in TEE</span>
       )}
      </button>

      {attestationData && !verificationResult && (
       <button
        onClick={verifyOnChain}
        disabled={isVerifyingOnChain || !account}
        className={`w-full btn btn-lg ${
         isVerifyingOnChain || !account
          ? 'opacity-50 cursor-not-allowed'
          : 'btn-secondary'
        }`}
       >
        {isVerifyingOnChain ? (
         <div className="flex items-center justify-center space-x-3">
          <div className="w-5 h-5 border-2 border-secondary-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-albert font-medium">Verifying on SUI Blockchain...</span>
         </div>
        ) : !account ? (
         <span className="font-albert font-medium">Connect Wallet to Verify</span>
        ) : (
         <span className="font-albert font-medium">Verify on SUI Blockchain</span>
        )}
       </button>
      )}

      {verificationResult && (
       <div className="bg-success-50 border border-success-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
         <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">✓</span>
         </div>
         <span className="font-albert font-semibold text-success-800">Blockchain Verification Complete</span>
        </div>
       </div>
      )}
     </div>
    </div>
   </div>

   {error && (
    <div className="bg-danger-50 border border-danger-200 rounded-xl p-6">
     <div className="flex items-start gap-3">
      <div className="w-6 h-6 bg-danger-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
       <span className="text-white text-sm font-bold">!</span>
      </div>
      <div>
       <h4 className="font-albert font-semibold text-danger-800 mb-1">Error Occurred</h4>
       <p className="font-albert text-danger-700">{error}</p>
      </div>
     </div>
    </div>
   )}

   <TEEAttestationCard
    attestationData={attestationData}
    isVerified={!!verificationResult}
    onVerifyOnChain={verifyOnChain}
    isVerifying={isVerifyingOnChain}
   />

   {verificationResult && (
    <div className="bg-success-50 border border-success-200 rounded-2xl p-6">
     <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-success-500 rounded-xl flex items-center justify-center flex-shrink-0">
       <span className="text-white text-lg font-bold">✓</span>
      </div>
      <div className="flex-1">
       <h4 className="font-russo text-lg text-success-800 mb-3">Blockchain Verification Complete!</h4>
       <div className="space-y-3">
        <div className="bg-surface-50 rounded-xl p-4">
         <div className="text-sm font-albert text-secondary-600 mb-1">Transaction Digest</div>
         <code className="text-xs font-mono bg-white border border-secondary-300 px-2 py-1 rounded text-secondary-700">
          {verificationResult.digest}
         </code>
        </div>
        <a 
         href={`https://explorer.sui.io/txblock/${verificationResult.digest}?network=testnet`}
         target="_blank"
         rel="noopener noreferrer"
         className="btn btn-secondary btn-sm"
        >
         View on SUI Explorer
        </a>
       </div>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}