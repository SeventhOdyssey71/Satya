// SEAL Configuration Test Utility

import { SuiClient } from '@mysten/sui/client';
import { SUI_CONFIG } from '../../../constants';
import { SEAL_CONFIG } from '../config/seal.config';

/**
 * Test SEAL package and key servers on testnet
 */
export async function testSealConfiguration(): Promise<{
  packageValid: boolean;
  keyServersValid: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let packageValid = false;
  let keyServersValid = 0;
  
  const suiClient = new SuiClient({
    url: SUI_CONFIG.RPC_URL
  });
  
  try {
    // Test package existence
    console.log('🔍 Testing SEAL package:', SEAL_CONFIG.testnet.packageId);
    const packageInfo = await suiClient.getObject({
      id: SEAL_CONFIG.testnet.packageId,
      options: { showType: true }
    });
    
    if (packageInfo.error) {
      errors.push(`Package error: ${packageInfo.error.code}`);
    } else if (packageInfo.data?.type === 'package') {
      packageValid = true;
      console.log('✅ SEAL package found and valid');
    } else {
      errors.push(`Object is not a package: ${packageInfo.data?.type}`);
    }
  } catch (error) {
    errors.push(`Package verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Test key servers
  for (const [index, server] of SEAL_CONFIG.testnet.keyServers.entries()) {
    try {
      console.log(`🔍 Testing key server ${index + 1}:`, server.objectId);
      const serverInfo = await suiClient.getObject({
        id: server.objectId,
        options: { showType: true }
      });
      
      if (serverInfo.error) {
        errors.push(`Key server ${index + 1} error: ${serverInfo.error.code}`);
      } else if (serverInfo.data) {
        keyServersValid++;
        console.log(`✅ Key server ${index + 1} found and valid`);
      }
    } catch (error) {
      errors.push(`Key server ${index + 1} test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  const result = {
    packageValid,
    keyServersValid,
    errors
  };
  
  console.log('📊 SEAL configuration test results:', result);
  return result;
}

/**
 * Quick SEAL client validation
 */
export async function validateSealClient(): Promise<boolean> {
  try {
    const results = await testSealConfiguration();
    
    const isValid = results.packageValid && 
                   results.keyServersValid >= 1 && 
                   results.errors.length === 0;
    
    if (isValid) {
      console.log('🎉 SEAL configuration is valid and ready for use');
    } else {
      console.warn('⚠️ SEAL configuration has issues:', results.errors);
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ SEAL validation failed:', error);
    return false;
  }
}