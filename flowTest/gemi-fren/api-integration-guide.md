# API Integration Guide & Service Patterns

## Service Architecture Overview

### MarketplaceContractService Integration
```typescript
// Core Methods & Expected Responses
class MarketplaceContractService {
  // Returns array of pending model objects
  async getUserPendingModels(userAddress: string): Promise<PendingModel[]>
  
  // Returns paginated marketplace listings
  async getMarketplaceModels(limit: number, cursor?: string): Promise<MarketplaceResponse>
  
  // Creates new marketplace listing
  async createListing(params: ListingParams): Promise<TransactionResult>
  
  // Executes model purchase
  async purchaseModel(listingId: string, payment: PaymentDetails): Promise<PurchaseResult>
}

// Error Handling Patterns
try {
  const models = await marketplaceService.getUserPendingModels(address);
  return { success: true, data: models };
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    return { success: false, error: 'Connection timeout', retry: true };
  } else if (error.code === 'INVALID_ADDRESS') {
    return { success: false, error: 'Invalid wallet address', retry: false };
  }
  // Generic error handling
  return { success: false, error: error.message, retry: true };
}
```

### EventService Integration
```typescript
// Event-based data fetching
class EventService {
  // Returns model listing events with pagination
  async getModelListings(limit: number, cursor?: string): Promise<EventQueryResult>
  
  // Returns specific model events and history
  async getModelEvents(modelId: string): Promise<ModelEvent[]>
  
  // Custom event filtering and queries
  async queryEvents(filter: EventFilter): Promise<EventResult>
}

// Response Processing
interface EventQueryResult {
  events: ModelListedEvent[];
  hasNextPage: boolean;
  nextCursor?: string;
  totalCount?: number;
}

// Data Transformation
const processMarketplaceEvents = (events: ModelListedEvent[]) => {
  return events.map(event => ({
    id: event.listingId,
    title: event.title || `Model ${event.listingId.slice(0, 8)}...`,
    price: formatSuiPrice(event.downloadPrice),
    timestamp: event.timestamp,
    category: inferCategory(event.title),
    quality: event.qualityScore || 'Pending'
  }));
};
```

### WalrusService Integration
```typescript
// File upload and storage operations
class WalrusService {
  // Upload with encryption and metadata
  async uploadBlob(file: File, metadata: BlobMetadata): Promise<UploadResult>
  
  // Secure download with authentication
  async downloadBlob(blobId: string, credentials: AccessCredentials): Promise<Blob>
  
  // Get file information and availability
  async getBlobInfo(blobId: string): Promise<BlobInfo>
}

// Upload Progress Tracking
const uploadWithProgress = async (file: File, onProgress: (percent: number) => void) => {
  const upload = await walrusService.uploadBlob(file, {
    category: 'ai-model',
    encryption: true,
    onProgress
  });
  
  return {
    blobId: upload.blobId,
    size: upload.size,
    hash: upload.contentHash,
    encryptionKey: upload.encryptionKey
  };
};
```

## Error Handling & Recovery Patterns

### Network & Connectivity Issues
```typescript
// Exponential backoff retry logic
class RetryHandler {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries || !isRetriableError(error)) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}

// Determine if error is worth retrying
const isRetriableError = (error: any): boolean => {
  return (
    error.code === 'NETWORK_ERROR' ||
    error.code === 'TIMEOUT' ||
    error.status >= 500 ||
    error.message?.includes('rate limit')
  );
};
```

### Data Consistency & Synchronization
```typescript
// Cache management for consistency
class DataSyncManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  
  async getCachedOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    forceFresh = false
  ): Promise<T> {
    if (!forceFresh) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.TTL) {
        return cached.data;
      }
    }
    
    try {
      const freshData = await fetcher();
      this.cache.set(key, { data: freshData, timestamp: Date.now() });
      return freshData;
    } catch (error) {
      // Return stale cache data if available
      const cached = this.cache.get(key);
      if (cached) {
        console.warn('Using stale cache data due to fetch error:', error);
        return cached.data;
      }
      throw error;
    }
  }
}
```

### Transaction & State Management
```typescript
// Atomic operations with rollback
class TransactionManager {
  private pendingOperations = new Set<string>();
  
  async executeTransaction(
    operationId: string,
    operations: Array<() => Promise<any>>
  ): Promise<any[]> {
    if (this.pendingOperations.has(operationId)) {
      throw new Error('Operation already in progress');
    }
    
    this.pendingOperations.add(operationId);
    const completedOps: any[] = [];
    
    try {
      for (const operation of operations) {
        const result = await operation();
        completedOps.push(result);
      }
      
      return completedOps;
    } catch (error) {
      // Attempt rollback of completed operations
      await this.rollbackOperations(completedOps.reverse());
      throw error;
    } finally {
      this.pendingOperations.delete(operationId);
    }
  }
  
  private async rollbackOperations(operations: any[]): Promise<void> {
    for (const op of operations) {
      try {
        if (op.rollback) {
          await op.rollback();
        }
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
  }
}
```

## Performance Optimization Strategies

### Parallel Data Fetching
```typescript
// Concurrent API calls with proper error isolation
const fetchDashboardData = async (userAddress: string) => {
  const [
    pendingModelsResult,
    marketplaceModelsResult,
    userStatsResult
  ] = await Promise.allSettled([
    marketplaceService.getUserPendingModels(userAddress),
    eventService.getModelListings(20),
    analyticsService.getUserStats(userAddress)
  ]);
  
  return {
    pendingModels: pendingModelsResult.status === 'fulfilled' 
      ? pendingModelsResult.value 
      : [],
    marketplaceModels: marketplaceModelsResult.status === 'fulfilled'
      ? marketplaceModelsResult.value.events
      : [],
    userStats: userStatsResult.status === 'fulfilled'
      ? userStatsResult.value
      : null,
    errors: [
      pendingModelsResult.status === 'rejected' ? pendingModelsResult.reason : null,
      marketplaceModelsResult.status === 'rejected' ? marketplaceModelsResult.reason : null,
      userStatsResult.status === 'rejected' ? userStatsResult.reason : null
    ].filter(Boolean)
  };
};
```

### Smart Caching & Invalidation
```typescript
// Context-aware caching with automatic invalidation
class SmartCache {
  private caches = {
    userModels: new Map<string, CacheEntry>(),
    marketplace: new Map<string, CacheEntry>(),
    metadata: new Map<string, CacheEntry>()
  };
  
  // Cache with dependency tracking
  async cacheWithDependencies(
    key: string,
    data: any,
    dependencies: string[] = [],
    ttl: number = 300000
  ): Promise<void> {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      dependencies: new Set(dependencies)
    };
    
    this.caches.userModels.set(key, entry);
    
    // Register dependency relationships
    dependencies.forEach(dep => {
      this.registerDependency(dep, key);
    });
  }
  
  // Invalidate cache and all dependents
  invalidate(key: string): void {
    const toInvalidate = this.getDependentKeys(key);
    toInvalidate.add(key);
    
    toInvalidate.forEach(k => {
      Object.values(this.caches).forEach(cache => cache.delete(k));
    });
  }
}
```

### Batching & Rate Limiting
```typescript
// Request batching to reduce API calls
class RequestBatcher {
  private batches = new Map<string, BatchedRequest>();
  private readonly batchDelay = 100; // ms
  
  async batchedFetch<T>(
    key: string,
    fetcher: (keys: string[]) => Promise<Map<string, T>>,
    itemKey: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(key)) {
        this.batches.set(key, {
          keys: [],
          promises: [],
          fetcher,
          timer: setTimeout(() => this.executeBatch(key), this.batchDelay)
        });
      }
      
      const batch = this.batches.get(key)!;
      batch.keys.push(itemKey);
      batch.promises.push({ resolve, reject, key: itemKey });
    });
  }
  
  private async executeBatch(batchKey: string): Promise<void> {
    const batch = this.batches.get(batchKey)!;
    this.batches.delete(batchKey);
    
    try {
      const results = await batch.fetcher(batch.keys);
      
      batch.promises.forEach(({ resolve, key }) => {
        resolve(results.get(key));
      });
    } catch (error) {
      batch.promises.forEach(({ reject }) => {
        reject(error);
      });
    }
  }
}
```

## Real-time Updates & WebSocket Integration

### Event-driven Data Updates
```typescript
// WebSocket connection management
class RealtimeDataManager {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Set<(data: any) => void>>();
  
  connect(userAddress: string): void {
    this.ws = new WebSocket(`wss://api.satya.ai/ws/${userAddress}`);
    
    this.ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      this.notifySubscribers(type, data);
    };
    
    this.ws.onclose = () => {
      // Reconnect with exponential backoff
      setTimeout(() => this.connect(userAddress), 5000);
    };
  }
  
  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }
    
    this.subscriptions.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.get(eventType)?.delete(callback);
    };
  }
  
  private notifySubscribers(eventType: string, data: any): void {
    this.subscriptions.get(eventType)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Subscription callback error:', error);
      }
    });
  }
}
```

### Optimistic UI Updates
```typescript
// Optimistic updates with rollback capability
class OptimisticUpdater {
  async optimisticUpdate<T>(
    currentData: T,
    optimisticData: T,
    operation: () => Promise<T>,
    updateUI: (data: T) => void
  ): Promise<T> {
    // Apply optimistic update immediately
    updateUI(optimisticData);
    
    try {
      // Execute actual operation
      const result = await operation();
      updateUI(result);
      return result;
    } catch (error) {
      // Rollback on failure
      updateUI(currentData);
      throw error;
    }
  }
}
```