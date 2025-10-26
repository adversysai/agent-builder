/**
 * Tavily MCP Integration
 * Advanced web search capabilities for agents
 */

export interface TavilyMCPConfig {
  name: string;
  url: string;
  authType: 'url';
  label: string;
  description: string;
  category: 'web-search';
  capabilities: string[];
  apiKey: string;
}

export interface TavilySearchParams {
  query: string;
  search_depth?: 'basic' | 'advanced';
  include_answer?: boolean;
  include_images?: boolean;
  include_raw_content?: boolean;
  max_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
  days?: number;
}

export interface TavilyExtractParams {
  url: string;
  include_raw_content?: boolean;
}

export interface TavilyCrawlParams {
  urls: string[];
  crawler_mode?: 'crawl' | 'scrape';
  limit?: number;
  include_raw_content?: boolean;
}

export interface TavilyMapParams {
  url: string;
  search_depth?: 'basic' | 'advanced';
  limit?: number;
}

/**
 * Tavily MCP Tool Configuration
 */
export const TAVILY_MCP_CONFIG: TavilyMCPConfig = {
  name: 'Tavily',
  url: 'https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}',
  authType: 'url',
  label: 'Tavily',
  description: 'Advanced web search and content extraction',
  category: 'web-search',
  capabilities: ['search', 'extract', 'crawl', 'map'],
  apiKey: process.env.TAVILY_API_KEY || ''
};

/**
 * Tavily MCP Tool Registry Entry
 */
export const TAVILY_MCP_TOOL = {
  name: 'Tavily',
  url: TAVILY_MCP_CONFIG.url.replace('{TAVILY_API_KEY}', TAVILY_MCP_CONFIG.apiKey),
  authType: 'url',
  label: 'Tavily',
  description: 'Advanced web search and content extraction',
  category: 'web-search',
  capabilities: ['search', 'extract', 'crawl', 'map'],
  requirements: { apiKey: 'TAVILY_API_KEY' },
  examples: [
    {
      name: 'Web Search',
      description: 'Search the web for information',
      input: { query: 'latest AI developments', max_results: 5 },
      output: { results: [], answer: '...' }
    },
    {
      name: 'Content Extraction',
      description: 'Extract content from a specific URL',
      input: { url: 'https://example.com/article' },
      output: { content: '...', title: '...', metadata: {} }
    },
    {
      name: 'News Search',
      description: 'Search for recent news articles',
      input: { query: 'AI startups', days: 7, max_results: 10 },
      output: { results: [], answer: '...' }
    }
  ]
};

/**
 * Tavily MCP Tool Executor
 */
export class TavilyMCPExecutor {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Execute Tavily search
   */
  async search(params: TavilySearchParams): Promise<any> {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          query: params.query,
          search_depth: params.search_depth || 'basic',
          include_answer: params.include_answer || true,
          include_images: params.include_images || false,
          include_raw_content: params.include_raw_content || false,
          max_results: params.max_results || 5,
          include_domains: params.include_domains || [],
          exclude_domains: params.exclude_domains || [],
          days: params.days || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Tavily search failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tavily search error:', error);
      throw new Error(`Tavily search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute Tavily extract
   */
  async extract(params: TavilyExtractParams): Promise<any> {
    try {
      const response = await fetch('https://api.tavily.com/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          url: params.url,
          include_raw_content: params.include_raw_content || false
        })
      });

      if (!response.ok) {
        throw new Error(`Tavily extract failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tavily extract error:', error);
      throw new Error(`Tavily extract failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute Tavily crawl
   */
  async crawl(params: TavilyCrawlParams): Promise<any> {
    try {
      const response = await fetch('https://api.tavily.com/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          urls: params.urls,
          crawler_mode: params.crawler_mode || 'crawl',
          limit: params.limit || 10,
          include_raw_content: params.include_raw_content || false
        })
      });

      if (!response.ok) {
        throw new Error(`Tavily crawl failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tavily crawl error:', error);
      throw new Error(`Tavily crawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute Tavily map
   */
  async map(params: TavilyMapParams): Promise<any> {
    try {
      const response = await fetch('https://api.tavily.com/map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          url: params.url,
          search_depth: params.search_depth || 'basic',
          limit: params.limit || 10
        })
      });

      if (!response.ok) {
        throw new Error(`Tavily map failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tavily map error:', error);
      throw new Error(`Tavily map failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Tavily MCP Tool Integration for Dexflow
 */
export class TavilyMCPIntegration {
  private executor: TavilyMCPExecutor;

  constructor(apiKey: string) {
    this.executor = new TavilyMCPExecutor(apiKey);
  }

  /**
   * Get Tavily MCP tool configuration for agents
   */
  getMCPToolConfig(): any {
    return {
      name: 'Tavily',
      url: `https://mcp.tavily.com/mcp/?tavilyApiKey=${this.executor['apiKey']}`,
      authType: 'url',
      label: 'Tavily',
      description: 'Advanced web search and content extraction',
      capabilities: ['search', 'extract', 'crawl', 'map']
    };
  }

  /**
   * Execute Tavily tool based on action
   */
  async executeTool(action: string, params: any): Promise<any> {
    switch (action) {
      case 'search':
        return await this.executor.search(params);
      case 'extract':
        return await this.executor.extract(params);
      case 'crawl':
        return await this.executor.crawl(params);
      case 'map':
        return await this.executor.map(params);
      default:
        throw new Error(`Unknown Tavily action: ${action}`);
    }
  }

  /**
   * Get tool suggestions based on user intent
   */
  getToolSuggestions(userIntent: string): string[] {
    const suggestions: string[] = [];
    const lowerIntent = userIntent.toLowerCase();

    if (lowerIntent.includes('search') || lowerIntent.includes('find') || lowerIntent.includes('look up')) {
      suggestions.push('search');
    }

    if (lowerIntent.includes('extract') || lowerIntent.includes('content') || lowerIntent.includes('article')) {
      suggestions.push('extract');
    }

    if (lowerIntent.includes('crawl') || lowerIntent.includes('multiple') || lowerIntent.includes('pages')) {
      suggestions.push('crawl');
    }

    if (lowerIntent.includes('map') || lowerIntent.includes('structure') || lowerIntent.includes('sitemap')) {
      suggestions.push('map');
    }

    return suggestions;
  }

  /**
   * Generate example usage for agents
   */
  getExampleUsage(): string {
    return `
# Tavily MCP Tool Usage Examples

## Web Search
- "Search for recent AI developments"
- "Find information about climate change"
- "Look up the latest news about Tesla"

## Content Extraction
- "Extract content from https://example.com/article"
- "Get the main content from this webpage"
- "Summarize this article"

## Website Crawling
- "Crawl multiple pages from this website"
- "Get content from all pages in this domain"
- "Extract data from multiple URLs"

## Website Mapping
- "Map the structure of this website"
- "Get all pages from this domain"
- "Find all links on this website"
    `.trim();
  }
}

/**
 * Initialize Tavily MCP integration
 */
export function initializeTavilyMCP(apiKey: string): TavilyMCPIntegration {
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is required for Tavily MCP integration');
  }
  
  return new TavilyMCPIntegration(apiKey);
}

/**
 * Get Tavily MCP tool for agent configuration
 */
export function getTavilyMCPTool(apiKey: string): any {
  return {
    name: 'Tavily',
    url: `https://mcp.tavily.com/mcp/?tavilyApiKey=${apiKey}`,
    authType: 'url',
    label: 'Tavily',
    description: 'Advanced web search and content extraction',
    category: 'web-search',
    capabilities: ['search', 'extract', 'crawl', 'map'],
    requirements: { apiKey: 'TAVILY_API_KEY' }
  };
}
