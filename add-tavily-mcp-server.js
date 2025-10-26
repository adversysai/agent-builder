/**
 * Add Tavily MCP Server to the database
 * This script adds Tavily as an official MCP server
 */

const API_BASE = 'http://localhost:3000/api';

async function addTavilyMCPServer() {
  console.log('🔍 Adding Tavily MCP Server to the database...\n');

  try {
    // First, let's check if Tavily is already configured
    console.log('1️⃣ Checking existing MCP servers...');
    
    const response = await fetch(`${API_BASE}/database/mcp-servers?userId=system-templates&enabled=true`);
    const servers = await response.json();
    
    const tavilyExists = servers.some(server => 
      server.name.toLowerCase().includes('tavily')
    );
    
    if (tavilyExists) {
      console.log('✅ Tavily MCP server already exists');
      return;
    }

    // Add Tavily MCP server
    console.log('2️⃣ Adding Tavily MCP server...');
    
    const tavilyServer = {
      action: 'add',
      userId: 'system-templates',
      name: 'Tavily',
      description: 'Advanced web search and content extraction',
      url: 'https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}',
      category: 'web-search',
      authType: 'url',
      tools: ['search', 'extract', 'crawl', 'map'],
      enabled: true,
      isOfficial: true
    };

    const addResponse = await fetch(`${API_BASE}/database/mcp-servers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tavilyServer)
    });

    if (addResponse.ok) {
      const result = await addResponse.json();
      console.log('✅ Tavily MCP server added successfully');
      console.log('   Server ID:', result.id);
      console.log('   Name:', result.name);
      console.log('   URL:', result.url);
      console.log('   Category:', result.category);
    } else {
      const error = await addResponse.text();
      console.log('❌ Failed to add Tavily MCP server:', error);
    }

    // Test the configuration
    console.log('\n3️⃣ Testing Tavily MCP server configuration...');
    
    const testResponse = await fetch(`${API_BASE}/database/mcp-servers?userId=system-templates&enabled=true`);
    const updatedServers = await testResponse.json();
    
    const foundTavilyServer = updatedServers.find(server => 
      server.name.toLowerCase().includes('tavily')
    );
    
    if (foundTavilyServer) {
      console.log('✅ Tavily MCP server found in database');
      console.log('   Name:', foundTavilyServer.name);
      console.log('   URL:', foundTavilyServer.url);
      console.log('   Enabled:', foundTavilyServer.enabled);
      console.log('   Category:', foundTavilyServer.category);
    } else {
      console.log('❌ Tavily MCP server not found in database');
    }

    console.log('\n🎉 Tavily MCP Server Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Add TAVILY_API_KEY to your .env.local file');
    console.log('   2. Restart your development server');
    console.log('   3. Test the Tavily MCP server in your workflow');
    console.log('   4. Configure Tavily tools in your agent nodes');

  } catch (error) {
    console.error('❌ Failed to add Tavily MCP server:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure the development server is running');
    console.log('   2. Check that the API endpoint is accessible');
    console.log('   3. Verify database connection');
  }
}

// Run the script
addTavilyMCPServer()
  .then(() => {
    console.log('\n🚀 Tavily MCP server is now ready to use!');
  })
  .catch(error => {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  });
