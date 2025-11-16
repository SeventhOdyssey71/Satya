// Satya Marketplace Configuration Constants
// All configurations loaded from environment variables

// ============================================
// SUI BLOCKCHAIN CONFIGURATION
// ============================================

export const SUI_CONFIG = {
  NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' || 'testnet',
  RPC_URL: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
  WEBSOCKET_URL: process.env.NEXT_PUBLIC_SUI_WEBSOCKET_URL || 'wss://fullnode.testnet.sui.io:9001',
  
  // Fallback RPC endpoints for better reliability
  FALLBACK_RPC_URLS: [
    'https://rpc.h2o-nodes.com/dsn/0d7b76b217d1a03ffd77b066624b5c690fa89892032/v1/service', // H2O Nodes SEAL testnet
    'https://fullnode.testnet.sui.io:443', // Default Sui testnet
    'https://sui-testnet-endpoint.blockvision.org/v1'
  ],
} as const

// ============================================
// MARKETPLACE CONTRACT CONFIGURATION
// ============================================

export const MARKETPLACE_CONFIG = {
  PACKAGE_ID: process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID || '',
  REGISTRY_ID: process.env.NEXT_PUBLIC_MARKETPLACE_REGISTRY_ID || '',
  UPGRADE_CAP: process.env.NEXT_PUBLIC_MARKETPLACE_UPGRADE_CAP || '',
  TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '',
  PLATFORM_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000000000000000000000000000',
  
  // Platform Settings
  PLATFORM_FEE_PERCENTAGE: parseInt(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || '250', 10),
  FEE_DENOMINATOR: parseInt(process.env.NEXT_PUBLIC_FEE_DENOMINATOR || '10000', 10),
  
  // Gas Configuration - Increased for robust transaction execution
  DEFAULT_GAS_BUDGET: parseInt(process.env.NEXT_PUBLIC_DEFAULT_GAS_BUDGET || '200000000', 10),
  MAX_GAS_BUDGET: parseInt(process.env.NEXT_PUBLIC_MAX_GAS_BUDGET || '1000000000', 10),
} as const

// ============================================
// SEAL ENCRYPTION CONFIGURATION
// ============================================

export const SEAL_CONFIG = {
  PACKAGE_ID: '0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82',
  UPGRADE_CAP_ID: process.env.NEXT_PUBLIC_SEAL_UPGRADE_CAP_ID || '',
  
  // Key Servers - Updated with correct testnet server object IDs
  KEY_SERVERS: [
    {
      OBJECT_ID: '0x2304dd255b13eaf5cb471bd5188df946a64f1715ee2b7b02fecf306bd12ceebc',
      URL: 'https://seal-key-server-testnet-1.mystenlabs.com',
    },
    {
      OBJECT_ID: '0x81aeaa8c25d2c912e1dc23b4372305b7a602c4ec4cc3e510963bc635e500aa37',
      URL: 'https://seal-key-server-testnet-2.mystenlabs.com',
    },
  ],
  
  // Agent Configuration
  agent: {
    threshold: 2,
    defaultEpochs: 200,
    sessionTtlMinutes: 30,
    cacheSize: 100,
    maxRetries: 3,
  },
} as const

// ============================================
// WALRUS STORAGE CONFIGURATION
// ============================================

export const WALRUS_CONFIG = {
  AGGREGATOR_URL: process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || 'https://aggregator-devnet.walrus.space',
  PUBLISHER_URL: process.env.NEXT_PUBLIC_WALRUS_PUBLISHER || 'https://publisher-devnet.walrus.space',
  SYSTEM_OBJECT: process.env.NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT || '',
  
  // Storage Nodes
  STORAGE_NODES: [
    process.env.NEXT_PUBLIC_WALRUS_STORAGE_NODE_1 || '',
    process.env.NEXT_PUBLIC_WALRUS_STORAGE_NODE_2 || '',
    process.env.NEXT_PUBLIC_WALRUS_STORAGE_NODE_3 || '',
    process.env.NEXT_PUBLIC_WALRUS_STORAGE_NODE_4 || '',
    process.env.NEXT_PUBLIC_WALRUS_STORAGE_NODE_5 || '',
  ].filter(Boolean),
  
  // Agent Configuration
  agent: {
    defaultEpochs: parseInt(process.env.NEXT_PUBLIC_WALRUS_DEFAULT_EPOCHS || '5', 10),
    maxFileSize: parseInt(process.env.NEXT_PUBLIC_WALRUS_MAX_FILE_SIZE || '1073741824', 10), // 1GB
    chunkSize: parseInt(process.env.NEXT_PUBLIC_WALRUS_CHUNK_SIZE || '10485760', 10), // 10MB
    maxRetries: parseInt(process.env.NEXT_PUBLIC_WALRUS_MAX_RETRIES || '3', 10),
    cacheSizeMB: parseInt(process.env.NEXT_PUBLIC_WALRUS_CACHE_SIZE_MB || '100', 10),
    retryDelayMs: 1000, // Base retry delay
  },
} as const

// ============================================
// API CONFIGURATION (for backward compatibility)
// ============================================

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  ENDPOINTS: {
    // Authentication
    AUTH: {
      CHALLENGE: '/api/auth/challenge',
      VERIFY: '/api/auth/verify',
      REFRESH: '/api/auth/refresh',
      PROFILE: '/api/auth/profile',
      ESTIMATE_GAS: '/api/auth/estimate-gas',
    },
    // Marketplace
    MARKETPLACE: {
      LISTINGS: '/api/marketplace/listings',
      LISTINGS_SUBMIT: '/api/marketplace/listings/submit-signed',
      PURCHASE: '/api/marketplace/purchase',
      PURCHASE_SUBMIT: '/api/marketplace/purchase/submit-signed',
      MODELS: '/api/marketplace/models',
    },
    // Walrus
    WALRUS: {
      UPLOAD: '/api/walrus/upload',
      DOWNLOAD: '/api/walrus/download',
      INFO: '/api/walrus/info',
    },
    // SEAL
    SEAL: {
      ENCRYPT: '/api/seal/encrypt',
      DECRYPT: '/api/seal/decrypt',
      VERIFY: '/api/seal/verify',
    },
    // Nautilus
    NAUTILUS: {
      COMPUTE: '/api/nautilus/compute',
      STATUS: '/api/nautilus/status',
      RESULTS: '/api/nautilus/results',
    },
  },
} as const

// ============================================
// APPLICATION CONFIGURATION
// ============================================

export const APP_CONFIG = {
  NAME: 'Satya Data Marketplace',
  VERSION: '1.0.0',
  ENVIRONMENT: process.env.NEXT_PUBLIC_NODE_ENV || 'development',
  
  // File Upload Limits
  MAX_FILE_SIZE: parseInt(process.env.NEXT_PUBLIC_WALRUS_MAX_FILE_SIZE || (100 * 1024 * 1024).toString(), 10),
  ALLOWED_FILE_TYPES: [
    'application/json',
    'application/octet-stream',
    'text/csv',
    'application/zip',
    'application/x-tar',
    'application/x-gzip',
    'application/x-compressed',
    'model/onnx', // ONNX model files
    'application/x-pickle', // Pickle files
  ],
  
  // UI Configuration
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 12,
    MAX_PAGE_SIZE: 50,
  },
  
  // Performance Settings
  PARALLEL_UPLOADS: parseInt(process.env.NEXT_PUBLIC_PARALLEL_UPLOADS || '3', 10),
  PARALLEL_DOWNLOADS: parseInt(process.env.NEXT_PUBLIC_PARALLEL_DOWNLOADS || '5', 10),
  PARALLEL_VERIFICATIONS: parseInt(process.env.NEXT_PUBLIC_PARALLEL_VERIFICATIONS || '2', 10),
  
  // Cache Settings
  CACHE_TTL_SECONDS: parseInt(process.env.NEXT_PUBLIC_CACHE_TTL_SECONDS || '1800', 10),
  CACHE_MAX_SIZE: parseInt(process.env.NEXT_PUBLIC_CACHE_MAX_SIZE || '1000', 10),
  
  // Development Settings
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  VERBOSE_LOGGING: process.env.NEXT_PUBLIC_VERBOSE_LOGGING === 'true',
  
  // Mock Services
  MOCK_WALRUS: process.env.NEXT_PUBLIC_MOCK_WALRUS === 'true',
  MOCK_SEAL: process.env.NEXT_PUBLIC_MOCK_SEAL === 'true',
  MOCK_SUI: process.env.NEXT_PUBLIC_MOCK_SUI === 'true',
  
  // Feature Flags
  ENABLE_WALRUS_SDK_UPLOADS: process.env.NEXT_PUBLIC_ENABLE_WALRUS_SDK_UPLOADS === 'true',
} as const

// ============================================
// NAUTILUS TEE CONFIGURATION
// ============================================

export const NAUTILUS_CONFIG = {
  // For local development
  LOCAL_ENCLAVE_URL: 'http://localhost:8080',
  
  // Attestation settings
  ATTESTATION_VALIDITY_MS: parseInt(process.env.NEXT_PUBLIC_ATTESTATION_VALIDITY_MS || '86400000', 10), // 24 hours
  DEFAULT_ACCESS_DURATION_MS: parseInt(process.env.NEXT_PUBLIC_DEFAULT_ACCESS_DURATION_MS || '2592000000', 10), // 30 days
} as const

// ============================================
// VALIDATION UTILITIES
// ============================================

export const validateConfiguration = () => {
  const requiredConfigs = [
    { key: 'MARKETPLACE_PACKAGE_ID', value: MARKETPLACE_CONFIG.PACKAGE_ID },
    { key: 'SEAL_PACKAGE_ID', value: SEAL_CONFIG.PACKAGE_ID },
    { key: 'WALRUS_AGGREGATOR_URL', value: WALRUS_CONFIG.AGGREGATOR_URL },
    { key: 'WALRUS_PUBLISHER_URL', value: WALRUS_CONFIG.PUBLISHER_URL },
  ]
  
  const missingConfigs = requiredConfigs.filter(config => !config.value)
  
  if (missingConfigs.length > 0) {
    console.warn('Missing required configurations:', missingConfigs.map(c => c.key))
    if (APP_CONFIG.ENVIRONMENT === 'production') {
      throw new Error(`Missing required configurations: ${missingConfigs.map(c => c.key).join(', ')}`)
    }
  }
  
  return {
    valid: missingConfigs.length === 0,
    missing: missingConfigs.map(c => c.key)
  }
}

// ============================================
// TYPE EXPORTS
// ============================================

export type NetworkType = typeof SUI_CONFIG.NETWORK
export type EnvironmentType = typeof APP_CONFIG.ENVIRONMENT

// Validate configuration on module load (non-production only)
if (typeof window !== 'undefined' && APP_CONFIG.ENVIRONMENT !== 'production') {
  const validation = validateConfiguration()
  if (!validation.valid) {
    console.log('Configuration validation:', validation)
  }
}
