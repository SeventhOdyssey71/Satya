import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { WalrusClient } from '../services/WalrusClientStub';
import { createLogger } from '../utils/logger';

const router: Router = Router();
const logger = createLogger();
const walrusClient = new WalrusClient();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// POST /api/walrus/upload - Upload file to Walrus
router.post('/upload', 
  upload.single('file'),
  [
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
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

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { message: 'No file provided' }
        });
        return;
      }

      logger.info('Uploading file to Walrus', { 
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      const uploadResult = await walrusClient.uploadBlob(req.file.buffer);

      res.json({
        success: true,
        data: {
          blobId: uploadResult.blobId,
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          uploadedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error uploading to Walrus:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to upload file' }
      });
    }
  }
);

// GET /api/walrus/download/:blobId - Download file from Walrus
router.get('/download/:blobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { blobId } = req.params;

    if (!blobId) {
      res.status(400).json({
        success: false,
        error: { message: 'Blob ID is required' }
      });
      return;
    }

    logger.info('Downloading file from Walrus', { blobId });

    const downloadResult = await walrusClient.downloadBlob(blobId);

    if (!downloadResult.success) {
      res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
      return;
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${blobId}.dat"`);
    
    // Send the binary data
    res.send(Buffer.from(downloadResult.data));

  } catch (error) {
    logger.error('Error downloading from Walrus:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to download file' }
    });
  }
});

// GET /api/walrus/info/:blobId - Get file info from Walrus
router.get('/info/:blobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { blobId } = req.params;

    if (!blobId) {
      res.status(400).json({
        success: false,
        error: { message: 'Blob ID is required' }
      });
      return;
    }

    // For now, return basic info. In production, this would query Walrus metadata
    const info = {
      blobId,
      available: true,
      storedAt: new Date().toISOString(),
      replicas: 3,
      status: 'active'
    };

    res.json({
      success: true,
      data: info,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting Walrus info:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get file info' }
    });
  }
});

export { router as walrusRoutes };