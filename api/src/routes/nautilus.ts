import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { NautilusService } from '../services/NautilusService';
import { createLogger } from '../utils/logger';

const router: Router = Router();
const logger = createLogger();
const nautilusService = new NautilusService();

// POST /api/nautilus/verify - Submit verification request
router.post('/verify',
  [
    body('blobId').notEmpty().isString().withMessage('Blob ID is required'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
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

      const { blobId, metadata } = req.body;

      const result = await nautilusService.submitVerification({
        blobId,
        metadata
      });

      res.status(202).json({
        success: true,
        data: result,
        message: 'Verification request submitted',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error submitting verification:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to submit verification request' }
      });
    }
  }
);

// GET /api/nautilus/verify/:requestId - Get verification status
router.get('/verify/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Request ID is required' }
      });
    }

    const status = await nautilusService.getVerificationStatus(requestId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: { message: 'Verification request not found' }
      });
    }

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting verification status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get verification status' }
    });
  }
});

// POST /api/nautilus/process - Process data in TEE
router.post('/process',
  [
    body('blobId').notEmpty().isString().withMessage('Blob ID is required'),
    body('operations').isArray().withMessage('Operations must be an array'),
    body('operations.*').isString().withMessage('Each operation must be a string')
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

      const { blobId, operations } = req.body;

      const result = await nautilusService.processDataInTEE(blobId, operations);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error processing data in TEE:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to process data in TEE' }
      });
    }
  }
);

// GET /api/nautilus/attestation/:enclaveId - Get attestation report
router.get('/attestation/:enclaveId', async (req: Request, res: Response) => {
  try {
    const { enclaveId } = req.params;

    if (!enclaveId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Enclave ID is required' }
      });
    }

    const report = await nautilusService.getAttestationReport(enclaveId);

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting attestation report:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get attestation report' }
    });
  }
});

export { router as nautilusRoutes };