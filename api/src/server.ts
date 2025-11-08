import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { authenticateWallet } from './middleware/auth';

// Import route handlers
import { marketplaceRoutes } from './routes/marketplace';
import { walrusRoutes } from './routes/walrus';
import { sealRoutes } from './routes/seal';
import { nautilusRoutes } from './routes/nautilus';
import { contractRoutes } from './routes/contracts';

// Load environment variables
dotenv.config();

const app: express.Application = express();
const logger = createLogger();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      sui: 'connected',
      walrus: 'available',
      seal: 'operational',
      nautilus: 'ready'
    }
  });
});

// API Routes
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/walrus', walrusRoutes);
app.use('/api/seal', sealRoutes);
app.use('/api/nautilus', nautilusRoutes);
app.use('/api/contracts', contractRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Satya API Server running on port ${PORT}`);
  logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  logger.info(`Sui Network: ${process.env.SUI_NETWORK || 'testnet'}`);
});

export default app;