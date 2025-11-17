// DEK (Data Encryption Key) Cache Manager

import { SEAL_CONFIG } from '../config/seal.config';

export class DEKCache {
 private cache: Map<string, { dek: Uint8Array; timestamp: number }> = new Map();
 private maxSize: number;
 private ttl: number;
 
 constructor(maxSize: number = SEAL_CONFIG.agent.cacheSize) {
  this.maxSize = maxSize;
  this.ttl = SEAL_CONFIG.agent.cacheTTLSeconds * 1000;
 }
 
 // Get cached DEK
 get(policyId: string): Uint8Array | null {
  const entry = this.cache.get(policyId);
  
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() - entry.timestamp > this.ttl) {
   this.delete(policyId);
   return null;
  }
  
  // Return a copy to prevent external modification
  return new Uint8Array(entry.dek);
 }
 
 // Set DEK in cache
 set(policyId: string, dek: Uint8Array): void {
  // Enforce cache size limit
  if (this.cache.size >= this.maxSize && !this.cache.has(policyId)) {
   this.evictOldest();
  }
  
  // Store a copy to prevent external modification
  this.cache.set(policyId, {
   dek: new Uint8Array(dek),
   timestamp: Date.now()
  });
 }
 
 // Delete DEK from cache
 delete(policyId: string): void {
  const entry = this.cache.get(policyId);
  if (entry) {
   // Securely clear the DEK before deletion
   this.secureClear(entry.dek);
   this.cache.delete(policyId);
  }
 }
 
 // Clear all cached DEKs
 clear(): void {
  // Securely clear all DEKs
  for (const entry of this.cache.values()) {
   this.secureClear(entry.dek);
  }
  this.cache.clear();
 }
 
 // Evict oldest entry
 private evictOldest(): void {
  // Map maintains insertion order, so the first entry is the oldest
  const firstKey = this.cache.keys().next().value;
  
  if (firstKey) {
   this.delete(firstKey);
  }
 }
 
 // Securely clear DEK from memory
 private secureClear(dek: Uint8Array): void {
  // Overwrite with zeros
  dek.fill(0);
 }
 
 // Get cache statistics
 getStats(): {
  entries: number;
  hitRate: number;
  averageAge: number;
 } {
  const now = Date.now();
  let totalAge = 0;
  let validEntries = 0;
  
  for (const entry of this.cache.values()) {
   const age = now - entry.timestamp;
   if (age <= this.ttl) {
    totalAge += age;
    validEntries++;
   }
  }
  
  return {
   entries: this.cache.size,
   hitRate: validEntries / this.cache.size,
   averageAge: validEntries > 0 ? totalAge / validEntries : 0
  };
 }
 
 // Cleanup expired entries
 cleanup(): void {
  const now = Date.now();
  const toDelete: string[] = [];
  
  for (const [key, entry] of this.cache.entries()) {
   if (now - entry.timestamp > this.ttl) {
    toDelete.push(key);
   }
  }
  
  for (const key of toDelete) {
   this.delete(key);
  }
 }
}