import { useState, useCallback } from 'react';
import { useNautilusContext } from './context';
import { DatasetUploadData, DatasetVerificationResult, AttestationDocument } from './client';

export function useNautilusVerification() {
 const { client, addVerificationToHistory } = useNautilusContext();
 const [isVerifying, setIsVerifying] = useState(false);
 const [verificationProgress, setVerificationProgress] = useState(0);
 const [currentVerificationId, setCurrentVerificationId] = useState<string | null>(null);

 const verifyDataset = useCallback(async (
  file: File,
  metadata: DatasetUploadData
 ): Promise<DatasetVerificationResult> => {
  if (!client) {
   throw new Error('Nautilus client not initialized');
  }

  setIsVerifying(true);
  setVerificationProgress(0);
  
  try {
   console.log('Starting dataset verification with Nautilus...');
   
   // Step 1: Upload to enclave
   setVerificationProgress(20);
   const result = await client.uploadDatasetForVerification(file, metadata);
   
   if (!result.success) {
    throw new Error(result.error || 'Verification failed');
   }

   setCurrentVerificationId(result.verificationId);
   setVerificationProgress(50);
   
   // Step 2: Poll for completion
   const finalResult = await pollVerificationStatus(result.verificationId);
   setVerificationProgress(100);
   
   // Add to history
   addVerificationToHistory({
    id: result.verificationId,
    datasetName: metadata.name,
    status: finalResult.success ? 'verified' : 'failed',
    timestamp: Date.now(),
    attestationId: finalResult.attestationDocument?.moduleId,
    error: finalResult.error
   });
   
   console.log('Dataset verification completed successfully');
   return finalResult;
   
  } catch (error) {
   console.error('Dataset verification failed:', error);
   
   const errorResult: DatasetVerificationResult = {
    success: false,
    verificationId: '',
    attestationDocument: null,
    integrity_hash: '',
    timestamp: Date.now(),
    error: error instanceof Error ? error.message : 'Unknown error'
   };
   
   addVerificationToHistory({
    id: 'error-' + Date.now(),
    datasetName: metadata.name,
    status: 'failed',
    timestamp: Date.now(),
    error: errorResult.error
   });
   
   return errorResult;
   
  } finally {
   setIsVerifying(false);
   setVerificationProgress(0);
   setCurrentVerificationId(null);
  }
 }, [client, addVerificationToHistory]);

 const pollVerificationStatus = useCallback(async (
  verificationId: string
 ): Promise<DatasetVerificationResult> => {
  if (!client) {
   throw new Error('Nautilus client not initialized');
  }

  const maxAttempts = 30; // 5 minutes max (10 second intervals)
  let attempts = 0;

  while (attempts < maxAttempts) {
   try {
    const status = await client.getVerificationStatus(verificationId);
    
    setVerificationProgress(50 + (attempts / maxAttempts) * 40);
    
    if (status.status === 'completed' && status.attestation) {
     return {
      success: true,
      verificationId,
      attestationDocument: status.attestation,
      integrity_hash: status.attestation.user_data,
      timestamp: Date.now()
     };
    }
    
    if (status.status === 'failed') {
     throw new Error(status.message || 'Verification failed in enclave');
    }
    
    // Still pending, wait and retry
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second intervals
    attempts++;
    
   } catch (error) {
    console.error('Polling error:', error);
    throw error;
   }
  }
  
  throw new Error('Verification timeout - process took too long');
 }, [client]);

 const validateAttestation = useCallback(async (
  attestation: AttestationDocument
 ): Promise<boolean> => {
  if (!client) {
   throw new Error('Nautilus client not initialized');
  }

  try {
   return await client.validateAttestationDocument(attestation);
  } catch (error) {
   console.error('Attestation validation failed:', error);
   return false;
  }
 }, [client]);

 const checkDatasetIntegrity = useCallback(async (
  verificationId: string,
  expectedHash: string
 ) => {
  if (!client) {
   throw new Error('Nautilus client not initialized');
  }

  try {
   return await client.verifyDatasetIntegrity(verificationId, expectedHash);
  } catch (error) {
   console.error('Dataset integrity check failed:', error);
   return {
    valid: false,
    attestation: null,
    error: error instanceof Error ? error.message : 'Integrity check failed'
   };
  }
 }, [client]);

 return {
  verifyDataset,
  validateAttestation,
  checkDatasetIntegrity,
  isVerifying,
  verificationProgress,
  currentVerificationId
 };
}