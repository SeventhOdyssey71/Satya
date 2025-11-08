import { vi, afterEach } from 'vitest';

// Mock crypto for Node.js environment
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      subtle: {
        async digest(_algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer> {
          const view = new Uint8Array(data);
          const hash = new Uint8Array(32);
          for (let i = 0; i < 32; i++) {
            hash[i] = (view[i % view.length] + i) % 256;
          }
          return hash.buffer;
        }
      },
      getRandomValues(array: Uint8Array): Uint8Array {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
      randomUUID(): string {
        return 'test-uuid-' + Math.random().toString(36).substring(2);
      }
    },
    writable: true,
    configurable: true
  });
}

// Mock fetch for HTTP requests
globalThis.fetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
  const urlStr = url.toString();
  
  if (urlStr.includes('walrus')) {
    if (options?.method === 'POST') {
      return {
        ok: true,
        json: async () => ({
          success: true,
          blobId: `blob_${Date.now()}`,
          certificate: { id: 'cert_123' }
        })
      };
    } else {
      return {
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3, 4, 5]).buffer
      };
    }
  }
  
  if (urlStr.includes('localhost:3000') || urlStr.includes('nautilus')) {
    if (urlStr.includes('/health')) {
      return {
        ok: true,
        json: async () => ({
          status: 'healthy',
          enclave_verified: true
        })
      };
    }
    
    if (urlStr.includes('/upload')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          file_id: `file_${Date.now()}`,
          hash: 'test_hash_123',
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
          signature: new Uint8Array(64),
          public_key: new Uint8Array(32),
          metadata: {}
        })
      };
    }
  }
  
  return {
    ok: true,
    json: async () => ({ success: true })
  };
});

// Reset mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});