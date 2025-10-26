/**
 * Automatic MCP Tool Selection Logic
 * Determines which MCP tools to include based on workflow requirements
 */

export interface MCPToolConfig {
  name: string;
  url: string;
  authType: string;
  label: string;
  description?: string;
  category: 'web-scraping' | 'data-processing' | 'automation' | 'analysis';
}

/**
 * Available MCP tools configuration
 */
export const AVAILABLE_MCP_TOOLS: MCPToolConfig[] = [
  {
    name: 'Firecrawl',
    url: 'https://mcp.firecrawl.dev/{FIRECRAWL_API_KEY}/v2/mcp',
    authType: 'url',
    label: 'Firecrawl',
    description: 'Web scraping and content extraction',
    category: 'web-scraping'
  },
  {
    name: 'Browserbase',
    url: 'https://mcp.browserbase.com/{BROWSERBASE_API_KEY}/v1/mcp',
    authType: 'url',
    label: 'Browserbase',
    description: 'Browser automation and interaction',
    category: 'automation'
  },
  {
    name: 'E2B',
    url: 'https://mcp.e2b.dev/{E2B_API_KEY}/v1/mcp',
    authType: 'url',
    label: 'E2B',
    description: 'Code execution and sandboxed environments',
    category: 'data-processing'
  }
];

/**
 * Analyze user prompt to determine required MCP tools
 */
export function analyzePromptForMCPTools(prompt: string): MCPToolConfig[] {
  const lowerPrompt = prompt.toLowerCase();
  const requiredTools: MCPToolConfig[] = [];

  // Web scraping indicators
  const webScrapingKeywords = [
    'scrape', 'scraping', 'website', 'web page', 'extract data', 'crawl',
    'get content', 'fetch page', 'download page', 'parse html', 'web data',
    'site content', 'page content', 'web scraping', 'data extraction'
  ];

  // Browser automation indicators
  const automationKeywords = [
    'browser', 'automation', 'click', 'interact', 'navigate', 'form',
    'button', 'selenium', 'puppeteer', 'playwright', 'browser automation',
    'web automation', 'interact with', 'fill form', 'submit form'
  ];

  // Code execution indicators
  const codeExecutionKeywords = [
    'execute code', 'run code', 'python', 'javascript', 'script',
    'code execution', 'sandbox', 'compute', 'calculate', 'process data',
    'data analysis', 'algorithm', 'function', 'programming'
  ];

  // Check for web scraping needs
  if (webScrapingKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    const firecrawl = AVAILABLE_MCP_TOOLS.find(tool => tool.name === 'Firecrawl');
    if (firecrawl) {
      requiredTools.push(firecrawl);
    }
  }

  // Check for browser automation needs
  if (automationKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    const browserbase = AVAILABLE_MCP_TOOLS.find(tool => tool.name === 'Browserbase');
    if (browserbase) {
      requiredTools.push(browserbase);
    }
  }

  // Check for code execution needs
  if (codeExecutionKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    const e2b = AVAILABLE_MCP_TOOLS.find(tool => tool.name === 'E2B');
    if (e2b) {
      requiredTools.push(e2b);
    }
  }

  return requiredTools;
}

/**
 * Get MCP tool configuration for a specific tool name
 */
export function getMCPToolConfig(toolName: string): MCPToolConfig | null {
  return AVAILABLE_MCP_TOOLS.find(tool => tool.name === toolName) || null;
}

/**
 * Generate MCP tools array for agent nodes
 */
export function generateMCPToolsArray(requiredTools: MCPToolConfig[]): any[] {
  return requiredTools.map(tool => ({
    name: tool.name,
    url: tool.url,
    authType: tool.authType,
    label: tool.label,
    description: tool.description
  }));
}

/**
 * Determine if a workflow needs MCP tools based on node types
 */
export function analyzeWorkflowForMCPNeeds(workflow: any): MCPToolConfig[] {
  const requiredTools: MCPToolConfig[] = [];
  
  if (!workflow.nodes) return requiredTools;

  // Check each node for MCP needs
  for (const node of workflow.nodes) {
    const nodeType = node.data?.nodeType || node.type;
    
    // Agent nodes might need MCP tools
    if (nodeType === 'agent') {
      const instructions = node.data?.instructions || '';
      const tools = analyzePromptForMCPTools(instructions);
      requiredTools.push(...tools);
    }
    
    // MCP nodes explicitly need tools
    if (nodeType === 'mcp') {
      const mcpAction = node.data?.mcpAction || '';
      if (mcpAction.includes('scrape') || mcpAction.includes('web')) {
        const firecrawl = AVAILABLE_MCP_TOOLS.find(tool => tool.name === 'Firecrawl');
        if (firecrawl && !requiredTools.find(t => t.name === 'Firecrawl')) {
          requiredTools.push(firecrawl);
        }
      }
    }
  }

  // Remove duplicates
  return requiredTools.filter((tool, index, self) => 
    index === self.findIndex(t => t.name === tool.name)
  );
}

/**
 * Auto-configure agent nodes with appropriate MCP tools
 */
export function configureAgentWithMCPTools(agentNode: any, requiredTools: MCPToolConfig[]): any {
  if (requiredTools.length === 0) return agentNode;

  const mcpTools = generateMCPToolsArray(requiredTools);
  
  return {
    ...agentNode,
    data: {
      ...agentNode.data,
      mcpTools,
      mcpServerIds: mcpTools.map(tool => tool.name)
    }
  };
}
