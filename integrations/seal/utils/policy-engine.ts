// Policy Engine for managing access policies

import {
  PolicyType,
  PolicyParams,
  PolicyConfig,
  PolicyRule
} from '../types';

export class PolicyEngine {
  private policies: Map<string, PolicyConfig> = new Map();
  
  // Create policy configuration based on type
  async createPolicy(
    type: PolicyType,
    params: PolicyParams
  ): Promise<PolicyConfig> {
    switch (type) {
      case PolicyType.PAYMENT_GATED:
        return this.createPaymentGatedPolicy(params);
      
      case PolicyType.TEE_ONLY:
        return this.createTEEOnlyPolicy(params);
      
      case PolicyType.SUBSCRIPTION:
        return this.createSubscriptionPolicy(params);
      
      case PolicyType.TIME_LOCKED:
        return this.createTimeLockPolicy(params);
      
      case PolicyType.ALLOWLIST:
        return this.createAllowlistPolicy(params);
      
      default:
        throw new Error(`Unknown policy type: ${type}`);
    }
  }
  
  // Payment-gated policy
  private createPaymentGatedPolicy(params: PolicyParams): PolicyConfig {
    const rules: PolicyRule[] = [];
    
    if (params.price !== undefined && params.seller) {
      rules.push({
        type: 'payment',
        amount: params.price,
        recipient: params.seller
      });
    }
    
    rules.push({
      type: 'ownership',
      verifyPurchaseRecord: true
    });
    
    return {
      type: PolicyType.PAYMENT_GATED,
      moveModule: 'marketplace::policies',
      function: 'seal_approve',
      rules,
      namespace: params.assetId
    };
  }
  
  // TEE-only policy
  private createTEEOnlyPolicy(params: PolicyParams): PolicyConfig {
    const rules: PolicyRule[] = [];
    
    if (params.enclaveId) {
      rules.push({
        type: 'attestation',
        requiredEnclaveId: params.enclaveId,
        verifyPCRs: true
      });
    }
    
    return {
      type: PolicyType.TEE_ONLY,
      moveModule: 'marketplace::tee_policies',
      function: 'seal_approve_tee',
      rules
    };
  }
  
  // Subscription policy
  private createSubscriptionPolicy(params: PolicyParams): PolicyConfig {
    const rules: PolicyRule[] = [];
    
    if (params.monthlyFee !== undefined) {
      rules.push({
        type: 'subscription',
        fee: params.monthlyFee,
        ttl: (params.duration || 30) * 24 * 60 * 60 * 1000
      });
    }
    
    return {
      type: PolicyType.SUBSCRIPTION,
      moveModule: 'marketplace::subscription',
      function: 'seal_approve_subscription',
      rules,
      namespace: params.serviceId
    };
  }
  
  // Time-locked policy
  private createTimeLockPolicy(params: PolicyParams): PolicyConfig {
    const rules: PolicyRule[] = [];
    
    if (params.unlockTime) {
      rules.push({
        type: 'time',
        unlockAt: params.unlockTime
      });
    }
    
    return {
      type: PolicyType.TIME_LOCKED,
      moveModule: 'marketplace::time_lock',
      function: 'seal_approve_time',
      rules
    };
  }
  
  // Allowlist policy
  private createAllowlistPolicy(params: PolicyParams): PolicyConfig {
    const rules: PolicyRule[] = [];
    
    if (params.allowedAddresses && params.allowedAddresses.length > 0) {
      rules.push({
        type: 'allowlist',
        addresses: params.allowedAddresses
      });
    }
    
    return {
      type: PolicyType.ALLOWLIST,
      moveModule: 'marketplace::allowlist',
      function: 'seal_approve_allowlist',
      rules
    };
  }
  
  // Store policy configuration
  storePolicy(policyId: string, config: PolicyConfig): void {
    this.policies.set(policyId, config);
  }
  
  // Retrieve policy configuration
  getPolicy(policyId: string): PolicyConfig | undefined {
    return this.policies.get(policyId);
  }
  
  // Validate policy parameters
  validatePolicyParams(type: PolicyType, params: PolicyParams): void {
    switch (type) {
      case PolicyType.PAYMENT_GATED:
        if (params.price === undefined || params.price <= 0) {
          throw new Error('Invalid price for payment-gated policy');
        }
        if (!params.seller) {
          throw new Error('Seller address required for payment-gated policy');
        }
        break;
      
      case PolicyType.TEE_ONLY:
        if (!params.enclaveId) {
          throw new Error('Enclave ID required for TEE-only policy');
        }
        break;
      
      case PolicyType.TIME_LOCKED:
        if (!params.unlockTime || params.unlockTime <= Date.now()) {
          throw new Error('Invalid unlock time for time-locked policy');
        }
        break;
      
      case PolicyType.ALLOWLIST:
        if (!params.allowedAddresses || params.allowedAddresses.length === 0) {
          throw new Error('Allowed addresses required for allowlist policy');
        }
        break;
    }
  }
}