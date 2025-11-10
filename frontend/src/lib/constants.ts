// API Configuration Constants
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
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

// Sui Configuration
export const SUI_CONFIG = {
  NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet',
  RPC_URL: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io',
} as const

// Walrus Configuration
export const WALRUS_CONFIG = {
  PUBLISHER_URL: process.env.NEXT_PUBLIC_WALRUS_PUBLISHER || 'https://walrus-testnet-publisher.nodes.guru',
  AGGREGATOR_URL: process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || 'https://walrus-testnet-aggregator.nodes.guru',
} as const

// Application Configuration
export const APP_CONFIG = {
  NAME: 'Satya Data Marketplace',
  VERSION: '1.0.0',
  ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  
  // File Upload Limits
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_FILE_TYPES: [
    'application/json',
    'application/octet-stream',
    'text/csv',
    'application/zip',
    'application/x-tar',
  ],
  
  // UI Configuration
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 12,
    MAX_PAGE_SIZE: 50,
  },
} as const