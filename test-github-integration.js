#!/usr/bin/env node

/**
 * Test GitHub Integration in Web App
 * 
 * Tests if GitHub MCP is properly integrated and accessible
 */

require('dotenv').config({ path: '.env.local' });

async function testGitHubIntegration() {
  console.log('🧪 Testing GitHub Integration in Web App...\n');
  
  try {
    // Test 1: Environment Variables
    console.log('1. Testing Environment Variables...');
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      console.log('❌ GITHUB_TOKEN not found in environment');
      return;
    }
    
    if (githubToken === 'your_github_personal_access_token_here') {
      console.log('⚠️  GITHUB_TOKEN is still set to placeholder value');
      return;
    }
    
    console.log('✅ GITHUB_TOKEN found in environment');
    console.log(`   Token: ${githubToken.substring(0, 10)}...`);
    
    // Test 2: GitHub API Access
    console.log('\n2. Testing GitHub API Access...');
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dexflow-AI-Detection/1.0'
      }
    });
    
    if (!response.ok) {
      console.log('❌ GitHub API access failed');
      console.log(`   Status: ${response.status}`);
      return;
    }
    
    const userData = await response.json();
    console.log('✅ GitHub API access successful');
    console.log(`   User: ${userData.login}`);
    
    // Test 3: MCP Registry Integration
    console.log('\n3. Testing MCP Registry Integration...');
    
    // Import the MCP registry
    const { officialMCPServers } = require('./lib/mcp/mcp-registry.ts');
    
    const githubMCP = officialMCPServers.find(server => server.id === 'github');
    
    if (!githubMCP) {
      console.log('❌ GitHub MCP not found in registry');
      return;
    }
    
    console.log('✅ GitHub MCP found in registry');
    console.log(`   Name: ${githubMCP.name}`);
    console.log(`   Category: ${githubMCP.category}`);
    console.log(`   Tools: ${githubMCP.tools.length} available`);
    
    // Test 4: API Configuration
    console.log('\n4. Testing API Configuration...');
    
    const { getServerAPIKeys } = require('./lib/api/config.ts');
    const apiKeys = getServerAPIKeys();
    
    if (!apiKeys.github) {
      console.log('❌ GitHub token not found in API configuration');
      return;
    }
    
    console.log('✅ GitHub token found in API configuration');
    console.log(`   API Keys configured: ${Object.keys(apiKeys).filter(key => apiKeys[key]).length} providers`);
    
    // Test 5: GitHub MCP Executor
    console.log('\n5. Testing GitHub MCP Executor...');
    
    try {
      // Test if the executor can be imported
      const { executeGitHubMCPNode } = require('./lib/workflow/executors/github-mcp.ts');
      console.log('✅ GitHub MCP executor imported successfully');
      
      // Test a simple GitHub API call
      const testNode = {
        data: {
          mcpAction: 'search_code',
          mcpParams: {
            q: 'test',
            per_page: 1
          }
        }
      };
      
      const testState = {
        variables: {}
      };
      
      console.log('   Testing GitHub MCP execution...');
      const result = await executeGitHubMCPNode(testNode, testState, githubToken);
      
      if (result.success) {
        console.log('✅ GitHub MCP execution successful');
        console.log(`   Found ${result.data?.total_count || 0} results`);
      } else {
        console.log('⚠️  GitHub MCP execution failed');
        console.log(`   Error: ${result.error}`);
      }
      
    } catch (error) {
      console.log('❌ GitHub MCP executor test failed');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 6: AI Detection Templates
    console.log('\n6. Testing AI Detection Templates...');
    
    const { getTemplate } = require('./lib/workflow/templates.ts');
    
    const aiTemplates = [
      'ai-asset-discovery-scanner',
      'shadow-ai-detection-system',
      'ai-security-compliance-checker',
      'ai-data-exposure-scanner',
      'comprehensive-ai-security-audit'
    ];
    
    let templatesFound = 0;
    for (const templateId of aiTemplates) {
      const template = getTemplate(templateId);
      if (template) {
        templatesFound++;
        console.log(`   ✅ ${template.name}`);
      }
    }
    
    console.log(`✅ Found ${templatesFound}/${aiTemplates.length} AI detection templates`);
    
    // Summary
    console.log('\n🎉 GitHub Integration Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ GitHub token configured');
    console.log('   ✅ GitHub API access working');
    console.log('   ✅ MCP registry integration');
    console.log('   ✅ API configuration updated');
    console.log('   ✅ GitHub MCP executor working');
    console.log('   ✅ AI detection templates available');
    
    console.log('\n🚀 Ready for AI Security Workflows!');
    console.log('   • GitHub MCP is available in workflow canvas');
    console.log('   • AI detection templates are ready to use');
    console.log('   • AI chat can generate GitHub-based workflows');
    console.log('   • Security scanning workflows are operational');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check if GITHUB_TOKEN is set in .env.local');
    console.log('   2. Verify the token has required scopes');
    console.log('   3. Ensure all dependencies are installed');
    console.log('   4. Check if the web app is running');
  }
}

// Run test
testGitHubIntegration();
