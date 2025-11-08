import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { createLogger } from '../utils/logger';

const router: Router = Router();
const logger = createLogger();

// Initialize Sui client
const network = process.env.SUI_NETWORK || 'testnet';
const suiClient = new SuiClient({ url: getFullnodeUrl(network as any) });

// Contract configuration
const MARKETPLACE_PACKAGE_ID = process.env.MARKETPLACE_PACKAGE_ID || '';
const MARKETPLACE_OBJECT_ID = process.env.MARKETPLACE_OBJECT_ID || '';

// GET /api/contracts/info - Get contract information
router.get('/info', async (req: Request, res: Response): Promise<void> => {
  try {
    const info = {
      network,
      packageId: MARKETPLACE_PACKAGE_ID,
      objectId: MARKETPLACE_OBJECT_ID,
      deployed: !!(MARKETPLACE_PACKAGE_ID && MARKETPLACE_OBJECT_ID),
      version: '1.0.0'
    };

    res.json({
      success: true,
      data: info,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting contract info:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get contract information' }
    });
  }
});

// GET /api/contracts/objects/:id - Get object details
router.get('/objects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Object ID is required' }
      });
    }

    const object = await suiClient.getObject({
      id,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
        showPreviousTransaction: true
      }
    });

    res.json({
      success: true,
      data: object,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting object details:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get object details' }
    });
  }
});

// GET /api/contracts/transactions/:digest - Get transaction details
router.get('/transactions/:digest', async (req: Request, res: Response): Promise<void> => {
  try {
    const { digest } = req.params;

    if (!digest) {
      return res.status(400).json({
        success: false,
        error: { message: 'Transaction digest is required' }
      });
    }

    const transaction = await suiClient.getTransactionBlock({
      digest,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true
      }
    });

    res.json({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting transaction details:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get transaction details' }
    });
  }
});

// POST /api/contracts/simulate - Simulate transaction
router.post('/simulate',
  [
    body('transactionBytes').notEmpty().isString().withMessage('Transaction bytes are required')
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

      const { transactionBytes } = req.body;

      // Simulate the transaction
      const result = await suiClient.dryRunTransactionBlock({
        transactionBlock: TransactionBlock.from(transactionBytes)
      });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error simulating transaction:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to simulate transaction' }
      });
    }
  }
);

// GET /api/contracts/gas-price - Get current gas price
router.get('/gas-price', async (req: Request, res: Response) => {
  try {
    const gasPrice = await suiClient.getReferenceGasPrice();

    res.json({
      success: true,
      data: { gasPrice: gasPrice.toString() },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting gas price:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get gas price' }
    });
  }
});

// GET /api/contracts/events - Get contract events
router.get('/events', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!MARKETPLACE_PACKAGE_ID) {
      return res.status(400).json({
        success: false,
        error: { message: 'Marketplace package not configured' }
      });
    }

    const events = await suiClient.queryEvents({
      query: { Package: MARKETPLACE_PACKAGE_ID },
      limit: 50,
      order: 'descending'
    });

    res.json({
      success: true,
      data: events,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting contract events:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get contract events' }
    });
  }
});

export { router as contractRoutes };