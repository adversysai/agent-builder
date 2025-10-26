# 🔍 Tavily MCP Integration Guide: Unstoppable Web Search

## 🎯 **Overview**

Based on the [Tavily MCP documentation](https://docs.tavily.com/documentation/mcp), Tavily provides an excellent MCP server for advanced web search capabilities. This guide shows how to integrate Tavily MCP into your agent builder system.

## 🔧 **What is Tavily MCP?**

**Tavily MCP** is a Model Context Protocol server that provides:

- **Advanced Web Search**: Real-time web search with sophisticated filtering
- **Content Extraction**: Extract main content from web pages
- **Domain-Specific Search**: Search within specific domains
- **News Search**: Find recent news articles
- **Website Crawling**: Crawl multiple pages from websites
- **Website Mapping**: Map website structure and links

## 🚀 **Integration Implementation**

### **1. Tavily MCP Tool Configuration**

```typescript
// Tavily MCP Tool Configuration
export const TAVILY_MCP_TOOL = {
  name: 'Tavily',
  url: 'https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}',
  authType: 'url',
  label: 'Tavily',
  description: 'Advanced web search and content extraction',
  category: 'web-search',
  capabilities: ['search', 'extract', 'crawl', 'map'],
  requirements: { apiKey: 'TAVILY_API_KEY' }
};
```

### **2. Tavily MCP Node Executor**

```typescript
// Execute Tavily MCP operations
export async function executeTavilyMCPNode(
  node: WorkflowNode,
  state: WorkflowState,
  apiKey?: string
): Promise<any> {
  const action = nodeData.mcpAction || 'search';
  const params = nodeData.mcpParams || {};
  
  switch (action) {
    case 'search':
      return await executeTavilySearch(apiKey, params);
    case 'extract':
      return await executeTavilyExtract(apiKey, params);
    case 'crawl':
      return await executeTavilyCrawl(apiKey, params);
    case 'map':
      return await executeTavilyMap(apiKey, params);
  }
}
```

### **3. Tavily API Integration**

```typescript
// Tavily Search API
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
      max_results: params.max_results || 5,
      days: params.days || undefined
    })
  });
  
  return await response.json();
}
```

## 🛠️ **Usage Examples**

### **1. Web Search Agent**

```typescript
// Agent with Tavily search capabilities
{
  "type": "agent",
  "data": {
    "instructions": "Search for the latest AI developments and provide a comprehensive summary",
    "mcpTools": [
      {
        "name": "Tavily",
        "url": "https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}",
        "authType": "url"
      }
    ]
  }
}
```

### **2. Content Extraction Workflow**

```typescript
// MCP node for content extraction
{
  "type": "mcp",
  "data": {
    "nodeType": "mcp",
    "label": "Extract Content",
    "mcpServers": [{
      "name": "Tavily",
      "url": "https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}",
      "authType": "url"
    }],
    "mcpAction": "extract",
    "mcpParams": {
      "url": "{{input.url}}"
    }
  }
}
```

### **3. News Research Workflow**

```typescript
// Multi-step news research
{
  "nodes": [
    {
      "id": "search-news",
      "type": "mcp",
      "data": {
        "mcpAction": "search",
        "mcpParams": {
          "query": "{{input.topic}}",
          "days": 7,
          "max_results": 10
        }
      }
    },
    {
      "id": "extract-articles",
      "type": "mcp", 
      "data": {
        "mcpAction": "extract",
        "mcpParams": {
          "urls": "{{search-news.results}}"
        }
      }
    }
  ]
}
```

## 🎯 **Tavily MCP Capabilities**

### **1. Web Search**
```typescript
// Search parameters
{
  "query": "latest AI developments",
  "search_depth": "advanced",
  "include_answer": true,
  "max_results": 5,
  "days": 7,
  "include_domains": ["techcrunch.com", "wired.com"],
  "exclude_domains": ["spam.com"]
}
```

### **2. Content Extraction**
```typescript
// Extract parameters
{
  "url": "https://example.com/article",
  "include_raw_content": false
}
```

### **3. Website Crawling**
```typescript
// Crawl parameters
{
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "crawler_mode": "crawl",
  "limit": 10,
  "include_raw_content": false
}
```

### **4. Website Mapping**
```typescript
// Map parameters
{
  "url": "https://example.com",
  "search_depth": "basic",
  "limit": 10
}
```

## 🔧 **Agent Integration Patterns**

### **1. Research Agent**
```typescript
// Agent that can research any topic
{
  "instructions": "Research the latest developments in AI and provide a comprehensive analysis",
  "mcpTools": [
    {
      "name": "Tavily",
      "capabilities": ["search", "extract"]
    }
  ]
}
```

### **2. News Monitoring Agent**
```typescript
// Agent that monitors news
{
  "instructions": "Monitor news about AI startups and provide daily summaries",
  "mcpTools": [
    {
      "name": "Tavily", 
      "capabilities": ["search", "extract", "crawl"]
    }
  ]
}
```

### **3. Content Analysis Agent**
```typescript
// Agent that analyzes web content
{
  "instructions": "Analyze web content and extract key insights",
  "mcpTools": [
    {
      "name": "Tavily",
      "capabilities": ["extract", "crawl", "map"]
    }
  ]
}
```

## 🚀 **Advanced Use Cases**

### **1. Competitive Intelligence**
```typescript
// Multi-step competitive analysis
const competitiveAnalysis = {
  steps: [
    "Search for competitor news",
    "Extract content from competitor websites", 
    "Map competitor website structure",
    "Analyze findings and generate report"
  ],
  tools: ["Tavily search", "Tavily extract", "Tavily map", "AI analysis"]
};
```

### **2. Market Research**
```typescript
// Market research workflow
const marketResearch = {
  steps: [
    "Search for market trends",
    "Extract industry reports",
    "Crawl relevant websites",
    "Synthesize market insights"
  ],
  tools: ["Tavily search", "Tavily extract", "Tavily crawl", "AI synthesis"]
};
```

### **3. Content Aggregation**
```typescript
// Content aggregation workflow
const contentAggregation = {
  steps: [
    "Search for relevant content",
    "Extract content from multiple sources",
    "Crawl additional pages",
    "Aggregate and summarize content"
  ],
  tools: ["Tavily search", "Tavily extract", "Tavily crawl", "AI synthesis"]
};
```

## 🔒 **Security & Configuration**

### **1. API Key Management**
```typescript
// Secure API key handling
const apiKeys = {
  tavily: process.env.TAVILY_API_KEY
};

if (!apiKeys.tavily) {
  throw new Error('TAVILY_API_KEY not configured');
}
```

### **2. Rate Limiting**
```typescript
// Rate limiting considerations
const rateLimits = {
  search: '100 requests/hour',
  extract: '50 requests/hour', 
  crawl: '20 requests/hour',
  map: '30 requests/hour'
};
```

### **3. Error Handling**
```typescript
// Robust error handling
try {
  const result = await executeTavilySearch(apiKey, params);
  return result;
} catch (error) {
  // Handle API errors
  // Implement retry logic
  // Provide fallback responses
}
```

## 🎉 **The Unstoppable Web Search Agent**

With Tavily MCP integration, your agents become **unstoppable web researchers**:

- ✅ **Real-time Search**: Access the latest web information
- ✅ **Content Extraction**: Extract structured data from any webpage
- ✅ **Website Crawling**: Process multiple pages automatically
- ✅ **Website Mapping**: Understand website structure and navigation
- ✅ **News Monitoring**: Track recent developments in any field
- ✅ **Competitive Intelligence**: Monitor competitors and market trends
- ✅ **Research Automation**: Automate complex research workflows

**Your agents can now:**
- Search the web for any information
- Extract content from any webpage
- Crawl entire websites for comprehensive data
- Map website structures for analysis
- Monitor news and trends in real-time
- Conduct competitive intelligence research
- Automate complex research workflows

The **Tavily MCP integration** transforms your agents into **powerful web research assistants** that can access, analyze, and synthesize information from across the entire web! 🔍✨🚀

## 📚 **References**

- [Tavily MCP Documentation](https://docs.tavily.com/documentation/mcp)
- [Tavily API Reference](https://docs.tavily.com/documentation/api-reference)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Anthropic Claude MCP Support](https://docs.anthropic.com/claude/mcp)
