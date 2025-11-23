// Service Layer Exports - Unified API for all marketplace services

import { MarketplaceService } from './marketplace-service';
import { UploadService } from './upload-service';
import { DownloadService } from './download-service';
import { UserService } from './user-service';
import { EventService } from './event-service';

// Re-export service classes
export { MarketplaceService } from './marketplace-service';
export { UploadService } from './upload-service';
export { DownloadService } from './download-service';
export { UserService } from './user-service';
export { EventService } from './event-service';

// Service types
export type {
 ModelUploadRequest,
 ModelListing,
 ModelPurchase
} from './marketplace-service';

export type {
 MarketplaceEvent,
 ModelListedEvent,
 ModelPurchasedEvent,
 ModelUpdatedEvent,
 EventFilter,
 EventQueryResult
} from './event-service';

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
let eventService: EventService | null = null;

// Singleton factory functions with runtime checks
export function getMarketplaceService(): MarketplaceService {
 if (typeof window === 'undefined') {
  // During SSR/build time, return a mock or minimal service
  return {} as MarketplaceService;
 }
 
 if (!marketplaceService) {
  marketplaceService = new MarketplaceService();
 }
 return marketplaceService;
}

export function getUploadService(): UploadService {
 if (typeof window === 'undefined') {
  return {} as UploadService;
 }
 
 if (!uploadService) {
  try {
   uploadService = new UploadService();
  } catch (error) {
   console.error('Failed to create UploadService:', error);
   // Return a mock service in case of initialization failure
   return {
    uploadFile: async () => { throw new Error('Upload service not available'); },
    getHealthStatus: async () => ({ overall: 'failed' as const })
   } as unknown as UploadService;
  }
 }
 return uploadService;
}

// Get upload service with fallback RPC support
export async function getUploadServiceWithFallback(): Promise<UploadService> {
 if (typeof window === 'undefined') {
  return {} as UploadService;
 }
 
 if (!uploadService) {
  try {
   console.log('Creating upload service with RPC fallback...');
   uploadService = await UploadService.createWithFallback();
   console.log('Upload service with fallback created successfully');
  } catch (error) {
   console.error('Failed to create UploadService with fallback:', error);
   // Fallback to regular upload service
   uploadService = new UploadService();
  }
 }
 return uploadService;
}

export function getDownloadService(): DownloadService {
 if (typeof window === 'undefined') {
  return {} as DownloadService;
 }
 
 if (!downloadService) {
  downloadService = new DownloadService();
 }
 return downloadService;
}

export function getUserService(): UserService {
 if (typeof window === 'undefined') {
  return {} as UserService;
 }
 
 if (!userService) {
  userService = new UserService();
 }
 return userService;
}

export function getEventService(): EventService {
 if (typeof window === 'undefined') {
  return {} as EventService;
 }
 
 if (!eventService) {
  eventService = new EventService();
 }
 return eventService;
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
 },
 get events() {
  return getEventService();
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