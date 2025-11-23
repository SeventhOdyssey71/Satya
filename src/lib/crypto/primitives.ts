/**
 * Core cryptographic primitives for model encryption/decryption
 * Based on decryption-codebase implementation
 */

/**
 * Generate cryptographically secure random bytes
 */
export function randomBytes(length: number): Uint8Array {
  if (length <= 0) {
    throw new Error('Invalid random bytes length: must be > 0');
  }

  if (length <= 65536) {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  const result = new Uint8Array(length);
  const chunkSize = 65536;
  let offset = 0;

  while (offset < length) {
    const remaining = length - offset;
    const size = Math.min(remaining, chunkSize);
    const chunk = crypto.getRandomValues(new Uint8Array(size));
    result.set(chunk, offset);
    offset += size;
  }

  return result;
}

/**
 * Generate a random AES-128 key (16 bytes)
 */
export function generateAes128Key(): Uint8Array {
  return randomBytes(16);
}

/**
 * Generate a random 12-byte IV for AES-GCM
 */
export function generateIv(): Uint8Array {
  return randomBytes(12);
}

/**
 * Import raw AES key bytes as CryptoKey
 */
export async function importAesKey(
  keyBytes: Uint8Array,
  keyUsages: KeyUsage[] = ['encrypt', 'decrypt']
): Promise<CryptoKey> {
  if (keyBytes.length !== 16) {
    throw new Error('AES key must be 16 bytes (AES-128)');
  }

  return await crypto.subtle.importKey(
    'raw',
    keyBytes as BufferSource,
    {
      name: 'AES-GCM',
      length: 128,
    },
    true,
    keyUsages
  );
}

/**
 * Encrypt data using AES-GCM-128
 */
export async function aesGcmEncrypt(
  key: CryptoKey | Uint8Array,
  plaintext: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  if (iv.length !== 12) {
    throw new Error('IV must be 12 bytes for AES-GCM');
  }

  const cryptoKey =
    key instanceof Uint8Array
      ? await crypto.subtle.importKey(
          'raw',
          key as BufferSource,
          {
            name: 'AES-GCM',
            length: 128,
          },
          false,
          ['encrypt']
        )
      : key;

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      tagLength: 128,
    },
    cryptoKey,
    plaintext as BufferSource
  );

  return new Uint8Array(ciphertext);
}

/**
 * Decrypt data using AES-GCM-128
 */
export async function aesGcmDecrypt(
  key: CryptoKey | Uint8Array,
  ciphertext: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  if (iv.length !== 12) {
    throw new Error('IV must be 12 bytes for AES-GCM');
  }

  const cryptoKey =
    key instanceof Uint8Array
      ? await crypto.subtle.importKey(
          'raw',
          key as BufferSource,
          {
            name: 'AES-GCM',
            length: 128,
          },
          false,
          ['decrypt']
        )
      : key;

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      tagLength: 128,
    },
    cryptoKey,
    ciphertext as BufferSource
  );

  return new Uint8Array(plaintext);
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Concatenate multiple Uint8Array buffers
 */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  
  return result;
}