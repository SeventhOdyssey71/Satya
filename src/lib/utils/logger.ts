/**
 * Production-safe logger utility
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.log(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.info(...args)
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.debug(...args)
    }
  },
  
  warn: (...args: any[]) => {
    // Always log warnings
    console.warn(...args)
  },
  
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args)
  }
}

// For backwards compatibility
export const devLog = logger.log
export const devInfo = logger.info
export const devDebug = logger.debug