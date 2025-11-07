// Simplified Seal Encryption for testing

export class SealEncryption {
  // Generate a random DEK
  async generateDEK(): Promise<Uint8Array> {
    const dek = new Uint8Array(32);
    crypto.getRandomValues(dek);
    return dek;
  }

  // Encrypt data with DEK using AES-GCM
  async encryptWithDEK(data: Uint8Array, dek: Uint8Array): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await crypto.subtle.importKey(
      'raw',
      dek.buffer.slice(dek.byteOffset, dek.byteOffset + dek.byteLength) as ArrayBuffer,
      'AES-GCM',
      false,
      ['encrypt']
    );
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
      key,
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
    );
    
    return {
      ciphertext: new Uint8Array(ciphertext),
      iv
    };
  }

  // Decrypt data with DEK
  async decryptWithDEK(ciphertext: Uint8Array, dek: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
      'raw',
      dek.buffer.slice(dek.byteOffset, dek.byteOffset + dek.byteLength) as ArrayBuffer,
      'AES-GCM',
      false,
      ['decrypt']
    );
    
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
      key,
      ciphertext.buffer.slice(ciphertext.byteOffset, ciphertext.byteOffset + ciphertext.byteLength) as ArrayBuffer
    );
    
    return new Uint8Array(plaintext);
  }

  // Mock Seal encryption of DEK (in production, this would use Seal SDK)
  async encryptDEK(dek: Uint8Array): Promise<Uint8Array> {
    // For testing, just return the DEK with a mock header
    const encryptedDEK = new Uint8Array(dek.length + 16);
    encryptedDEK.set(new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE, 0xBA, 0xBE]), 0);
    encryptedDEK.set(dek, 16);
    return encryptedDEK;
  }

  // Mock Seal decryption of DEK
  async decryptDEK(encryptedDEK: Uint8Array): Promise<Uint8Array> {
    // For testing, just skip the mock header and return the DEK
    return encryptedDEK.slice(16);
  }
}