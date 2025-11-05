import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Generic MCP Server Execution API
 * Supports calling any remote MCP server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverUrl, serverName, tool, params, authToken } = body;

    console.log(`Executing MCP server: ${serverName}, tool: ${tool}`);
    console.log('Params:', params);

    // Generic MCP server execution
    return await executeGenericMCP(serverUrl, tool, params, authToken);

  } catch (error) {
    console.error('MCP execution error:', error);
    return NextResponse.json(
      {
        error: 'MCP execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


/**
 * Execute generic MCP server
 */
async function executeGenericMCP(serverUrl: string, tool: string, params: any, authToken?: string) {
  // Generic MCP execution using JSON-RPC protocol
  const mcpRequest = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: tool,
      arguments: params,
    },
    id: Date.now(),
  };

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };

    // Handle different authentication methods
    if (authToken) {
      // For Supabase and other OAuth providers, use Bearer token
      if (serverUrl.includes('supabase.com')) {
        headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        // For other MCP servers, try Bearer first
        headers['Authorization'] = `Bearer ${authToken}`;
      }
    }

    console.log(`Making MCP request to: ${serverUrl}`);
    console.log('Headers:', headers);
    console.log('Request body:', JSON.stringify(mcpRequest, null, 2));

    const response = await fetch(serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(mcpRequest),
    });

    // Read response as text first (can only read once)
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`MCP server error ${response.status}:`, responseText.substring(0, 500));
      
      if (response.status === 401) {
        throw new Error(`Authentication failed (401): ${responseText.substring(0, 500)}. Please check your access token for the MCP server.`);
      } else if (response.status === 403) {
        throw new Error(`Access forbidden (403): ${responseText.substring(0, 500)}. You may not have permission to use this MCP server.`);
      } else {
        throw new Error(`MCP server returned ${response.status}: ${responseText.substring(0, 500)}`);
      }
    }

    // Check if response is SSE (Server-Sent Events) format
    const contentType = response.headers.get('content-type') || '';
    const isSSE = contentType.includes('text/event-stream') || 
                  contentType.includes('text/plain') ||
                  responseText.includes('event:') || 
                  responseText.includes('data:');
    
    let result: any;
    
    if (isSSE) {
      // Handle SSE format response
      console.log('🔍 MCP server returned SSE format, parsing...');
      
      // Parse SSE format - look for "data: {...}" patterns
      const dataMatches = Array.from(responseText.matchAll(/(?:^|\n)data:\s*(\{[\s\S]*?\})\s*(?:\n|$)/gm));
      
      if (dataMatches.length > 0) {
        // Use the last data chunk (most complete result)
        const lastDataChunk = dataMatches[dataMatches.length - 1][1];
        try {
          result = JSON.parse(lastDataChunk);
          console.log('✅ Parsed SSE data chunk successfully');
        } catch (e) {
          // Try to extract JSON more carefully
          const jsonMatch = lastDataChunk.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error(`MCP server returned invalid SSE format. Response preview: ${responseText.substring(0, 300)}`);
          }
        }
      } else {
        // Try alternative format: look for any JSON object in the response
        const jsonMatch = responseText.match(/\{[\s\S]*"jsonrpc"[\s\S]*\}/) || 
                         responseText.match(/\{[\s\S]*"result"[\s\S]*\}/) || 
                         responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`MCP server returned invalid SSE format. Response preview: ${responseText.substring(0, 300)}`);
        }
      }
    } else {
      // Regular JSON response
      try {
        result = JSON.parse(responseText);
        console.log('✅ Parsed JSON response successfully');
      } catch (e) {
        console.error('❌ Failed to parse JSON response:', e);
        throw new Error(`MCP server returned invalid JSON format. Response preview: ${responseText.substring(0, 300)}`);
      }
    }
    
    // Check for errors in JSON-RPC response
    if (result.error) {
      const errorMessage = result.error.message || `MCP error ${result.error.code || 'unknown'}`;
      console.error('❌ MCP server returned error:', result.error);
      throw new Error(errorMessage);
    }
    
    // Zapier MCP returns results in nested structure: result.content[0].text (JSON string)
    let resultData = result.result || result.data || result;
    
    // If result has content array with text, parse it
    if (resultData && typeof resultData === 'object' && Array.isArray(resultData.content)) {
      const contentItem = resultData.content.find((item: any) => item.type === 'text' && item.text);
      if (contentItem && contentItem.text) {
        try {
          // The text is a JSON string, parse it
          const parsedContent = JSON.parse(contentItem.text);
          // Extract the actual result from the parsed content
          resultData = parsedContent.results || parsedContent.execution || parsedContent || resultData;
        } catch (e) {
          // If parsing fails, use the original resultData
          console.warn('⚠️ Failed to parse content text, using original result:', e);
        }
      }
    }
    
    console.log('MCP response:', resultData);

    return NextResponse.json({
      success: true,
      tool,
      result: resultData,
    });
  } catch (error) {
    console.error('MCP execution error:', error);
    throw new Error(`Failed to call MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
