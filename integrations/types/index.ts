export interface DataListing {
  id: string;
  seller: string;
  title: string;
  description: string;
  price: bigint;
  category: string;
  size: number;
  sampleAvailable: boolean;
  encryptedBlobId: string;
  encryptionPolicyId: string;
  dataHash: string;
  attestationId?: string;
  allowedBuyers?: string[];
  expiryDate?: Date;
  maxDownloads?: number;
  createdAt: Date;
  isActive: boolean;
}

export interface PurchaseRequest {
  listingId: string;
  buyer: string;
  paymentAmount: bigint;
  accessDuration?: number;
}

export interface DataAccess {
  listingId: string;
  buyer: string;
  expiresAt: Date;
  downloadCount: number;
  attestation?: string;
}

export interface DisputeRequest {
  listingId: string;
  buyer: string;
  reason: string;
  evidence?: Record<string, any>;
}

export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  LISTING_NOT_FOUND = 'LISTING_NOT_FOUND',
  INSUFFICIENT_PAYMENT = 'INSUFFICIENT_PAYMENT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  STORAGE_FAILED = 'STORAGE_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  HASH_MISMATCH = 'HASH_MISMATCH'
}

export class MarketplaceError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MarketplaceError';
  }
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}