import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import { 
  verifyWalletSignature, 
  isValidSuiAddress, 
  normalizeSuiAddress,
  generateSessionToken,
  validateSessionToken,
  WalletRateLimiter,
  WalletSignatureData 
} from '../utils/walletUtils';

const logger = createLogger();
const rateLimiter = new WalletRateLimiter();

export interface AuthenticatedRequest extends Request {
  walletAddress?: string;
  userId?: string;
  sessionToken?: string;
}

export interface WalletAuthBody {
  walletAddress: string;
  signature: string;
  signedMessage: string;
  publicKey?: string;
}

/**
 * Main wallet authentication middleware
 * Supports both signature-based auth and session token auth
 */
export const authenticateWallet = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: { 
          message: 'Authorization required',
          code: 'NO_AUTH_HEADER',
          details: 'Provide wallet signature or session token in Authorization header'
        }
      });
      return;
    }

    const [authType, token] = authHeader.split(' ');
    
    if (!token || !authType) {
      res.status(401).json({
        success: false,
        error: { 
          message: 'Invalid authorization format',
          code: 'INVALID_AUTH_FORMAT'
        }
      });
      return;
    }

    // Handle different authentication types
    if (authType.toLowerCase() === 'bearer') {
      // Session token authentication
      const result = await authenticateSession(token);
      if (result.success) {
        req.walletAddress = result.walletAddress;
        req.userId = result.walletAddress;
        req.sessionToken = token;
        logger.info('Session authenticated', { walletAddress: req.walletAddress });
        next();
        return;
      }
    } else if (authType.toLowerCase() === 'wallet') {
      // Signature-based authentication
      const result = await authenticateSignature(token);
      if (result.success) {
        req.walletAddress = result.walletAddress;
        req.userId = result.walletAddress;
        logger.info('Wallet signature authenticated', { walletAddress: req.walletAddress });
        next();
        return;
      }
    }

    res.status(401).json({
      success: false,
      error: { 
        message: 'Authentication failed',
        code: 'AUTH_FAILED'
      }
    });

  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'Internal authentication error',
        code: 'AUTH_ERROR'
      }
    });
  }
};

/**
 * Authenticates using a session token
 */
async function authenticateSession(token: string): Promise<{ success: boolean; walletAddress?: string; error?: string }> {
  try {
    // Decode the session token to extract wallet address
    const decoded = Buffer.from(token, 'hex').toString();
    const sessionData = JSON.parse(decoded);
    
    if (!sessionData.walletAddress || !sessionData.timestamp) {
      return { success: false, error: 'Invalid session token format' };
    }

    // Check if session is expired (24 hours)
    const sessionAge = Date.now() - sessionData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      return { success: false, error: 'Session expired' };
    }

    // Validate session token
    if (!validateSessionToken(token, sessionData.walletAddress)) {
      return { success: false, error: 'Invalid session token' };
    }

    return { 
      success: true, 
      walletAddress: normalizeSuiAddress(sessionData.walletAddress) 
    };

  } catch (error) {
    logger.error('Session authentication error:', error);
    return { success: false, error: 'Session validation failed' };
  }
}

/**
 * Authenticates using a wallet signature
 */
async function authenticateSignature(signatureToken: string): Promise<{ success: boolean; walletAddress?: string; error?: string }> {
  try {
    // Parse the signature data from the token
    const signatureData: WalletSignatureData = JSON.parse(
      Buffer.from(signatureToken, 'base64').toString()
    );

    const { signature, signedMessage, walletAddress, publicKey } = signatureData;

    // Validate required fields
    if (!signature || !signedMessage || !walletAddress) {
      return { success: false, error: 'Missing signature data' };
    }

    // Validate wallet address format
    if (!isValidSuiAddress(walletAddress)) {
      return { success: false, error: 'Invalid wallet address format' };
    }

    const normalizedAddress = normalizeSuiAddress(walletAddress);

    // Check rate limiting
    if (rateLimiter.isRateLimited(normalizedAddress)) {
      return { success: false, error: 'Too many authentication attempts. Try again later.' };
    }

    // Verify the signature
    const verificationResult = await verifyWalletSignature({
      signature,
      signedMessage,
      walletAddress: normalizedAddress,
      publicKey
    });

    if (!verificationResult.isValid) {
      logger.warn('Wallet signature verification failed', { 
        walletAddress: normalizedAddress,
        error: verificationResult.error 
      });
      return { success: false, error: verificationResult.error || 'Signature verification failed' };
    }

    // Reset rate limiting on successful auth
    rateLimiter.reset(normalizedAddress);

    return { 
      success: true, 
      walletAddress: normalizedAddress 
    };

  } catch (error) {
    logger.error('Signature authentication error:', error);
    return { success: false, error: 'Signature validation failed' };
  }
}

/**
 * Optional middleware for endpoints that don't require authentication
 * but can use it if provided
 */
export const optionalWalletAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    // Try to authenticate, but don't fail if it doesn't work
    try {
      await authenticateWallet(req, res, () => {});
    } catch (error) {
      // Continue without authentication
      logger.debug('Optional auth failed, continuing without auth');
    }
  }
  
  next();
};