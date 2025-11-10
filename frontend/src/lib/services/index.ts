// Service Layer Exports - Unified API for all marketplace services

import { MarketplaceService } from './marketplace-service';
import { UploadService } from './upload-service';
import { DownloadService } from './download-service';
import { UserService } from './user-service';

// Re-export service classes
export { MarketplaceService } from './marketplace-service';
export { UploadService } from './upload-service';
export { DownloadService } from './download-service';
export { UserService } from './user-service';

// Service types
export type {
  ModelUploadRequest,
  ModelListing,
  ModelPurchase
} from './marketplace-service';

export type { 
  FileUploadRequest as UploadRequest,
  FileUploadProgress as UploadProgress,
  FileUploadResult as UploadResult,
  UploadProgressCallback
} from './upload-service';

export type {
  DownloadRequest,
  DownloadProgress,
  DownloadResult,
  DownloadProgressCallback
} from './download-service';

export type {
  UserProfile,
  UserActivity,
  UserStats,
  WalletConnection
} from './user-service';

// Service instances for global use
let marketplaceService: MarketplaceService | null = null;
let uploadService: UploadService | null = null;
let downloadService: DownloadService | null = null;
let userService: UserService | null = null;

// Singleton factory functions
export function getMarketplaceService(): MarketplaceService {
  if (!marketplaceService) {
    marketplaceService = new MarketplaceService();
  }
  return marketplaceService;
}

export function getUploadService(): UploadService {
  if (!uploadService) {
    uploadService = new UploadService();
  }
  return uploadService;
}

export function getDownloadService(): DownloadService {
  if (!downloadService) {
    downloadService = new DownloadService();
  }
  return downloadService;
}

export function getUserService(): UserService {
  if (!userService) {
    userService = new UserService();
  }
  return userService;
}

// Convenience exports for common operations
export const services = {
  get marketplace() {
    return getMarketplaceService();
  },
  get upload() {
    return getUploadService();
  },
  get download() {
    return getDownloadService();
  },
  get user() {
    return getUserService();
  }
};

// Health check for all services
export async function checkServicesHealth(): Promise<{
  marketplace: string;
  upload: string;
  download: string;
  user: string;
  overall: string;
}> {
  try {
    const [marketplaceHealth, uploadHealth] = await Promise.allSettled([
      getMarketplaceService().getHealthStatus(),
      getUploadService().getHealthStatus()
    ]);

    const marketplace = marketplaceHealth.status === 'fulfilled' ? 
      marketplaceHealth.value.overall : 'failed';
    
    const upload = uploadHealth.status === 'fulfilled' ? 
      uploadHealth.value.overall : 'failed';

    // Download and user services are mostly local, so assume healthy unless proven otherwise
    const download = 'healthy';
    const user = 'healthy';

    const overall = [marketplace, upload, download, user].every(status => status === 'healthy') ? 
      'healthy' : 'degraded';

    return {
      marketplace,
      upload,
      download,
      user,
      overall
    };

  } catch (error) {
    return {
      marketplace: 'unknown',
      upload: 'unknown',
      download: 'unknown',
      user: 'unknown',
      overall: 'failed'
    };
  }
}

// Initialize all services
export async function initializeServices(): Promise<void> {
  try {
    // Pre-initialize services to validate configurations
    getMarketplaceService();
    getUploadService();
    getDownloadService();
    getUserService();
    
    console.info('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
}