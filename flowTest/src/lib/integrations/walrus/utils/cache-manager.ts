// Cache Manager for blob storage

export class CacheManager {
  private cache: Map<string, { data: Uint8Array; timestamp: number }> = new Map();
  private maxSizeBytes: number;
  private currentSizeBytes: number = 0;
  private ttl: number = 1800000; // 30 minutes default
  
  constructor(maxSizeMB: number) {
    this.maxSizeBytes = maxSizeMB * 1024 * 1024;
  }
  
  // Get cached data
  get(key: string): Uint8Array | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  // Set cache entry
  set(key: string, data: Uint8Array): void {
    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.delete(key);
    }
    
    // Check if data fits in cache
    if (data.length > this.maxSizeBytes) {
      console.warn(`Data too large for cache: ${data.length} bytes`);
      return;
    }
    
    // Evict entries if needed
    while (this.currentSizeBytes + data.length > this.maxSizeBytes) {
      this.evictOldest();
    }
    
    // Add to cache
    this.cache.set(key, { data, timestamp: Date.now() });
    this.currentSizeBytes += data.length;
  }
  
  // Delete cache entry
  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSizeBytes -= entry.data.length;
      this.cache.delete(key);
    }
  }
  
  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.currentSizeBytes = 0;
  }
  
  // Evict oldest entry
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }
  
  // Get cache statistics
  getStats(): { entries: number; sizeBytes: number; utilization: number } {
    return {
      entries: this.cache.size,
      sizeBytes: this.currentSizeBytes,
      utilization: this.currentSizeBytes / this.maxSizeBytes
    };
  }
}