// Walrus Connectivity Monitoring and Health Management

import { WalrusNetworkDiagnostics, NetworkHealth } from '../diagnostics/network-diagnostics';
import { WalrusConnectivityTester, ConnectivityTestResult } from '../tests/connectivity-test';
import { walrusEnvironment } from '../config/environment-specific';
import { logger } from '../../core/logger';

export interface MonitoringConfig {
  healthCheckInterval: number;
  testInterval: number;
  alertThreshold: number;
  autoRepair: boolean;
}

export interface ConnectivityAlert {
  level: 'info' | 'warning' | 'critical';
  component: string;
  message: string;
  timestamp: number;
  resolved?: boolean;
}

export class WalrusConnectivityMonitor {
  private diagnostics: WalrusNetworkDiagnostics;
  private tester: WalrusConnectivityTester;
  private config: MonitoringConfig;
  private isMonitoring: boolean = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private testInterval?: NodeJS.Timeout;
  private alerts: ConnectivityAlert[] = [];
  private lastHealthCheck?: NetworkHealth;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.diagnostics = new WalrusNetworkDiagnostics();
    this.tester = new WalrusConnectivityTester();
    this.config = {
      healthCheckInterval: 30000,  // 30 seconds
      testInterval: 300000,       // 5 minutes
      alertThreshold: 3,          // 3 failures before alert
      autoRepair: true,
      ...config
    };
  }

  // Start continuous monitoring
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Connectivity monitoring already running');
      return;
    }

    logger.info('Starting Walrus connectivity monitoring', this.config);

    this.isMonitoring = true;

    // Run initial diagnostic
    await this.runHealthCheck();

    // Schedule periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.runHealthCheck();
      } catch (error) {
        logger.error('Health check failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.config.healthCheckInterval);

    // Schedule periodic full tests
    this.testInterval = setInterval(async () => {
      try {
        await this.runConnectivityTests();
      } catch (error) {
        logger.error('Connectivity tests failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.config.testInterval);

    logger.info('Walrus connectivity monitoring started');
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    logger.info('Stopping Walrus connectivity monitoring');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = undefined;
    }

    this.isMonitoring = false;
    logger.info('Walrus connectivity monitoring stopped');
  }

  // Run network health check
  private async runHealthCheck(): Promise<NetworkHealth> {
    logger.debug('Running Walrus health check');

    try {
      const health = await this.diagnostics.runDiagnostics();
      this.lastHealthCheck = health;

      // Process health results
      await this.processHealthResults(health);

      return health;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Health check failed', { error: errorMessage });
      
      this.createAlert('critical', 'Health Check', `Health check failed: ${errorMessage}`);
      throw error;
    }
  }

  // Run connectivity tests
  private async runConnectivityTests(): Promise<ConnectivityTestResult[]> {
    logger.debug('Running Walrus connectivity tests');

    try {
      const results = await this.tester.runAllTests();
      
      // Process test results
      await this.processTestResults(results);

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Connectivity tests failed', { error: errorMessage });
      
      this.createAlert('critical', 'Connectivity Tests', `Tests failed: ${errorMessage}`);
      throw error;
    }
  }

  // Process health check results
  private async processHealthResults(health: NetworkHealth): Promise<void> {
    // Check for critical issues
    const criticalComponents = health.components.filter(c => c.status === 'failed');
    const degradedComponents = health.components.filter(c => c.status === 'degraded');

    // Create alerts for new issues
    for (const component of criticalComponents) {
      if (!this.hasRecentAlert(component.component, 'critical')) {
        this.createAlert('critical', component.component, component.error || 'Component failed');
      }
    }

    for (const component of degradedComponents) {
      if (!this.hasRecentAlert(component.component, 'warning')) {
        this.createAlert('warning', component.component, component.error || 'Component degraded');
      }
    }

    // Auto-repair if enabled
    if (this.config.autoRepair && (criticalComponents.length > 0 || degradedComponents.length > 0)) {
      await this.attemptAutoRepair();
    }

    // Log health summary
    logger.info('Health check completed', {
      overall: health.overall,
      criticalIssues: criticalComponents.length,
      degradedIssues: degradedComponents.length,
      recommendations: health.recommendations.length
    });
  }

  // Process connectivity test results
  private async processTestResults(results: ConnectivityTestResult[]): Promise<void> {
    const failedTests = results.filter(r => !r.success);
    const passedTests = results.filter(r => r.success);

    logger.info('Connectivity tests completed', {
      total: results.length,
      passed: passedTests.length,
      failed: failedTests.length
    });

    // Create alerts for failed tests
    for (const test of failedTests) {
      if (!this.hasRecentAlert(test.testName, 'warning')) {
        this.createAlert('warning', test.testName, test.error || 'Test failed');
      }
    }

    // Resolve alerts for now-passing tests
    for (const test of passedTests) {
      this.resolveAlert(test.testName);
    }
  }

  // Attempt automatic repair
  private async attemptAutoRepair(): Promise<void> {
    logger.info('Attempting automatic repair of connectivity issues');

    try {
      const repairResult = await this.diagnostics.attemptAutoRepair();
      
      logger.info('Auto-repair completed', repairResult);

      if (repairResult.successful.length > 0) {
        this.createAlert('info', 'Auto-Repair', `Successfully repaired: ${repairResult.successful.join(', ')}`);
      }

      if (repairResult.failed.length > 0) {
        this.createAlert('warning', 'Auto-Repair', `Failed to repair: ${repairResult.failed.join(', ')}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Auto-repair failed', { error: errorMessage });
      this.createAlert('warning', 'Auto-Repair', `Auto-repair failed: ${errorMessage}`);
    }
  }

  // Create alert
  private createAlert(level: 'info' | 'warning' | 'critical', component: string, message: string): void {
    const alert: ConnectivityAlert = {
      level,
      component,
      message,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.push(alert);

    const logLevel = level === 'critical' ? 'error' : level === 'warning' ? 'warn' : 'info';
    logger[logLevel](`Connectivity alert: ${message}`, { component, level });

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  // Check if there's a recent alert for component
  private hasRecentAlert(component: string, level: string): boolean {
    const recentTime = Date.now() - (5 * 60 * 1000); // 5 minutes
    return this.alerts.some(alert => 
      alert.component === component &&
      alert.level === level &&
      alert.timestamp > recentTime &&
      !alert.resolved
    );
  }

  // Resolve alert
  private resolveAlert(component: string): void {
    const unresolvedAlerts = this.alerts.filter(alert => 
      alert.component === component && !alert.resolved
    );

    for (const alert of unresolvedAlerts) {
      alert.resolved = true;
      logger.info(`Resolved connectivity alert for ${component}`);
    }
  }

  // Get current monitoring status
  getStatus(): {
    isMonitoring: boolean;
    lastHealthCheck?: NetworkHealth;
    activeAlerts: ConnectivityAlert[];
    config: MonitoringConfig;
  } {
    return {
      isMonitoring: this.isMonitoring,
      lastHealthCheck: this.lastHealthCheck,
      activeAlerts: this.alerts.filter(alert => !alert.resolved),
      config: this.config
    };
  }

  // Get connectivity summary
  async getConnectivitySummary(): Promise<{
    health: NetworkHealth;
    environmentInfo: any;
    alerts: ConnectivityAlert[];
    recommendations: string[];
  }> {
    const health = this.lastHealthCheck || await this.runHealthCheck();
    const environmentInfo = walrusEnvironment.getEnvironmentInfo();
    const envSummary = walrusEnvironment.getConnectivitySummary();

    const recommendations = [
      ...health.recommendations,
      ...envSummary.recommendations
    ];

    return {
      health,
      environmentInfo,
      alerts: this.alerts.filter(alert => !alert.resolved).slice(-10), // Last 10 unresolved
      recommendations
    };
  }

  // Force health check
  async forceHealthCheck(): Promise<NetworkHealth> {
    logger.info('Forcing immediate health check');
    return await this.runHealthCheck();
  }

  // Force connectivity tests
  async forceConnectivityTests(): Promise<ConnectivityTestResult[]> {
    logger.info('Forcing immediate connectivity tests');
    return await this.runConnectivityTests();
  }

  // Clear all alerts
  clearAlerts(): void {
    logger.info('Clearing all connectivity alerts');
    this.alerts = [];
  }

  // Get monitoring metrics
  getMetrics(): {
    uptime: number;
    totalAlerts: number;
    criticalAlerts: number;
    lastHealthCheck: number;
    isHealthy: boolean;
  } {
    const now = Date.now();
    const criticalAlerts = this.alerts.filter(a => a.level === 'critical' && !a.resolved).length;
    
    return {
      uptime: this.isMonitoring ? now - (this.alerts[0]?.timestamp || now) : 0,
      totalAlerts: this.alerts.length,
      criticalAlerts,
      lastHealthCheck: this.lastHealthCheck?.timestamp || 0,
      isHealthy: this.lastHealthCheck?.overall === 'healthy' && criticalAlerts === 0
    };
  }
}

// Global connectivity monitor instance
export const walrusConnectivityMonitor = new WalrusConnectivityMonitor();