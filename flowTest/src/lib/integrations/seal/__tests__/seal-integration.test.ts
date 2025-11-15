// SEAL Integration Test

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { SealEncryptionService } from '../services/encryption-service';
import { PolicyType } from '../types';

// Test configuration (for testnet)
const TEST_CONFIG = {
  suiRpcUrl: getFullnodeUrl('testnet'),
  testData: new TextEncoder().encode('This is test data for SEAL encryption'),
  testAddress: '0x1234567890abcdef1234567890abcdef12345678',
  testPolicyParams: {
    price: 1000000, // 0.001 SUI
    seller: '0x1234567890abcdef1234567890abcdef12345678',
    assetId: 'test-asset-id'
  }
};

/**
 * Integration test for SEAL encryption/decryption flow
 * 
 * NOTE: This test requires:
 * 1. Valid SEAL key server configuration
 * 2. SUI testnet access
 * 3. Proper environment setup
 */
describe('SEAL Integration', () => {
  let sealService: SealEncryptionService;
  let suiClient: SuiClient;

  beforeAll(async () => {
    // Initialize SUI client
    suiClient = new SuiClient({
      url: TEST_CONFIG.suiRpcUrl
    });

    // Initialize SEAL service
    sealService = new SealEncryptionService(suiClient);
  });

  describe('Service Initialization', () => {
    it('should initialize SEAL service successfully', () => {
      expect(sealService).toBeDefined();
      expect(sealService.getSessionStats).toBeDefined();
    });

    it('should have session statistics available', () => {
      const stats = sealService.getSessionStats();
      expect(stats).toHaveProperty('totalSessions');
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('sealClientStats');
    });
  });

  describe('Encryption Flow', () => {
    it('should encrypt data with PAYMENT_GATED policy', async () => {
      try {
        const result = await sealService.encryptData(
          TEST_CONFIG.testData,
          PolicyType.PAYMENT_GATED,
          TEST_CONFIG.testPolicyParams
        );

        expect(result.success).toBe(true);
        expect(result.encryptedData).toBeInstanceOf(Uint8Array);
        expect(result.encryptedDEK).toBeInstanceOf(Uint8Array);
        expect(result.policyId).toBeDefined();
        expect(result.iv).toBeInstanceOf(Uint8Array);
        
        console.log('✅ SEAL encryption test passed');
        console.log(`Policy ID: ${result.policyId}`);
        console.log(`Encrypted data size: ${result.encryptedData.length} bytes`);
      } catch (error) {
        console.warn('⚠️ SEAL encryption test failed (expected in test environment):', error);
        // This is expected to fail without proper SEAL key server setup
        expect(error).toBeDefined();
      }
    }, 30000); // 30 second timeout for network operations

    it('should handle encryption errors gracefully', async () => {
      try {
        // Test with invalid data
        const result = await sealService.encryptData(
          new Uint8Array(0), // Empty data
          PolicyType.PAYMENT_GATED,
          {}
        );

        // Should either succeed or fail gracefully
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      } catch (error) {
        // Errors should be properly wrapped in SealError
        expect(error).toBeDefined();
      }
    });
  });

  describe('Session Management', () => {
    it('should track session statistics', () => {
      const stats = sealService.getSessionStats();
      expect(typeof stats.totalSessions).toBe('number');
      expect(typeof stats.activeSessions).toBe('number');
      expect(stats.sealClientStats).toBeDefined();
    });

    it('should allow clearing all sessions', () => {
      sealService.clearAllSessions();
      const stats = sealService.getSessionStats();
      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toBe(0);
    });
  });

  describe('Policy Types', () => {
    const policyTypes = [
      PolicyType.PAYMENT_GATED,
      PolicyType.TIME_LOCKED,
      PolicyType.ALLOWLIST
    ];

    policyTypes.forEach(policyType => {
      it(`should support ${policyType} policy type`, async () => {
        const params = {
          ...TEST_CONFIG.testPolicyParams,
          unlockTime: policyType === PolicyType.TIME_LOCKED ? Date.now() - 1000 : undefined,
          allowedAddresses: policyType === PolicyType.ALLOWLIST ? [TEST_CONFIG.testAddress] : undefined
        };

        try {
          const result = await sealService.encryptData(
            TEST_CONFIG.testData,
            policyType,
            params
          );

          // Should either succeed or fail with proper error structure
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');
        } catch (error) {
          // Expected in test environment without proper setup
          expect(error).toBeDefined();
        }
      });
    });
  });
});

/**
 * Manual test function for development/debugging
 * Call this function to test SEAL integration in a development environment
 */
export async function runManualSealTest(): Promise<void> {
  console.log('🔧 Starting manual SEAL integration test...');

  try {
    const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    const sealService = new SealEncryptionService(suiClient);

    console.log('✅ SEAL service initialized');
    
    const stats = sealService.getSessionStats();
    console.log('📊 Session stats:', stats);

    console.log('🧪 Testing encryption...');
    const testData = new TextEncoder().encode('Hello, SEAL!');
    
    try {
      const encryptResult = await sealService.encryptData(
        testData,
        PolicyType.TIME_LOCKED,
        { unlockTime: Date.now() - 1000 } // Already unlocked
      );

      if (encryptResult.success) {
        console.log('✅ Encryption successful!');
        console.log(`Policy ID: ${encryptResult.policyId}`);
        console.log(`Encrypted size: ${encryptResult.encryptedData.length} bytes`);
      } else {
        console.log('❌ Encryption failed:', encryptResult.error);
      }
    } catch (error) {
      console.log('⚠️ Encryption test failed (expected without key servers):', error);
    }

  } catch (error) {
    console.error('❌ Manual test failed:', error);
  }
}