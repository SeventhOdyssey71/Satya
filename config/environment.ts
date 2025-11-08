// Environment Configuration
// Loads and validates environment variables for the Satya Marketplace

export interface EnvironmentConfig {
  nodeEnv: string;
  network: string;
  
  sui: {
    network: string;
    rpcUrl: string;
    privateKey: string;
    walletAddress: string;
    defaultGasBudget: number;
  };
  
  marketplace: {
    packageId?: string;
    objectId?: string;
    adminCapId?: string;
    treasuryAddress?: string;
    platformFeePercentage: number;
  };
  
  seal: {
    packageId?: string;
    keyServers: Array<{
      objectId: string;
      url: string;
    }>;
  };
  
  walrus: {
    aggregator: string;
    publisher: string;
    systemObject?: string;
    defaultEpochs: number;
  };
  
  api: {
    port: number;
    host: string;
  };
}

// Helper functions
const getOptional = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

const getNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

export function loadEnvironmentConfig(): EnvironmentConfig {
  return {
    nodeEnv: getOptional('NODE_ENV', 'development'),
    network: getOptional('NETWORK', 'testnet'),
    
    sui: {
      network: getOptional('SUI_NETWORK', 'testnet'),
      rpcUrl: getOptional('SUI_RPC_URL', 'https://fullnode.testnet.sui.io:443'),
      privateKey: getOptional('SUI_PRIVATE_KEY', ''),
      walletAddress: getOptional('SUI_WALLET_ADDRESS', ''),
      defaultGasBudget: getNumber('DEFAULT_GAS_BUDGET', 100000000),
    },
    
    marketplace: {
      packageId: process.env.MARKETPLACE_PACKAGE_ID,
      objectId: process.env.MARKETPLACE_V2_OBJECT_ID,
      adminCapId: process.env.MARKETPLACE_V2_ADMIN_CAP,
      treasuryAddress: process.env.TREASURY_ADDRESS,
      platformFeePercentage: getNumber('PLATFORM_FEE_PERCENTAGE', 250),
    },
    
    seal: {
      packageId: process.env.SEAL_PACKAGE_ID,
      keyServers: [
        {
          objectId: getOptional('SEAL_KEY_SERVER_1_OBJECT_ID', ''),
          url: getOptional('SEAL_KEY_SERVER_1_URL', 'https://seal-key-server-testnet-1.mystenlabs.com'),
        },
        {
          objectId: getOptional('SEAL_KEY_SERVER_2_OBJECT_ID', ''),
          url: getOptional('SEAL_KEY_SERVER_2_URL', 'https://seal-key-server-testnet-2.mystenlabs.com'),
        },
      ].filter(server => server.objectId),
    },
    
    walrus: {
      aggregator: getOptional('WALRUS_AGGREGATOR', 'https://aggregator-devnet.walrus.space'),
      publisher: getOptional('WALRUS_PUBLISHER', 'https://publisher-devnet.walrus.space'),
      systemObject: process.env.WALRUS_SYSTEM_OBJECT,
      defaultEpochs: getNumber('WALRUS_DEFAULT_EPOCHS', 5),
    },
    
    api: {
      port: getNumber('API_PORT', 3000),
      host: getOptional('API_HOST', 'localhost'),
    },
  };
}

export const env = loadEnvironmentConfig();

export function validateEnvironment(): void {
  if (env.nodeEnv === 'production') {
    const requiredForProduction = [
      'SUI_PRIVATE_KEY',
      'SUI_WALLET_ADDRESS',
      'MARKETPLACE_PACKAGE_ID',
      'SEAL_PACKAGE_ID',
      'WALRUS_SYSTEM_OBJECT',
    ];
    
    const missing = requiredForProduction.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for production: ${missing.join(', ')}`);
    }
  }
  
  console.log(`Environment: ${env.nodeEnv} on ${env.network}`);
}

export default env;