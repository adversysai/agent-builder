#!/usr/bin/env node

/**
 * Add GitHub MCP Server to User Account
 * 
 * Adds the GitHub MCP server to the user's MCP servers list
 */

const userId = 'user_34R0Sgld0BQDul6XWZvwYLy0Zot'; // From the API logs

async function addGitHubMCPToUser() {
  console.log('🔧 Adding GitHub MCP Server to User Account...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/database/mcp-servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'add',
        userId: userId,
        name: 'GitHub',
        description: 'GitHub repository management, code search, and security analysis',
        url: 'https://api.github.com'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Failed to add GitHub MCP server');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log('✅ GitHub MCP server added successfully!');
    console.log(`   ID: ${result.id}`);
    console.log(`   Name: ${result.name}`);
    console.log(`   Category: ${result.category}`);
    console.log(`   Tools: ${result.tools?.length || 0} available`);
    
    console.log('\n🔍 Verifying GitHub MCP server in user account...');
    
    // Verify it was added
    const verifyResponse = await fetch(`http://localhost:3000/api/database/mcp-servers?userId=${userId}&enabled=true`);
    
    if (verifyResponse.ok) {
      const servers = await verifyResponse.json();
      const githubServer = servers.find(server => server.name === 'GitHub');
      
      if (githubServer) {
        console.log('✅ GitHub MCP server found in user account');
        console.log(`   Status: ${githubServer.connectionStatus}`);
        console.log(`   Enabled: ${githubServer.enabled}`);
        console.log(`   Tools: ${githubServer.tools?.length || 0} available`);
        
        console.log('\n🎉 GitHub MCP server is now available in your settings!');
        console.log('   • Go to Settings → MCP Servers');
        console.log('   • You should see "GitHub" in the list');
        console.log('   • It will be available in workflow MCP nodes');
        
      } else {
        console.log('⚠️  GitHub MCP server not found in user account');
        console.log('   This might be a timing issue. Try refreshing the settings page.');
      }
    } else {
      console.log('⚠️  Could not verify GitHub MCP server addition');
    }
    
  } catch (error) {
    console.error('❌ Error adding GitHub MCP server:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure the web app is running on localhost:3000');
    console.log('   2. Check if you are logged in to the application');
    console.log('   3. Try refreshing the browser page');
  }
}

// Run the script
addGitHubMCPToUser();
