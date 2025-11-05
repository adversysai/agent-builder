import { WorkflowNode, WorkflowState } from '../types';
import { getMCPServer } from '../storage';
import { substituteVariables } from '../variable-substitution';
import FirecrawlApp from '@mendable/firecrawl-js';
import { getServerAPIKeys } from '@/lib/api/config';
import { resolveMCPServer } from '@/lib/mcp/resolver';
import { executeTavilyMCPNode } from './tavily-mcp';
import { executeGitHubMCPNode } from './github-mcp';

/**
 * Extract specific field from Firecrawl response
 */
function extractField(data: any, field: string, customPath?: string): any {
  if (field === 'full') return data;
  if (field === 'custom' && customPath) {
    return getNestedValue(data, customPath);
  }

  // Predefined field mappings
  switch (field) {
    case 'markdown':
      return data.markdown || data;
    case 'html':
      return data.html || data;
    case 'metadata':
      return data.metadata || {};
    case 'results':
      return data.results || data;
    case 'urls':
      if (Array.isArray(data.results)) {
        return data.results.map((r: any) => r.url);
      }
      if (Array.isArray(data.urls)) {
        return data.urls;
      }
      if (Array.isArray(data.links)) {
        return data.links;
      }
      return data;
    case 'first':
      return data.results?.[0] || data[0] || data;
    case 'json':
      // For JSON mode in scrape/crawl
      return data.json || data.data || data;
    default:
      return data[field] || data;
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    // Handle array indexing
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      current = current[arrayName]?.[parseInt(index)];
    } else {
      current = current?.[part];
    }

    if (current === undefined) break;
  }

  return current;
}

/**
 * Execute a generic MCP server (Zapier, DeepWiki, etc.)
 * Uses JSON-RPC 2.0 protocol to call MCP server tools
 */
async function executeGenericMCPServer(serverConfig: any, state: WorkflowState): Promise<any> {
  const input = state.variables?.input || state.variables?.lastOutput;
  const serverName = serverConfig.name.toLowerCase();

  // For DeepWiki
  if (serverName.includes('deepwiki') || serverName.includes('devin')) {
    // Parse the input to determine which tool to use
    const inputText = typeof input === 'string' ? input : JSON.stringify(input);

    // Determine which DeepWiki tool to use based on input
    let tool = 'ask_question'; // Default
    let params: any = {};

    if (inputText.includes('wiki structure') || inputText.includes('topics')) {
      tool = 'read_wiki_structure';
      // Extract repo from input (e.g., "anthropics/anthropic-sdk-python")
      const repoMatch = inputText.match(/([a-zA-Z0-9-]+\/[a-zA-Z0-9-]+)/);
      params.repository = repoMatch ? repoMatch[1] : 'anthropics/anthropic-sdk-python';
    } else if (inputText.includes('wiki content') || inputText.includes('documentation')) {
      tool = 'read_wiki_contents';
      const repoMatch = inputText.match(/([a-zA-Z0-9-]+\/[a-zA-Z0-9-]+)/);
      params.repository = repoMatch ? repoMatch[1] : 'anthropics/anthropic-sdk-python';
    } else {
      tool = 'ask_question';
      // Extract repo if mentioned
      const repoMatch = inputText.match(/([a-zA-Z0-9-]+\/[a-zA-Z0-9-]+)/);
      params.repository = repoMatch ? repoMatch[1] : 'anthropics/anthropic-sdk-python';
      params.question = inputText;
    }

    return {
      tool,
      data: {
        server: 'DeepWiki',
        tool,
        params,
        note: 'DeepWiki MCP execution is not yet implemented. This is a placeholder response.',
        input: inputText,
        suggestedImplementation: 'Call the DeepWiki MCP server API at ' + serverConfig.url,
      },
    };
  }

  // For Zapier and other generic MCP servers, use JSON-RPC 2.0 protocol
  // Get the tool name and parameters from the state
  // Reuse the input variable already defined at the top of the function
  const tool = (input && typeof input === 'object' && input.tool) ? input.tool : 
               (input && typeof input === 'object' && input.mcpAction) ? input.mcpAction :
               'list_tools'; // Default fallback
  let params = (input && typeof input === 'object' && input.params) ? input.params :
                 (input && typeof input === 'object' && input.mcpParams) ? input.mcpParams :
                 (typeof input === 'object' && input) ? input : {};

  // Check if this is Zapier MCP
  const isZapier = serverConfig.name?.toLowerCase().includes('zapier') || 
                    serverConfig.url?.includes('zapier.com') ||
                    serverConfig.url?.includes('mcp.zapier.com');
  
  // Substitute variables in params BEFORE constructing instructions
  if (params && typeof params === 'object' && isZapier) {
    const substitutedParams: any = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && (value.includes('{{') || value.includes('${'))) {
        const substituted = substituteVariables(value, state);
        substitutedParams[key] = (substituted !== null && substituted !== undefined && substituted !== value) 
          ? substituted 
          : value;
      } else {
        substitutedParams[key] = value;
      }
    }
    params = substitutedParams;
    console.log('✅ [Generic MCP] Substituted variables in params:', params);
  }

  // Zapier MCP tools require an 'instructions' parameter
  // If not provided, construct it from available parameters
  // Always preserve explicit parameters (like parent_page, title, etc.) even when instructions are provided
  if (isZapier && typeof params === 'object' && Object.keys(params).length > 0) {
    // If instructions are already provided, ensure explicit parameters are still included
    if (params.instructions) {
      // For Notion tools, ensure parent_page is explicitly passed if provided
      if (tool.includes('notion') && params.parent_page && typeof params.parent_page === 'string' && params.parent_page !== '') {
        // parent_page is already in params, so it will be passed through
        console.log('✅ [Generic MCP] Notion tool with explicit parent_page:', params.parent_page);
      }
    }
    
    // Only construct instructions if not already provided
    if (!params.instructions) {
    console.log('⚠️ [Generic MCP] Zapier tool missing "instructions" parameter, constructing from available params');
    
    // Create natural language instructions from parameters
    let instructionsText = '';
    
    // Handle email/send tools (must be Gmail-specific)
    if (tool.includes('gmail') || (tool.includes('email') && !tool.includes('slack') && !tool.includes('message'))) {
      const recipient = params.to || params.email || '';
      const subject = params.subject || '';
      const body = params.body || params.message || params.content || '';
      
      const parts: string[] = [];
      if (recipient) parts.push(`to ${recipient}`);
      if (subject) parts.push(`with subject "${subject}"`);
      if (body) parts.push(`with body "${typeof body === 'string' ? body : JSON.stringify(body)}"`);
      
      instructionsText = parts.length > 0 
        ? `Send an email ${parts.join(' ')}.`
        : 'Send an email.';
    }
    // Handle sheets/spreadsheet tools
    else if (tool.includes('sheets') || tool.includes('spreadsheet')) {
      const spreadsheetId = params.spreadsheetId || params.spreadsheet_id || '';
      const range = params.range || params.worksheet || 'Sheet1!A1';
      const values = params.values || params.cells || params.row || [];
      
      const parts: string[] = [];
      if (spreadsheetId) parts.push(`to spreadsheet ${spreadsheetId}`);
      if (range) parts.push(`at range ${range}`);
      if (values && values.length > 0) parts.push(`with values ${JSON.stringify(values)}`);
      
      instructionsText = parts.length > 0 
        ? `Create a spreadsheet row ${parts.join(' ')}.`
        : 'Create a spreadsheet row.';
    }
    // Handle Slack tools
    else if (tool.includes('slack')) {
      const channel = params.channel || params.channel_id || '';
      const text = params.text || params.message || params.content || '';
      
      const parts: string[] = [];
      if (channel) parts.push(`to channel ${channel}`);
      if (text) parts.push(`with text "${text}"`);
      
      instructionsText = parts.length > 0 
        ? `Send a Slack message ${parts.join(' ')}.`
        : 'Send a Slack message.';
    }
    // Handle Notion tools
    else if (tool.includes('notion')) {
      const title = params.title || params.name || '';
      const content = params.content || params.body || '';
      const parentPage = params.parent_page || params.parentPage || '';
      
      const parts: string[] = [];
      if (title) parts.push(`with title "${title}"`);
      if (content) parts.push(`and content "${content}"`);
      if (parentPage) parts.push(`under parent page ${parentPage}`);
      
      instructionsText = parts.length > 0 
        ? `Create a Notion page ${parts.join(' ')}.`
        : 'Create a Notion page.';
    }
    // Handle Browse AI tools
    else if (tool.includes('browse_ai') || tool.includes('browse')) {
      const robotId = params.robot_id || params.robotId || '';
      const url = params.url || '';
      
      const parts: string[] = [];
      if (robotId) parts.push(`using robot ID ${robotId}`);
      else parts.push(`using any available robot from the connected Browse AI account`);
      if (url) parts.push(`for URL ${url}`);
      
      instructionsText = parts.length > 0 
        ? `Run a Browse AI task ${parts.join(' ')}.`
        : 'Run a Browse AI task.';
    }
    // Handle Smartsheet tools
    else if (tool.includes('smartsheet')) {
      const sheetId = params.sheet_id || params.sheetId || params.SHEET_ID || '';
      const rowId = params.row_id || params.rowId || params.ROW_ID || '';
      
      const parts: string[] = [];
      if (sheetId) parts.push(`in sheet ${sheetId}`);
      if (rowId) parts.push(`for row ${rowId}`);
      
      instructionsText = parts.length > 0 
        ? `Execute Smartsheet action ${parts.join(' ')}.`
        : 'Execute Smartsheet action.';
    }
    // Handle calendar event tools
    else if (tool.includes('calendar') || (tool.includes('event') && !tool.includes('notion'))) {
      const title = params.summary || params.title || params.name || '';
      const start = params.start_time || params.startTime || params.start || '';
      const end = params.end_time || params.endTime || params.end || '';
      
      const parts: string[] = [];
      if (title) parts.push(`"${title}"`);
      if (start) parts.push(`starting at ${start}`);
      if (end) parts.push(`ending at ${end}`);
      
      instructionsText = parts.length > 0 
        ? `Create a calendar event ${parts.join(' ')}.`
        : 'Create a calendar event.';
    }
    // Generic tools
    else {
      const instructionsParts: string[] = [];
      
      if (params.to || params.email) {
        instructionsParts.push(`to ${params.to || params.email}`);
      }
      if (params.subject) {
        instructionsParts.push(`with subject "${params.subject}"`);
      }
      if (params.body || params.message || params.content) {
        const content = params.body || params.message || params.content;
        instructionsParts.push(`with body "${typeof content === 'string' ? content.substring(0, 100) : JSON.stringify(content)}"`);
      }
      if (params.summary || params.title) {
        instructionsParts.push(`with title "${params.summary || params.title}"`);
      }
      
      // Determine action verb
      let actionVerb = 'Execute';
      if (tool.includes('create') || tool.includes('add')) {
        actionVerb = 'Create';
      } else if (tool.includes('send')) {
        actionVerb = 'Send';
      }
      
      instructionsText = instructionsParts.length > 0 
        ? `${actionVerb} ${instructionsParts.join(' ')}.`
        : `${actionVerb} with parameters: ${Object.entries(params)
            .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
            .join(', ')}.`;
    }
    
      params = { instructions: instructionsText, ...params };
      console.log('✅ [Generic MCP] Constructed instructions:', instructionsText.substring(0, 200));
    }
    // If instructions were already provided, params already contain all parameters including parent_page
    // so we don't need to do anything else - they'll be passed through to Zapier
  } else if (isZapier && !params.instructions) {
    // If no parameters at all, provide a default instruction
    params = { instructions: `Execute ${tool}` };
    console.log('⚠️ [Generic MCP] No parameters provided, using default instructions');
  }

  // Build JSON-RPC request
  const mcpRequest = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: tool,
      arguments: params,
    },
    id: Date.now(),
  };

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };

  // Add authentication if available
  if (serverConfig.accessToken) {
    headers['Authorization'] = `Bearer ${serverConfig.accessToken}`;
  }

  // Make request to MCP server
  try {
    console.log(`🔍 [Generic MCP] Calling ${tool} on ${serverConfig.name} at ${serverConfig.url}`);
    const response = await fetch(serverConfig.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(mcpRequest),
    });

    // Read response as text first (can only read once)
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ [Generic MCP] Error response:`, { status: response.status, statusText: response.statusText, body: responseText.substring(0, 500) });
      throw new Error(`MCP server returned ${response.status}: ${responseText.substring(0, 500)}`);
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
      console.log('🔍 [Generic MCP] Server returned SSE format, parsing...');
      
      // Parse SSE format - look for "data: {...}" patterns
      const dataMatches = Array.from(responseText.matchAll(/(?:^|\n)data:\s*(\{[\s\S]*?\})\s*(?:\n|$)/gm));
      
      if (dataMatches.length > 0) {
        // Use the last data chunk (most complete result)
        const lastDataChunk = dataMatches[dataMatches.length - 1][1];
        try {
          result = JSON.parse(lastDataChunk);
          console.log('✅ [Generic MCP] Parsed SSE data chunk successfully');
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
        console.log('✅ [Generic MCP] Parsed JSON response successfully');
      } catch (e) {
        console.error('❌ [Generic MCP] Failed to parse JSON response:', e);
        throw new Error(`MCP server returned invalid JSON format. Response preview: ${responseText.substring(0, 300)}`);
      }
    }
    
    // Check for errors in JSON-RPC response
    if (result.error) {
      const errorMessage = result.error.message || `MCP error ${result.error.code || 'unknown'}`;
      console.error('❌ [Generic MCP] Server returned error:', result.error);
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
          console.warn('⚠️ [Generic MCP] Failed to parse content text, using original result:', e);
        }
      }
    }
    
    return {
      tool,
      data: resultData,
    };
  } catch (error) {
    console.error(`❌ [Generic MCP] Failed to call MCP server "${serverConfig.name}":`, error);
    throw new Error(`Failed to call MCP server "${serverConfig.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute MCP Node - Calls MCP server tools (Firecrawl)
 * Uses API route when running client-side to avoid CORS
 */
export async function executeMCPNode(
  node: WorkflowNode,
  state: WorkflowState,
  apiKeys?: { anthropic?: string; groq?: string; openai?: string; firecrawl?: string; tavily?: string; github?: string; zapier?: string }
): Promise<any> {
  const { data } = node;

  // MCP executor always runs on server side in LangGraph context
  // No client-side detection needed
  
  const nodeName = data.nodeName?.toLowerCase() || '';
  const nodeData = data as any;
  const lastOutput = state.variables?.lastOutput;

  // Resolve MCP server configuration
  let mcpServers = nodeData.mcpServers || [];

  // If using new format with server ID, resolve it
  if (nodeData.mcpServerId) {
    console.log('🔍 Resolving MCP server ID:', nodeData.mcpServerId);
    const resolvedServer = await resolveMCPServer(nodeData.mcpServerId);
    if (resolvedServer) {
      console.log('✅ Resolved MCP server:', resolvedServer);
      mcpServers = [resolvedServer];
    } else {
      console.warn(`❌ Could not resolve MCP server ID: ${nodeData.mcpServerId}`);
      console.log('🔍 Falling back to inline mcpServers:', nodeData.mcpServers);
    }
  } else if (mcpServers.length > 0 && mcpServers[0].name) {
    // If we have inline mcpServers, try to resolve them by name to get the latest URL from database
    // This ensures we use the updated URL even if the workflow node has old data
    console.log('🔍 Found inline mcpServers, attempting to resolve by name to get latest URL');
    for (let i = 0; i < mcpServers.length; i++) {
      const inlineServer = mcpServers[i];
      if (inlineServer.name && (inlineServer.name.toLowerCase().includes('zapier') || inlineServer.url?.includes('zapier.com'))) {
        // Try to find the server in database by name
        try {
          const { db } = await import('@/lib/database/client');
          // Try to find by name (without userId filter for now, as we might not have it in this context)
          // If multiple servers with same name exist, we'll use the first enabled one
          const result = await db.query(
            'SELECT * FROM "mcpServer" WHERE LOWER(name) = LOWER($1) AND enabled = true ORDER BY "updatedAt" DESC LIMIT 1',
            [inlineServer.name]
          );
          if (result.rows.length > 0) {
            const dbServer = result.rows[0];
            console.log('✅ Found updated Zapier server in database, using latest URL:', dbServer.url);
            console.log('🔍 Database server URL:', dbServer.url);
            console.log('🔍 Inline server URL:', inlineServer.url);
            // Replace inline server with database version
            mcpServers[i] = {
              name: dbServer.name,
              url: dbServer.url,
              description: dbServer.description,
              authType: dbServer.authType,
              accessToken: dbServer.accessToken,
              availableTools: dbServer.tools || [],
              headers: dbServer.headers,
              label: dbServer.name,
            };
          } else {
            console.warn('⚠️ Could not find server in database with name:', inlineServer.name);
          }
        } catch (error) {
          console.warn('⚠️ Could not resolve server from database, using inline config:', error);
        }
      }
    }
  }

  console.log('🔍 MCP Node Debug - mcpServers:', mcpServers);
  console.log('🔍 MCP Node Debug - nodeData:', nodeData);
  console.log('🔍 MCP Node Debug - apiKeys:', apiKeys);

  if (!mcpServers || mcpServers.length === 0) {
    console.log('❌ No MCP servers configured or could not resolve server');
    return {
      error: 'No MCP servers configured or could not resolve server',
    };
  }

  const results: any[] = [];

  for (const serverConfig of mcpServers) {
    console.log('🔍 Processing MCP server:', { 
      name: serverConfig.name, 
      url: serverConfig.url,
      authType: serverConfig.authType,
      label: serverConfig.label
    });
    console.log('🔍 GitHub detection check:', {
      nameCheck: serverConfig.name.toLowerCase().includes('github'),
      urlApiCheck: serverConfig.url?.includes('api.github.com'),
      urlGithubCheck: serverConfig.url?.includes('github.com')
    });
    
    // Handle Tavily MCP server - more robust detection
    const isTavily = serverConfig.name.toLowerCase().includes('tavily') || 
                    serverConfig.url?.includes('tavily') ||
                    serverConfig.url?.includes('mcp.tavily.com') ||
                    serverConfig.label?.toLowerCase().includes('tavily');
    
    console.log('🔍 Tavily detection:', { isTavily, name: serverConfig.name, url: serverConfig.url });
    
    if (isTavily) {
      console.log('🔍 MCP executor running Tavily on server side');
      
      if (!apiKeys?.tavily) {
        console.log('❌ TAVILY_API_KEY not configured');
        throw new Error('TAVILY_API_KEY not configured. Add it to your .env.local file:\nTAVILY_API_KEY=your_key_here');
      }

      console.log('✅ TAVILY_API_KEY found, proceeding with execution');
      try {
        const result = await executeTavilyMCPNode(node, state, apiKeys.tavily);
        console.log('✅ Tavily MCP execution completed successfully');
        results.push({
          server: 'Tavily',
          tool: nodeData.mcpAction || 'search',
          success: true,
          data: result.output,
        });
        state.variables.lastOutput = result.output;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Tavily execution error:', error);
        results.push({
          server: 'Tavily',
          error: errorMessage,
          success: false,
        });
      }
    } else if (serverConfig.name.toLowerCase().includes('firecrawl')) {
      // Server-side Firecrawl execution - use Firecrawl SDK directly
      console.log('🖥️ MCP executor running Firecrawl on server side');

      if (!apiKeys?.firecrawl) {
        throw new Error('FIRECRAWL_API_KEY not configured. Add it to your .env.local file:\nFIRECRAWL_API_KEY=your_key_here');
      }

      const firecrawl = new FirecrawlApp({ apiKey: apiKeys.firecrawl });
      
      // Get the action and parameters from the node data
      const nodeData = data as any;
      const action = nodeData.mcpAction || 'scrape';
      
      // Get URL from input or previous step
      const getUrl = () => {
        const explicitUrl = nodeData.scrapeUrl || nodeData.mapUrl || nodeData.crawlUrl;
        if (explicitUrl) {
          const substituted = substituteVariables(explicitUrl, state);
          if (substituted && substituted.startsWith('http')) {
            return substituted;
          }
        }
        
        const lastOutput = state.variables?.lastOutput;
        if (typeof lastOutput === 'string' && lastOutput.startsWith('http')) {
          return lastOutput;
        }
        if (lastOutput?.url && typeof lastOutput.url === 'string') {
          return lastOutput.url;
        }
        if (typeof state.variables?.input === 'string' && state.variables.input.startsWith('http')) {
          return state.variables.input;
        }
        return 'https://example.com';
      };

      // Get search query
      const getSearchQuery = () => {
        if (nodeData.searchQuery) {
          const substituted = substituteVariables(nodeData.searchQuery, state);
          if (substituted) {
            return substituted;
          }
        }
        
        const lastOutput = state.variables?.lastOutput;
        if (typeof lastOutput === 'string' && !lastOutput.startsWith('http')) {
          return lastOutput;
        }
        if (typeof state.variables?.input === 'string' && !state.variables.input.startsWith('http')) {
          return state.variables.input;
        }
        return 'latest tech news';
      };

      let result: any;
      
      try {
        switch (action) {
          case 'scrape':
            result = await firecrawl.scrape(getUrl(), {
              formats: nodeData.useJsonMode ? ['json'] : ['markdown', 'html'],
            });
            break;
            
          case 'search':
            result = await firecrawl.search(getSearchQuery(), {
              limit: nodeData.searchLimit || 5,
            });
            break;
            
          case 'map':
            result = await firecrawl.map(getUrl());
            break;
            
          case 'crawl':
            result = await firecrawl.crawl(getUrl(), {
              limit: nodeData.crawlLimit || 10,
            });
            break;
            
          default:
            throw new Error(`Unknown Firecrawl action: ${action}`);
        }
        
        console.log('✅ MCP Firecrawl server-side execution completed successfully');
        
        // Extract specific field based on configuration
        let outputData = result;
        if (nodeData.outputField && nodeData.outputField !== 'full') {
          outputData = extractField(result, nodeData.outputField, nodeData.customOutputPath);
        }
        
        // Update state
        state.variables.lastOutput = outputData;
        
        return {
          results: [{
            server: 'Firecrawl',
            tool: action,
            success: true,
            data: result,
          }],
          extractedField: nodeData.outputField,
          output: outputData,
          mcpServers: ['Firecrawl'],
          toolCalls: [{
            name: `firecrawl_${action}`,
            arguments: { action, url: getUrl(), query: getSearchQuery() },
            output: result,
          }],
        };
        
      } catch (error) {
        console.error('❌ MCP Firecrawl server-side execution failed:', error);
        throw new Error(`Firecrawl ${action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (serverConfig.name.toLowerCase().includes('github') || 
               serverConfig.url?.includes('api.github.com') || 
               serverConfig.url?.includes('github.com')) {
      // GitHub MCP execution
      console.log('🔍 MCP executor running GitHub on server side');
      console.log('🔍 Server config:', { name: serverConfig.name, url: serverConfig.url, authType: serverConfig.authType });
      console.log('🔍 GitHub detection - name check:', serverConfig.name.toLowerCase().includes('github'));
      console.log('🔍 GitHub detection - URL api.github.com check:', serverConfig.url?.includes('api.github.com'));
      console.log('🔍 GitHub detection - URL github.com check:', serverConfig.url?.includes('github.com'));
      
      if (!apiKeys?.github) {
        console.log('❌ GITHUB_TOKEN not configured');
        throw new Error('GITHUB_TOKEN not configured. Add it to your .env.local file:\nGITHUB_TOKEN=your_github_personal_access_token_here');
      }

      console.log('✅ GITHUB_TOKEN found, proceeding with execution');
      try {
        const result = await executeGitHubMCPNode(node, state, apiKeys.github);
        console.log('✅ GitHub MCP execution completed successfully');
        results.push({
          server: 'GitHub',
          tool: nodeData.mcpAction || 'search_code',
          success: result.success,
          data: result.data,
          error: result.error,
        });
        if (result.success) {
          state.variables.lastOutput = result.data;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ GitHub execution error:', error);
        results.push({
          server: 'GitHub',
          error: errorMessage,
          success: false,
        });
      }
    } else if (serverConfig.name.toLowerCase().includes('zapier') || 
               serverConfig.url?.includes('zapier.com') ||
               serverConfig.url?.includes('mcp.zapier.com')) {
      // Zapier MCP execution - uses generic JSON-RPC protocol
      console.log('🔍 MCP executor running Zapier on server side');
      console.log('🔍 Server config:', { name: serverConfig.name, url: serverConfig.url, authType: serverConfig.authType });
      
      // Validate and fix Zapier URL - use environment variable if database URL is incorrect
      let zapierUrl = serverConfig.url;
      
      // Check if URL is incorrect (just the main website, not the MCP endpoint)
      if (zapierUrl === 'https://zapier.com' || zapierUrl === 'http://zapier.com') {
        console.warn('⚠️ Invalid Zapier URL detected, attempting to use environment variable');
        // Try to get correct URL from environment variable
        const envZapierUrl = apiKeys?.zapier || process.env.ZAPIER_MCP_SERVER_URL || process.env.ZAPIER_MCP_OAUTH_URL;
        if (envZapierUrl && (envZapierUrl.includes('mcp.zapier.com') || envZapierUrl.includes('/api/mcp/'))) {
          zapierUrl = envZapierUrl;
          console.log('✅ Using Zapier URL from environment variable:', zapierUrl);
        } else {
          throw new Error(
            'Zapier MCP URL is incorrectly configured. The URL should be:\n' +
            'Format: https://mcp.zapier.com/api/mcp/s/YOUR_SERVER_ID/mcp\n' +
            'Or set ZAPIER_MCP_SERVER_URL in your .env.local file.\n' +
            'Current URL: ' + serverConfig.url
          );
        }
      }
      
      // Validate that URL is a proper MCP endpoint
      if (!zapierUrl.includes('mcp.zapier.com') && !zapierUrl.includes('/api/mcp/')) {
        throw new Error(
          'Invalid Zapier MCP URL format. URL must include "mcp.zapier.com" or "/api/mcp/".\n' +
          'Current URL: ' + zapierUrl + '\n' +
          'Expected format: https://mcp.zapier.com/api/mcp/s/YOUR_SERVER_ID/mcp'
        );
      }
      
      // Zapier MCP uses server-specific URL that contains auth info
      // Get tool and params from nodeData
      const tool = nodeData.mcpAction || nodeData.tool || 'list_tools';
      let params = nodeData.mcpParams || nodeData.params || {};
      
      // Substitute variables in params BEFORE constructing instructions
      if (params && typeof params === 'object') {
        const substitutedParams: any = {};
        for (const [key, value] of Object.entries(params)) {
          if (typeof value === 'string' && (value.includes('{{') || value.includes('${'))) {
            const substituted = substituteVariables(value, state);
            // Only use substituted value if it's not null/undefined and not the same as original
            substitutedParams[key] = (substituted !== null && substituted !== undefined && substituted !== value) 
              ? substituted 
              : value;
          } else {
            substitutedParams[key] = value;
          }
        }
        params = substitutedParams;
        console.log('✅ Substituted variables in params:', params);
      }
      
      // Zapier MCP tools require an 'instructions' parameter
      // If not provided, construct it from available parameters
      if (!params.instructions && typeof params === 'object' && Object.keys(params).length > 0) {
        console.log('⚠️ Zapier tool missing "instructions" parameter, constructing from available params');
        
        // Create natural language instructions from parameters
        // Determine action based on tool name and parameters
        let instructionsText = '';
        
        // Handle email/send tools (must be Gmail-specific)
        if (tool.includes('gmail') || (tool.includes('email') && !tool.includes('slack') && !tool.includes('message'))) {
          const recipient = params.to || params.email || '';
          const subject = params.subject || '';
          const body = params.body || params.message || params.content || '';
          
          const parts: string[] = [];
          if (recipient) parts.push(`to ${recipient}`);
          if (subject) parts.push(`with subject "${subject}"`);
          if (body) parts.push(`with body "${typeof body === 'string' ? body : JSON.stringify(body)}"`);
          
          instructionsText = parts.length > 0 
            ? `Send an email ${parts.join(' ')}.`
            : 'Send an email.';
        }
        // Handle sheets/spreadsheet tools
        else if (tool.includes('sheets') || tool.includes('spreadsheet')) {
          const spreadsheetId = params.spreadsheetId || params.spreadsheet_id || '';
          const range = params.range || params.worksheet || 'Sheet1!A1';
          const values = params.values || params.cells || params.row || [];
          
          const parts: string[] = [];
          if (spreadsheetId) parts.push(`to spreadsheet ${spreadsheetId}`);
          if (range) parts.push(`at range ${range}`);
          if (values && values.length > 0) parts.push(`with values ${JSON.stringify(values)}`);
          
          instructionsText = parts.length > 0 
            ? `Create a spreadsheet row ${parts.join(' ')}.`
            : 'Create a spreadsheet row.';
        }
        // Handle Slack tools
        else if (tool.includes('slack')) {
          const channel = params.channel || params.channel_id || '';
          const text = params.text || params.message || params.content || '';
          
          const parts: string[] = [];
          if (channel) parts.push(`to channel ${channel}`);
          if (text) parts.push(`with text "${text}"`);
          
          instructionsText = parts.length > 0 
            ? `Send a Slack message ${parts.join(' ')}.`
            : 'Send a Slack message.';
        }
        // Handle Notion tools
        else if (tool.includes('notion')) {
          const title = params.title || params.name || '';
          const content = params.content || params.body || '';
          const parentPage = params.parent_page || params.parentPage || '';
          
          const parts: string[] = [];
          if (title) parts.push(`with title "${title}"`);
          if (content) parts.push(`and content "${content}"`);
          if (parentPage) parts.push(`under parent page ${parentPage}`);
          
          instructionsText = parts.length > 0 
            ? `Create a Notion page ${parts.join(' ')}.`
            : 'Create a Notion page.';
        }
        // Handle Smartsheet tools
        else if (tool.includes('smartsheet')) {
          const sheetId = params.sheet_id || params.sheetId || params.SHEET_ID || '';
          const rowId = params.row_id || params.rowId || params.ROW_ID || '';
          
          const parts: string[] = [];
          if (sheetId) parts.push(`in sheet ${sheetId}`);
          if (rowId) parts.push(`for row ${rowId}`);
          
          instructionsText = parts.length > 0 
            ? `Execute Smartsheet action ${parts.join(' ')}.`
            : 'Execute Smartsheet action.';
        }
        // Handle calendar event tools
        else if (tool.includes('calendar') || (tool.includes('event') && !tool.includes('notion'))) {
          const title = params.summary || params.title || params.name || '';
          const start = params.start_time || params.startTime || params.start || '';
          const end = params.end_time || params.endTime || params.end || '';
          
          const parts: string[] = [];
          if (title) parts.push(`"${title}"`);
          if (start) parts.push(`starting at ${start}`);
          if (end) parts.push(`ending at ${end}`);
          
          instructionsText = parts.length > 0 
            ? `Create a calendar event ${parts.join(' ')}.`
            : 'Create a calendar event.';
        }
        // Handle generic tools - create natural instructions from parameters
        else {
          const instructionsParts: string[] = [];
          
          if (params.to || params.email) {
            const recipient = params.to || params.email;
            instructionsParts.push(`to ${recipient}`);
          }
          if (params.subject) {
            instructionsParts.push(`with subject "${params.subject}"`);
          }
          if (params.body || (params.message && !tool.includes('slack')) || params.content) {
            const content = params.body || params.message || params.content;
            instructionsParts.push(`with body "${typeof content === 'string' ? content.substring(0, 100) : JSON.stringify(content)}"`);
          }
          if (params.summary || params.title) {
            const title = params.summary || params.title;
            instructionsParts.push(`with title "${title}"`);
          }
          if (params.start_time || params.startTime || params.start) {
            instructionsParts.push(`starting at ${params.start_time || params.startTime || params.start}`);
          }
          if (params.end_time || params.endTime || params.end) {
            instructionsParts.push(`ending at ${params.end_time || params.endTime || params.end}`);
          }
          
          // For any remaining parameters, add them generically
          const handledKeys = new Set(['to', 'email', 'subject', 'body', 'message', 'content', 'summary', 'title', 'start_time', 'startTime', 'start', 'end_time', 'endTime', 'end']);
          const remainingParams = Object.entries(params)
            .filter(([key]) => !handledKeys.has(key))
            .map(([key, value]) => {
              const formattedValue = typeof value === 'string' ? value : JSON.stringify(value);
              return `${key} "${formattedValue}"`;
            });
          
          if (remainingParams.length > 0) {
            instructionsParts.push(`with ${remainingParams.join(', ')}`);
          }
          
          // Determine action verb based on tool name
          let actionVerb = 'Execute';
          if (tool.includes('create') || tool.includes('add')) {
            actionVerb = 'Create';
          } else if (tool.includes('update') || tool.includes('edit')) {
            actionVerb = 'Update';
          } else if (tool.includes('delete') || tool.includes('remove')) {
            actionVerb = 'Delete';
          } else if (tool.includes('find') || tool.includes('search') || tool.includes('get')) {
            actionVerb = 'Find';
          } else if (tool.includes('send')) {
            actionVerb = 'Send';
          }
          
          instructionsText = instructionsParts.length > 0 
            ? `${actionVerb} ${instructionsParts.join(' ')}.`
            : `${actionVerb} with parameters: ${Object.entries(params)
                .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
                .join(', ')}.`;
        }
        
        params = { instructions: instructionsText, ...params };
        console.log('✅ Constructed instructions:', instructionsText.substring(0, 200));
      } else if (!params.instructions) {
        // If no parameters at all, provide a default instruction
        params = { instructions: `Execute ${tool}` };
        console.log('⚠️ No parameters provided, using default instructions');
      }
      
      // Build JSON-RPC request for Zapier
      const mcpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: tool,
          arguments: params,
        },
        id: Date.now(),
      };

      // Build headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      };

      // Add authentication if available
      if (serverConfig.accessToken) {
        headers['Authorization'] = `Bearer ${serverConfig.accessToken}`;
      }

      try {
        console.log(`🔍 Calling Zapier MCP tool: ${tool} with params:`, params);
        console.log(`🔍 Zapier MCP URL: ${zapierUrl}`);
        const response = await fetch(zapierUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(mcpRequest),
        });

        // Read response as text first (can only read once)
        // Zapier MCP may return SSE format even if content-type doesn't indicate it
        const responseText = await response.text();
        
        if (!response.ok) {
          console.error(`❌ Zapier MCP error response:`, { status: response.status, statusText: response.statusText, body: responseText.substring(0, 500) });
          throw new Error(`Zapier MCP server returned ${response.status}: ${responseText.substring(0, 500)}`);
        }
        
        console.log('🔍 Raw Zapier response (first 500 chars):', responseText.substring(0, 500));
        
        // Check if response is SSE (Server-Sent Events) format
        const contentType = response.headers.get('content-type') || '';
        const isSSE = contentType.includes('text/event-stream') || 
                      contentType.includes('text/plain') ||
                      responseText.includes('event:') || 
                      responseText.includes('data:');
        
        let result: any;
        
        if (isSSE) {
          // Handle SSE format response
          console.log('🔍 Zapier MCP returned SSE format, parsing...');
          
          // Parse SSE format - look for "data: {...}" patterns
          // SSE format can be:
          // 1. "event: message\ndata: {...}\n\n"
          // 2. "data: {...}\n\n"
          // 3. Multiple data chunks
          
          // Try to find all data chunks - handle both with and without leading newline
          const dataMatches = Array.from(responseText.matchAll(/(?:^|\n)data:\s*(\{[\s\S]*?\})\s*(?:\n|$)/gm));
          
          if (dataMatches.length > 0) {
            // Use the last data chunk (most complete result)
            const lastDataChunk = dataMatches[dataMatches.length - 1][1];
            try {
              result = JSON.parse(lastDataChunk);
              console.log('✅ Parsed SSE data chunk successfully');
            } catch (e) {
              console.error('❌ Failed to parse SSE data chunk:', e);
              // Try to extract JSON more carefully - handle multi-line JSON
              const jsonMatch = lastDataChunk.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  result = JSON.parse(jsonMatch[0]);
                  console.log('✅ Parsed JSON from SSE after extraction');
                } catch (e2) {
                  console.error('❌ Failed to parse extracted JSON:', e2);
                  throw new Error(`Zapier MCP returned invalid JSON in SSE response. Response preview: ${responseText.substring(0, 300)}`);
                }
              } else {
                throw new Error(`Zapier MCP returned invalid SSE format. Response preview: ${responseText.substring(0, 300)}`);
              }
            }
          } else {
            // Try alternative format: look for any JSON object in the response
            const jsonMatch = responseText.match(/\{[\s\S]*"jsonrpc"[\s\S]*\}/) || 
                             responseText.match(/\{[\s\S]*"result"[\s\S]*\}/) || 
                             responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                result = JSON.parse(jsonMatch[0]);
                console.log('✅ Parsed JSON from alternative format');
              } catch (e) {
                console.error('❌ Failed to parse alternative JSON format:', e);
                throw new Error(`Zapier MCP returned invalid SSE format. Response preview: ${responseText.substring(0, 300)}`);
              }
            } else {
              console.error('❌ Failed to find JSON in SSE response:', responseText.substring(0, 300));
              throw new Error(`Zapier MCP returned invalid SSE format. Response preview: ${responseText.substring(0, 300)}`);
            }
          }
        } else {
          // Regular JSON response
          try {
            result = JSON.parse(responseText);
            console.log('✅ Parsed JSON response successfully');
          } catch (e) {
            console.error('❌ Failed to parse JSON response:', e);
            throw new Error(`Zapier MCP returned invalid JSON format. Response preview: ${responseText.substring(0, 300)}`);
          }
        }
        
        // Check for errors in JSON-RPC response
        if (result.error) {
          const errorMessage = result.error.message || `Zapier MCP error ${result.error.code || 'unknown'}`;
          console.error('❌ Zapier MCP returned error:', result.error);
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
              console.warn('⚠️ Failed to parse Zapier content text, using original result:', e);
            }
          }
        }
        
        console.log('✅ Zapier MCP execution completed successfully');
        console.log('🔍 Zapier MCP result:', JSON.stringify(resultData, null, 2).substring(0, 500));
        results.push({
          server: 'Zapier',
          tool: tool,
          success: true,
          data: resultData,
        });
        
        state.variables.lastOutput = resultData;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Zapier execution error:', error);
        results.push({
          server: 'Zapier',
          error: errorMessage,
          success: false,
        });
      }
    } else {
      // Generic MCP server support (DeepWiki, etc.)
      console.log('🔍 Unknown MCP server, trying generic handler:', serverConfig.name);
      console.log('🔍 Server config details:', JSON.stringify(serverConfig, null, 2));
      try {
        const result = await executeGenericMCPServer(serverConfig, state);
        results.push({
          server: serverConfig.name,
          tool: result.tool || 'unknown',
          success: true,
          data: result.data,
        });
        state.variables.lastOutput = result.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`${serverConfig.name} execution error:`, error);
        results.push({
          server: serverConfig.name,
          error: errorMessage,
          success: false,
        });
      }
    }
  }

  return {
    results,
    mcpServers: mcpServers.map(s => s.name),
  };
}

