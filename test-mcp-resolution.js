#!/usr/bin/env node

/**
 * Test MCP Server Resolution
 * 
 * Tests if MCP server resolution is working
 */

require('dotenv').config({ path: '.env.local' });

async function testMCPResolution() {
  console.log('🧪 Testing MCP Server Resolution...\n');
  
  try {
    const { resolveMCPServer } = require('./lib/mcp/resolver.ts');
    
    const serverId = '0bc793a1-f4ed-46d9-a8d5-8fd860ff1743';
    
    console.log('🔍 Resolving MCP server ID:', serverId);
    
    const resolvedServer = await resolveMCPServer(serverId);
    
    if (resolvedServer) {
      console.log('✅ MCP server resolved successfully:');
      console.log(JSON.stringify(resolvedServer, null, 2));
    } else {
      console.log('❌ MCP server resolution failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMCPResolution();
