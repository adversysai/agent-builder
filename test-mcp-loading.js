#!/usr/bin/env node

/**
 * Test MCP Server Loading
 * 
 * Tests if MCP servers are being loaded correctly
 */

require('dotenv').config({ path: '.env.local' });

async function testMCPLoading() {
  console.log('🧪 Testing MCP Server Loading...\n');
  
  try {
    // Test MCP server loading
    const { getMCPServer } = require('./lib/workflow/storage.ts');
    
    const userId = 'user_34R0Sgld0BQDul6XWZvwYLy0Zot';
    
    console.log('🔍 Loading MCP servers for user:', userId);
    
    const mcpServers = await getMCPServer(userId);
    
    console.log('📋 MCP Servers loaded:');
    mcpServers.forEach(server => {
      console.log(`  - ${server.name} (${server.url}) [${server.authType}]`);
    });
    
    // Check if GitHub MCP is in the list
    const githubServer = mcpServers.find(server => 
      server.name.toLowerCase().includes('github') || 
      server.url?.includes('api.github.com')
    );
    
    if (githubServer) {
      console.log('✅ GitHub MCP server found:', githubServer.name);
    } else {
      console.log('❌ GitHub MCP server not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMCPLoading();
