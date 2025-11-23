// Debug API endpoint for testing marketplace service in isolation
import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceContractService } from '@/lib/services/marketplace-contract.service';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export async function POST(request: NextRequest) {
 try {
  const { params } = await request.json();
  
  console.log('DEBUG: Testing marketplace service...');
  console.log('DEBUG: Service params:', params);
  
  // Create test signer
  const keypair = new Ed25519Keypair();
  
  console.log('DEBUG: Created test keypair');
  
  // Create marketplace service
  console.log('DEBUG: Creating marketplace service...');
  const contractService = await MarketplaceContractService.createWithFallback();
  console.log('DEBUG: Marketplace service created');
  
  // Test the upload model function directly
  console.log('DEBUG: Calling uploadModel...');
  console.log('DEBUG: Params being passed to uploadModel:');
  Object.keys(params).forEach(key => {
   console.log(` - ${key}:`, typeof params[key], params[key]);
  });
  
  try {
   const result = await contractService.uploadModel(params, keypair);
   
   console.log('DEBUG: uploadModel completed');
   console.log('DEBUG: Result:', result);
   
   return NextResponse.json({
    success: result.success,
    error: result.error,
    result: result,
    message: result.success ? 'Marketplace service test passed' : 'Marketplace service test failed'
   });
   
  } catch (serviceError) {
   console.error('DEBUG: uploadModel failed:', serviceError);
   
   const errorMessage = serviceError instanceof Error ? serviceError.message : String(serviceError);
   const errorStack = serviceError instanceof Error ? serviceError.stack : undefined;
   
   return NextResponse.json({
    success: false,
    error: errorMessage,
    stack: errorStack,
    phase: 'marketplace-service'
   });
  }
  
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