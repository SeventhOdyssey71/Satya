import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateWallet, AuthenticatedRequest } from '../middleware/auth';
import { MarketplaceService } from '../services/MarketplaceService';
import { createLogger } from '../utils/logger';

const router: Router = Router();
const logger = createLogger();
const marketplaceService = new MarketplaceService();

// GET /api/marketplace/listings - Browse all listings
router.get('/listings', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be non-negative'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be non-negative'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const search = req.query.search as string;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

      const listings = await marketplaceService.getListings({
        page,
        limit,
        category,
        search,
        minPrice,
        maxPrice
      });

      res.json({
        success: true,
        data: listings,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error fetching listings:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch listings' }
      });
    }
  }
);

// POST /api/marketplace/listings - Create new listing
router.post('/listings',
  authenticateWallet,
  [
    body('title').notEmpty().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('description').notEmpty().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
    body('category').notEmpty().isIn(['financial', 'healthcare', 'research', 'marketing', 'other']).withMessage('Invalid category'),
    body('fileHash').notEmpty().isString().withMessage('File hash is required'),
    body('encryptionKey').optional().isString().withMessage('Encryption key must be a string'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
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

      const listingData = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        fileHash: req.body.fileHash,
        encryptionKey: req.body.encryptionKey,
        metadata: req.body.metadata,
        sellerAddress: req.walletAddress!
      };

      const listing = await marketplaceService.createListing(listingData);

      res.status(201).json({
        success: true,
        data: listing,
        message: 'Listing created successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error creating listing:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to create listing' }
      });
    }
  }
);

// GET /api/marketplace/listings/:id - Get specific listing
router.get('/listings/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const listingId = req.params.id;
    
    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Listing ID is required' }
      });
    }

    const listing = await marketplaceService.getListing(listingId);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: { message: 'Listing not found' }
      });
    }

    res.json({
      success: true,
      data: listing,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching listing:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch listing' }
    });
  }
});

// POST /api/marketplace/purchase - Purchase a listing
router.post('/purchase',
  authenticateWallet,
  [
    body('listingId').notEmpty().isString().withMessage('Listing ID is required'),
    body('paymentTxHash').notEmpty().isString().withMessage('Payment transaction hash is required')
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

      const { listingId, paymentTxHash } = req.body;
      const buyerAddress = req.walletAddress!;

      const purchase = await marketplaceService.purchaseListing({
        listingId,
        buyerAddress,
        paymentTxHash
      });

      res.json({
        success: true,
        data: purchase,
        message: 'Purchase completed successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error processing purchase:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to process purchase' }
      });
    }
  }
);

// GET /api/marketplace/downloads/:purchaseId - Get download link
router.get('/downloads/:purchaseId',
  authenticateWallet,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const purchaseId = req.params.purchaseId;
      const buyerAddress = req.walletAddress as string;

      const downloadInfo = await marketplaceService.getDownloadLink({
        purchaseId,
        buyerAddress
      });

      res.json({
        success: true,
        data: downloadInfo,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error generating download link:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to generate download link' }
      });
    }
  }
);

export { router as marketplaceRoutes };