import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { 
  generateAuthMessage, 
  verifyWalletSignature, 
  isValidSuiAddress, 
  normalizeSuiAddress,
  generateSessionToken,
  WalletRateLimiter
} from '../utils/walletUtils';
import { TransactionService } from '../services/TransactionService';
import { authenticateWallet, AuthenticatedRequest } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const router: Router = Router();
const logger = createLogger();
const transactionService = new TransactionService();
const authRateLimiter = new WalletRateLimiter(10, 15 * 60 * 1000); // 10 attempts per 15 minutes

/**
 * POST /api/auth/challenge
 * Generates a challenge message for wallet authentication
 */
router.post('/challenge',
  [
    body('walletAddress').notEmpty().isString().withMessage('Wallet address is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
        return;
      }

      const { walletAddress } = req.body;

      // Validate wallet address format
      if (!isValidSuiAddress(walletAddress)) {
        res.status(400).json({
          success: false,
          error: { 
            message: 'Invalid wallet address format',
            code: 'INVALID_ADDRESS'
          }
        });
        return;
      }

      const normalizedAddress = normalizeSuiAddress(walletAddress);

      // Check rate limiting
      if (authRateLimiter.isRateLimited(normalizedAddress)) {
        res.status(429).json({
          success: false,
          error: { 
            message: 'Too many authentication attempts. Please try again later.',
            code: 'RATE_LIMITED'
          }
        });
        return;
      }

      // Generate authentication challenge
      const authMessage = generateAuthMessage(normalizedAddress);

      logger.info('Generated authentication challenge', { 
        walletAddress: normalizedAddress,
        nonce: authMessage.nonce 
      });

      res.json({
        success: true,
        data: {
          message: authMessage.message,
          nonce: authMessage.nonce,
          timestamp: authMessage.timestamp,
          walletAddress: normalizedAddress
        },
        message: 'Authentication challenge generated. Sign this message with your wallet.'
      });

    } catch (error) {
      logger.error('Error generating auth challenge:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to generate authentication challenge' }
      });
    }
  }
);

/**
 * POST /api/auth/verify
 * Verifies a signed message and creates a session
 */
router.post('/verify',
  [
    body('walletAddress').notEmpty().isString().withMessage('Wallet address is required'),
    body('signature').notEmpty().isString().withMessage('Signature is required'),
    body('signedMessage').notEmpty().isString().withMessage('Signed message is required'),
    body('publicKey').optional().isString().withMessage('Public key must be a string')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
        return;
      }

      const { walletAddress, signature, signedMessage, publicKey } = req.body;

      // Validate wallet address format
      if (!isValidSuiAddress(walletAddress)) {
        res.status(400).json({
          success: false,
          error: { 
            message: 'Invalid wallet address format',
            code: 'INVALID_ADDRESS'
          }
        });
        return;
      }

      const normalizedAddress = normalizeSuiAddress(walletAddress);

      // Verify the signature
      const verificationResult = await verifyWalletSignature({
        signature,
        signedMessage,
        walletAddress: normalizedAddress,
        publicKey
      });

      if (!verificationResult.isValid) {
        res.status(401).json({
          success: false,
          error: { 
            message: verificationResult.error || 'Signature verification failed',
            code: 'VERIFICATION_FAILED'
          }
        });
        return;
      }

      // Generate session token
      const sessionToken = generateSessionToken(normalizedAddress, Date.now().toString());

      // Reset rate limiting on successful auth
      authRateLimiter.reset(normalizedAddress);

      logger.info('Wallet authentication successful', { 
        walletAddress: normalizedAddress 
      });

      res.json({
        success: true,
        data: {
          sessionToken,
          walletAddress: normalizedAddress,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          tokenType: 'Bearer'
        },
        message: 'Authentication successful'
      });

    } catch (error) {
      logger.error('Error verifying wallet signature:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Authentication verification failed' }
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refreshes an existing session token
 */
router.post('/refresh',
  authenticateWallet,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const walletAddress = req.walletAddress!;

      // Generate new session token
      const sessionToken = generateSessionToken(walletAddress, Date.now().toString());

      logger.info('Session token refreshed', { walletAddress });

      res.json({
        success: true,
        data: {
          sessionToken,
          walletAddress,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          tokenType: 'Bearer'
        },
        message: 'Session refreshed successfully'
      });

    } catch (error) {
      logger.error('Error refreshing session:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to refresh session' }
      });
    }
  }
);

/**
 * GET /api/auth/profile
 * Gets the authenticated user's profile information
 */
router.get('/profile',
  authenticateWallet,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const walletAddress = req.walletAddress!;

      // Get wallet balance
      const balance = await transactionService.checkSufficientBalance(walletAddress, 0);

      res.json({
        success: true,
        data: {
          walletAddress,
          balance: {
            total: balance.balance,
            formatted: `${(balance.balance / 1_000_000_000).toFixed(4)} SUI`
          },
          connectedAt: new Date().toISOString(),
          network: process.env.SUI_NETWORK || 'testnet'
        }
      });

    } catch (error) {
      logger.error('Error fetching user profile:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch profile' }
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Logs out the current session
 */
router.post('/logout',
  authenticateWallet,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const walletAddress = req.walletAddress!;

      // In a production app, you'd invalidate the session token in a database
      // For now, we'll just log the logout
      logger.info('User logged out', { walletAddress });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Error during logout:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Logout failed' }
      });
    }
  }
);

/**
 * POST /api/auth/estimate-gas
 * Estimates gas cost for a transaction
 */
router.post('/estimate-gas',
  authenticateWallet,
  [
    body('transactionBlock').notEmpty().isString().withMessage('Transaction block is required')
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
        return;
      }

      const { transactionBlock } = req.body;

      // Estimate gas cost
      const gasEstimate = await transactionService.estimateGasCost(transactionBlock);
      const gasPrice = await transactionService.getCurrentGasPrice();

      // Check if user has sufficient balance
      const balanceCheck = await transactionService.checkSufficientBalance(
        req.walletAddress!,
        gasEstimate.totalCost
      );

      res.json({
        success: true,
        data: {
          gasEstimate,
          gasPrice,
          balanceCheck,
          formatted: {
            totalCost: `${(gasEstimate.totalCost / 1_000_000_000).toFixed(6)} SUI`,
            computationCost: `${(gasEstimate.computationCost / 1_000_000_000).toFixed(6)} SUI`,
            storageCost: `${(gasEstimate.storageCost / 1_000_000_000).toFixed(6)} SUI`
          }
        }
      });

    } catch (error) {
      logger.error('Error estimating gas:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to estimate gas cost' }
      });
    }
  }
);

export { router as authRoutes };