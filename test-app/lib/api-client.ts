import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types for API responses
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
  message?: string;
  timestamp: string;
}

export interface ListingData {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  fileHash: string;
  sellerAddress: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  category: string;
  fileHash: string;
  encryptionKey?: string;
  metadata?: any;
}

export interface PurchaseRequest {
  listingId: string;
}

export interface VerificationRequest {
  assetId: string;
  blobId: string;
  expectedHash: string;
  metadata?: {
    format: string;
    expectedSize?: number;
  };
}

export interface AttestationData {
  assetId: string;
  dataHash: string;
  verificationResult: {
    authentic: boolean;
    quality: number;
    size: number;
    format: string;
    timestamp: string;
  };
  pcr: string;
  signature: string;
  enclaveId: string;
}

class APIClient {
  private axios: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const timeout = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000');

    this.axios = axios.create({
      baseURL: `${baseURL}/api`,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axios.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear auth token on 401
          this.authToken = null;
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = null;
  }

  // Authentication endpoints
  async authenticateWallet(walletAddress: string, signature: string): Promise<APIResponse<{ token: string }>> {
    const response: AxiosResponse<APIResponse<{ token: string }>> = await this.axios.post('/auth/wallet', {
      walletAddress,
      signature,
    });
    
    if (response.data.success && response.data.data?.token) {
      this.setAuthToken(response.data.data.token);
    }
    
    return response.data;
  }

  async getNonce(walletAddress: string): Promise<APIResponse<{ nonce: string }>> {
    const response: AxiosResponse<APIResponse<{ nonce: string }>> = await this.axios.get(`/auth/nonce/${walletAddress}`);
    return response.data;
  }

  // Marketplace endpoints
  async getListings(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<APIResponse<{ listings: ListingData[]; total: number; page: number; limit: number }>> {
    const response: AxiosResponse<APIResponse<{ listings: ListingData[]; total: number; page: number; limit: number }>> = 
      await this.axios.get('/marketplace/listings', { params });
    return response.data;
  }

  async getListing(id: string): Promise<APIResponse<ListingData>> {
    const response: AxiosResponse<APIResponse<ListingData>> = await this.axios.get(`/marketplace/listings/${id}`);
    return response.data;
  }

  async createListing(data: CreateListingRequest): Promise<APIResponse<any>> {
    const response: AxiosResponse<APIResponse<any>> = await this.axios.post('/marketplace/listings', data);
    return response.data;
  }

  async submitSignedListing(transactionBlock: string, signature: string, listingData: any): Promise<APIResponse<any>> {
    const response: AxiosResponse<APIResponse<any>> = await this.axios.post('/marketplace/listings/submit-signed', {
      transactionBlock,
      signature,
      listingData,
    });
    return response.data;
  }

  async purchaseListing(data: PurchaseRequest): Promise<APIResponse<any>> {
    const response: AxiosResponse<APIResponse<any>> = await this.axios.post('/marketplace/purchase', data);
    return response.data;
  }

  async submitSignedPurchase(transactionBlock: string, signature: string, purchaseData: any): Promise<APIResponse<any>> {
    const response: AxiosResponse<APIResponse<any>> = await this.axios.post('/marketplace/purchase/submit-signed', {
      transactionBlock,
      signature,
      purchaseData,
    });
    return response.data;
  }

  async getDownloadLink(purchaseId: string): Promise<APIResponse<{ downloadUrl: string; expiresAt: string }>> {
    const response: AxiosResponse<APIResponse<{ downloadUrl: string; expiresAt: string }>> = 
      await this.axios.get(`/marketplace/downloads/${purchaseId}`);
    return response.data;
  }

  // Walrus endpoints
  async uploadFile(file: File): Promise<APIResponse<{ blobId: string; filename: string; size: number; uploadedAt: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<APIResponse<{ blobId: string; filename: string; size: number; uploadedAt: string }>> = 
      await this.axios.post('/walrus/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    return response.data;
  }

  async downloadFile(blobId: string): Promise<Uint8Array> {
    const response: AxiosResponse<ArrayBuffer> = await this.axios.get(`/walrus/download/${blobId}`, {
      responseType: 'arraybuffer',
    });
    return new Uint8Array(response.data);
  }

  async getFileInfo(blobId: string): Promise<APIResponse<{ blobId: string; available: boolean; storedAt: string }>> {
    const response: AxiosResponse<APIResponse<{ blobId: string; available: boolean; storedAt: string }>> = 
      await this.axios.get(`/walrus/info/${blobId}`);
    return response.data;
  }

  // Nautilus endpoints
  async requestVerification(data: VerificationRequest): Promise<APIResponse<{ requestId: string }>> {
    const response: AxiosResponse<APIResponse<{ requestId: string }>> = 
      await this.axios.post('/nautilus/verify', data);
    return response.data;
  }

  async getAttestationResult(requestId: string): Promise<APIResponse<AttestationData | null>> {
    const response: AxiosResponse<APIResponse<AttestationData | null>> = 
      await this.axios.get(`/nautilus/attestation/${requestId}`);
    return response.data;
  }

  async processDataInEnclave(blobId: string, operations: string[]): Promise<APIResponse<{ resultHash: string; attestation: AttestationData }>> {
    const response: AxiosResponse<APIResponse<{ resultHash: string; attestation: AttestationData }>> = 
      await this.axios.post('/nautilus/process', { blobId, operations });
    return response.data;
  }

  // SEAL endpoints
  async encryptData(data: string, policyId: string): Promise<APIResponse<{ encryptedData: string; sessionId: string }>> {
    const response: AxiosResponse<APIResponse<{ encryptedData: string; sessionId: string }>> = 
      await this.axios.post('/seal/encrypt', { data, policyId });
    return response.data;
  }

  async decryptData(encryptedData: string, sessionId: string): Promise<APIResponse<{ data: string }>> {
    const response: AxiosResponse<APIResponse<{ data: string }>> = 
      await this.axios.post('/seal/decrypt', { encryptedData, sessionId });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<APIResponse<{ status: string; services: Record<string, string> }>> {
    const response: AxiosResponse<APIResponse<{ status: string; services: Record<string, string> }>> = 
      await this.axios.get('/health', { baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001' });
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new APIClient();