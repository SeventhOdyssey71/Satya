// Seal Type Definitions

export interface PolicyMetadata {
  type: PolicyType;
  createdAt: number;
  params: PolicyParams;
  dekHash?: string;
}

export enum PolicyType {
  PAYMENT_GATED = 'payment-gated',
  TEE_ONLY = 'tee-only',
  SUBSCRIPTION = 'subscription',
  TIME_LOCKED = 'time-locked',
  ALLOWLIST = 'allowlist'
}

export interface PolicyParams {
  price?: number;
  seller?: string;
  assetId?: string;
  enclaveId?: string;
  monthlyFee?: number;
  duration?: number;
  unlockTime?: number;
  serviceId?: string;
  allowedAddresses?: string[];
}

export interface PolicyConfig {
  type: string;
  moveModule: string;
  function: string;
  rules: PolicyRule[];
  namespace?: string;
}

export interface PolicyRule {
  type: 'payment' | 'ownership' | 'attestation' | 'subscription' | 'time' | 'allowlist';
  amount?: number;
  recipient?: string;
  verifyPurchaseRecord?: boolean;
  requiredEnclaveId?: string;
  verifyPCRs?: boolean;
  fee?: number;
  ttl?: number;
  unlockAt?: number;
  addresses?: string[];
}

export interface EncryptionResult {
  success: boolean;
  encryptedData: Uint8Array;
  encryptedDEK: Uint8Array;
  policyId: string;
  iv: Uint8Array;
  error?: string;
}

export interface DecryptionResult {
  success: boolean;
  data?: Uint8Array;
  accessGranted: boolean;
  error?: string;
}

export interface SessionData {
  sessionKey: any; // Will be replaced with actual SessionKey type
  createdAt: number;
  refreshCount: number;
  expiresAt: number;
}

export interface ServerHealth {
  healthy: boolean;
  lastChecked: number;
  responseTime: number | null;
  errorCount: number;
}

export interface KeyServerStatus {
  objectId: string;
  url: string;
  healthy: boolean;
  responseTime?: number;
}

export class SealError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SealError';
  }
}

export class AccessDeniedError extends SealError {
  constructor(message: string) {
    super(message, 'ACCESS_DENIED');
    this.name = 'AccessDeniedError';
  }
}

export class PolicyError extends SealError {
  constructor(message: string) {
    super(message, 'POLICY_ERROR');
    this.name = 'PolicyError';
  }
}

export class SessionError extends SealError {
  constructor(message: string) {
    super(message, 'SESSION_ERROR');
    this.name = 'SessionError';
  }
}