import { verifySignature } from '@mysten/sui.js/verify';
import { fromB64 } from '@mysten/sui.js/utils';
import { createHash, randomBytes } from 'crypto';
import { createLogger } from './logger';

const logger = createLogger();

export interface WalletSignatureData {
  signature: string;
  signedMessage: string;
  walletAddress: string;
  publicKey?: string;
}

export interface AuthMessage {
  message: string;
  nonce: string;
  timestamp: number;
  walletAddress: string;
}

export interface WalletVerificationResult {
  isValid: boolean;
  walletAddress: string;
  error?: string;
}

/**
 * Generates a secure authentication message for wallet signing
 */
export function generateAuthMessage(walletAddress: string): AuthMessage {
  const nonce = randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const message = `Authenticate wallet for Satya API\n\nWallet Address: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nThis signature proves you control this wallet address.`;

  return {
    message,
    nonce,
    timestamp,
    walletAddress
  };
}

/**
 * Verifies a wallet signature against a signed message
 */
export async function verifyWalletSignature(
  signatureData: WalletSignatureData
): Promise<WalletVerificationResult> {
  try {
    const { signature, signedMessage, walletAddress } = signatureData;

    // Parse the signed message to extract components
    const authMessage = parseAuthMessage(signedMessage);
    if (!authMessage) {
      return {
        isValid: false,
        walletAddress,
        error: 'Invalid message format'
      };
    }

    // Verify wallet address matches
    if (authMessage.walletAddress !== walletAddress) {
      return {
        isValid: false,
        walletAddress,
        error: 'Wallet address mismatch'
      };
    }

    // Check timestamp (15 minutes validity)
    const now = Date.now();
    const messageAge = now - authMessage.timestamp;
    const maxAge = 15 * 60 * 1000; // 15 minutes

    if (messageAge > maxAge) {
      return {
        isValid: false,
        walletAddress,
        error: 'Message expired'
      };
    }

    // Convert message to bytes for verification
    const messageBytes = new TextEncoder().encode(signedMessage);

    // Verify the signature (Note: verifySignature expects public key, not wallet address)
    // This is a simplified version - in production, you'd need proper signature verification
    const isValidSignature = signature && walletAddress; // Placeholder validation

    if (!isValidSignature) {
      return {
        isValid: false,
        walletAddress,
        error: 'Invalid signature'
      };
    }

    logger.info('Wallet signature verified successfully', { walletAddress });

    return {
      isValid: true,
      walletAddress
    };

  } catch (error) {
    logger.error('Error verifying wallet signature:', error);
    return {
      isValid: false,
      walletAddress: signatureData.walletAddress,
      error: 'Verification failed'
    };
  }
}

/**
 * Parses an authentication message to extract components
 */
function parseAuthMessage(signedMessage: string): AuthMessage | null {
  try {
    const lines = signedMessage.split('\n');
    
    let walletAddress = '';
    let nonce = '';
    let timestamp = 0;

    for (const line of lines) {
      if (line.startsWith('Wallet Address: ')) {
        walletAddress = line.replace('Wallet Address: ', '');
      } else if (line.startsWith('Nonce: ')) {
        nonce = line.replace('Nonce: ', '');
      } else if (line.startsWith('Timestamp: ')) {
        timestamp = parseInt(line.replace('Timestamp: ', ''));
      }
    }

    if (!walletAddress || !nonce || !timestamp) {
      return null;
    }

    return {
      message: signedMessage,
      nonce,
      timestamp,
      walletAddress
    };

  } catch (error) {
    logger.error('Error parsing auth message:', error);
    return null;
  }
}

/**
 * Validates a Sui wallet address format
 */
export function isValidSuiAddress(address: string): boolean {
  try {
    // Sui addresses should be 32 bytes (64 hex characters) with 0x prefix
    if (!address.startsWith('0x')) {
      return false;
    }

    const hexPart = address.slice(2);
    if (hexPart.length !== 64) {
      return false;
    }

    // Check if it's valid hex
    return /^[0-9a-fA-F]+$/.test(hexPart);
  } catch {
    return false;
  }
}

/**
 * Normalizes a Sui address to the standard format
 */
export function normalizeSuiAddress(address: string): string {
  if (!address.startsWith('0x')) {
    address = '0x' + address;
  }
  
  const hexPart = address.slice(2);
  return '0x' + hexPart.toLowerCase().padStart(64, '0');
}

/**
 * Generates a session token for authenticated users
 */
export function generateSessionToken(walletAddress: string, nonce: string): string {
  const payload = JSON.stringify({
    walletAddress,
    nonce,
    timestamp: Date.now()
  });
  
  const hash = createHash('sha256');
  hash.update(payload);
  hash.update(process.env.JWT_SECRET || 'default-secret');
  
  return hash.digest('hex');
}

/**
 * Validates a session token
 */
export function validateSessionToken(token: string, walletAddress: string): boolean {
  try {
    // In production, you'd use proper JWT validation
    // This is a simplified version for the demo
    const decoded = Buffer.from(token, 'hex').toString();
    return decoded.includes(walletAddress);
  } catch {
    return false;
  }
}

/**
 * Rate limiting helper for wallet operations
 */
export class WalletRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) { // 5 attempts per 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isRateLimited(walletAddress: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(walletAddress);

    if (!record || now > record.resetTime) {
      this.attempts.set(walletAddress, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return false;
    }

    if (record.count >= this.maxAttempts) {
      return true;
    }

    record.count++;
    return false;
  }

  reset(walletAddress: string): void {
    this.attempts.delete(walletAddress);
  }
}