import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { createLogger } from '../utils/logger';

const logger = createLogger();

/**
 * General API rate limiting
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMITED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authentication rate limiting
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMITED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Transaction creation rate limiting
 */
export const transactionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 transaction creations per minute
  message: {
    success: false,
    error: {
      message: 'Too many transaction requests, please slow down.',
      code: 'TRANSACTION_RATE_LIMITED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Marketplace operations rate limiting (stricter)
 */
export const marketplaceRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit each IP to 50 marketplace requests per 5 minutes
  message: {
    success: false,
    error: {
      message: 'Too many marketplace requests, please wait before trying again.',
      code: 'MARKETPLACE_RATE_LIMITED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiting
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 uploads per minute
  message: {
    success: false,
    error: {
      message: 'Too many file uploads, please wait before uploading again.',
      code: 'UPLOAD_RATE_LIMITED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Per-wallet rate limiting for blockchain operations
 */
class WalletOperationLimiter {
  private operations: Map<string, { 
    count: number; 
    resetTime: number; 
    operations: Array<{ type: string; timestamp: number }>;
  }> = new Map();

  private maxOperations: number;
  private windowMs: number;
  private operationTypes: string[];

  constructor(
    maxOperations = 10, 
    windowMs = 5 * 60 * 1000, // 5 minutes
    operationTypes = ['create_listing', 'purchase', 'transfer']
  ) {
    this.maxOperations = maxOperations;
    this.windowMs = windowMs;
    this.operationTypes = operationTypes;
  }

  isLimited(walletAddress: string, operationType: string): boolean {
    const now = Date.now();
    const record = this.operations.get(walletAddress);

    if (!record || now > record.resetTime) {
      this.operations.set(walletAddress, {
        count: 1,
        resetTime: now + this.windowMs,
        operations: [{ type: operationType, timestamp: now }]
      });
      return false;
    }

    // Check overall operation limit
    if (record.count >= this.maxOperations) {
      return true;
    }

    // Check specific operation type limits
    const typeCount = record.operations.filter(op => 
      op.type === operationType && now - op.timestamp < this.windowMs
    ).length;

    const typeLimit = this.getTypeLimits(operationType);
    if (typeCount >= typeLimit) {
      return true;
    }

    // Add new operation
    record.count++;
    record.operations.push({ type: operationType, timestamp: now });

    // Clean old operations
    record.operations = record.operations.filter(op => 
      now - op.timestamp < this.windowMs
    );

    return false;
  }

  private getTypeLimits(operationType: string): number {
    const limits: { [key: string]: number } = {
      'create_listing': 5,    // 5 listings per 5 minutes
      'purchase': 10,         // 10 purchases per 5 minutes
      'transfer': 20,         // 20 transfers per 5 minutes
      'default': 3            // Default limit for unknown operations
    };

    const limit = limits[operationType];
    const defaultLimit = limits['default'];
    return limit !== undefined ? limit : (defaultLimit ?? 3);
  }

  reset(walletAddress: string): void {
    this.operations.delete(walletAddress);
  }

  getUsage(walletAddress: string): {
    totalOperations: number;
    operationsByType: { [key: string]: number };
    resetTime: number;
  } {
    const record = this.operations.get(walletAddress);
    const now = Date.now();

    if (!record || now > record.resetTime) {
      return {
        totalOperations: 0,
        operationsByType: {},
        resetTime: now + this.windowMs
      };
    }

    const recentOps = record.operations.filter(op => 
      now - op.timestamp < this.windowMs
    );

    const operationsByType: { [key: string]: number } = {};
    recentOps.forEach(op => {
      operationsByType[op.type] = (operationsByType[op.type] || 0) + 1;
    });

    return {
      totalOperations: recentOps.length,
      operationsByType,
      resetTime: record.resetTime
    };
  }
}

const walletLimiter = new WalletOperationLimiter();

/**
 * Middleware for wallet-specific operation rate limiting
 */
export function createWalletRateLimit(operationType: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const walletAddress = req.walletAddress;

      if (!walletAddress) {
        // If no wallet address (shouldn't happen with auth middleware), continue
        next();
        return;
      }

      if (walletLimiter.isLimited(walletAddress, operationType)) {
        const usage = walletLimiter.getUsage(walletAddress);
        
        logger.warn('Wallet operation rate limited', { 
          walletAddress, 
          operationType,
          usage
        });

        res.status(429).json({
          success: false,
          error: {
            message: `Too many ${operationType} operations. Please wait before trying again.`,
            code: 'WALLET_OPERATION_RATE_LIMITED',
            details: {
              operationType,
              usage,
              resetTime: new Date(usage.resetTime).toISOString()
            }
          }
        });
        return;
      }

      next();

    } catch (error) {
      logger.error('Error in wallet rate limiting:', error);
      // Don't block the request if rate limiting fails
      next();
    }
  };
}

/**
 * Middleware to check wallet operation usage
 */
export const getWalletUsage = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.walletAddress) {
    req.walletUsage = walletLimiter.getUsage(req.walletAddress);
  }
  next();
};

/**
 * Reset rate limiting for a wallet (admin use)
 */
export const resetWalletLimits = (walletAddress: string): void => {
  walletLimiter.reset(walletAddress);
};

// Extend the AuthenticatedRequest interface to include usage info
declare global {
  namespace Express {
    interface Request {
      walletUsage?: {
        totalOperations: number;
        operationsByType: { [key: string]: number };
        resetTime: number;
      };
    }
  }
}