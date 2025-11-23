// RPC Fallback Utility for SEAL Operations
import { SuiClient } from '@mysten/sui/client';
import { SUI_CONFIG } from '../../constants';

// Cache the working client to avoid repeated testing
let cachedClient: SuiClient | null = null;
let lastSuccessfulUrl: string | null = null;

/**
 * Create SUI client with automatic RPC fallback for SEAL operations
 */
export async function createSuiClientWithFallback(): Promise<SuiClient> {
 // Return cached client if available
 if (cachedClient && lastSuccessfulUrl) {
  console.log('Using cached SUI client:', lastSuccessfulUrl);
  return cachedClient;
 }
 // Try primary RPC first
 const primaryRpcUrl = SUI_CONFIG.RPC_URL;
 
 try {
  console.log('Testing primary RPC:', primaryRpcUrl);
  const primaryClient = new SuiClient({ url: primaryRpcUrl });
  
  // Quick health check
  await primaryClient.getLatestSuiSystemState();
  console.log('Primary RPC is working');
  
  // Cache successful client
  cachedClient = primaryClient;
  lastSuccessfulUrl = primaryRpcUrl;
  
  return primaryClient;
 } catch (error) {
  console.warn('Primary RPC failed, trying fallbacks...', error);
 }
 
 // Try fallback RPCs one by one
 for (const [index, fallbackUrl] of SUI_CONFIG.FALLBACK_RPC_URLS.entries()) {
  try {
   console.log(`Testing fallback RPC ${index + 1}:`, fallbackUrl);
   const fallbackClient = new SuiClient({ url: fallbackUrl });
   
   // Quick health check
   await fallbackClient.getLatestSuiSystemState();
   console.log(`Fallback RPC ${index + 1} is working`);
   
   // Cache successful client
   cachedClient = fallbackClient;
   lastSuccessfulUrl = fallbackUrl;
   
   return fallbackClient;
  } catch (error) {
   console.warn(`Fallback RPC ${index + 1} failed:`, error);
   continue;
  }
 }
 
 // If all RPCs fail, still return a client with the H2O Nodes SEAL endpoint
 // as it's specifically configured for SEAL operations
 console.warn('All RPC endpoints failed, using H2O Nodes SEAL testnet as last resort');
 return new SuiClient({ 
  url: 'https://rpc.h2o-nodes.com/dsn/0d7b76b217d1a03ffd77b066624b5c690fa89892032/v1/service' 
 });
}

/**
 * Test RPC endpoint connectivity
 */
export async function testRpcConnectivity(rpcUrl: string): Promise<boolean> {
 try {
  const client = new SuiClient({ url: rpcUrl });
  await client.getLatestSuiSystemState();
  return true;
 } catch {
  return false;
 }
}

/**
 * Get the best available RPC endpoint for SEAL operations
 */
export async function getBestSealRpc(): Promise<string> {
 const allRpcUrls = [SUI_CONFIG.RPC_URL, ...SUI_CONFIG.FALLBACK_RPC_URLS];
 
 for (const rpcUrl of allRpcUrls) {
  const isWorking = await testRpcConnectivity(rpcUrl);
  if (isWorking) {
   return rpcUrl;
  }
 }
 
 // Return H2O Nodes SEAL testnet as ultimate fallback
 return 'https://rpc.h2o-nodes.com/dsn/0d7b76b217d1a03ffd77b066624b5c690fa89892032/v1/service';
}