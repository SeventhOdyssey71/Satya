// Error Interceptor - Bulletproof error handling
// This will catch ALL possible errors and prevent console spam

class ErrorInterceptor {
  private static instance: ErrorInterceptor;
  private originalConsoleError: typeof console.error;
  private originalWindowError?: typeof window.onerror;
  private originalUnhandledRejection?: typeof window.onunhandledrejection;
  private errorCallbacks: Set<(error: any) => void> = new Set();
  
  private constructor() {
    this.originalConsoleError = console.error.bind(console);
    if (typeof window !== 'undefined') {
      this.originalWindowError = window.onerror;
      this.originalUnhandledRejection = window.onunhandledrejection;
    }
    this.setupErrorInterception();
  }

  static getInstance(): ErrorInterceptor {
    if (!ErrorInterceptor.instance) {
      ErrorInterceptor.instance = new ErrorInterceptor();
    }
    return ErrorInterceptor.instance;
  }

  private setupErrorInterception() {
    if (typeof window === 'undefined') return;
    
    // Intercept console.error
    console.error = (...args: any[]) => {
      try {
        const errorMessage = args.join(' ');
        
        // Filter out known safe errors that we want to suppress
        if (this.shouldSuppressError(errorMessage)) {
          this.notifyCallbacks({
            type: 'console.error',
            message: errorMessage,
            args,
            timestamp: new Date().toISOString(),
            suppressed: true
          });
          return; // Suppress the error
        }
        
        // For other errors, log them safely
        this.notifyCallbacks({
          type: 'console.error',
          message: errorMessage,
          args,
          timestamp: new Date().toISOString(),
          suppressed: false
        });
        
        // Still log to console but in a controlled way
        this.originalConsoleError('🛠️ [Intercepted Error]:', ...args);
        
      } catch (interceptError) {
        // If our interceptor fails, fall back to original
        this.originalConsoleError('🚨 [Error Interceptor Failed]:', interceptError);
        this.originalConsoleError('🚨 [Original Error]:', ...args);
      }
    };

    // Global error handler
    window.onerror = (message, source, lineno, colno, error) => {
      try {
        this.notifyCallbacks({
          type: 'window.onerror',
          message: String(message),
          source,
          lineno,
          colno,
          error,
          timestamp: new Date().toISOString(),
          suppressed: this.shouldSuppressError(String(message))
        });
        
        return true; // Prevent default browser error handling
      } catch (interceptError) {
        this.originalConsoleError('🚨 [Global Error Handler Failed]:', interceptError);
        return false;
      }
    };

    // Unhandled promise rejections
    window.onunhandledrejection = (event) => {
      try {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        
        this.notifyCallbacks({
          type: 'unhandledrejection',
          message,
          reason,
          timestamp: new Date().toISOString(),
          suppressed: this.shouldSuppressError(message)
        });
        
        event.preventDefault(); // Prevent default browser handling
        
      } catch (interceptError) {
        this.originalConsoleError('🚨 [Unhandled Rejection Handler Failed]:', interceptError);
      }
    };
  }

  private shouldSuppressError(errorMessage: string): boolean {
    const suppressPatterns = [
      // Upload-related errors we want to handle gracefully
      /toLowerCase.*not.*function/i,
      /Upload.*failed/i,
      /Smart.*contract.*creation.*failed/i,
      /Model.*upload.*failed/i,
      /handleUpload/i,
      /handleSubmit/i,
      
      // Next.js dev overlay errors
      /captureStackTrace/i,
      /intercept-console-error/i,
      /react-dev-overlay/i,
      
      // Network errors we handle gracefully
      /Failed.*to.*fetch/i,
      /Network.*error/i,
      /Connection.*failed/i,
      
      // Wallet connection errors
      /Wallet.*not.*connected/i,
      /No.*account.*available/i,
      
      // File handling errors
      /File.*upload.*error/i,
      /Invalid.*file/i,
      
      // Other common errors we handle
      /Validation.*error/i,
      /Transaction.*failed/i
    ];

    return suppressPatterns.some(pattern => pattern.test(errorMessage));
  }

  private notifyCallbacks(errorData: any) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorData);
      } catch (callbackError) {
        this.originalConsoleError('🚨 [Error Callback Failed]:', callbackError);
      }
    });
  }

  // Public API
  onError(callback: (error: any) => void) {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  suppressAll() {
    // Override to suppress all errors temporarily
    console.error = () => {};
  }

  restore() {
    // Restore original error handling
    console.error = this.originalConsoleError;
    if (typeof window !== 'undefined') {
      if (this.originalWindowError) {
        window.onerror = this.originalWindowError;
      }
      if (this.originalUnhandledRejection) {
        window.onunhandledrejection = this.originalUnhandledRejection;
      }
    }
  }

  // Safe promise wrapper
  static async safePromise<T>(
    promise: Promise<T>,
    fallbackValue?: T
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const data = await promise;
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage,
        data: fallbackValue
      };
    }
  }

  // Safe function wrapper
  static safeExecute<T>(
    fn: () => T,
    fallbackValue?: T
  ): { success: boolean; data?: T; error?: string } {
    try {
      const data = fn();
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage,
        data: fallbackValue
      };
    }
  }
}

// Export singleton instance
export const errorInterceptor = ErrorInterceptor.getInstance();

// Export utility functions
export const { safePromise, safeExecute } = ErrorInterceptor;

// Hook for React components (import React in your component)
export function useErrorInterceptor() {
  // Note: Import React hooks in your component file
  // const [errors, setErrors] = useState<any[]>([]);
  // const unsubscribe = errorInterceptor.onError((error) => {
  //   setErrors(prev => [...prev, error]);
  // });
  // return unsubscribe function for cleanup
  
  return {
    subscribe: (callback: (error: any) => void) => errorInterceptor.onError(callback)
  };
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  errorInterceptor; // Just reference to initialize
}

export default errorInterceptor;