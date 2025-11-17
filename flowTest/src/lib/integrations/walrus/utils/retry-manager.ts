// Retry Manager for handling failures

export class RetryManager {
 constructor(
  private maxRetries: number,
  private baseDelayMs: number
 ) {}
 
 // Execute function with retry logic
 async executeWithRetry<T>(
  fn: () => Promise<T>,
  attempt: number = 1
 ): Promise<T> {
  try {
   return await fn();
  } catch (error) {
   if (attempt >= this.maxRetries) {
    throw error;
   }
   
   const delay = this.calculateDelay(attempt);
   console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
   
   await this.delay(delay);
   
   return this.executeWithRetry(fn, attempt + 1);
  }
 }
 
 // Calculate delay with exponential backoff
 private calculateDelay(attempt: number): number {
  const exponentialDelay = this.baseDelayMs * Math.pow(2, attempt - 1);
  const maxDelay = 30000; // 30 seconds max
  const jitter = Math.random() * 1000; // Add random jitter
  
  return Math.min(exponentialDelay + jitter, maxDelay);
 }
 
 // Delay helper
 private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
 }
}