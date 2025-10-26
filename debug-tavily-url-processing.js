/**
 * Debug Tavily URL processing
 * Test the exact URL processing logic used in agent execution
 */

const API_BASE = 'http://localhost:3000/api';

async function debugTavilyUrlProcessing() {
  console.log('🔍 Debugging Tavily URL processing...\n');

  try {
    // Test 1: Get API keys
    console.log('1️⃣ Getting API keys...');
    
    const configResponse = await fetch(`${API_BASE}/config`);
    const config = await configResponse.json();
    
    console.log('Config response:', config);
    
    // Simulate the getServerAPIKeys function
    const apiKeys = {
      anthropic: process.env.ANTHROPIC_API_KEY,
      groq: process.env.GROQ_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      firecrawl: process.env.FIRECRAWL_API_KEY,
      arcade: process.env.ARCADE_API_KEY,
      e2b: process.env.E2B_API_KEY,
      tavily: process.env.TAVILY_API_KEY,
    };
    
    console.log('API Keys available:');
    console.log('  anthropic:', !!apiKeys.anthropic);
    console.log('  groq:', !!apiKeys.groq);
    console.log('  openai:', !!apiKeys.openai);
    console.log('  firecrawl:', !!apiKeys.firecrawl);
    console.log('  arcade:', !!apiKeys.arcade);
    console.log('  e2b:', !!apiKeys.e2b);
    console.log('  tavily:', !!apiKeys.tavily);
    
    if (apiKeys.tavily) {
      console.log('  tavily key (first 10 chars):', apiKeys.tavily.substring(0, 10) + '...');
    }

    // Test 2: Get Tavily MCP server configuration
    console.log('\n2️⃣ Getting Tavily MCP server configuration...');
    
    const serversResponse = await fetch(`${API_BASE}/database/mcp-servers?userId=system-templates&enabled=true`);
    const servers = await serversResponse.json();
    
    const tavilyServer = servers.find(server => 
      server.name.toLowerCase().includes('tavily')
    );
    
    if (tavilyServer) {
      console.log('✅ Tavily MCP server found:');
      console.log('   Name:', tavilyServer.name);
      console.log('   URL:', tavilyServer.url);
      console.log('   Enabled:', tavilyServer.enabled);
      
      // Test 3: Simulate the exact URL processing logic from agent.ts
      console.log('\n3️⃣ Testing URL processing logic...');
      
      const mcp = {
        name: tavilyServer.name,
        url: tavilyServer.url,
        accessToken: null
      };
      
      console.log('Original MCP config:', mcp);
      
      // Simulate the exact logic from agent.ts
      let processedUrl = mcp.url;
      console.log('Initial processedUrl:', processedUrl);
      
      // Replace API key placeholders
      if (processedUrl.includes('{FIRECRAWL_API_KEY}')) {
        processedUrl = processedUrl.replace('{FIRECRAWL_API_KEY}', apiKeys.firecrawl || '');
        console.log('After FIRECRAWL replacement:', processedUrl);
      }
      if (processedUrl.includes('{TAVILY_API_KEY}')) {
        console.log('Found {TAVILY_API_KEY} placeholder');
        console.log('API key value:', apiKeys.tavily || 'undefined');
        processedUrl = processedUrl.replace('{TAVILY_API_KEY}', apiKeys.tavily || '');
        console.log('After TAVILY replacement:', processedUrl);
      } else {
        console.log('❌ No {TAVILY_API_KEY} placeholder found in URL');
      }
      
      // Build the final MCP server configuration
      const mcpServer = {
        type: 'url',
        url: processedUrl,
        name: mcp.name,
        authorization_token: mcp.accessToken,
      };
      
      console.log('\n4️⃣ Final MCP server configuration:');
      console.log(JSON.stringify(mcpServer, null, 2));
      
      // Test 4: Validate the final URL
      console.log('\n5️⃣ Validating final URL...');
      console.log('Final URL:', mcpServer.url);
      
      if (mcpServer.url.includes('{TAVILY_API_KEY}')) {
        console.log('❌ URL still contains {TAVILY_API_KEY} placeholder');
      } else if (mcpServer.url.includes('//mcp')) {
        console.log('❌ URL contains double slashes - this is the problem!');
        console.log('Expected: https://mcp.tavily.com/mcp/?tavilyApiKey=ACTUAL_KEY');
        console.log('Actual:', mcpServer.url);
      } else if (mcpServer.url.startsWith('https://mcp.tavily.com/mcp/?tavilyApiKey=')) {
        console.log('✅ URL format is correct');
      } else {
        console.log('❌ URL format is unexpected');
      }
      
    } else {
      console.log('❌ Tavily MCP server not found in database');
    }

    console.log('\n🎉 Tavily URL Processing Debug Complete!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugTavilyUrlProcessing()
  .then(() => {
    console.log('\n🎯 Analysis complete!');
  })
  .catch(error => {
    console.error('💥 Debug execution failed:', error);
    process.exit(1);
  });
