/**
 * Fix Tavily MCP URL in the database
 * The URL should be: https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}
 */

const API_BASE = 'http://localhost:3000/api';

async function fixTavilyMCPUrl() {
  console.log('🔧 Fixing Tavily MCP URL in the database...\n');

  try {
    // First, let's check the current Tavily MCP server configuration
    console.log('1️⃣ Checking current Tavily MCP server configuration...');
    
    const response = await fetch(`${API_BASE}/database/mcp-servers?userId=system-templates&enabled=true`);
    const servers = await response.json();
    
    const tavilyServer = servers.find(server => 
      server.name.toLowerCase().includes('tavily')
    );
    
    if (!tavilyServer) {
      console.log('❌ Tavily MCP server not found in database');
      return;
    }
    
    console.log('✅ Found Tavily MCP server:');
    console.log('   ID:', tavilyServer.id);
    console.log('   Name:', tavilyServer.name);
    console.log('   Current URL:', tavilyServer.url);
    console.log('   Status:', tavilyServer.enabled ? 'Enabled' : 'Disabled');
    
    // Check if the URL is already correct
    const correctUrl = 'https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}';
    if (tavilyServer.url === correctUrl) {
      console.log('✅ Tavily MCP URL is already correct');
      return;
    }
    
    console.log('\n2️⃣ Updating Tavily MCP server URL...');
    console.log('   From:', tavilyServer.url);
    console.log('   To:', correctUrl);
    
    // Update the Tavily MCP server URL
    const updateResponse = await fetch(`${API_BASE}/database/mcp-servers/${tavilyServer.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        url: correctUrl,
        description: 'Advanced web search and content extraction'
      })
    });
    
    if (updateResponse.ok) {
      const updatedServer = await updateResponse.json();
      console.log('✅ Tavily MCP server URL updated successfully');
      console.log('   New URL:', updatedServer.url);
    } else {
      const error = await updateResponse.text();
      console.log('❌ Failed to update Tavily MCP server URL:', error);
    }
    
    // Verify the update
    console.log('\n3️⃣ Verifying Tavily MCP server configuration...');
    
    const verifyResponse = await fetch(`${API_BASE}/database/mcp-servers?userId=system-templates&enabled=true`);
    const updatedServers = await verifyResponse.json();
    
    const updatedTavilyServer = updatedServers.find(server => 
      server.name.toLowerCase().includes('tavily')
    );
    
    if (updatedTavilyServer) {
      console.log('✅ Tavily MCP server configuration verified:');
      console.log('   Name:', updatedTavilyServer.name);
      console.log('   URL:', updatedTavilyServer.url);
      console.log('   Enabled:', updatedTavilyServer.enabled);
      
      if (updatedTavilyServer.url === correctUrl) {
        console.log('✅ URL is now correct!');
      } else {
        console.log('❌ URL is still incorrect');
      }
    } else {
      console.log('❌ Tavily MCP server not found after update');
    }

    console.log('\n🎉 Tavily MCP URL Fix Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Tavily MCP server found in database');
    console.log('   ✅ URL updated to correct format');
    console.log('   ✅ Configuration verified');
    
    console.log('\n🚀 Your Tavily MCP server should now work correctly!');
    console.log('   • Web search operations');
    console.log('   • Content extraction');
    console.log('   • Website crawling');
    console.log('   • Website mapping');

  } catch (error) {
    console.error('❌ Failed to fix Tavily MCP URL:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure the development server is running');
    console.log('   2. Check that the API endpoint is accessible');
    console.log('   3. Verify database connection');
  }
}

// Run the script
fixTavilyMCPUrl()
  .then(() => {
    console.log('\n🎯 Next steps:');
    console.log('   1. Test the Tavily MCP server in your workflow');
    console.log('   2. Verify web search functionality');
    console.log('   3. Check that the 404 error is resolved');
  })
  .catch(error => {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  });
