#!/usr/bin/env node

/**
 * Anthropic Rate Limit Dashboard
 * 
 * Comprehensive monitoring and management of Anthropic API rate limits
 * Based on official Anthropic documentation and best practices
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class AnthropicRateLimitMonitor {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.rateLimitHistory = [];
    this.alerts = [];
  }

  /**
   * Check current rate limit status
   */
  async checkRateLimits() {
    if (!this.apiKey) {
      console.log('❌ ANTHROPIC_API_KEY not found in environment variables');
      return null;
    }

    try {
      const response = await this.makeTestRequest();
      this.rateLimitHistory.push({
        timestamp: new Date(),
        ...response
      });

      return response;
    } catch (error) {
      console.log('❌ Error checking rate limits:', error.message);
      return null;
    }
  }

  /**
   * Make a minimal test request to get rate limit headers
   */
  makeTestRequest() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        port: 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      };

      const req = https.request(options, (res) => {
        const headers = res.headers;
        
        const rateLimitInfo = {
          timestamp: new Date().toISOString(),
          inputTokens: {
            remaining: parseInt(headers['anthropic-ratelimit-input-tokens-remaining'] || '0'),
            limit: parseInt(headers['anthropic-ratelimit-input-tokens-limit'] || '30000'),
            percentage: 0
          },
          outputTokens: {
            remaining: parseInt(headers['anthropic-ratelimit-output-tokens-remaining'] || '0'),
            limit: parseInt(headers['anthropic-ratelimit-output-tokens-limit'] || '8000'),
            percentage: 0
          },
          requests: {
            remaining: parseInt(headers['anthropic-ratelimit-requests-remaining'] || '0'),
            limit: parseInt(headers['anthropic-ratelimit-requests-limit'] || '50'),
            percentage: 0
          },
          totalTokens: {
            remaining: parseInt(headers['anthropic-ratelimit-tokens-remaining'] || '0'),
            limit: parseInt(headers['anthropic-ratelimit-tokens-limit'] || '38000'),
            percentage: 0
          },
          resetTime: headers['anthropic-ratelimit-input-tokens-reset'] || 'Unknown',
          retryAfter: parseInt(headers['retry-after'] || '0')
        };

        // Calculate percentages
        rateLimitInfo.inputTokens.percentage = Math.round((rateLimitInfo.inputTokens.remaining / rateLimitInfo.inputTokens.limit) * 100);
        rateLimitInfo.outputTokens.percentage = Math.round((rateLimitInfo.outputTokens.remaining / rateLimitInfo.outputTokens.limit) * 100);
        rateLimitInfo.requests.percentage = Math.round((rateLimitInfo.requests.remaining / rateLimitInfo.requests.limit) * 100);
        rateLimitInfo.totalTokens.percentage = Math.round((rateLimitInfo.totalTokens.remaining / rateLimitInfo.totalTokens.limit) * 100);

        resolve(rateLimitInfo);
      });

      req.on('error', reject);

      // Send minimal request
      req.write(JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      }));

      req.end();
    });
  }

  /**
   * Display rate limit status with visual indicators
   */
  displayStatus(rateLimitInfo) {
    if (!rateLimitInfo) return;

    console.log('\n🔍 Anthropic Rate Limit Dashboard');
    console.log('═'.repeat(50));
    
    // Input Tokens
    this.displayMetric('Input Tokens', rateLimitInfo.inputTokens, '📥');
    
    // Output Tokens  
    this.displayMetric('Output Tokens', rateLimitInfo.outputTokens, '📤');
    
    // Requests
    this.displayMetric('Requests', rateLimitInfo.requests, '🔄');
    
    // Total Tokens
    this.displayMetric('Total Tokens', rateLimitInfo.totalTokens, '📊');

    console.log(`\n⏰ Reset Time: ${rateLimitInfo.resetTime}`);
    
    if (rateLimitInfo.retryAfter > 0) {
      console.log(`⏳ Retry After: ${rateLimitInfo.retryAfter} seconds`);
    }

    // Recommendations
    this.displayRecommendations(rateLimitInfo);
  }

  /**
   * Display a single metric with visual indicators
   */
  displayMetric(name, metric, icon) {
    const { remaining, limit, percentage } = metric;
    const bar = this.createProgressBar(percentage);
    const status = this.getStatusIcon(percentage);
    
    console.log(`\n${icon} ${name}:`);
    console.log(`   ${status} ${remaining.toLocaleString()}/${limit.toLocaleString()} (${percentage}%)`);
    console.log(`   ${bar}`);
  }

  /**
   * Create a visual progress bar
   */
  createProgressBar(percentage) {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    return `   [${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
  }

  /**
   * Get status icon based on percentage
   */
  getStatusIcon(percentage) {
    if (percentage >= 80) return '🟢';
    if (percentage >= 50) return '🟡';
    if (percentage >= 20) return '🟠';
    return '🔴';
  }

  /**
   * Display recommendations based on current status
   */
  displayRecommendations(rateLimitInfo) {
    console.log('\n💡 Recommendations:');
    
    const critical = rateLimitInfo.inputTokens.percentage < 10 || 
                    rateLimitInfo.requests.percentage < 10;
    
    const warning = rateLimitInfo.inputTokens.percentage < 30 || 
                   rateLimitInfo.requests.percentage < 30;

    if (critical) {
      console.log('   🚨 CRITICAL: Very low rate limits remaining!');
      console.log('   • Wait for rate limit reset before running workflows');
      console.log('   • Consider using Claude Haiku 4.5 for faster, cheaper operations');
      console.log('   • Break down large workflows into smaller chunks');
    } else if (warning) {
      console.log('   ⚠️  WARNING: Rate limits are getting low');
      console.log('   • Use shorter prompts to reduce token usage');
      console.log('   • Consider batching operations together');
      console.log('   • Monitor usage before running large workflows');
    } else {
      console.log('   ✅ Rate limits are healthy');
      console.log('   • You can run workflows normally');
      console.log('   • Consider optimizing prompts for efficiency');
    }

    // Specific recommendations
    if (rateLimitInfo.inputTokens.percentage < 50) {
      console.log('   📝 Input tokens low - use more concise prompts');
    }
    
    if (rateLimitInfo.requests.percentage < 50) {
      console.log('   🔄 Requests low - batch operations together');
    }

    console.log('\n🛠️  Optimization Tips:');
    console.log('   • Use Claude Haiku 4.5 for simple tasks (faster, cheaper)');
    console.log('   • Use Claude Sonnet 4.5 for complex reasoning');
    console.log('   • Implement token bucket rate limiting in your app');
    console.log('   • Monitor rate limits before running large workflows');
  }

  /**
   * Save rate limit history to file
   */
  saveHistory() {
    const historyFile = path.join(__dirname, 'rate-limit-history.json');
    fs.writeFileSync(historyFile, JSON.stringify(this.rateLimitHistory, null, 2));
    console.log(`\n📁 Rate limit history saved to: ${historyFile}`);
  }

  /**
   * Run continuous monitoring
   */
  async startMonitoring(intervalMinutes = 5) {
    console.log(`🔄 Starting continuous monitoring (every ${intervalMinutes} minutes)`);
    console.log('Press Ctrl+C to stop\n');

    const interval = setInterval(async () => {
      console.log(`\n⏰ ${new Date().toLocaleString()}`);
      const rateLimitInfo = await this.checkRateLimits();
      this.displayStatus(rateLimitInfo);
    }, intervalMinutes * 60 * 1000);

    // Initial check
    const rateLimitInfo = await this.checkRateLimits();
    this.displayStatus(rateLimitInfo);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      clearInterval(interval);
      this.saveHistory();
      console.log('\n👋 Monitoring stopped. Goodbye!');
      process.exit(0);
    });
  }
}

// Main execution
async function main() {
  const monitor = new AnthropicRateLimitMonitor();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'monitor':
      const interval = parseInt(args[1]) || 5;
      await monitor.startMonitoring(interval);
      break;
    
    case 'check':
    default:
      const rateLimitInfo = await monitor.checkRateLimits();
      monitor.displayStatus(rateLimitInfo);
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AnthropicRateLimitMonitor;
