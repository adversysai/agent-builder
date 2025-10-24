#!/usr/bin/env node

/**
 * Check Anthropic Rate Limits
 * 
 * This script helps you monitor your current rate limit usage
 * and provides recommendations for avoiding rate limits.
 */

const https = require('https');

async function checkRateLimits() {
  console.log('🔍 Checking Anthropic rate limits...\n');
  
  // Check if API key is available
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('❌ ANTHROPIC_API_KEY not found in environment variables');
    console.log('   Please add your Anthropic API key to .env.local');
    return;
  }
  
  console.log('✅ Anthropic API key found');
  console.log(`   Key: ${apiKey.substring(0, 10)}...`);
  
  // Make a test request to check current usage
  try {
    const response = await makeTestRequest(apiKey);
    console.log('\n📊 Current Rate Limit Status:');
    console.log(`   Input Tokens: ${response.remainingInputTokens}/${response.limitInputTokens} (${Math.round(response.remainingInputTokens/response.limitInputTokens*100)}% remaining)`);
    console.log(`   Output Tokens: ${response.remainingOutputTokens}/${response.limitOutputTokens} (${Math.round(response.remainingOutputTokens/response.limitOutputTokens*100)}% remaining)`);
    console.log(`   Requests: ${response.remainingRequests}/${response.limitRequests} (${Math.round(response.remainingRequests/response.limitRequests*100)}% remaining)`);
    console.log(`   Total Tokens: ${response.totalTokensRemaining}/${response.totalTokensLimit} (${Math.round(response.totalTokensRemaining/response.totalTokensLimit*100)}% remaining)`);
    console.log(`   Reset Time: ${response.resetTime}`);
    
    // Provide recommendations
    console.log('\n💡 Recommendations:');
    
    if (response.remainingInputTokens < 5000) {
      console.log('   ⚠️  Low input tokens remaining - consider using shorter prompts');
    }
    
    if (response.remainingRequests < 10) {
      console.log('   ⚠️  Low requests remaining - consider batching operations');
    }
    
    if (response.remainingInputTokens < 1000) {
      console.log('   🚨 Very low tokens - wait for reset before running workflows');
    }
    
    console.log('\n🛠️  To avoid rate limits:');
    console.log('   1. Use shorter prompts when possible');
    console.log('   2. Batch multiple operations together');
    console.log('   3. Consider using Claude Haiku 4.5 for faster, cheaper operations');
    console.log('   4. Wait for rate limit reset before retrying failed workflows');
    
  } catch (error) {
    console.log('❌ Error checking rate limits:', error.message);
  }
}

function makeTestRequest(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    };
    
    const req = https.request(options, (res) => {
      const headers = res.headers;
      
      resolve({
        remainingInputTokens: parseInt(headers['anthropic-ratelimit-input-tokens-remaining'] || '0'),
        limitInputTokens: parseInt(headers['anthropic-ratelimit-input-tokens-limit'] || '30000'),
        remainingOutputTokens: parseInt(headers['anthropic-ratelimit-output-tokens-remaining'] || '8000'),
        limitOutputTokens: parseInt(headers['anthropic-ratelimit-output-tokens-limit'] || '8000'),
        remainingRequests: parseInt(headers['anthropic-ratelimit-requests-remaining'] || '50'),
        limitRequests: parseInt(headers['anthropic-ratelimit-requests-limit'] || '50'),
        totalTokensRemaining: parseInt(headers['anthropic-ratelimit-tokens-remaining'] || '0'),
        totalTokensLimit: parseInt(headers['anthropic-ratelimit-tokens-limit'] || '38000'),
        resetTime: headers['anthropic-ratelimit-input-tokens-reset'] || 'Unknown'
      });
    });
    
    req.on('error', reject);
    
    // Send a minimal test request
    req.write(JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    }));
    
    req.end();
  });
}

// Run the check
checkRateLimits().catch(console.error);
