'use client';

import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { ExternalLink } from 'lucide-react';

interface TEEResult {
 request_id: string;
 ml_processing_result: {
  request_id: string;
  model_hash: string;
  quality_score: number;
  signature: string;
 };
 tee_attestation: {
  pcr0: string;
  pcr1: string;
  pcr2: string;
  pcr8: string;
  signature: string;
  timestamp: string;
 };
 verification_metadata: {
  enclave_id: string;
 };
}

interface OnChainVerificationProps {
 teeResult: TEEResult | null;
 onVerificationComplete?: (digest: string) => void;
}

export function OnChainVerification({ teeResult, onVerificationComplete }: OnChainVerificationProps) {
 const [isVerifying, setIsVerifying] = useState(false);
 const [verificationResult, setVerificationResult] = useState<any>(null);
 const [error, setError] = useState<string | null>(null);
 
 const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
 const account = useCurrentAccount();

 // Using the flowTest onchain_verification.move package ID
 const PACKAGE_ID = "0x3bb585bfbc7c637bbfce62b92c8711bcbd752f48117d80477f4260f7dd9448fd";

 const handleOnChainVerification = async () => {
  if (!account || !teeResult) {
   setError('Please connect wallet and run TEE computation first');
   return;
  }

  setIsVerifying(true);
  setError(null);

  try {
   const transaction = new Transaction();
   
   // Convert quality score to basis points
   const qualityScoreBP = Math.floor(teeResult.ml_processing_result.quality_score * 10000);
   
   // Convert hex strings to vector<u8> format
   const pcr0 = Array.from(Buffer.from(teeResult.tee_attestation.pcr0, 'hex'));
   const pcr1 = Array.from(Buffer.from(teeResult.tee_attestation.pcr1, 'hex'));
   const pcr2 = Array.from(Buffer.from(teeResult.tee_attestation.pcr2, 'hex'));
   const pcr8 = Array.from(Buffer.from(teeResult.tee_attestation.pcr8, 'hex'));
   const attestationSig = Array.from(Buffer.from(teeResult.tee_attestation.signature, 'hex'));
   const mlSig = Array.from(Buffer.from(teeResult.ml_processing_result.signature, 'hex'));
   
   const attestationTimestamp = Math.floor(new Date(teeResult.tee_attestation.timestamp).getTime() / 1000);
   
   transaction.moveCall({
    target: `${PACKAGE_ID}::tee_verification::complete_verification`,
    arguments: [
     transaction.pure.vector('u8', pcr0),
     transaction.pure.vector('u8', pcr1),
     transaction.pure.vector('u8', pcr2),
     transaction.pure.vector('u8', pcr8),
     transaction.pure.vector('u8', attestationSig),
     transaction.pure.u64(attestationTimestamp),
     transaction.pure.string(teeResult.ml_processing_result.request_id),
     transaction.pure.string(teeResult.ml_processing_result.model_hash),
     transaction.pure.u64(qualityScoreBP),
     transaction.pure.vector('u8', mlSig),
     transaction.pure.u64(Math.floor(Date.now() / 1000))
    ],
   });

   signAndExecuteTransaction(
    { transaction },
    {
     onSuccess: (result) => {
      console.log('On-chain verification successful:', result);
      setVerificationResult(result);
      setIsVerifying(false);
      if (onVerificationComplete) {
       onVerificationComplete(result.digest);
      }
     },
     onError: (error) => {
      console.error('On-chain verification failed:', error);
      setError(`Transaction failed: ${error.message}`);
      setIsVerifying(false);
     },
    }
   );
  } catch (err) {
   console.error('Error preparing transaction:', err);
   setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
   setIsVerifying(false);
  }
 };

 if (!account) {
  return (
   <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-2">On-Chain Verification</h3>
    <p className="text-gray-600">Connect your wallet to verify TEE results on SUI blockchain</p>
   </div>
  );
 }

 if (!teeResult) {
  return (
   <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-2">On-Chain Verification</h3>
    <p className="text-gray-600">Run TEE computation first to get results for verification</p>
   </div>
  );
 }

 return (
  <div className="bg-white rounded-lg border p-6">
   <h3 className="text-lg font-semibold text-gray-800 mb-4">On-Chain Verification</h3>
   
   <div className="space-y-4">
    <div className="bg-gray-50 rounded-lg p-4">
     <h4 className="text-sm font-semibold text-gray-700 mb-2">TEE Attestation Data</h4>
     <div className="text-xs text-gray-600 space-y-1">
      <div>Request ID: {teeResult.request_id}</div>
      <div>Enclave ID: {teeResult.verification_metadata.enclave_id}</div>
      <div>Model Hash: {teeResult.ml_processing_result.model_hash}</div>
      <div>Quality Score: {(teeResult.ml_processing_result.quality_score * 100).toFixed(1)}%</div>
      <div>PCR0: {teeResult.tee_attestation.pcr0.slice(0, 16)}...</div>
     </div>
    </div>

    <button
     onClick={handleOnChainVerification}
     disabled={isVerifying}
     className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-colors ${
      isVerifying
       ? 'bg-gray-400 cursor-not-allowed'
       : 'bg-blue-600 hover:bg-blue-700'
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

    {error && (
     <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <p className="text-sm text-red-600">{error}</p>
     </div>
    )}

    {verificationResult && (
     <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-green-800 mb-2">Verification Successful!</h4>
      <div className="text-xs text-green-700 space-y-1">
       <div>Transaction Digest: {verificationResult.digest}</div>
       <div>
        <a 
         href={`https://testnet.suivision.xyz/txblock/${verificationResult.digest}`}
         target="_blank"
         rel="noopener noreferrer"
         className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
         View on SuiVision Explorer
         <ExternalLink className="w-3 h-3" />
        </a>
       </div>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}