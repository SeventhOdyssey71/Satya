#!/usr/bin/env node
// Test the MarketplaceContractService directly

const { MarketplaceContractService } = require('./dist/lib/services/marketplace-contract.service.js');

async function testMarketplaceService() {
  try {
    console.log('🧪 Testing MarketplaceContractService...');
    
    // This test would require building the project first
    console.log('❌ Need to build project first');
    console.log('Run: npm run build');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMarketplaceService();