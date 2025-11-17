// Environment-Specific Walrus Configuration and Fixes

import { WALRUS_CONFIG } from './walrus.config';
import { logger } from '../../core/logger';

export interface EnvironmentConfig {
  useProxy: boolean;
  proxyUrl?: string;
  corsHeaders: Record<string, string>;
  timeoutAdjustments: {
    upload: number;
    download: number;
    health: number;
  };
  retryPolicy: {
    maxRetries: number;
    baseDelay: number;
    backoffMultiplier: number;
  };
  fallbackNodes: string[];
}

// Environment-specific configurations
const ENVIRONMENT_CONFIGS: Record<string, EnvironmentConfig> = {
  development: {
    useProxy: false,
    corsHeaders: {
      'Content-Type': 'application/octet-stream'
    },
    timeoutAdjustments: {
      upload: 120000,  // 120s for dev (increased for large files)
      download: 60000, // 60s for dev  
      health: 10000    // 10s for dev
    },
    retryPolicy: {
      maxRetries: 5,
      baseDelay: 2000,
      backoffMultiplier: 2
    },
    fallbackNodes: [
      'https://wal-testnet-stor-nest-01.walrus.space:11444',
      'https://wal-testnet-stor-nest-02.walrus.space:11444'
    ]
  },
  
  production: {
    useProxy: true,
    proxyUrl: '/api/walrus-proxy',
    corsHeaders: {
      'Content-Type': 'application/octet-stream'
    },
    timeoutAdjustments: {
      upload: 60000,   // 60s for prod
      download: 30000, // 30s for prod
      health: 5000     // 5s for prod
    },
    retryPolicy: {
      maxRetries: 3,
      baseDelay: 1000,
      backoffMultiplier: 2
    },
    fallbackNodes: WALRUS_CONFIG.testnet.storageNodes.map(node => node.url)
  },
  
  testing: {
    useProxy: false,
    corsHeaders: {
      'Content-Type': 'application/octet-stream'
    },
    timeoutAdjustments: {
      upload: 15000,   // 15s for tests
      download: 10000, // 10s for tests
      health: 3000     // 3s for tests
    },
    retryPolicy: {
      maxRetries: 2,
      baseDelay: 500,
      backoffMultiplier: 1.5
    },
    fallbackNodes: [
      'https://wal-testnet-stor-nest-01.walrus.space:11444'
    ]
  }
};

export class WalrusEnvironmentManager {
  private currentEnv: string;
  private config: EnvironmentConfig;
  private connectivityIssues: Set<string> = new Set();

  constructor() {
    this.currentEnv = this.detectEnvironment();
    this.config = this.getEnvironmentConfig();
    this.applyEnvironmentFixes();
  }

  // Detect current environment
  private detectEnvironment(): string {
    if (typeof window === 'undefined') return 'testing';
    
    const hostname = window.location.hostname;
    const nodeEnv = process.env.NODE_ENV;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    
    if (nodeEnv === 'production') {
      return 'production';
    }
    
    if (nodeEnv === 'test') {
      return 'testing';
    }
    
    return 'development';
  }

  // Get environment-specific configuration
  private getEnvironmentConfig(): EnvironmentConfig {
    const config = ENVIRONMENT_CONFIGS[this.currentEnv];
    if (!config) {
      logger.warn(`Unknown environment: ${this.currentEnv}, using development config`);
      return ENVIRONMENT_CONFIGS.development;
    }
    return config;
  }

  // Apply environment-specific fixes
  private applyEnvironmentFixes(): void {
    logger.info(`Applying Walrus configuration for environment: ${this.currentEnv}`, {
      useProxy: this.config.useProxy,
      maxRetries: this.config.retryPolicy.maxRetries
    });

    // Apply timeout adjustments
    this.applyTimeoutFixes();
    
    // Apply CORS fixes
    this.applyCORSFixes();
    
    // Apply retry policy
    this.applyRetryPolicyFixes();

    // Browser-specific fixes
    if (typeof window !== 'undefined') {
      this.applyBrowserFixes();
    }
  }

  // Apply timeout adjustments
  private applyTimeoutFixes(): void {
    // These would be used by the WalrusClient
    const timeouts = this.config.timeoutAdjustments;
    
    logger.debug('Applied timeout configurations', timeouts);
  }

  // Apply CORS fixes for browser environments
  private applyCORSFixes(): void {
    if (this.config.useProxy) {
      logger.info('CORS proxy enabled for Walrus requests');
    } else {
      // Set up direct CORS headers
      logger.debug('Using direct CORS headers', this.config.corsHeaders);
    }
  }

  // Apply retry policy fixes
  private applyRetryPolicyFixes(): void {
    const policy = this.config.retryPolicy;
    logger.debug('Applied retry policy', policy);
  }

  // Apply browser-specific fixes
  private applyBrowserFixes(): void {
    // Fix for Safari fetch limitations
    if (this.isSafari()) {
      this.applySafariFixes();
    }

    // Fix for Chrome CORS preflight issues
    if (this.isChrome()) {
      this.applyChromeFixes();
    }

    // Fix for Firefox security restrictions
    if (this.isFirefox()) {
      this.applyFirefoxFixes();
    }
  }

  // Safari-specific fixes
  private applySafariFixes(): void {
    logger.info('Applying Safari-specific Walrus fixes');
    // Safari has stricter CORS and fetch timeout handling
    this.config.timeoutAdjustments.upload *= 1.5;
    this.config.retryPolicy.maxRetries = Math.min(this.config.retryPolicy.maxRetries, 3);
  }

  // Chrome-specific fixes  
  private applyChromeFixes(): void {
    logger.info('Applying Chrome-specific Walrus fixes');
    // Chrome has aggressive preflight caching
    this.config.corsHeaders['Cache-Control'] = 'no-cache';
  }

  // Firefox-specific fixes
  private applyFirefoxFixes(): void {
    logger.info('Applying Firefox-specific Walrus fixes');
    // Firefox has stricter security for large uploads
    if (this.currentEnv === 'development') {
      this.config.timeoutAdjustments.upload *= 1.2;
    }
  }

  // Browser detection utilities
  private isSafari(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  private isChrome(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent);
  }

  private isFirefox(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /firefox/i.test(navigator.userAgent);
  }

  // Get upload URL with proxy if needed
  getUploadUrl(baseUrl: string): string {
    if (this.config.useProxy && this.config.proxyUrl) {
      return `${this.config.proxyUrl}/upload?target=${encodeURIComponent(baseUrl)}`;
    }
    return baseUrl;
  }

  // Get download URL with proxy if needed
  getDownloadUrl(baseUrl: string): string {
    if (this.config.useProxy && this.config.proxyUrl) {
      return `${this.config.proxyUrl}/download?target=${encodeURIComponent(baseUrl)}`;
    }
    return baseUrl;
  }

  // Get request headers for environment
  getRequestHeaders(): Record<string, string> {
    return { ...this.config.corsHeaders };
  }

  // Get timeout for operation type
  getTimeout(operation: 'upload' | 'download' | 'health'): number {
    return this.config.timeoutAdjustments[operation];
  }

  // Get retry configuration
  getRetryConfig(): { maxRetries: number; baseDelay: number; backoffMultiplier: number } {
    return { ...this.config.retryPolicy };
  }

  // Get fallback nodes for the environment
  getFallbackNodes(): string[] {
    return [...this.config.fallbackNodes];
  }

  // Track connectivity issues
  reportConnectivityIssue(component: string, error: string): void {
    const issue = `${component}: ${error}`;
    this.connectivityIssues.add(issue);
    
    logger.warn('Walrus connectivity issue reported', {
      component,
      error,
      environment: this.currentEnv
    });

    // Auto-apply fixes for common issues
    this.autoFixConnectivityIssue(component, error);
  }

  // Auto-fix common connectivity issues
  private autoFixConnectivityIssue(component: string, error: string): void {
    if (error.includes('CORS') || error.includes('cross-origin')) {
      if (!this.config.useProxy && this.currentEnv === 'production') {
        logger.info('CORS issue detected, recommending proxy usage');
      }
    }

    if (error.includes('timeout') || error.includes('slow')) {
      // Increase timeouts for this session
      Object.keys(this.config.timeoutAdjustments).forEach(key => {
        this.config.timeoutAdjustments[key as keyof typeof this.config.timeoutAdjustments] *= 1.5;
      });
      logger.info('Increased timeouts due to slow connection');
    }

    if (error.includes('certificate') || error.includes('SSL')) {
      logger.warn('SSL issue detected, may need to use HTTP fallback', {
        component,
        suggestion: 'Check Walrus network SSL configuration'
      });
    }
  }

  // Get connectivity issue summary
  getConnectivitySummary(): {
    hasIssues: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues = Array.from(this.connectivityIssues);
    const recommendations: string[] = [];

    if (issues.length === 0) {
      return {
        hasIssues: false,
        issues: [],
        recommendations: ['✅ No connectivity issues detected']
      };
    }

    // Generate recommendations based on issues
    if (issues.some(issue => issue.includes('CORS'))) {
      recommendations.push('Consider enabling proxy mode for CORS issues');
    }

    if (issues.some(issue => issue.includes('timeout'))) {
      recommendations.push('Increase timeout values for slow connections');
    }

    if (issues.some(issue => issue.includes('SSL'))) {
      recommendations.push('Check SSL certificate configuration');
    }

    return {
      hasIssues: true,
      issues,
      recommendations
    };
  }

  // Clear connectivity issues (for testing)
  clearConnectivityIssues(): void {
    this.connectivityIssues.clear();
  }

  // Get current environment info
  getEnvironmentInfo(): {
    environment: string;
    config: EnvironmentConfig;
    browser?: string;
    issues: number;
  } {
    let browser: string | undefined;
    
    if (typeof navigator !== 'undefined') {
      if (this.isSafari()) browser = 'Safari';
      else if (this.isChrome()) browser = 'Chrome';  
      else if (this.isFirefox()) browser = 'Firefox';
      else browser = 'Other';
    }

    return {
      environment: this.currentEnv,
      config: this.config,
      browser,
      issues: this.connectivityIssues.size
    };
  }
}

// Global environment manager instance
export const walrusEnvironment = new WalrusEnvironmentManager();