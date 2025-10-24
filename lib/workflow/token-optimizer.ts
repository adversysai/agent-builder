/**
 * Token Usage Optimization Utilities
 */

/**
 * Optimize prompt to reduce token usage while maintaining quality
 */
export function optimizePrompt(prompt: string, maxTokens: number = 8000): string {
  if (prompt.length <= maxTokens) {
    return prompt;
  }

  // For very large content (like scraped web pages), use intelligent truncation
  if (prompt.length > 20000) { // Lower threshold for more aggressive optimization
    return optimizeLargeContent(prompt, maxTokens);
  }

  // Split into sentences for better truncation
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Keep the most important parts (first and last sentences)
  const importantSentences = [
    sentences[0], // First sentence (usually the main instruction)
    ...sentences.slice(-3), // Last 3 sentences (usually conclusions/results)
  ];

  // If still too long, truncate from the middle
  let optimized = importantSentences.join('. ');
  
  if (optimized.length > maxTokens) {
    const words = optimized.split(' ');
    const targetWords = Math.floor((maxTokens / optimized.length) * words.length);
    optimized = words.slice(0, targetWords).join(' ') + '...';
  }

  return optimized;
}

/**
 * Optimize very large content (like scraped web pages) intelligently
 */
function optimizeLargeContent(content: string, maxTokens: number): string {
  const maxChars = maxTokens * 4; // Rough character limit
  
  console.log(`🔧 Optimizing large content: ${content.length} chars → target ${maxChars} chars`);
  
  // For e-commerce content, extract only the most essential information
  const lines = content.split('\n');
  const essentialLines: string[] = [];
  
  // Much more aggressive filtering - only keep absolutely essential e-commerce data
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      // Product titles and names
      (trimmed.length > 20 && trimmed.length < 100 && 
       (trimmed.includes('Mouse') || trimmed.includes('Wireless') || trimmed.includes('Bluetooth'))) ||
      // Prices
      trimmed.includes('$') && trimmed.length < 50 ||
      // Ratings
      (trimmed.includes('stars') || trimmed.includes('rating')) && trimmed.length < 50 ||
      // Key product features
      (trimmed.includes('DPI') || trimmed.includes('battery') || trimmed.includes('rechargeable')) && trimmed.length < 100 ||
      // Reviews count
      (trimmed.includes('bought') || trimmed.includes('customers')) && trimmed.length < 50
    ) {
      essentialLines.push(trimmed);
    }
  }
  
  // If we have essential content, use it
  if (essentialLines.length > 0) {
    const optimized = essentialLines.join('\n');
    if (optimized.length <= maxChars) {
      console.log(`✅ Extracted ${essentialLines.length} essential lines: ${optimized.length} chars`);
      return optimized;
    }
  }
  
  // Ultra-aggressive fallback: take only the first 25% and last 25%
  const firstPart = content.substring(0, maxChars / 2);
  const lastPart = content.substring(content.length - maxChars / 2);
  
  const result = `${firstPart}\n\n... (content truncated) ...\n\n${lastPart}`;
  console.log(`✂️ Ultra-aggressive truncation: ${content.length} → ${result.length} chars`);
  return result;
}

/**
 * Get estimated token count (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Check if prompt is likely to exceed rate limits
 */
export function isPromptTooLong(prompt: string, contextWindow: number = 200000): boolean {
  const estimatedTokens = estimateTokenCount(prompt);
  return estimatedTokens > contextWindow * 0.8; // Use 80% of context window as threshold
}

/**
 * Add rate limiting headers to requests
 */
export function addRateLimitHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...headers,
    'X-Rate-Limit-Strategy': 'conservative',
    'X-Max-Tokens': '4096', // Limit max tokens per request
  };
}
