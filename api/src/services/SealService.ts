import { createLogger } from '../utils/logger';

const logger = createLogger();

export interface SealPolicy {
  type: 'payment-gated' | 'time-locked' | 'allowlist' | 'tee-only';
  price?: number;
  allowedBuyers?: string[];
  expiresAt?: Date;
  conditions?: any;
}

export interface AccessGrant {
  policyId: string;
  buyerAddress: string;
  grantedAt?: Date;
}

export interface DecryptionKeyRequest {
  policyId: string;
  buyerAddress: string;
}

export class SealService {
  private sealApiUrl: string;
  private sealApiKey: string;

  constructor() {
    this.sealApiUrl = process.env.SEAL_API_URL || 'http://localhost:8080';
    this.sealApiKey = process.env.SEAL_API_KEY || '';

    if (!this.sealApiKey) {
      logger.warn('SEAL API key not configured, using mock mode');
    }
  }

  async createPolicy(policy: SealPolicy): Promise<string> {
    try {
      if (!this.sealApiKey) {
        // Mock implementation for demo
        const mockPolicyId = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        logger.info('Created mock SEAL policy', { policyId: mockPolicyId, type: policy.type });
        return mockPolicyId;
      }

      // Real implementation would call SEAL API
      const response = await fetch(`${this.sealApiUrl}/policies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sealApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(policy)
      });

      if (!response.ok) {
        throw new Error(`SEAL API error: ${response.statusText}`);
      }

      const result = await response.json() as any;
      logger.info('Created SEAL policy', { policyId: result.policyId });
      return result.policyId;

    } catch (error) {
      logger.error('Error creating SEAL policy:', error);
      throw new Error('Failed to create encryption policy');
    }
  }

  async grantAccess(grant: AccessGrant): Promise<void> {
    try {
      if (!this.sealApiKey) {
        // Mock implementation
        logger.info('Granted mock SEAL access', grant);
        return;
      }

      const response = await fetch(`${this.sealApiUrl}/policies/${grant.policyId}/grant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sealApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyerAddress: grant.buyerAddress,
          grantedAt: grant.grantedAt || new Date()
        })
      });

      if (!response.ok) {
        throw new Error(`SEAL API error: ${response.statusText}`);
      }

      logger.info('Granted SEAL access', grant);

    } catch (error) {
      logger.error('Error granting SEAL access:', error);
      throw new Error('Failed to grant access');
    }
  }

  async getDecryptionKey(request: DecryptionKeyRequest): Promise<string> {
    try {
      if (!this.sealApiKey) {
        // Mock implementation
        const mockKey = `key_${request.policyId.substr(-8)}_${request.buyerAddress.substr(-8)}`;
        logger.info('Generated mock decryption key', { policyId: request.policyId });
        return mockKey;
      }

      const response = await fetch(`${this.sealApiUrl}/policies/${request.policyId}/key`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.sealApiKey}`,
          'X-Buyer-Address': request.buyerAddress
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied: buyer not authorized');
        }
        throw new Error(`SEAL API error: ${response.statusText}`);
      }

      const result = await response.json() as any;
      return result.decryptionKey;

    } catch (error) {
      logger.error('Error getting decryption key:', error);
      throw new Error('Failed to get decryption key');
    }
  }

  async revokeAccess(policyId: string, buyerAddress: string): Promise<void> {
    try {
      if (!this.sealApiKey) {
        logger.info('Revoked mock SEAL access', { policyId, buyerAddress });
        return;
      }

      const response = await fetch(`${this.sealApiUrl}/policies/${policyId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sealApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ buyerAddress })
      });

      if (!response.ok) {
        throw new Error(`SEAL API error: ${response.statusText}`);
      }

      logger.info('Revoked SEAL access', { policyId, buyerAddress });

    } catch (error) {
      logger.error('Error revoking SEAL access:', error);
      throw new Error('Failed to revoke access');
    }
  }

  async getPolicyStatus(policyId: string): Promise<any> {
    try {
      if (!this.sealApiKey) {
        return {
          id: policyId,
          active: true,
          type: 'payment-gated',
          grantedUsers: [],
          createdAt: new Date().toISOString()
        };
      }

      const response = await fetch(`${this.sealApiUrl}/policies/${policyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.sealApiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`SEAL API error: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      logger.error('Error getting policy status:', error);
      throw new Error('Failed to get policy status');
    }
  }
}