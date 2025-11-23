// Export comprehensive types and utilities
export * from './common';

// Legacy interface compatibility
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