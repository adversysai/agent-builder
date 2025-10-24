/**
 * Rate Limiting Utilities for LLM API Calls
 */

interface RateLimitInfo {
  retryAfter: number;
  resetTime: string;
  remainingTokens: number;
  limitTokens: number;
  outputTokensRemaining?: number;
  outputTokensLimit?: number;
  requestsRemaining?: number;
  requestsLimit?: number;
  totalTokensRemaining?: number;
  totalTokensLimit?: number;
}

/**
 * Extract rate limit information from error response
 * Based on Anthropic's official rate limit headers
 */
export function extractRateLimitInfo(error: any): RateLimitInfo | null {
  if (!error?.headers) return null;

  const headers = error.headers;
  
  // Extract all Anthropic rate limit headers
  const inputTokensRemaining = parseInt(headers.get?.('anthropic-ratelimit-input-tokens-remaining') || '0');
  const inputTokensLimit = parseInt(headers.get?.('anthropic-ratelimit-input-tokens-limit') || '30000');
  const outputTokensRemaining = parseInt(headers.get?.('anthropic-ratelimit-output-tokens-remaining') || '0');
  const outputTokensLimit = parseInt(headers.get?.('anthropic-ratelimit-output-tokens-limit') || '8000');
  const requestsRemaining = parseInt(headers.get?.('anthropic-ratelimit-requests-remaining') || '0');
  const requestsLimit = parseInt(headers.get?.('anthropic-ratelimit-requests-limit') || '50');
  
  return {
    retryAfter: parseInt(headers.get?.('retry-after') || '60'),
    resetTime: headers.get?.('anthropic-ratelimit-input-tokens-reset') || '',
    remainingTokens: inputTokensRemaining,
    limitTokens: inputTokensLimit,
    // Additional rate limit info
    outputTokensRemaining,
    outputTokensLimit,
    requestsRemaining,
    requestsLimit,
    totalTokensRemaining: parseInt(headers.get?.('anthropic-ratelimit-tokens-remaining') || '0'),
    totalTokensLimit: parseInt(headers.get?.('anthropic-ratelimit-tokens-limit') || '38000')
  };
}

/**
 * Calculate wait time with exponential backoff
 */
export function calculateWaitTime(attempt: number, baseDelay: number = 1000): number {
  // Exponential backoff: baseDelay * 2^attempt, max 5 minutes
  const maxDelay = 5 * 60 * 1000; // 5 minutes
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 1000;
  
  return delay + jitter;
}

/**
 * Check if we should retry based on rate limit info
 */
export function shouldRetry(rateLimitInfo: RateLimitInfo, maxRetries: number = 3): boolean {
  if (!rateLimitInfo) return false;
  
  // Don't retry if we've exceeded max retries
  if (maxRetries <= 0) return false;
  
  // Don't retry if we have no remaining tokens and reset time is far away
  if (rateLimitInfo.remainingTokens === 0) {
    const resetTime = new Date(rateLimitInfo.resetTime);
    const now = new Date();
    const timeUntilReset = resetTime.getTime() - now.getTime();
    
    // If reset time is more than 5 minutes away, don't retry
    if (timeUntilReset > 5 * 60 * 1000) return false;
  }
  
  return true;
}

/**
 * Get user-friendly rate limit message
 */
export function getRateLimitMessage(rateLimitInfo: RateLimitInfo): string {
  if (!rateLimitInfo) {
    return 'Rate limited. Please wait a moment and try again.';
  }

  const { retryAfter, remainingTokens, limitTokens, resetTime } = rateLimitInfo;
  
  if (remainingTokens === 0) {
    const resetDate = new Date(resetTime);
    const now = new Date();
    const minutesUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60));
    
    return `Rate limit exceeded. You've used all ${limitTokens.toLocaleString()} tokens. Please wait ${minutesUntilReset} minutes until the limit resets at ${resetDate.toLocaleTimeString()}.`;
  }
  
  return `Rate limited. ${remainingTokens.toLocaleString()} tokens remaining. Please wait ${retryAfter} seconds before retrying.`;
}
