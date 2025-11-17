import { API_CONFIG } from './constants'
import type {
 ApiResponse,
 AuthChallenge,
 AuthSession,
 ModelListing,
 ModelUpload,
 PurchaseRequest,
 WalrusUploadResult,
 SealEncryptionResult,
 NautilusComputeRequest,
 NautilusComputeResult,
 TransactionRequest,
 SignedTransaction,
 TransactionResult,
 ModelFilters,
 SearchResult,
 UserStats,
} from './types'

export class ApiError extends Error {
 constructor(
  public code: string,
  public message: string,
  public details?: any,
  public status?: number
 ) {
  super(message)
  this.name = 'ApiError'
 }
}

class ApiClient {
 private baseURL: string
 private authToken: string | null = null

 constructor(baseURL: string = API_CONFIG.BASE_URL) {
  this.baseURL = baseURL
  this.loadStoredToken()
 }

 private loadStoredToken() {
  if (typeof window !== 'undefined') {
   this.authToken = localStorage.getItem('satya_auth_token')
  }
 }

 private saveToken(token: string) {
  this.authToken = token
  if (typeof window !== 'undefined') {
   localStorage.setItem('satya_auth_token', token)
  }
 }

 private clearToken() {
  this.authToken = null
  if (typeof window !== 'undefined') {
   localStorage.removeItem('satya_auth_token')
  }
 }

 private async request<T>(
  endpoint: string,
  options: RequestInit = {}
 ): Promise<T> {
  const url = `${this.baseURL}${endpoint}`
  
  const headers: Record<string, string> = {
   'Content-Type': 'application/json',
   ...(options.headers as Record<string, string> || {}),
  }

  if (this.authToken) {
   headers.Authorization = `Bearer ${this.authToken}`
  }

  const config: RequestInit = {
   ...options,
   headers,
  }

  try {
   const response = await fetch(url, config)
   
   if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
     errorData.error?.code || 'HTTP_ERROR',
     errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
     errorData.error?.details,
     response.status
    )
   }

   const data: ApiResponse<T> = await response.json()
   
   if (!data.success) {
    throw new ApiError(
     data.error?.code || 'API_ERROR',
     data.error?.message || 'An unknown error occurred',
     data.error?.details
    )
   }

   return data.data!
  } catch (error) {
   if (error instanceof ApiError) {
    throw error
   }
   throw new ApiError(
    'NETWORK_ERROR',
    'Failed to connect to the server',
    { originalError: error }
   )
  }
 }

 // Authentication Methods
 async getChallenge(address: string): Promise<AuthChallenge> {
  return this.request<AuthChallenge>(API_CONFIG.ENDPOINTS.AUTH.CHALLENGE, {
   method: 'POST',
   body: JSON.stringify({ address }),
  })
 }

 async verifySignature(
  address: string,
  signature: string,
  message: string
 ): Promise<AuthSession> {
  const session = await this.request<AuthSession>(API_CONFIG.ENDPOINTS.AUTH.VERIFY, {
   method: 'POST',
   body: JSON.stringify({ address, signature, message }),
  })
  
  this.saveToken(session.token)
  return session
 }

 async refreshSession(): Promise<AuthSession> {
  const session = await this.request<AuthSession>(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
   method: 'POST',
  })
  
  this.saveToken(session.token)
  return session
 }

 async getProfile(): Promise<AuthSession['user']> {
  return this.request<AuthSession['user']>(API_CONFIG.ENDPOINTS.AUTH.PROFILE)
 }

 async estimateGas(transaction: TransactionRequest): Promise<{ gasEstimate: string }> {
  return this.request<{ gasEstimate: string }>(API_CONFIG.ENDPOINTS.AUTH.ESTIMATE_GAS, {
   method: 'POST',
   body: JSON.stringify(transaction),
  })
 }

 logout() {
  this.clearToken()
 }

 // Marketplace Methods
 async getModels(filters?: ModelFilters): Promise<SearchResult<ModelListing>> {
  const params = new URLSearchParams()
  if (filters) {
   Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
     if (typeof value === 'object') {
      params.append(key, JSON.stringify(value))
     } else {
      params.append(key, String(value))
     }
    }
   })
  }

  const query = params.toString()
  const endpoint = query ? `${API_CONFIG.ENDPOINTS.MARKETPLACE.MODELS}?${query}` : API_CONFIG.ENDPOINTS.MARKETPLACE.MODELS
  
  return this.request<SearchResult<ModelListing>>(endpoint)
 }

 async getModel(id: string): Promise<ModelListing> {
  return this.request<ModelListing>(`${API_CONFIG.ENDPOINTS.MARKETPLACE.MODELS}/${id}`)
 }

 async createListing(model: ModelUpload): Promise<TransactionRequest> {
  const formData = new FormData()
  formData.append('file', model.file)
  if (model.thumbnail) {
   formData.append('thumbnail', model.thumbnail)
  }
  
  // Add model metadata
  Object.entries(model).forEach(([key, value]) => {
   if (key !== 'file' && key !== 'thumbnail' && value !== undefined) {
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
   }
  })

  return this.request<TransactionRequest>(API_CONFIG.ENDPOINTS.MARKETPLACE.LISTINGS, {
   method: 'POST',
   headers: {}, // Don't set Content-Type for FormData
   body: formData,
  })
 }

 async submitSignedListing(
  transactionBytes: string,
  signature: string,
  modelData: Partial<ModelUpload>
 ): Promise<TransactionResult> {
  return this.request<TransactionResult>(API_CONFIG.ENDPOINTS.MARKETPLACE.LISTINGS_SUBMIT, {
   method: 'POST',
   body: JSON.stringify({
    transactionBytes,
    signature,
    modelData,
   }),
  })
 }

 async createPurchase(request: PurchaseRequest): Promise<TransactionRequest> {
  return this.request<TransactionRequest>(API_CONFIG.ENDPOINTS.MARKETPLACE.PURCHASE, {
   method: 'POST',
   body: JSON.stringify(request),
  })
 }

 async submitSignedPurchase(
  transactionBytes: string,
  signature: string,
  purchaseData: PurchaseRequest
 ): Promise<TransactionResult> {
  return this.request<TransactionResult>(API_CONFIG.ENDPOINTS.MARKETPLACE.PURCHASE_SUBMIT, {
   method: 'POST',
   body: JSON.stringify({
    transactionBytes,
    signature,
    purchaseData,
   }),
  })
 }

 // Walrus Storage Methods
 async uploadToWalrus(file: File, metadata?: Record<string, any>): Promise<WalrusUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  if (metadata) {
   formData.append('metadata', JSON.stringify(metadata))
  }

  return this.request<WalrusUploadResult>(API_CONFIG.ENDPOINTS.WALRUS.UPLOAD, {
   method: 'POST',
   headers: {}, // Don't set Content-Type for FormData
   body: formData,
  })
 }

 async downloadFromWalrus(blobId: string): Promise<Blob> {
  const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.WALRUS.DOWNLOAD}/${blobId}`, {
   headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
  })

  if (!response.ok) {
   throw new ApiError(
    'DOWNLOAD_ERROR',
    'Failed to download file from Walrus',
    { blobId, status: response.status }
   )
  }

  return response.blob()
 }

 async getWalrusInfo(blobId: string): Promise<{ size: number; contentType: string }> {
  return this.request<{ size: number; contentType: string }>(`${API_CONFIG.ENDPOINTS.WALRUS.INFO}/${blobId}`)
 }

 // SEAL Encryption Methods
 async encryptWithSeal(data: ArrayBuffer, policyType: string): Promise<SealEncryptionResult> {
  const formData = new FormData()
  formData.append('data', new Blob([data]))
  formData.append('policyType', policyType)

  return this.request<SealEncryptionResult>(API_CONFIG.ENDPOINTS.SEAL.ENCRYPT, {
   method: 'POST',
   headers: {}, // Don't set Content-Type for FormData
   body: formData,
  })
 }

 async decryptWithSeal(policyId: string, encryptedData: string): Promise<ArrayBuffer> {
  const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.SEAL.DECRYPT}`, {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json',
    ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
   },
   body: JSON.stringify({ policyId, encryptedData }),
  })

  if (!response.ok) {
   throw new ApiError(
    'DECRYPTION_ERROR',
    'Failed to decrypt data with SEAL',
    { policyId }
   )
  }

  return response.arrayBuffer()
 }

 // Nautilus TEE Methods
 async submitTEEComputation(request: NautilusComputeRequest): Promise<{ jobId: string }> {
  return this.request<{ jobId: string }>(API_CONFIG.ENDPOINTS.NAUTILUS.COMPUTE, {
   method: 'POST',
   body: JSON.stringify(request),
  })
 }

 async getTEEComputationStatus(jobId: string): Promise<NautilusComputeResult> {
  return this.request<NautilusComputeResult>(`${API_CONFIG.ENDPOINTS.NAUTILUS.STATUS}/${jobId}`)
 }

 async getTEEComputationResult(jobId: string): Promise<NautilusComputeResult> {
  return this.request<NautilusComputeResult>(`${API_CONFIG.ENDPOINTS.NAUTILUS.RESULTS}/${jobId}`)
 }

 // Dashboard Methods
 async getUserStats(): Promise<UserStats> {
  return this.request<UserStats>('/api/dashboard/stats')
 }

 async getUserModels(status?: 'uploaded' | 'downloaded'): Promise<ModelListing[]> {
  const endpoint = status ? `/api/dashboard/models?status=${status}` : '/api/dashboard/models'
  return this.request<ModelListing[]>(endpoint)
 }

 // Health Check
 async healthCheck(): Promise<{ status: string; timestamp: string }> {
  return this.request<{ status: string; timestamp: string }>('/health')
 }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient