#!/usr/bin/env node
// Debug what configuration is actually loaded

const { MARKETPLACE_CONFIG } = require('./src/lib/config/marketplace.ts');

console.log('🔧 Current Marketplace Configuration:');
console.log('Package ID:', MARKETPLACE_CONFIG.PACKAGE_ID);
console.log('Registry ID:', MARKETPLACE_CONFIG.REGISTRY_OBJECT_ID);
console.log('Platform Address:', MARKETPLACE_CONFIG.PLATFORM_ADDRESS);

// Also check environment variables directly
console.log('\n📋 Environment Variables:');
console.log('NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID:', process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID);
console.log('NEXT_PUBLIC_MARKETPLACE_REGISTRY_ID:', process.env.NEXT_PUBLIC_MARKETPLACE_REGISTRY_ID);