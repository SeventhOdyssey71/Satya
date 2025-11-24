/**
 * Production-safe logger utility
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.log(message, ...args)
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.info(message, ...args)
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.debug(message, ...args)
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    // Always log warnings
    console.warn(message, ...args)
  },
  
  error: (message: string, ...args: any[]) => {
    // Always log errors
    console.error(message, ...args)
  }
}

// For backwards compatibility
export const devLog = logger.log
export const devInfo = logger.info
export const devDebug = logger.debug