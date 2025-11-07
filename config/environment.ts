/**
 * Environment Configuration Loader
 * Loads and validates environment variables for the Satya Marketplace
 */

export interface EnvironmentConfig {
  // Network Configuration
  nodeEnv: string;
  network: string;
  
  // Sui Configuration
  sui: {
    network: string;
    rpcUrl: string;
    websocketUrl: string;
    privateKey: string;
    walletAddress: string;
    defaultGasBudget: number;
    maxGasBudget: number;
  };
  
  // Marketplace Configuration
  marketplace: {
    packageId?: string;
    adminCapId?: string;
    verifierAdminCapId?: string;
    treasuryAddress: string;
    platformFeePercentage: number;
    feeDenominator: number;
    defaultAccessDurationMs: number;
    attestationValidityMs: number;
  };
  
  // Seal Configuration
  seal: {
    packageId: string;
    upgradeCapId: string;
    threshold: number;
    defaultEpochs: number;
    sessionTtlMinutes: number;
    cacheSize: number;
    maxRetries: number;
    keyServers: Array<{
      objectId: string;
      url: string;
    }>;
  };
  
  // Walrus Configuration
  walrus: {
    aggregator: string;
    publisher: string;
    systemObject: string;
    defaultEpochs: number;
    maxFileSize: number;
    chunkSize: number;
    maxRetries: number;
    cacheSizeMb: number;
    storageNodes: string[];
  };
  
  // API Configuration
  api: {
    port: number;
    host: string;
    baseUrl: string;
    corsOrigin: string[];
    corsMethods: string[];
    corsHeaders: string[];
  };
  
  // Security Configuration
  security: {
    rateLimitEnabled: boolean;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    sessionSecret: string;
    sessionTtlHours: number;
  };
  
  // Monitoring Configuration
  monitoring: {
    logLevel: string;
    logFormat: string;
    metricsEnabled: boolean;
    metricsPort: number;
    healthCheckIntervalMs: number;
    errorReportingEnabled: boolean;
    errorReportingEndpoint: string;
  };
  
  // Performance Configuration
  performance: {
    connectionPoolSize: number;
    requestTimeoutMs: number;
    parallelUploads: number;
    parallelDownloads: number;
    parallelVerifications: number;
    cacheTtlSeconds: number;
    cacheMaxSize: number;
  };
  
  // Development Configuration
  development: {
    debugMode: boolean;
    verboseLogging: boolean;
    testTimeoutMs: number;
    mockWalrus: boolean;
    mockSeal: boolean;
    mockSui: boolean;
  };
}

/**
 * Load and validate environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  // Helper function to get required environment variable
  const getRequired = (key: string): string => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  };
  
  // Helper function to get optional environment variable with default
  const getOptional = (key: string, defaultValue: string): string => {
    return process.env[key] || defaultValue;
  };
  
  // Helper function to get number with default
  const getNumber = (key: string, defaultValue: number): number => {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  };
  
  // Helper function to get boolean with default
  const getBoolean = (key: string, defaultValue: boolean): boolean => {
    const value = process.env[key];
    return value ? value.toLowerCase() === 'true' : defaultValue;
  };
  
  // Helper function to get array from comma-separated string
  const getArray = (key: string, defaultValue: string[] = []): string[] => {
    const value = process.env[key];
    return value ? value.split(',').map(item => item.trim()) : defaultValue;
  };
  
  return {
    nodeEnv: getOptional('NODE_ENV', 'development'),
    network: getOptional('NETWORK', 'testnet'),
    
    sui: {
      network: getOptional('SUI_NETWORK', 'testnet'),
      rpcUrl: getOptional('SUI_RPC_URL', 'https://fullnode.testnet.sui.io:443'),
      websocketUrl: getOptional('SUI_WEBSOCKET_URL', 'wss://fullnode.testnet.sui.io:9001'),
      privateKey: getRequired('SUI_PRIVATE_KEY'),
      walletAddress: getRequired('SUI_WALLET_ADDRESS'),
      defaultGasBudget: getNumber('DEFAULT_GAS_BUDGET', 100000000),
      maxGasBudget: getNumber('MAX_GAS_BUDGET', 1000000000),
    },
    
    marketplace: {
      packageId: process.env.MARKETPLACE_PACKAGE_ID,
      adminCapId: process.env.MARKETPLACE_ADMIN_CAP_ID,
      verifierAdminCapId: process.env.VERIFIER_ADMIN_CAP_ID,
      treasuryAddress: getRequired('TREASURY_ADDRESS'),
      platformFeePercentage: getNumber('PLATFORM_FEE_PERCENTAGE', 250),
      feeDenominator: getNumber('FEE_DENOMINATOR', 10000),
      defaultAccessDurationMs: getNumber('DEFAULT_ACCESS_DURATION_MS', 2592000000),
      attestationValidityMs: getNumber('ATTESTATION_VALIDITY_MS', 86400000),
    },
    
    seal: {
      packageId: getRequired('SEAL_PACKAGE_ID'),
      upgradeCapId: getRequired('SEAL_UPGRADE_CAP_ID'),
      threshold: getNumber('SEAL_THRESHOLD', 2),
      defaultEpochs: getNumber('SEAL_DEFAULT_EPOCHS', 200),
      sessionTtlMinutes: getNumber('SEAL_SESSION_TTL_MINUTES', 30),
      cacheSize: getNumber('SEAL_CACHE_SIZE', 100),
      maxRetries: getNumber('SEAL_MAX_RETRIES', 3),
      keyServers: [
        {
          objectId: getRequired('SEAL_KEY_SERVER_1_OBJECT_ID'),
          url: getRequired('SEAL_KEY_SERVER_1_URL'),
        },
        {
          objectId: getRequired('SEAL_KEY_SERVER_2_OBJECT_ID'),
          url: getRequired('SEAL_KEY_SERVER_2_URL'),
        },
      ],
    },
    
    walrus: {
      aggregator: getRequired('WALRUS_AGGREGATOR'),
      publisher: getRequired('WALRUS_PUBLISHER'),
      systemObject: getRequired('WALRUS_SYSTEM_OBJECT'),
      defaultEpochs: getNumber('WALRUS_DEFAULT_EPOCHS', 5),
      maxFileSize: getNumber('WALRUS_MAX_FILE_SIZE', 1073741824),
      chunkSize: getNumber('WALRUS_CHUNK_SIZE', 10485760),
      maxRetries: getNumber('WALRUS_MAX_RETRIES', 3),
      cacheSizeMb: getNumber('WALRUS_CACHE_SIZE_MB', 100),
      storageNodes: [
        getOptional('WALRUS_STORAGE_NODE_1', ''),
        getOptional('WALRUS_STORAGE_NODE_2', ''),
        getOptional('WALRUS_STORAGE_NODE_3', ''),
        getOptional('WALRUS_STORAGE_NODE_4', ''),
        getOptional('WALRUS_STORAGE_NODE_5', ''),
      ].filter(node => node !== ''),
    },
    
    api: {
      port: getNumber('API_PORT', 3000),
      host: getOptional('API_HOST', 'localhost'),
      baseUrl: getOptional('API_BASE_URL', 'http://localhost:3000'),
      corsOrigin: getArray('CORS_ORIGIN', ['http://localhost:3000']),
      corsMethods: getArray('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
      corsHeaders: getArray('CORS_HEADERS', ['Content-Type', 'Authorization']),
    },
    
    security: {
      rateLimitEnabled: getBoolean('RATE_LIMIT_ENABLED', true),
      rateLimitWindowMs: getNumber('RATE_LIMIT_WINDOW_MS', 900000),
      rateLimitMaxRequests: getNumber('RATE_LIMIT_MAX_REQUESTS', 100),
      sessionSecret: getOptional('SESSION_SECRET', 'change-this-in-production'),
      sessionTtlHours: getNumber('SESSION_TTL_HOURS', 24),
    },
    
    monitoring: {
      logLevel: getOptional('LOG_LEVEL', 'info'),
      logFormat: getOptional('LOG_FORMAT', 'json'),
      metricsEnabled: getBoolean('METRICS_ENABLED', true),
      metricsPort: getNumber('METRICS_PORT', 9090),
      healthCheckIntervalMs: getNumber('HEALTH_CHECK_INTERVAL_MS', 30000),
      errorReportingEnabled: getBoolean('ERROR_REPORTING_ENABLED', true),
      errorReportingEndpoint: getOptional('ERROR_REPORTING_ENDPOINT', '/api/errors'),
    },
    
    performance: {
      connectionPoolSize: getNumber('CONNECTION_POOL_SIZE', 10),
      requestTimeoutMs: getNumber('REQUEST_TIMEOUT_MS', 30000),
      parallelUploads: getNumber('PARALLEL_UPLOADS', 3),
      parallelDownloads: getNumber('PARALLEL_DOWNLOADS', 5),
      parallelVerifications: getNumber('PARALLEL_VERIFICATIONS', 2),
      cacheTtlSeconds: getNumber('CACHE_TTL_SECONDS', 1800),
      cacheMaxSize: getNumber('CACHE_MAX_SIZE', 1000),
    },
    
    development: {
      debugMode: getBoolean('DEBUG_MODE', false),
      verboseLogging: getBoolean('VERBOSE_LOGGING', false),
      testTimeoutMs: getNumber('TEST_TIMEOUT_MS', 30000),
      mockWalrus: getBoolean('MOCK_WALRUS', false),
      mockSeal: getBoolean('MOCK_SEAL', false),
      mockSui: getBoolean('MOCK_SUI', false),
    },
  };
}

/**
 * Global environment configuration instance
 */
export const env = loadEnvironmentConfig();

/**
 * Validate required environment configuration
 */
export function validateEnvironment(): void {
  const requiredForProduction = [
    'SUI_PRIVATE_KEY',
    'SUI_WALLET_ADDRESS', 
    'TREASURY_ADDRESS',
    'SEAL_PACKAGE_ID',
    'SEAL_UPGRADE_CAP_ID',
    'WALRUS_AGGREGATOR',
    'WALRUS_PUBLISHER',
    'WALRUS_SYSTEM_OBJECT',
  ];
  
  if (env.nodeEnv === 'production') {
    const missing = requiredForProduction.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for production: ${missing.join(', ')}`);
    }
    
    if (env.security.sessionSecret === 'change-this-in-production') {
      throw new Error('SESSION_SECRET must be changed for production deployment');
    }
  }
  
  // Validate Sui address format
  if (env.sui.walletAddress && !env.sui.walletAddress.startsWith('0x')) {
    throw new Error('SUI_WALLET_ADDRESS must start with 0x');
  }
  
  // Validate treasury address format
  if (env.marketplace.treasuryAddress && !env.marketplace.treasuryAddress.startsWith('0x')) {
    throw new Error('TREASURY_ADDRESS must start with 0x');
  }
  
  console.log(`Environment loaded: ${env.nodeEnv} on ${env.network}`);
  console.log(`Sui Network: ${env.sui.network}`);
  console.log(`Marketplace Treasury: ${env.marketplace.treasuryAddress}`);
  console.log(`Seal Package: ${env.seal.packageId}`);
  console.log(`Walrus Aggregator: ${env.walrus.aggregator}`);
}

export default env;