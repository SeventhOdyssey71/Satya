import { z } from 'zod';

// =============================================================================
// CORE DOMAIN TYPES
// =============================================================================

export const SuiAddressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Sui address format')
  .brand('SuiAddress');

export type SuiAddress = z.infer<typeof SuiAddressSchema>;

export const ObjectIdSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Object ID format')
  .brand('ObjectId');

export type ObjectId = z.infer<typeof ObjectIdSchema>;

export const BlobIdSchema = z.string()
  .min(1)
  .max(255)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid blob ID format')
  .brand('BlobId');

export type BlobId = z.infer<typeof BlobIdSchema>;

export const PolicyIdSchema = z.string()
  .uuid('Invalid policy ID format')
  .brand('PolicyId');

export type PolicyId = z.infer<typeof PolicyIdSchema>;

export const AttestationIdSchema = z.string()
  .uuid('Invalid attestation ID format')
  .brand('AttestationId');

export type AttestationId = z.infer<typeof AttestationIdSchema>;

// =============================================================================
// DATA MARKETPLACE TYPES
// =============================================================================

export const DataListingSchema = z.object({
  id: ObjectIdSchema,
  seller: SuiAddressSchema,
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(2000).trim(),
  price: z.bigint().positive('Price must be positive'),
  category: z.string().min(1).max(100).trim(),
  size: z.number().int().positive('Size must be positive'),
  sampleAvailable: z.boolean(),
  
  // Technical details
  encryptedBlobId: BlobIdSchema,
  encryptionPolicyId: PolicyIdSchema,
  dataHash: z.string().regex(/^[a-fA-F0-9]{64}$/, 'Invalid SHA-256 hash'),
  attestationId: AttestationIdSchema.optional(),
  
  // Access control
  allowedBuyers: z.array(SuiAddressSchema).max(1000).optional(),
  expiryDate: z.date().optional(),
  maxDownloads: z.number().int().positive().max(10000).optional(),
  
  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean(),
  totalEarned: z.bigint().nonnegative(),
  purchaseCount: z.number().int().nonnegative()
});

export type DataListing = z.infer<typeof DataListingSchema>;

export const PurchaseRequestSchema = z.object({
  listingId: ObjectIdSchema,
  buyer: SuiAddressSchema,
  paymentAmount: z.bigint().positive('Payment amount must be positive'),
  accessDuration: z.number().int().positive().max(8760).optional() // Max 1 year in hours
});

export type PurchaseRequest = z.infer<typeof PurchaseRequestSchema>;

export const DataAccessSchema = z.object({
  id: ObjectIdSchema,
  listingId: ObjectIdSchema,
  buyer: SuiAddressSchema,
  seller: SuiAddressSchema,
  purchaseAmount: z.bigint().positive(),
  accessGrantedAt: z.date(),
  expiresAt: z.date(),
  downloadCount: z.number().int().nonnegative(),
  maxDownloads: z.number().int().positive(),
  isActive: z.boolean(),
  attestationId: AttestationIdSchema.optional()
});

export type DataAccess = z.infer<typeof DataAccessSchema>;

// =============================================================================
// DISPUTE TYPES
// =============================================================================

export enum DisputeReason {
  DATA_QUALITY = 'DATA_QUALITY',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  MISREPRESENTATION = 'MISREPRESENTATION',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  OTHER = 'OTHER'
}

export const DisputeRequestSchema = z.object({
  listingId: ObjectIdSchema,
  purchaseId: ObjectIdSchema,
  buyer: SuiAddressSchema,
  reason: z.nativeEnum(DisputeReason),
  description: z.string().min(10).max(2000).trim(),
  evidence: z.record(z.string(), z.any()).optional(),
  evidenceHash: z.string().regex(/^[a-fA-F0-9]{64}$/).optional()
});

export type DisputeRequest = z.infer<typeof DisputeRequestSchema>;

// =============================================================================
// OPERATION RESULTS
// =============================================================================

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: MarketplaceError;
  timestamp: Date;
  operationId: string;
}

export interface AsyncOperationResult<T> extends OperationResult<T> {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export enum ErrorCode {
  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  
  // Authentication/Authorization errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  ACCESS_DENIED = 'ACCESS_DENIED',
  
  // Business logic errors
  LISTING_NOT_FOUND = 'LISTING_NOT_FOUND',
  PURCHASE_NOT_FOUND = 'PURCHASE_NOT_FOUND',
  INSUFFICIENT_PAYMENT = 'INSUFFICIENT_PAYMENT',
  LISTING_EXPIRED = 'LISTING_EXPIRED',
  ACCESS_EXPIRED = 'ACCESS_EXPIRED',
  MAX_DOWNLOADS_EXCEEDED = 'MAX_DOWNLOADS_EXCEEDED',
  
  // System errors
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  STORAGE_FAILED = 'STORAGE_FAILED',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  TEE_ERROR = 'TEE_ERROR',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Data integrity errors
  HASH_MISMATCH = 'HASH_MISMATCH',
  SIGNATURE_INVALID = 'SIGNATURE_INVALID',
  ATTESTATION_FAILED = 'ATTESTATION_FAILED'
}

export class MarketplaceError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly operationId: string;
  public readonly cause?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(message);
    this.name = 'MarketplaceError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.operationId = crypto.randomUUID();
    this.cause = cause;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MarketplaceError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      operationId: this.operationId,
      stack: this.stack
    };
  }
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export const NetworkConfigSchema = z.object({
  suiNetwork: z.enum(['mainnet', 'testnet', 'devnet', 'localnet']),
  suiRpcUrl: z.string().url(),
  marketplacePackageId: ObjectIdSchema,
  walrusAggregatorUrl: z.string().url(),
  nautilusEnclaveUrl: z.string().url(),
  enableTeeVerification: z.boolean().default(true)
});

export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;

export const SecurityConfigSchema = z.object({
  maxFileSize: z.number().int().positive().max(100 * 1024 * 1024 * 1024), // 100GB
  allowedMimeTypes: z.array(z.string()).optional(),
  encryptionAlgorithm: z.enum(['AES-256-GCM', 'ChaCha20-Poly1305']).default('AES-256-GCM'),
  keyDerivationRounds: z.number().int().positive().min(100000).default(310000),
  maxConcurrentOperations: z.number().int().positive().max(1000).default(10),
  operationTimeoutMs: z.number().int().positive().max(300000).default(30000)
});

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

// =============================================================================
// MONITORING TYPES
// =============================================================================

export interface MetricsData {
  operationType: string;
  duration: number;
  success: boolean;
  errorCode?: ErrorCode;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: Date;
  details?: Record<string, any>;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function createOperationResult<T>(
  success: boolean,
  data?: T,
  error?: MarketplaceError
): OperationResult<T> {
  return {
    success,
    data,
    error,
    timestamp: new Date(),
    operationId: crypto.randomUUID()
  };
}

export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new MarketplaceError(
        ErrorCode.INVALID_INPUT,
        'Input validation failed',
        {
          validationErrors: (error as any).errors,
          receivedInput: input
        }
      );
    }
    throw error;
  }
}