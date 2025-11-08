import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateWallet, AuthenticatedRequest } from '../middleware/auth';
import { SealService } from '../services/SealService';
import { createLogger } from '../utils/logger';

const router: Router = Router();
const logger = createLogger();
const sealService = new SealService();

// POST /api/seal/policies - Create encryption policy
router.post('/policies',
  authenticateWallet,
  [
    body('type').isIn(['payment-gated', 'time-locked', 'allowlist', 'tee-only']).withMessage('Invalid policy type'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative'),
    body('allowedBuyers').optional().isArray().withMessage('Allowed buyers must be an array'),
    body('expiresAt').optional().isISO8601().withMessage('Invalid expiration date'),
    body('conditions').optional().isObject().withMessage('Conditions must be an object')
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const policyData = {
        type: req.body.type,
        price: req.body.price,
        allowedBuyers: req.body.allowedBuyers || [],
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        conditions: req.body.conditions
      };

      const policyId = await sealService.createPolicy(policyData);

      res.status(201).json({
        success: true,
        data: { policyId },
        message: 'Encryption policy created successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error creating SEAL policy:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to create encryption policy' }
      });
    }
  }
);

// GET /api/seal/policies/:id - Get policy status
router.get('/policies/:id', async (req: Request, res: Response) => {
  try {
    const policyId = req.params.id;

    if (!policyId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Policy ID is required' }
      });
    }

    const policy = await sealService.getPolicyStatus(policyId);

    res.json({
      success: true,
      data: policy,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting policy status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get policy status' }
    });
  }
});

// POST /api/seal/policies/:id/grant - Grant access to policy
router.post('/policies/:id/grant',
  authenticateWallet,
  [
    body('buyerAddress').notEmpty().isString().withMessage('Buyer address is required')
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const policyId = req.params.id as string;
      const { buyerAddress } = req.body;

      await sealService.grantAccess({
        policyId,
        buyerAddress,
        grantedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Access granted successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error granting access:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to grant access' }
      });
    }
  }
);

// GET /api/seal/keys/:policyId - Get decryption key
router.get('/keys/:policyId',
  authenticateWallet,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const policyId = req.params.policyId;
      const buyerAddress = req.walletAddress!;

      const decryptionKey = await sealService.getDecryptionKey({
        policyId,
        buyerAddress
      });

      res.json({
        success: true,
        data: { decryptionKey },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error getting decryption key:', error);
      res.status(403).json({
        success: false,
        error: { message: 'Access denied or key not available' }
      });
    }
  }
);

// DELETE /api/seal/policies/:id/access/:buyerAddress - Revoke access
router.delete('/policies/:id/access/:buyerAddress',
  authenticateWallet,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id: policyId, buyerAddress } = req.params;

      await sealService.revokeAccess(policyId, buyerAddress);

      res.json({
        success: true,
        message: 'Access revoked successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error revoking access:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to revoke access' }
      });
    }
  }
);

export { router as sealRoutes };