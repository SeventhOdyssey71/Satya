/**
 * Enterprise-grade logging system for Satya Marketplace
 * Structured logging with security considerations
 */

export enum LogLevel {
 ERROR = 0,
 WARN = 1,
 INFO = 2,
 DEBUG = 3,
 TRACE = 4
}

export interface LogContext {
 operationId?: string;
 userId?: string;
 listingId?: string;
 purchaseId?: string;
 component?: string;
 [key: string]: any;
}

export interface LogEntry {
 timestamp: string;
 level: LogLevel;
 message: string;
 context: LogContext;
 error?: {
  name: string;
  message: string;
  stack?: string;
  code?: string;
 };
}

class Logger {
 private level: LogLevel = LogLevel.INFO;
 private sensitiveFields = new Set([
  'password', 'key', 'secret', 'token', 'signature',
  'privateKey', 'seed', 'mnemonic', 'decryptionKey'
 ]);

 constructor(level: LogLevel = LogLevel.INFO) {
  this.level = level;
 }

 setLevel(level: LogLevel): void {
  this.level = level;
 }

 private shouldLog(level: LogLevel): boolean {
  return level <= this.level;
 }

 private sanitizeContext(context: LogContext): LogContext {
  const sanitized: LogContext = {};
  
  for (const [key, value] of Object.entries(context)) {
   if (typeof key === 'string' && this.sensitiveFields.has(key.toLowerCase())) {
    sanitized[key] = '[REDACTED]';
   } else if (typeof value === 'object' && value !== null) {
    sanitized[key] = this.sanitizeObject(value);
   } else {
    sanitized[key] = value;
   }
  }
  
  return sanitized;
 }

 private sanitizeObject(obj: any): any {
  if (Array.isArray(obj)) {
   return obj.map(item => 
    typeof item === 'object' ? this.sanitizeObject(item) : item
   );
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
   if (typeof key === 'string' && this.sensitiveFields.has(key.toLowerCase())) {
    sanitized[key] = '[REDACTED]';
   } else if (typeof value === 'object' && value !== null) {
    sanitized[key] = this.sanitizeObject(value);
   } else {
    sanitized[key] = value;
   }
  }
  return sanitized;
 }

 private createLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext = {},
  error?: Error
 ): LogEntry {
  return {
   timestamp: new Date().toISOString(),
   level,
   message,
   context: this.sanitizeContext(context),
   error: error ? {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: (error as any).code
   } : undefined
  };
 }

 private output(entry: LogEntry): void {
  const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
  const levelName = levelNames[entry.level];
  
  // In production, this would go to a structured logging system
  // like CloudWatch, Datadog, or similar
  console.log(JSON.stringify({
   ...entry,
   level: levelName
  }));
 }

 error(message: string, context: LogContext = {}, error?: Error): void {
  if (this.shouldLog(LogLevel.ERROR)) {
   this.output(this.createLogEntry(LogLevel.ERROR, message, context, error));
  }
 }

 warn(message: string, context: LogContext = {}): void {
  if (this.shouldLog(LogLevel.WARN)) {
   this.output(this.createLogEntry(LogLevel.WARN, message, context));
  }
 }

 info(message: string, context: LogContext = {}): void {
  if (this.shouldLog(LogLevel.INFO)) {
   this.output(this.createLogEntry(LogLevel.INFO, message, context));
  }
 }

 debug(message: string, context: LogContext = {}): void {
  if (this.shouldLog(LogLevel.DEBUG)) {
   this.output(this.createLogEntry(LogLevel.DEBUG, message, context));
  }
 }

 trace(message: string, context: LogContext = {}): void {
  if (this.shouldLog(LogLevel.TRACE)) {
   this.output(this.createLogEntry(LogLevel.TRACE, message, context));
  }
 }

 // Performance logging
 startTimer(operationName: string, context: LogContext = {}): () => void {
  const startTime = Date.now();
  const operationId = crypto.randomUUID();
  
  this.debug(`Starting ${operationName}`, {
   ...context,
   operationId,
   operationType: 'timer_start'
  });

  return () => {
   const duration = Date.now() - startTime;
   this.info(`Completed ${operationName}`, {
    ...context,
    operationId,
    duration,
    operationType: 'timer_end'
   });
  };
 }

 // Audit logging for security-critical operations
 audit(
  action: string,
  actor: string,
  resource: string,
  context: LogContext = {}
 ): void {
  this.info(`AUDIT: ${action}`, {
   ...context,
   actor,
   resource,
   operationType: 'audit',
   timestamp: new Date().toISOString()
  });
 }

 // Security event logging
 security(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context: LogContext = {}
 ): void {
  this.warn(`SECURITY: ${event}`, {
   ...context,
   severity,
   operationType: 'security_event'
  });
 }
}

// Create default logger instance
export const logger = new Logger();

// Environment-specific configuration
const logLevel = process.env.LOG_LEVEL?.toUpperCase();
switch (logLevel) {
 case 'ERROR':
  logger.setLevel(LogLevel.ERROR);
  break;
 case 'WARN':
  logger.setLevel(LogLevel.WARN);
  break;
 case 'INFO':
  logger.setLevel(LogLevel.INFO);
  break;
 case 'DEBUG':
  logger.setLevel(LogLevel.DEBUG);
  break;
 case 'TRACE':
  logger.setLevel(LogLevel.TRACE);
  break;
 default:
  // Default to INFO in production, DEBUG in development
  logger.setLevel(
   process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
  );
}

export { Logger };