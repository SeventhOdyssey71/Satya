import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export interface AuthenticatedRequest extends Request {
  walletAddress?: string;
  userId?: string;
}

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
        error: { message: 'No authorization header provided' }
      });
      return;
    }

    // For now, we'll use a simple bearer token approach
    // In production, this would verify a signed message from the wallet
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid authorization format' }
      });
      return;
    }

    // TODO: Implement proper wallet signature verification
    // For hackathon demo, we'll extract wallet address from token
    req.walletAddress = token; // Simplified for demo
    req.userId = token;

    logger.info('Wallet authenticated', { walletAddress: req.walletAddress });
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: { message: 'Authentication failed' }
    });
    return;
  }
};