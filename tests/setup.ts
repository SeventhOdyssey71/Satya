import { vi, afterEach } from 'vitest';
if (!global.crypto) {
  global.crypto = {
    subtle: {
      async digest(_algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer> {
        // Simple mock hash function for testing
        const view = new Uint8Array(data);
        const hash = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          hash[i] = (view[i % view.length] + i) % 256;
        }
        return hash.buffer;
      },
      
      async encrypt(_algorithm: any, _key: any, data: ArrayBuffer): Promise<ArrayBuffer> {
        // Simple XOR encryption for testing
        const view = new Uint8Array(data);
        const encrypted = new Uint8Array(view.length);
        for (let i = 0; i < view.length; i++) {
          encrypted[i] = view[i] ^ (i % 256);
        }
        return encrypted.buffer;
      },
      
      async decrypt(algorithm: any, key: any, data: ArrayBuffer): Promise<ArrayBuffer> {
        // Reverse of XOR encryption
        const view = new Uint8Array(data);
        const decrypted = new Uint8Array(view.length);
        for (let i = 0; i < view.length; i++) {
          decrypted[i] = view[i] ^ (i % 256);
        }
        return decrypted.buffer;
      },
      
      async generateKey(algorithm: any, extractable: boolean, keyUsages: string[]): Promise<any> {
        return {
          algorithm: algorithm,
          extractable: extractable,
          type: 'secret',
          usages: keyUsages
        };
      },
      
      async importKey(format: string, keyData: any, algorithm: any, extractable: boolean, keyUsages: string[]): Promise<any> {
        return {
          algorithm: algorithm,
          extractable: extractable,
          type: 'secret',
          usages: keyUsages
        };
      }
    },
    
    getRandomValues(array: Uint8Array): Uint8Array {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }
  } as any;
}

// Mock fetch for HTTP requests
global.fetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
  const urlStr = url.toString();
  
  // Mock Walrus API responses
  if (urlStr.includes('walrus')) {
    if (options?.method === 'POST') {
      return {
        ok: true,
        json: async () => ({
          success: true,
          blobId: `blob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          certificate: {
            id: 'cert_123',
            epoch: 1,
            storage_nodes: ['node1', 'node2', 'node3']
          }
        })
      };
    } else {
      // Mock download
      return {
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3, 4, 5]).buffer
      };
    }
  }
  
  // Mock Nautilus API responses
  if (urlStr.includes('localhost:3000') || urlStr.includes('nautilus')) {
    if (urlStr.includes('/health')) {
      return {
        ok: true,
        json: async () => ({
          status: 'healthy',
          enclave_verified: true,
          public_key: new Uint8Array(32).fill(42)
        })
      };
    }
    
    if (urlStr.includes('/upload')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          file_id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          hash: Array.from(new Uint8Array(32).fill(123)).map(b => b.toString(16).padStart(2, '0')).join(''),
          attestation_id: `attestation_${Date.now()}`
        })
      };
    }
    
    if (urlStr.includes('/attest')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          id: `attestation_${Date.now()}`,
          signature: new Uint8Array(64).fill(200),
          public_key: new Uint8Array(32).fill(100),
          metadata: JSON.parse(options?.body as string || '{}').metadata || {}
        })
      };
    }
    
    if (urlStr.includes('/process')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          valid: true,
          attestation: `process_attestation_${Date.now()}`,
          analysis: {
            quality_score: 0.95,
            completeness: true,
            format_valid: true
          }
        })
      };
    }
  }
  
  // Default response
  return {
    ok: true,
    json: async () => ({ success: true }),
    text: async () => 'OK',
    arrayBuffer: async () => new ArrayBuffer(0)
  };
});

// Mock file system operations for testing
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5])),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockResolvedValue({
    isFile: () => true,
    isDirectory: () => false,
    size: 1000,
    mtime: new Date()
  })
}));

// Mock blockchain client
vi.mock('@mysten/sui.js/client', () => ({
  SuiClient: vi.fn().mockImplementation(() => ({
    getObject: vi.fn().mockResolvedValue({
      data: {
        content: {
          fields: {
            listings: {},
            purchases: {},
            total_volume: '1000000'
          }
        }
      }
    }),
    executeTransactionBlock: vi.fn().mockResolvedValue({
      digest: 'tx_hash_123',
      effects: {
        status: { status: 'success' }
      }
    }),
    queryEvents: vi.fn().mockResolvedValue({
      data: []
    })
  }))
}));

// Test utilities
export class TestUtils {
  static createTestFile(size: number = 1000, name: string = 'test.bin'): File {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = i % 256;
    }
    return new File([data], name, { type: 'application/octet-stream' });
  }
  
  static createTestData(size: number = 10): Uint8Array {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = i % 256;
    }
    return data;
  }
  
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static generateTestAddress(): string {
    return `0x${Math.random().toString(16).substr(2, 40)}`;
  }
  
  static generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static mockNetworkError() {
    return vi.fn().mockRejectedValue(new Error('Network request failed'));
  }
  
  static mockSuccessResponse(data: any) {
    return vi.fn().mockResolvedValue({
      ok: true,
      json: async () => data,
      arrayBuffer: async () => new Uint8Array(data).buffer
    });
  }
}

// Console override for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: (...args: any[]) => {
    // Only show actual errors during tests
    if (args[0]?.includes?.('ERROR') || args[0]?.includes?.('FAIL')) {
      originalConsole.error(...args);
    }
  }
};

// Reset mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});