import { z } from 'zod';
import { apiClient } from './api-client';

// Mock Nautilus attestation types
export const AttestationDataSchema = z.object({
  assetId: z.string(),
  dataHash: z.string(),
  verificationResult: z.object({
    authentic: z.boolean(),
    quality: z.number().min(0).max(100),
    size: z.number(),
    format: z.string(),
    timestamp: z.string(),
  }),
  pcr: z.string(),
  signature: z.string(),
  enclaveId: z.string(),
});

export const VerificationRequestSchema = z.object({
  assetId: z.string(),
  blobId: z.string(),
  expectedHash: z.string(),
  metadata: z.object({
    format: z.string(),
    expectedSize: z.number().optional(),
  }).optional(),
});

export type AttestationData = z.infer<typeof AttestationDataSchema>;
export type VerificationRequest = z.infer<typeof VerificationRequestSchema>;

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  dataType: string;
  size: number;
  format: string;
  seller: string;
  verified: boolean;
  attestation?: AttestationData;
  blobId: string;
  sealPolicyId: string;
  createdAt: string;
}

export class NautilusClient {
  private baseUrl: string;
  private mockMode: boolean;

  constructor(baseUrl: string = '/api/nautilus', mockMode?: boolean) {
    this.baseUrl = baseUrl;
    this.mockMode = mockMode ?? (process.env.NEXT_PUBLIC_MOCK_MODE === 'true');
  }

  async requestVerification(request: VerificationRequest): Promise<{ requestId: string }> {
    if (this.mockMode) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
    }

    try {
      const response = await apiClient.requestVerification(request);
      if (response.success && response.data) {
        return { requestId: response.data.requestId };
      } else {
        throw new Error(response.error?.message || 'Verification request failed');
      }
    } catch (error) {
      console.error('Verification request error:', error);
      throw error;
    }
  }

  async getAttestationResult(requestId: string): Promise<AttestationData | null> {
    if (this.mockMode) {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        assetId: `asset_${requestId}`,
        dataHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        verificationResult: {
          authentic: Math.random() > 0.1, // 90% success rate
          quality: Math.floor(Math.random() * 40) + 60, // 60-100% quality
          size: Math.floor(Math.random() * 10000000) + 1000, // 1KB - 10MB
          format: ['json', 'csv', 'parquet', 'xlsx'][Math.floor(Math.random() * 4)],
          timestamp: new Date().toISOString(),
        },
        pcr: `0x${Math.random().toString(16).substr(2, 64)}`,
        signature: `0x${Math.random().toString(16).substr(2, 128)}`,
        enclaveId: `enclave_${Math.random().toString(36).substr(2, 16)}`,
      };
    }

    try {
      const response = await apiClient.getAttestationResult(requestId);
      if (response.success) {
        return response.data || null;
      } else if (response.error?.message.includes('not found')) {
        return null; // Still processing
      } else {
        throw new Error(response.error?.message || 'Failed to get attestation');
      }
    } catch (error) {
      console.error('Attestation result error:', error);
      throw error;
    }
  }

  async processDataInEnclave(blobId: string, operations: string[]): Promise<{
    resultHash: string;
    attestation: AttestationData;
  }> {
    if (this.mockMode) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const resultHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const attestation: AttestationData = {
        assetId: blobId,
        dataHash: resultHash,
        verificationResult: {
          authentic: true,
          quality: 95,
          size: Math.floor(Math.random() * 1000000),
          format: 'processed',
          timestamp: new Date().toISOString(),
        },
        pcr: `0x${Math.random().toString(16).substr(2, 64)}`,
        signature: `0x${Math.random().toString(16).substr(2, 128)}`,
        enclaveId: `enclave_${Math.random().toString(36).substr(2, 16)}`,
      };
      
      return { resultHash, attestation };
    }

    try {
      const response = await apiClient.processDataInEnclave(blobId, operations);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Processing failed');
      }
    } catch (error) {
      console.error('Data processing error:', error);
      throw error;
    }
  }

  // Mock marketplace functionality
  async getMockListings(): Promise<MarketplaceListing[]> {
    const listings: MarketplaceListing[] = [
      {
        id: 'listing_1',
        title: 'Customer Purchase Analytics Dataset',
        description: 'Anonymized customer purchase data from Q3 2024, perfect for ML training',
        price: 0.5,
        dataType: 'Analytics',
        size: 2500000,
        format: 'CSV',
        seller: '0x742d...8a1f',
        verified: true,
        blobId: 'blob_analytics_001',
        sealPolicyId: 'policy_001',
        createdAt: '2024-11-01T10:00:00Z',
        attestation: {
          assetId: 'listing_1',
          dataHash: '0x8f4a0bdad87096c8ed48b5711dbf701d5d3f45c7509bce440b374c4b63b46702',
          verificationResult: {
            authentic: true,
            quality: 92,
            size: 2500000,
            format: 'csv',
            timestamp: '2024-11-01T10:05:00Z',
          },
          pcr: '0x1234567890abcdef',
          signature: '0xabcdef1234567890',
          enclaveId: 'enclave_verified_001',
        },
      },
      {
        id: 'listing_2',
        title: 'IoT Sensor Temperature Data',
        description: 'Real-time temperature sensor data from smart city infrastructure',
        price: 0.2,
        dataType: 'IoT',
        size: 850000,
        format: 'JSON',
        seller: '0x9b2f...4c8d',
        verified: false,
        blobId: 'blob_iot_002',
        sealPolicyId: 'policy_002',
        createdAt: '2024-11-02T14:30:00Z',
      },
      {
        id: 'listing_3',
        title: 'Financial Market Indicators',
        description: 'Historical and real-time financial market data for algorithmic trading',
        price: 1.2,
        dataType: 'Financial',
        size: 5200000,
        format: 'Parquet',
        seller: '0x3a7e...9d2b',
        verified: true,
        blobId: 'blob_finance_003',
        sealPolicyId: 'policy_003',
        createdAt: '2024-11-03T09:15:00Z',
        attestation: {
          assetId: 'listing_3',
          dataHash: '0x7e9f2a8b3c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
          verificationResult: {
            authentic: true,
            quality: 98,
            size: 5200000,
            format: 'parquet',
            timestamp: '2024-11-03T09:20:00Z',
          },
          pcr: '0xfedcba0987654321',
          signature: '0x0987654321fedcba',
          enclaveId: 'enclave_verified_002',
        },
      },
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return listings;
  }
}

export const nautilusClient = new NautilusClient();