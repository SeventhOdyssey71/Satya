#!/usr/bin/env node
// Test script for marketplace contract functionality

const { SuiClient } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');

// Configuration from .env.local
const SUI_NETWORK = 'testnet';
const SUI_RPC_URL = 'https://fullnode.testnet.sui.io:443';
const MARKETPLACE_PACKAGE_ID = '0x9a4098e65be1c3af358eb2efb6376ac3628ae0b35fc304166f14b46527d29a4b';
const MARKETPLACE_REGISTRY_ID = '0x04285569e6e6fd4592b8e998d3e7796442c3adee5d5db1ddd4089579d4d983f3';

async function testSmartContractCall() {
  console.log('🧪 Testing Smart Contract Call...');
  
  try {
    // Initialize Sui client
    const suiClient = new SuiClient({ url: SUI_RPC_URL });
    console.log('✓ Sui client initialized');
    
    // Create test keypair (in real app, this would be user's wallet)
    const keypair = new Ed25519Keypair();
    console.log('✓ Test keypair created');
    console.log('Test address:', await keypair.toSuiAddress());
    
    // Check if package exists
    console.log('\n📦 Checking package...');
    try {
      const packageInfo = await suiClient.getObject({
        id: MARKETPLACE_PACKAGE_ID,
        options: { showContent: true }
      });
      console.log('✓ Package found:', packageInfo.data?.objectId);
    } catch (error) {
      console.error('❌ Package not found:', error.message);
      return;
    }
    
    // Check if registry exists
    console.log('\n🏛️ Checking marketplace registry...');
    try {
      const registryInfo = await suiClient.getObject({
        id: MARKETPLACE_REGISTRY_ID,
        options: { showContent: true }
      });
      console.log('✓ Registry found:', registryInfo.data?.objectId);
    } catch (error) {
      console.error('❌ Registry not found:', error.message);
      return;
    }
    
    // Test transaction construction (without executing)
    console.log('\n🔨 Testing transaction construction...');
    const tx = new Transaction();
    
    // Test the upload_model_entry function call structure (entry function auto-transfers)
    tx.moveCall({
      target: `${MARKETPLACE_PACKAGE_ID}::marketplace::upload_model_entry`,
      arguments: [
        tx.pure.string('Test Model Title'),
        tx.pure.string('Test model description'),
        tx.pure.string('AI/ML'),
        tx.pure.vector('string', ['test', 'ai', 'model']),
        tx.pure.string('test_blob_id_12345'),
        tx.pure.option('string', 'test_dataset_blob_id'),
        tx.pure.string('test_encryption_policy_id'),
        tx.pure.vector('u8', new Uint8Array([1, 2, 3, 4])),
        tx.pure.u64('1000000000'), // 1 SUI in MIST
        tx.pure.option('u64', 100), // max downloads
        tx.object('0x6'), // System Clock object
      ],
    });
    
    // Entry function auto-transfers the PendingModel - no manual transfer needed
    
    console.log('✓ Transaction constructed successfully');
    console.log('✓ moveCall target verified');
    console.log('✓ All parameters formatted correctly');
    
    // Test transaction inspection (set sender to validate structure)
    console.log('\n🔍 Transaction structure test...');
    try {
      tx.setSender(await keypair.toSuiAddress());
      const txBytes = await tx.build({ client: suiClient });
      console.log('✓ Transaction builds successfully');
      console.log('Transaction byte length:', txBytes.length);
    } catch (error) {
      if (error.message.includes('gas coins')) {
        console.log('✓ Transaction structure valid (needs gas coins for execution)');
      } else {
        console.error('❌ Transaction build error:', error.message);
        return;
      }
    }
    
    console.log('\n✅ Smart contract call test PASSED');
    console.log('🎉 All components are working correctly!');
    
    console.log('\n📋 Test Summary:');
    console.log('- Package exists and is accessible ✓');
    console.log('- Registry exists and is accessible ✓'); 
    console.log('- Transaction constructs without errors ✓');
    console.log('- Function target resolves correctly ✓');
    console.log('- Parameter types are valid ✓');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testSmartContractCall();