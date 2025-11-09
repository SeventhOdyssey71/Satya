// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId?: string
  }
}

// Authentication Types
export interface AuthChallenge {
  message: string
  nonce: string
  expiresAt: string
}

export interface AuthSession {
  token: string
  expiresAt: string
  user: {
    address: string
    balance?: string
    isVerified?: boolean
  }
}

export interface WalletSignature {
  signature: string
  publicKey?: string
}

// Model & Marketplace Types
export interface ModelListing {
  id: string
  title: string
  description: string
  category: string
  price: string
  author: string
  authorAddress: string
  walrusBlobId?: string
  sealPolicyId?: string
  isEncrypted: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
  downloads: number
  rating?: number
  tags?: string[]
  metadata?: {
    modelType?: string
    framework?: string
    size?: number
    accuracy?: number
    originalFileName?: string
    isEncrypted?: boolean
    sealPolicyId?: string
  }
}

export interface ModelUpload {
  title: string
  description: string
  category: string
  price: string
  file: File
  thumbnail?: File
  tags?: string[]
  isPrivate?: boolean
  enableSealEncryption?: boolean
  metadata?: {
    modelType?: string
    framework?: string
    license?: string
  }
}

export interface PurchaseRequest {
  modelId: string
  buyerAddress: string
  paymentAmount: string
}

// Walrus Storage Types
export interface WalrusUploadResult {
  blobId: string
  suiObjectId: string
  uploadUrl?: string
  size: number
  contentType: string
}

export interface WalrusBlob {
  blobId: string
  size: number
  contentType: string
  uploadedAt: string
  metadata?: Record<string, any>
}

// SEAL Encryption Types
export interface SealEncryptionResult {
  policyId: string
  encryptedData: string
  dekHash: string
  metadata: {
    algorithm: string
    keySize: number
    createdAt: string
  }
}

export interface SealDecryptionRequest {
  policyId: string
  encryptedData: string
  userAddress: string
  accessToken?: string
}

// Nautilus TEE Types
export interface NautilusComputeRequest {
  modelId: string
  inputData: any
  computationType: 'inference' | 'validation' | 'training'
  requirements?: {
    memory?: string
    cpu?: string
    timeout?: number
  }
}

export interface NautilusComputeResult {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: any
  attestation?: {
    pcr0: string
    pcr1: string
    pcr2: string
    signature: string
    timestamp: string
  }
  metrics?: {
    executionTime: number
    memoryUsed: number
    cpuUsed: number
  }
  error?: string
}

// Transaction Types
export interface TransactionRequest {
  type: 'listing' | 'purchase' | 'transfer'
  data: any
  gasEstimate?: {
    amount: string
    price: string
    total: string
  }
}

export interface SignedTransaction {
  transactionBytes: string
  signature: string
  publicKey?: string
}

export interface TransactionResult {
  transactionId: string
  status: 'pending' | 'confirmed' | 'failed'
  blockNumber?: number
  gasUsed?: string
  error?: string
}

// Wallet Types
export interface WalletInfo {
  address: string
  balance: string
  isConnected: boolean
  walletType?: 'sui-wallet' | 'suiet' | 'martian' | 'other'
}

export interface WalletAdapter {
  connect: () => Promise<WalletInfo>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<WalletSignature>
  signTransaction: (transaction: any) => Promise<SignedTransaction>
  getBalance: () => Promise<string>
}

// Error Types
export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp?: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// Search & Filter Types
export interface ModelFilters {
  category?: string
  priceRange?: {
    min?: number
    max?: number
  }
  tags?: string[]
  author?: string
  isVerified?: boolean
  isEncrypted?: boolean
  sortBy?: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'rating' | 'downloads'
  page?: number
  pageSize?: number
  search?: string
}

export interface SearchResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Dashboard Types
export interface UserStats {
  modelsUploaded: number
  modelsDownloaded: number
  totalEarnings: string
  totalSpent: string
  reputation: number
  verificationLevel: 'none' | 'basic' | 'verified' | 'premium'
}

export interface ModelStats {
  downloads: number
  earnings: string
  rating: number
  reviews: number
  views: number
  lastDownloaded?: string
}