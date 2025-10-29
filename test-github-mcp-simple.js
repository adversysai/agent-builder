#!/usr/bin/env node

/**
 * Simple GitHub MCP Test
 * 
 * Tests if GitHub MCP executor is working correctly
 */

require('dotenv').config({ path: '.env.local' });

async function testGitHubMCPSimple() {
  console.log('🧪 Testing GitHub MCP Simple...\n');
  
  try {
    // Test GitHub MCP executor directly
    const { executeGitHubMCPNode } = require('./lib/workflow/executors/github-mcp.ts');
    
    const testNode = {
      data: {
        mcpAction: 'search_code',
        mcpParams: {
          q: 'openai',
          per_page: 5
        }
      }
    };
    
    const testState = {
      variables: {}
    };
    
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log('❌ GITHUB_TOKEN not found');
      return;
    }
    
    console.log('✅ GITHUB_TOKEN found');
    console.log('🔍 Testing GitHub MCP executor...');
    
    const result = await executeGitHubMCPNode(testNode, testState, githubToken);
    
    if (result.success) {
      console.log('✅ GitHub MCP executor working!');
      console.log('📊 Results:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ GitHub MCP executor failed');
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGitHubMCPSimple();
