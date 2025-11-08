/**
 * Enterprise-grade rate limiting for Satya Marketplace
 * Prevents DoS attacks and ensures fair usage
 */

import { MarketplaceError, ErrorCode } from '../types/common';
import { logger } from './logger';

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyGenerator?: (context: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  enableBurst?: boolean;
  burstLimit?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  resetTime?: Date;
  remaining?: number;
  totalRequests?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: Date;
  burstCount?: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: Required<RateLimitConfig>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (context) => context.userId || context.ip || 'anonymous',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      enableBurst: false,
      burstLimit: Math.ceil(config.maxRequests * 0.1), // 10% burst by default
      ...config
    };

    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }

  private cleanup(): void {
    const now = new Date();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  private getOrCreateEntry(key: string): RateLimitEntry {
    const now = new Date();
    const existing = this.store.get(key);

    if (existing && existing.resetTime > now) {
      return existing;
    }

    const newEntry: RateLimitEntry = {
      count: 0,
      resetTime: new Date(now.getTime() + this.config.windowMs),
      burstCount: 0
    };

    this.store.set(key, newEntry);
    return newEntry;
  }

  check(context: any): RateLimitResult {
    const key = this.config.keyGenerator(context);
    const entry = this.getOrCreateEntry(key);
    const now = new Date();

    // Check burst limit first if enabled
    if (this.config.enableBurst && entry.burstCount! >= this.config.burstLimit) {
      logger.security('Rate limit burst exceeded', 'medium', {
        key,
        burstCount: entry.burstCount,
        burstLimit: this.config.burstLimit
      });

      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
        totalRequests: entry.count
      };
    }

    // Check main rate limit
    if (entry.count >= this.config.maxRequests) {
      logger.security('Rate limit exceeded', 'medium', {
        key,
        count: entry.count,
        maxRequests: this.config.maxRequests
      });

      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
        totalRequests: entry.count
      };
    }

    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: this.config.maxRequests - entry.count - 1,
      totalRequests: entry.count
    };
  }

  increment(context: any, success: boolean = true): void {
    if (this.config.skipSuccessfulRequests && success) return;
    if (this.config.skipFailedRequests && !success) return;

    const key = this.config.keyGenerator(context);
    const entry = this.getOrCreateEntry(key);

    entry.count++;

    if (this.config.enableBurst) {
      entry.burstCount = (entry.burstCount || 0) + 1;
    }

    logger.trace('Rate limit incremented', {
      key,
      count: entry.count,
      success,
      resetTime: entry.resetTime.toISOString()
    });
  }

  reset(context: any): void {
    const key = this.config.keyGenerator(context);
    this.store.delete(key);
    
    logger.info('Rate limit reset', { key });
  }

  getStats(): { totalKeys: number; entries: Array<{ key: string; count: number; resetTime: Date }> } {
    return {
      totalKeys: this.store.size,
      entries: Array.from(this.store.entries()).map(([key, entry]) => ({
        key,
        count: entry.count,
        resetTime: entry.resetTime
      }))
    };
  }
}

// Rate limiter decorator for methods
export function rateLimit(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);

  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = {
        userId: this.currentUserId,
        method: propertyName,
        timestamp: new Date().toISOString()
      };

      const result = limiter.check(context);

      if (!result.allowed) {
        limiter.increment(context, false);
        throw new MarketplaceError(
          ErrorCode.SERVICE_UNAVAILABLE,
          'Rate limit exceeded. Please try again later.',
          {
            resetTime: result.resetTime?.toISOString(),
            remaining: result.remaining
          }
        );
      }

      try {
        const methodResult = await method.apply(this, args);
        limiter.increment(context, true);
        return methodResult;
      } catch (error) {
        limiter.increment(context, false);
        throw error;
      }
    };

    return descriptor;
  };
}

// Pre-configured rate limiters for different operations
export const RateLimiters = {
  // General API operations
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,    // 100 requests per minute
    enableBurst: true
  }),

  // File upload operations (more restrictive)
  upload: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,     // 10 uploads per minute
    enableBurst: false
  }),

  // Purchase operations (very restrictive)
  purchase: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,      // 5 purchases per minute
    enableBurst: false
  }),

  // Download operations
  download: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,     // 50 downloads per minute
    enableBurst: true
  }),

  // Authentication operations
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,          // 20 auth attempts per 15 minutes
    enableBurst: false
  })
};