// SEAL Configuration Test Utility

import { SuiClient } from '@mysten/sui/client';
import { SUI_CONFIG } from '../../../constants';
import { SEAL_CONFIG } from '../config/seal.config';
import { createSuiClientWithFallback } from '../../sui/rpc-fallback';
import { KeyServerManager } from '../lib/key-server-manager';
import { SealClientWrapper } from '../lib/seal-client';

/**
 * Test SEAL package and key servers on testnet
 */
export async function testSealConfiguration(useCustomRpc?: string): Promise<{
  packageValid: boolean;
  keyServersValid: number;
  errors: string[];
  rpcUsed?: string;
}> {
  const errors: string[] = [];
  let packageValid = false;
  let keyServersValid = 0;
  
  let suiClient: SuiClient;
  let rpcUsed: string;
  
  if (useCustomRpc) {
    console.log('🔗 Using custom RPC:', useCustomRpc);
    suiClient = new SuiClient({ url: useCustomRpc });
    rpcUsed = useCustomRpc;
  } else {
    console.log('🔄 Using fallback RPC detection...');
    suiClient = await createSuiClientWithFallback();
    rpcUsed = 'fallback-detected';
  }
  
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
    errors,
    rpcUsed
  };
  
  console.log('📊 SEAL configuration test results:', result);
  return result;
}

/**
 * Test SEAL with H2O Nodes RPC specifically
 */
export async function testSealWithH2ONodes(): Promise<{
  success: boolean;
  rpcWorking: boolean;
  sealPackageFound: boolean;
  keyServersValid: number;
  keyServerHealth: any[];
  errors: string[];
}> {
  const h2oRpcUrl = 'https://rpc.h2o-nodes.com/dsn/0d7b76b217d1a03ffd77b066624b5c690fa89892032/v1/service';
  
  console.log('🧪 Testing SEAL with H2O Nodes RPC...');
  
  try {
    const results = await testSealConfiguration(h2oRpcUrl);
    
    // Also test key server operations
    const suiClient = new SuiClient({ url: h2oRpcUrl });
    const keyServerManager = new KeyServerManager(suiClient);
    
    const keyServerHealth = await keyServerManager.checkAllKeyServersHealth();
    const keyServerMetrics = await keyServerManager.getKeyServerMetrics();
    
    console.log('📊 Key server metrics:', keyServerMetrics);
    console.log('🏥 Key server health:', keyServerHealth);
    
    keyServerManager.destroy(); // Cleanup
    
    return {
      success: results.packageValid && results.keyServersValid > 0,
      rpcWorking: true,
      sealPackageFound: results.packageValid,
      keyServersValid: results.keyServersValid,
      keyServerHealth,
      errors: results.errors
    };
  } catch (error) {
    return {
      success: false,
      rpcWorking: false,
      sealPackageFound: false,
      keyServersValid: 0,
      keyServerHealth: [],
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Comprehensive SEAL client test with key server operations
 */
export async function testSealClientOperations(): Promise<{
  success: boolean;
  clientInitialized: boolean;
  keyServerTests: any[];
  sessionTests: any;
  errors: string[];
}> {
  const errors: string[] = [];
  let clientInitialized = false;
  let keyServerTests: any[] = [];
  let sessionTests: any = {};

  try {
    console.log('🧪 Testing comprehensive SEAL client operations...');
    
    const suiClient = await createSuiClientWithFallback();
    const sealClient = SealClientWrapper.getInstance(suiClient);
    clientInitialized = true;
    
    // Test key server operations
    try {
      keyServerTests = await sealClient.testAllKeyServers();
      console.log('🔑 Key server test results:', keyServerTests);
    } catch (error) {
      errors.push(`Key server tests failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test session management
    try {
      const sessionStats = sealClient.getSessionStats();
      const keyServerHealth = await sealClient.getKeyServerHealth();
      const keyServerMetrics = await sealClient.getKeyServerMetrics();
      
      sessionTests = {
        sessionStats,
        keyServerHealth,
        keyServerMetrics
      };
      
      console.log('📈 Session and key server stats:', sessionTests);
    } catch (error) {
      errors.push(`Session tests failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return {
      success: clientInitialized && keyServerTests.length > 0 && errors.length === 0,
      clientInitialized,
      keyServerTests,
      sessionTests,
      errors
    };
    
  } catch (error) {
    errors.push(`Client initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      success: false,
      clientInitialized,
      keyServerTests,
      sessionTests,
      errors
    };
  }
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