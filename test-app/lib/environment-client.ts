// Client-side environment configuration
// Uses Next.js public environment variables

export interface ClientEnvironmentConfig {
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
}

export function loadClientEnvironment(): ClientEnvironmentConfig {
  return {
    marketplace: {
      packageId: '0x8f4a0bdad87096c8ed48b5711dbf701d5d3f45c7509bce440b374c4b63b46702',
      objectId: '0xfcab0d521331a73ee838dfecb91d723b664d1dba4ad19f2e4beb1cb4a131ed65',
      adminCapId: '0x711228d9b34b8839798280407c14ce13c9bcfe714e90fe628d8ba1f89c8fc579',
      treasuryAddress: '0xcb4a3c693a334fe1be0161f446471a923c462178ef279b20f847f23c225a8d09',
      platformFeePercentage: 250,
    },
    
    seal: {
      packageId: '0x98f8a6ce208764219b23dc51db45bf11516ec0998810e98f3a94548d788ff679',
      keyServers: [
        {
          objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
          url: 'https://seal-key-server-testnet-1.mystenlabs.com',
        },
        {
          objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
          url: 'https://seal-key-server-testnet-2.mystenlabs.com',
        },
      ],
    },
    
    walrus: {
      aggregator: 'https://aggregator-devnet.walrus.space',
      publisher: 'https://publisher-devnet.walrus.space',
      systemObject: '0x50b84b68eb9da4c6d904a929f43638481c09c03be6274b8569778fe085c1590d',
      defaultEpochs: 5,
    },
  };
}