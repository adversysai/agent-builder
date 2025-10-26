/**
 * Tavily MCP Node Executor
 * Executes Tavily MCP tools in workflows
 */

import { WorkflowNode, WorkflowState } from '../types';
import { substituteVariables } from '../variable-substitution';
import { getServerAPIKeys } from '@/lib/api/config';

/**
 * Execute Tavily MCP Node
 * Handles Tavily search, extract, crawl, and map operations
 */
export async function executeTavilyMCPNode(
  node: WorkflowNode,
  state: WorkflowState,
  apiKey?: string
): Promise<any> {
  const { data } = node;
  const nodeData = data as any;
  
  // Get Tavily API key
  const apiKeys = getServerAPIKeys();
  const tavilyApiKey = apiKey || apiKeys.tavily || process.env.TAVILY_API_KEY;
  
  if (!tavilyApiKey) {
    throw new Error('TAVILY_API_KEY not configured. Add it to your .env.local file:\nTAVILY_API_KEY=your_key_here');
  }

  // Get the action and parameters
  const action = nodeData.mcpAction || 'search';
  const params = nodeData.mcpParams || {};
  
  // Substitute variables in parameters
  const substitutedParams = substituteVariables(params, state);
  
  console.log(`🔍 Executing Tavily ${action} with params:`, substitutedParams);

  try {
    let result: any;
    
    switch (action) {
      case 'search':
        result = await executeTavilySearch(tavilyApiKey, substitutedParams);
        break;
        
      case 'extract':
        result = await executeTavilyExtract(tavilyApiKey, substitutedParams);
        break;
        
      case 'crawl':
        result = await executeTavilyCrawl(tavilyApiKey, substitutedParams);
        break;
        
      case 'map':
        result = await executeTavilyMap(tavilyApiKey, substitutedParams);
        break;
        
      default:
        throw new Error(`Unknown Tavily action: ${action}`);
    }
    
    console.log('✅ Tavily MCP execution completed successfully');
    
    // Update state with result
    state.variables.lastOutput = result;
    
    return {
      results: [{
        server: 'Tavily',
        tool: action,
        success: true,
        data: result,
      }],
      output: result,
      mcpServers: ['Tavily'],
      toolCalls: [{
        name: `tavily_${action}`,
        arguments: substitutedParams,
        output: result,
      }],
    };
    
  } catch (error) {
    console.error('❌ Tavily MCP execution failed:', error);
    throw new Error(`Tavily ${action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute Tavily search
 */
async function executeTavilySearch(apiKey: string, params: any): Promise<any> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query: params.query,
      search_depth: params.search_depth || 'basic',
      include_answer: params.include_answer !== false,
      include_images: params.include_images || false,
      include_raw_content: params.include_raw_content || false,
      max_results: params.max_results || 5,
      include_domains: params.include_domains || [],
      exclude_domains: params.exclude_domains || [],
      days: params.days || undefined
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily search failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Execute Tavily extract
 */
async function executeTavilyExtract(apiKey: string, params: any): Promise<any> {
  const response = await fetch('https://api.tavily.com/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      url: params.url,
      include_raw_content: params.include_raw_content || false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily extract failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Execute Tavily crawl
 */
async function executeTavilyCrawl(apiKey: string, params: any): Promise<any> {
  const response = await fetch('https://api.tavily.com/crawl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      urls: Array.isArray(params.urls) ? params.urls : [params.urls],
      crawler_mode: params.crawler_mode || 'crawl',
      limit: params.limit || 10,
      include_raw_content: params.include_raw_content || false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily crawl failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Execute Tavily map
 */
async function executeTavilyMap(apiKey: string, params: any): Promise<any> {
  const response = await fetch('https://api.tavily.com/map', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      url: params.url,
      search_depth: params.search_depth || 'basic',
      limit: params.limit || 10
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily map failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Get Tavily MCP tool configuration for agent nodes
 */
export function getTavilyMCPToolConfig(apiKey: string): any {
  return {
    name: 'Tavily',
    url: `https://mcp.tavily.com/mcp/?tavilyApiKey=${apiKey}`,
    authType: 'url',
    label: 'Tavily',
    description: 'Advanced web search and content extraction',
    capabilities: ['search', 'extract', 'crawl', 'map']
  };
}

/**
 * Analyze prompt for Tavily tool needs
 */
export function analyzePromptForTavily(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  
  const tavilyKeywords = [
    'search', 'find', 'look up', 'web search', 'google', 'bing',
    'information', 'research', 'news', 'articles', 'recent',
    'latest', 'current', 'trending', 'what is', 'who is', 'when',
    'extract', 'content', 'article', 'crawl', 'multiple', 'pages',
    'map', 'structure', 'sitemap'
  ];
  
  return tavilyKeywords.some(keyword => lowerPrompt.includes(keyword));
}
