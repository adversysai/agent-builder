/**
 * Token Bucket Rate Limiter
 * 
 * Implements proactive rate limiting to prevent hitting Anthropic's rate limits
 * Based on Anthropic's official recommendations for rate limit management
 */

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly tokensPerSecond: number;
  private readonly maxTokens: number;
  private readonly lock: boolean = false;

  constructor(
    tokensPerSecond: number = 5, // Conservative: 5 requests per second
    maxTokens: number = 10 // Allow burst of 10 requests
  ) {
    this.tokensPerSecond = tokensPerSecond;
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // Convert to seconds
    const newTokens = elapsed * this.tokensPerSecond;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  /**
   * Try to consume a token
   * @returns true if token was consumed, false if bucket is empty
   */
  public tryConsume(): boolean {
    this.refillTokens();
    
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    
    return false;
  }

  /**
   * Wait for a token to become available
   * @param timeoutMs Maximum time to wait in milliseconds
   * @returns Promise that resolves when token is available
   */
  public async waitForToken(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (this.tryConsume()) {
        return true;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  /**
   * Get current token count
   */
  public getTokenCount(): number {
    this.refillTokens();
    return this.tokens;
  }

  /**
   * Get time until next token is available
   */
  public getTimeUntilNextToken(): number {
    this.refillTokens();
    
    if (this.tokens >= 1) {
      return 0;
    }
    
    return (1 - this.tokens) / this.tokensPerSecond * 1000; // Convert to milliseconds
  }
}

/**
 * Global token bucket instance for Anthropic API
 * Conservative settings to prevent rate limiting
 */
export const anthropicTokenBucket = new TokenBucket(
  3, // 3 requests per second (very conservative)
  5  // Allow burst of 5 requests
);

/**
 * Rate limiter for different providers
 */
export class ProviderRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();

  constructor() {
    // Initialize rate limiters for each provider
    this.buckets.set('anthropic', new TokenBucket(3, 5)); // Conservative
    this.buckets.set('openai', new TokenBucket(10, 20)); // More generous
    this.buckets.set('groq', new TokenBucket(15, 30)); // Most generous
  }

  /**
   * Get rate limiter for a specific provider
   */
  public getBucket(provider: string): TokenBucket {
    return this.buckets.get(provider) || this.buckets.get('anthropic')!;
  }

  /**
   * Wait for rate limit token for a specific provider
   */
  public async waitForToken(provider: string, timeoutMs: number = 30000): Promise<boolean> {
    const bucket = this.getBucket(provider);
    return await bucket.waitForToken(timeoutMs);
  }
}

// Global rate limiter instance
export const providerRateLimiter = new ProviderRateLimiter();
