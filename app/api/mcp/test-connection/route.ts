import { NextRequest, NextResponse } from 'next/server';
import { anthropicMCPClient } from '@/lib/mcp/anthropic-client';
import { FirecrawlMCPClient } from '@/lib/mcp/firecrawl-mcp';

// POST /api/mcp/test-connection - Test MCP server connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverUrl, apiKey, serverType, url, authToken } = body;
    
    // Handle both old and new parameter names
    const finalServerUrl = serverUrl || url;
    const finalApiKey = apiKey || authToken;
    
    if (!finalServerUrl) {
      return NextResponse.json({ error: 'Server URL is required' }, { status: 400 });
    }
    
    console.log('Testing MCP connection to:', finalServerUrl);
    console.log('Server type:', serverType);
    
    // Handle Firecrawl MCP specifically
    if (serverType === 'firecrawl' || finalServerUrl.includes('firecrawl')) {
      if (!finalApiKey) {
        return NextResponse.json({
          success: false,
          error: 'Firecrawl API key is required'
        }, { status: 400 });
      }
      
      const firecrawlClient = new FirecrawlMCPClient(finalApiKey);
      const result = await firecrawlClient.testConnection();
      
      if (result.success) {
        const tools = await firecrawlClient.getTools();
        return NextResponse.json({
          success: true,
          message: 'Firecrawl MCP connection successful',
          serverUrl: finalServerUrl,
          serverType: 'firecrawl',
          tools: tools,
          capabilities: {
            tools: tools.map(tool => tool.name),
            resources: ['web', 'content', 'scraping']
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'Firecrawl connection failed'
        }, { status: 500 });
      }
    }
    
    // For other MCP servers, use the Anthropic client
    const connectionResult = await anthropicMCPClient.testConnection(finalServerUrl);
    
    if (connectionResult.success) {
      // Get available tools and resources
      const tools = await anthropicMCPClient.getTools(finalServerUrl);
      const resources = await anthropicMCPClient.getResources(finalServerUrl);
      const capabilities = await anthropicMCPClient.getModelCapabilities();
      
      return NextResponse.json({
        success: true,
        connection: connectionResult,
        tools,
        resources,
        capabilities
      });
    } else {
      return NextResponse.json({
        success: false,
        error: connectionResult.error
      });
    }
  } catch (error) {
    console.error('Error testing MCP connection:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to test MCP connection' 
    }, { status: 500 });
  }
}
