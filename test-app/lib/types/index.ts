// Walrus Type Definitions

export interface BlobMetadata {
  blobId: string;
  size: number;
  name?: string;
  uploadedAt: number;
  expiresAt: number;
  epochs: number;
  certificate?: any;
}

export interface UploadOptions {
  epochs?: number;
  onProgress?: (progress: number) => void;
  forceChunked?: boolean;
}

export interface UploadResult {
  success: boolean;
  blobId: string;
  certificate?: any;
  metadata?: any;
  error?: string;
}

export interface DownloadOptions {
  forceRefresh?: boolean;
  streaming?: boolean;
}

export interface NetworkHealth {
  overall: boolean;
  aggregator: boolean;
  publisher: boolean;
  storageNodes: boolean;
  degraded: boolean;
  timestamp: number;
}

export interface NodeHealth {
  url: string;
  healthy: boolean;
  lastChecked: number;
  responseTime: number | null;
  errorCount?: number;
}

export interface StorageNode {
  url: string;
  weight: number;
  priority: number;
}

export interface Perception {
  pendingUploads: File[];
  networkHealth: NetworkHealth;
  activeRequests: string[];
  errorQueue: Error[];
}

export interface ActionPlan {
  action: 'upload' | 'download' | 'retry' | 'switchNode' | 'idle' | 'monitor';
  params: any;
}

export interface ActionResult {
  success: boolean;
  action: string;
  data?: any;
  error?: Error;
}

export interface ChunkedUploadManifest {
  fileName: string;
  fileSize: number;
  chunkIds: string[];
  chunkSize: number;
  uploadedAt: number;
}

export enum StorageStrategy {
  DIRECT = 'direct',
  CHUNKED = 'chunked',
  QUILT = 'quilt'
}

export class WalrusError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'WalrusError';
  }
}

export class BlobNotFoundError extends WalrusError {
  constructor(blobId: string) {
    super(`Blob ${blobId} not found`);
    this.name = 'BlobNotFoundError';
  }
}

export class DownloadError extends WalrusError {
  constructor(message: string) {
    super(message);
    this.name = 'DownloadError';
  }
}