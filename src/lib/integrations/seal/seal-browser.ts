/**
 * SEAL Browser Client for Wallet-Signed Decryption
 *
 * Implements SEAL decryption in the browser using user's wallet signature.
 * Based on KrillTube's implementation with @mysten/seal SDK.
 */

import { SuiClient } from '@mysten/sui/client';
import { SealClient, SessionKey } from '@mysten/seal';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SEAL_CONFIG } from '@/lib/constants';

/**
 * Initialize SEAL client for browser-based decryption
 */
export function initializeSealClient(suiClient: SuiClient): SealClient {
  return new SealClient({
    suiClient: suiClient as any,
    serverConfigs: SEAL_CONFIG.KEY_SERVERS.map((server) => ({
      objectId: server.OBJECT_ID,
      url: server.URL,
      weight: 1,
    })),
    verifyKeyServers: false,
  });
}

/**
 * Create a SEAL session key with wallet signature
 *
 * Session keys prove the user's identity and have a TTL (default 10 minutes)
 */
export async function createSealSessionKey(
  userKeypair: Ed25519Keypair,
  suiClient: SuiClient,
  ttlMin: number = 10
): Promise<SessionKey> {
  const userAddress = userKeypair.toSuiAddress();

  // Create session key
  const sessionKey = await SessionKey.create({
    address: userAddress,
    packageId: SEAL_CONFIG.PACKAGE_ID,
    ttlMin,
    suiClient: suiClient as any,
  });

  // Sign with user's wallet
  const message = sessionKey.getPersonalMessage();
  const { signature } = await userKeypair.signPersonalMessage(
    message  // Pass Uint8Array directly
  );
  sessionKey.setPersonalMessageSignature(signature);

  console.log('✓ SEAL session key created and signed with wallet');

  return sessionKey;
}

/**
 * Create a SEAL session key using browser wallet signature
 *
 * This version works with @mysten/dapp-kit wallet adapters
 */
export async function createSealSessionKeyWithWallet(
  userAddress: string,
  suiClient: SuiClient,
  signPersonalMessage: (args: { message: Uint8Array }) => Promise<{ signature: string }>,
  packageId: string,  // Use the package ID from blob metadata!
  ttlMin: number = 10
): Promise<SessionKey> {
  console.log('Creating SEAL session key with wallet signature...', { userAddress, packageId });

  // Create session key with the SAME package ID that was used to encrypt the blob
  const sessionKey = await SessionKey.create({
    address: userAddress,
    packageId: packageId,  // Use the package ID from the encrypted blob
    ttlMin,
    suiClient: suiClient as any,
  });

  // Get personal message to sign
  const message = sessionKey.getPersonalMessage();
  console.log('Personal message to sign:', message);
  console.log('Message type:', typeof message);
  console.log('Message length:', message.length);

  // Sign with connected wallet
  // IMPORTANT: message is already a Uint8Array, pass it directly!
  const { signature: walletSignature } = await signPersonalMessage({
    message: message  // Pass the Uint8Array directly, no conversion!
  });

  console.log('Wallet signature received (base64):', walletSignature);

  // Debug: Decode and inspect the signature
  try {
    const sigBytes = Uint8Array.from(atob(walletSignature), c => c.charCodeAt(0));
    console.log('Signature breakdown:', {
      totalBytes: sigBytes.length,
      scheme: sigBytes[0],
      signatureBytes: sigBytes.slice(1, 65).length,
      pubkeyBytes: sigBytes.slice(65).length
    });

    // Try to verify this matches the expected address
    const { verifyPersonalMessageSignature } = await import('@mysten/sui/verify');
    const publicKey = sigBytes.slice(65); // Extract public key from signature
    console.log('Public key from signature:', Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Verify the signature
    const verified = await verifyPersonalMessageSignature(
      new Uint8Array(Buffer.from(message)),
      walletSignature
    );
    console.log('Signature verification result:', verified);
  } catch (error) {
    console.error('Debug signature verification failed:', error);
  }

  // The wallet returns a serialized signature as base64 string
  // Format: base64(scheme || signature || pubkey)
  // SEAL expects this directly as a base64 string (same as Ed25519Keypair)
  sessionKey.setPersonalMessageSignature(walletSignature);

  console.log('✓ SEAL session key created and signed with wallet');

  return sessionKey;
}

/**
 * Decrypt SEAL-encrypted data using wallet signature
 *
 * @param sealClient - Initialized SEAL client
 * @param encryptedData - SEAL-encrypted data bytes
 * @param sessionKey - Session key signed by user's wallet
 * @param approveTransactionBytes - Transaction bytes proving authorization
 * @returns Decrypted plaintext data
 */
export async function decryptWithSeal(
  sealClient: SealClient,
  encryptedData: Uint8Array,
  sessionKey: SessionKey,
  approveTransactionBytes: Uint8Array
): Promise<Uint8Array> {
  console.log('Decrypting with SEAL...', {
    encryptedSize: encryptedData.length,
    approveTransactionSize: approveTransactionBytes.length
  });

  try {
    console.log('Calling sealClient.decrypt()...');
    console.log('Decrypt params:', {
      dataType: typeof encryptedData,
      dataLength: encryptedData?.length,
      dataFirst10Bytes: encryptedData?.slice(0, 10),
      sessionKeyExists: !!sessionKey,
      txBytesLength: approveTransactionBytes?.length,
    });

    // Wrap the SEAL decrypt call with additional error context
    const decryptPromise = sealClient.decrypt({
      data: encryptedData,
      sessionKey,
      txBytes: approveTransactionBytes,
    }).catch((err) => {
      console.error('SEAL decrypt rejected with:', err);
      console.error('This is likely a key server communication error');
      // Re-throw with more context
      throw new Error(`SEAL key server error: ${err?.message || 'Key servers may have rejected the approve transaction'}`);
    });

    console.log('Decrypt promise created, awaiting...');
    const decryptedData = await decryptPromise;

    console.log('Decrypt returned, checking result...');
    console.log('Result type:', typeof decryptedData);
    console.log('Result:', decryptedData);

    if (!decryptedData) {
      throw new Error('SEAL decrypt returned null/undefined - decryption may have failed silently');
    }

    console.log('✓ SEAL decryption successful:', {
      decryptedSize: decryptedData.length
    });

    return decryptedData;
  } catch (error: any) {
    console.error('❌ SEAL decryption failed - RAW ERROR:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);

    // Try to extract as much info as possible
    const errorInfo: any = {
      type: typeof error,
      constructor: error?.constructor?.name,
      isError: error instanceof Error,
      hasMessage: 'message' in (error || {}),
      hasName: 'name' in (error || {}),
      hasStack: 'stack' in (error || {}),
    };

    if (error) {
      try {
        errorInfo.stringified = JSON.stringify(error);
      } catch {
        errorInfo.stringified = 'Could not stringify';
      }

      try {
        errorInfo.toString = error.toString();
      } catch {
        errorInfo.toString = 'Could not call toString';
      }

      if (error.message) errorInfo.message = error.message;
      if (error.name) errorInfo.name = error.name;
      if (error.stack) errorInfo.stack = error.stack;
      if (error.cause) errorInfo.cause = error.cause;

      // Check for common SEAL error properties
      if (error.code) errorInfo.code = error.code;
      if (error.details) errorInfo.details = error.details;
      if (error.response) errorInfo.response = error.response;
    }

    console.error('Extracted error info:', errorInfo);

    const errorMessage = error?.message || error?.toString?.() || JSON.stringify(error) || 'Unknown SEAL error';
    throw new Error(`SEAL decryption failed: ${errorMessage}`);
  }
}

/**
 * Parse SEAL metadata from blob header
 *
 * Blob format: [metadata_length(4 bytes)] [metadata_json] [encrypted_data]
 */
export interface SealBlobMetadata {
  encrypted_dek_base64: string;
  policy_id: string;
  iv_base64: string;
  seal_package_id: string;
  encryption_algorithm: string;
  seal_threshold: number;
}

export function parseSealMetadata(blobData: ArrayBuffer): {
  metadata: SealBlobMetadata;
  encryptedData: Uint8Array;
} {
  // Read metadata length (4 bytes, little-endian)
  const metadataLength = new DataView(blobData).getUint32(0, true);

  if (metadataLength <= 0 || metadataLength > blobData.byteLength - 4) {
    throw new Error(`Invalid metadata length: ${metadataLength}`);
  }

  // Extract and parse metadata JSON
  const metadataBytes = new Uint8Array(blobData, 4, metadataLength);
  const metadataString = new TextDecoder().decode(metadataBytes);
  const metadata = JSON.parse(metadataString) as SealBlobMetadata;

  // Extract encrypted data after metadata
  const encryptedData = new Uint8Array(blobData, 4 + metadataLength);

  console.log('✓ Parsed SEAL metadata:');
  console.log('  - policy_id:', metadata.policy_id);
  console.log('  - seal_package_id:', metadata.seal_package_id);
  console.log('  - algorithm:', metadata.encryption_algorithm);
  console.log('  - encryptedDataSize:', encryptedData.length);

  return { metadata, encryptedData };
}

/**
 * Convert Uint8Array to base64 string for sending to server
 */
export function uint8ArrayToBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
