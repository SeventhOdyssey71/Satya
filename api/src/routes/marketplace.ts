import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateWallet, AuthenticatedRequest } from '../middleware/auth';
import { MarketplaceService } from '../services/MarketplaceService';
import { 
  marketplaceRateLimit, 
  transactionRateLimit,
  createWalletRateLimit 
} from '../middleware/rateLimiting';
import { createLogger } from '../utils/logger';

const router: Router = Router();
const logger = createLogger();
const marketplaceService = new MarketplaceService();

// GET /api/marketplace/listings - Browse all listings
router.get('/listings', 
  marketplaceRateLimit,
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
        res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
        return;
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
  transactionRateLimit,
  authenticateWallet,
  createWalletRateLimit('create_listing'),
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
        res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
        return;
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
        message: listing.requiresUserSignature 
          ? 'Transaction created successfully. Please sign with your wallet to complete listing creation.'
          : 'Listing created successfully',
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

// POST /api/marketplace/listings/submit-signed - Submit signed listing transaction
router.post('/listings/submit-signed',
  transactionRateLimit,
  authenticateWallet,
  [
    body('transactionBlock').notEmpty().isString().withMessage('Transaction block is required'),
    body('signature').notEmpty().isString().withMessage('Signature is required'),
    body('listingData').isObject().withMessage('Listing data is required')
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

      const { transactionBlock, signature, listingData } = req.body;

      const result = await marketplaceService.submitSignedListingTransaction(
        transactionBlock,
        signature,
        listingData
      );

      res.json({
        success: true,
        data: result,
        message: 'Listing created successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error submitting signed listing transaction:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to submit signed transaction' }
      });
    }
  }
);

// GET /api/marketplace/listings/:id - Get specific listing
router.get('/listings/:id', 
  marketplaceRateLimit,
  async (req: Request, res: Response): Promise<void> => {
  try {
    const listingId = req.params.id;
    
    if (!listingId) {
      res.status(400).json({
        success: false,
        error: { message: 'Listing ID is required' }
      });
      return;
    }

    const listing = await marketplaceService.getListing(listingId);

    if (!listing) {
      res.status(404).json({
        success: false,
        error: { message: 'Listing not found' }
      });
      return;
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
  transactionRateLimit,
  authenticateWallet,
  createWalletRateLimit('purchase'),
  [
    body('listingId').notEmpty().isString().withMessage('Listing ID is required')
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

      const { listingId } = req.body;
      const buyerAddress = req.walletAddress!;

      const purchase = await marketplaceService.purchaseListing({
        listingId,
        buyerAddress,
        paymentTxHash: '' // This field is now deprecated
      });

      res.json({
        success: true,
        data: purchase,
        message: purchase.requiresUserSignature 
          ? 'Transaction created successfully. Please sign with your wallet to complete the purchase.'
          : 'Purchase completed successfully',
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

// POST /api/marketplace/purchase/submit-signed - Submit signed purchase transaction
router.post('/purchase/submit-signed',
  transactionRateLimit,
  authenticateWallet,
  [
    body('transactionBlock').notEmpty().isString().withMessage('Transaction block is required'),
    body('signature').notEmpty().isString().withMessage('Signature is required'),
    body('purchaseData').isObject().withMessage('Purchase data is required')
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

      const { transactionBlock, signature, purchaseData } = req.body;

      const result = await marketplaceService.submitSignedPurchaseTransaction(
        transactionBlock,
        signature,
        purchaseData
      );

      res.json({
        success: true,
        data: result,
        message: 'Purchase completed successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error submitting signed purchase transaction:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to submit signed purchase transaction' }
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
      const buyerAddress = req.walletAddress!;

      if (!purchaseId) {
        res.status(400).json({
          success: false,
          error: { message: 'Purchase ID is required' }
        });
        return;
      }

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