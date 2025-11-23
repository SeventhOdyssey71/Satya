// Debug API endpoint for testing the complete upload flow
import { NextRequest, NextResponse } from 'next/server';
import { ModelUploadService } from '@/lib/services/model-upload.service';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export async function POST(request: NextRequest) {
 try {
  const { uploadData, debug } = await request.json();
  
  console.log('DEBUG: Testing full upload flow...');
  console.log('DEBUG: Upload data:', uploadData);
  
  if (debug) {
   // Create debug version without actual file upload
   
   // Create test signer
   const keypair = new Ed25519Keypair();
   console.log('DEBUG: Created test keypair');
   
   // Create test file object
   const mockFile = {
    name: 'debug-test.json',
    size: 1024,
    type: 'application/json'
   };
   
   const testUploadData = {
    ...uploadData,
    modelFile: mockFile // Mock file for testing
   };
   
   console.log('DEBUG: Created test upload data:', testUploadData);
   
   // Test each phase individually
   try {
    console.log('DEBUG: Phase 1 - Creating upload service...');
    const modelUploadService = await ModelUploadService.createWithFallback();
    console.log('DEBUG: Upload service created');
    
    console.log('DEBUG: Phase 2 - Testing validation...');
    // Skip actual file upload, go straight to contract testing
    
    console.log('DEBUG: Phase 3 - Testing contract creation...');
    // Simulate the contract parameters that would be created
    const contractParams = {
     title: testUploadData.title,
     description: testUploadData.description,
     category: testUploadData.category,
     tags: testUploadData.tags || [],
     modelBlobId: 'debug_test_blob_12345',
     datasetBlobId: undefined,
     encryptionPolicyId: 'debug_policy_12345',
     sealMetadata: new Uint8Array([1, 2, 3, 4]),
     price: (parseFloat(testUploadData.price) * 1000000000).toString(),
     maxDownloads: testUploadData.maxDownloads
    };
    
    console.log('DEBUG: Contract params created:', contractParams);
    console.log('DEBUG: About to test contract creation...');
    
    // Test the marketplace contract service directly
    const { MarketplaceContractService } = await import('@/lib/services/marketplace-contract.service');
    const contractService = new MarketplaceContractService();
    
    console.log('DEBUG: Testing contract uploadModel...');
    const contractResult = await contractService.uploadModel(contractParams, keypair);
    
    console.log('DEBUG: Contract result:', contractResult);
    
    if (contractResult.success) {
     return NextResponse.json({
      success: true,
      message: 'Full upload flow test passed',
      phase: 'completed',
      result: contractResult
     });
    } else {
     return NextResponse.json({
      success: false,
      error: contractResult.error,
      phase: 'contract',
      details: contractResult
     });
    }
    
   } catch (uploadError) {
    console.error('DEBUG: Upload flow error:', uploadError);
    
    const errorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);
    const errorStack = uploadError instanceof Error ? uploadError.stack : undefined;
    
    return NextResponse.json({
     success: false,
     error: errorMessage,
     stack: errorStack,
     phase: 'upload-flow'
    });
   }
  }
  
  return NextResponse.json({
   success: false,
   error: 'Debug mode required'
  });
  
 } catch (error) {
  console.error('DEBUG: API endpoint error:', error);
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  return NextResponse.json({
   success: false,
   error: errorMessage,
   stack: errorStack,
   phase: 'api-endpoint'
  });
 }
}