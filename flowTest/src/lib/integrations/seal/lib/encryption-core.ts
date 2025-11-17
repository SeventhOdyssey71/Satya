// Core Encryption Library for Seal

export class EncryptionCore {
 // Generate Data Encryption Key (DEK)
 async generateDEK(): Promise<Uint8Array> {
  const key = await crypto.subtle.generateKey(
   { name: 'AES-GCM', length: 256 },
   true,
   ['encrypt', 'decrypt']
  );
  
  const exported = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exported);
 }
 
 // Encrypt data with DEK using AES-GCM
 async encryptWithDEK(
  data: Uint8Array,
  dek: Uint8Array
 ): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
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
 
 // Decrypt data with DEK using AES-GCM
 async decryptWithDEK(
  encryptedData: Uint8Array,
  dek: Uint8Array,
  iv: Uint8Array
 ): Promise<Uint8Array> {
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
   encryptedData.buffer.slice(encryptedData.byteOffset, encryptedData.byteOffset + encryptedData.byteLength) as ArrayBuffer
  );
  
  return new Uint8Array(plaintext);
 }
 
 // Securely clear sensitive data from memory
 secureClear(data: Uint8Array): void {
  // Overwrite with random data
  crypto.getRandomValues(data);
  // Then overwrite with zeros
  data.fill(0);
 }
 
 // Hash DEK for verification
 async hashDEK(dek: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', dek.buffer.slice(dek.byteOffset, dek.byteOffset + dek.byteLength) as ArrayBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return this.toHex(hashArray);
 }
 
 // Generate unique policy ID
 generatePolicyId(prefix: string): string {
  const timestamp = Date.now().toString(16);
  const random = crypto.getRandomValues(new Uint8Array(8));
  const randomHex = this.toHex(random);
  return `${prefix}_${timestamp}_${randomHex}`;
 }
 
 // Convert to hex string
 toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
   .map(b => b.toString(16).padStart(2, '0'))
   .join('');
 }
 
 // Convert from hex string
 fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
   bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
 }
 
 // Validate encryption parameters
 validateEncryptionParams(data: Uint8Array, dek?: Uint8Array): void {
  if (!data || data.length === 0) {
   throw new Error('Data cannot be empty');
  }
  
  if (data.length > 1024 * 1024 * 100) { // 100MB limit
   throw new Error('Data too large for encryption');
  }
  
  if (dek && dek.length !== 32) {
   throw new Error('Invalid DEK length (must be 256 bits)');
  }
 }
}