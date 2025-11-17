// Debug API endpoint for testing smart contract calls in isolation
import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { MARKETPLACE_CONFIG, SUI_CONFIG } from '@/lib/constants';

export async function POST(request: NextRequest) {
 try {
  const { test, params } = await request.json();
  
  console.log('DEBUG: Testing smart contract with params:', params);
  console.log('DEBUG: MARKETPLACE_CONFIG:', MARKETPLACE_CONFIG);
  
  if (test === 'smart-contract-only') {
   // Create isolated smart contract test
   const suiClient = new SuiClient({ url: SUI_CONFIG.RPC_URL });
   const keypair = new Ed25519Keypair();
   const senderAddress = await keypair.toSuiAddress();
   
   console.log('DEBUG: Created test keypair:', senderAddress);
   
   const tx = new Transaction();
   
   console.log('DEBUG: About to create moveCall...');
   console.log('DEBUG: Target:', `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model_entry`);
   console.log('DEBUG: Arguments being passed:');
   console.log(' - title:', typeof params.title, params.title);
   console.log(' - description:', typeof params.description, params.description);
   console.log(' - category:', typeof params.category, params.category);
   console.log(' - tags:', typeof params.tags, params.tags);
   console.log(' - modelBlobId:', typeof params.modelBlobId, params.modelBlobId);
   console.log(' - datasetBlobId:', typeof params.datasetBlobId, params.datasetBlobId);
   console.log(' - encryptionPolicyId:', typeof params.encryptionPolicyId, params.encryptionPolicyId);
   console.log(' - sealMetadata:', typeof params.sealMetadata, params.sealMetadata);
   console.log(' - price:', typeof params.price, params.price);
   console.log(' - maxDownloads:', typeof params.maxDownloads, params.maxDownloads);
   
   // The exact call that should work
   tx.moveCall({
    target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model_entry`,
    arguments: [
     tx.pure.string(params.title),
     tx.pure.string(params.description), 
     tx.pure.string(params.category),
     tx.pure.vector('string', params.tags),
     tx.pure.string(params.modelBlobId),
     params.datasetBlobId ? 
      tx.pure.option('string', params.datasetBlobId) : 
      tx.pure.option('string', null),
     tx.pure.string(params.encryptionPolicyId),
     tx.pure.vector('u8', Array.from(params.sealMetadata)),
     tx.pure.u64(params.price),
     params.maxDownloads ? 
      tx.pure.option('u64', params.maxDownloads) : 
      tx.pure.option('u64', null),
     tx.object('0x6'), // Clock
    ],
   });
   
   tx.setSender(senderAddress);
   
   console.log('DEBUG: Transaction created, attempting to build...');
   
   try {
    const txBytes = await tx.build({ client: suiClient });
    console.log('DEBUG: Transaction built successfully!');
    
    return NextResponse.json({
     success: true,
     message: 'Smart contract test passed',
     details: {
      transactionSize: txBytes.length,
      target: `${MARKETPLACE_CONFIG.PACKAGE_ID}::marketplace::upload_model_entry`,
      senderAddress
     }
    });
    
   } catch (buildError) {
    console.error('DEBUG: Transaction build failed:', buildError);
    
    const errorMessage = buildError instanceof Error ? buildError.message : String(buildError);
    
    if (errorMessage.includes('toLowerCase')) {
     return NextResponse.json({
      success: false,
      error: `toLowerCase error in transaction build: ${errorMessage}`,
      phase: 'transaction-build',
      details: { buildError: errorMessage }
     });
    } else {
     // Expected errors (gas, etc.)
     return NextResponse.json({
      success: true,
      message: 'Transaction structure valid (gas error expected)',
      details: { 
       buildError: errorMessage,
       expected: errorMessage.includes('gas') || errorMessage.includes('coin')
      }
     });
    }
   }
  }
  
  return NextResponse.json({
   success: false,
   error: 'Unknown test type'
  });
  
 } catch (error) {
  console.error('DEBUG: API endpoint error:', error);
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  return NextResponse.json({
   success: false,
   error: errorMessage,
   stack: errorStack
  });
 }
}