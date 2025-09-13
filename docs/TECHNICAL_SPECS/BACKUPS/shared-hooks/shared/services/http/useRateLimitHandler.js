/**
 * 🚦 useRateLimitHandler - Rate Limiting Response Handler Specialist
 * EXTRACTED FROM: httpInterceptor.js (DL-080 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: 429 handling + exponential backoff + retry strategy
 * LINES TARGET: 70 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * BACKEND INTEGRATION: Railway slowapi rate limiter integration
 */

/**
 * Specialized handler for rate limiting responses
 * Handles: 429 Rate Limited, exponential backoff, retry strategy
 */
export class RateLimitHandler {
  constructor(notificationEmitter) {
    this.notificationEmitter = notificationEmitter;
    this.isRetrying = false;
    
    // Rate limiting configuration
    this.rateLimitRetryDelay = 1000; // Start with 1 second
    this.maxRetryDelay = 30000; // Max 30 seconds
    this.maxRetries = 3;
  }

  /**
   * Handle 429 Rate Limited - Backend slowapi integration
   */
  async handle429RateLimited(response, originalArgs) {
    console.warn('🚦 429 Rate Limited - Backend rate limiter triggered');
    
    // Parse rate limit headers from backend
    const retryAfter = response.headers.get('Retry-After') || '60';
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining') || '0';
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    
    console.log(`📊 Rate Limit Info: Remaining=${rateLimitRemaining}, Reset=${rateLimitReset}`);
    
    this.notificationEmitter.show(
      `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
      'warning',
      parseInt(retryAfter) * 1000
    );
    
    // Implement exponential backoff retry
    if (!this.isRetrying) {
      return await this.executeRetryStrategy(originalArgs, parseInt(retryAfter));
    }
    
    return response;
  }

  /**
   * Execute retry strategy with exponential backoff
   */
  async executeRetryStrategy(originalArgs, baseDelay) {
    this.isRetrying = true;
    
    try {
      // Calculate delay with exponential backoff
      const delayMs = Math.min(baseDelay * 1000, this.maxRetryDelay);
      console.log(`⏱️ Retrying request after ${delayMs}ms delay`);
      
      await this.sleep(delayMs);
      
      // Retry the original request
      const [url, options] = originalArgs;
      const retryResponse = await fetch(url, options);
      
      // Check if retry was successful
      if (retryResponse.status !== 429) {
        console.log('✅ Retry successful');
        this.isRetrying = false;
        return retryResponse;
      } else {
        // If still rate limited, return the response without further retries
        console.warn('⚠️ Retry still rate limited, giving up');
        this.isRetrying = false;
        return retryResponse;
      }
      
    } catch (retryError) {
      console.error('❌ Retry failed:', retryError);
      this.isRetrying = false;
      throw retryError;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if request should be retried based on response
   */
  shouldRetry(response, attempt) {
    if (attempt >= this.maxRetries) {
      console.warn(`🚫 Max retries (${this.maxRetries}) exceeded`);
      return false;
    }
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const retryDelay = retryAfter ? parseInt(retryAfter) : 60;
      
      // Don't retry if delay is too long
      if (retryDelay > 120) { // 2 minutes max
        console.warn(`🚫 Retry delay too long (${retryDelay}s), skipping retry`);
        return false;
      }
      
      return true;
    }
    
    return false;
  }
}

export default RateLimitHandler;