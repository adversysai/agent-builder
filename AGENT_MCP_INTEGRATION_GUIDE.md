# 🤖 Agent MCP Integration Guide

## ✅ **Problem Solved**

**Issue**: Agents in workflows were getting "MCP server not implemented" errors and couldn't use MCP tools.

**Root Cause**: Agent nodes weren't properly configured with MCP server information.

**Solution**: Comprehensive MCP integration system that allows agents to use MCP tools like Tavily web search.

## 🔧 **Technical Implementation**

### **1. MCP Server Configuration**
- ✅ **Tavily MCP Server**: Properly configured and connected
- ✅ **Database Integration**: MCP servers stored in database with tools
- ✅ **API Key Management**: TAVILY_API_KEY properly configured
- ✅ **Connection Testing**: MCP servers can be tested and validated

### **2. Agent Node MCP Integration**
- ✅ **MCP Tools Array**: Agents can have `mcpTools` configuration
- ✅ **MCP Server IDs**: Agents can reference MCP servers by ID
- ✅ **Tool Resolution**: `resolveMCPServers()` function resolves server configurations
- ✅ **API Key Substitution**: Placeholders like `{TAVILY_API_KEY}` are replaced

### **3. Workflow Execution**
- ✅ **Agent Executor**: `executeAgentNode()` supports MCP tools
- ✅ **Anthropic SDK**: Native MCP support via `mcp_servers` parameter
- ✅ **Tool Calling**: Agents can call MCP tools during execution
- ✅ **Error Handling**: Proper error handling for MCP failures

## 🚀 **How to Use MCP with Agents**

### **Method 1: Configure Agent Nodes with MCP Tools**

```typescript
// Agent node with MCP configuration
{
  id: "web-search-agent",
  type: "agent",
  data: {
    nodeName: "Web Search Agent",
    instructions: "Search the web for information and provide insights",
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    mcpTools: [
      {
        name: "Tavily",
        url: "https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}",
        description: "Web search and content extraction",
        authType: "url",
        accessToken: null,
        availableTools: ["search", "extract", "crawl", "map"]
      }
    ],
    mcpServerIds: ["tavily-server-id"]
  }
}
```

### **Method 2: Use MCP Server IDs**

```typescript
// Agent node with MCP server reference
{
  id: "research-agent",
  type: "agent",
  data: {
    nodeName: "Research Agent",
    instructions: "Use web search to research topics",
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    mcpServerIds: ["tavily-server-id"]
  }
}
```

### **Method 3: Auto-Configure with MCP Selector**

```typescript
// Use MCP selector to auto-configure agents
import { analyzePromptForTools, configureAgentWithMCPTools } from '@/lib/workflow/mcp/mcp-selector';

const requiredTools = analyzePromptForTools("Search for the latest AI news");
const configuredAgent = configureAgentWithMCPTools(agentNode, requiredTools);
```

## 🎯 **Available MCP Tools**

### **Tavily Web Search**
- **Search**: Search the web for information
- **Extract**: Extract content from specific URLs
- **Crawl**: Crawl websites for comprehensive data
- **Map**: Map website structure and content

### **Usage Examples**
```typescript
// Agent instructions that trigger MCP usage
"Search the web for the latest AI developments"
"Find information about machine learning trends"
"Research the current state of artificial intelligence"
"Look up recent news about OpenAI and Anthropic"
```

## 🔍 **Troubleshooting**

### **Common Issues and Solutions**

#### **1. "MCP server not implemented" Error**
- **Cause**: Agent node doesn't have MCP configuration
- **Solution**: Add `mcpTools` or `mcpServerIds` to agent node data

#### **2. "TAVILY_API_KEY not configured" Error**
- **Cause**: API key not set in environment
- **Solution**: Add `TAVILY_API_KEY=your_key_here` to `.env.local`

#### **3. "No MCP servers configured" Error**
- **Cause**: MCP server resolution failed
- **Solution**: Check MCP server exists in database and is enabled

#### **4. "Connection error while communicating with MCP server" Error**
- **Cause**: MCP server URL or authentication issue
- **Solution**: Verify MCP server configuration and API key

### **Debug Steps**

1. **Check MCP Server Status**:
   ```bash
   # Test MCP server connection
   curl -X POST http://localhost:3000/api/test-mcp-connection \
     -H "Content-Type: application/json" \
     -d '{"url": "https://mcp.tavily.com/mcp/?tavilyApiKey=YOUR_KEY"}'
   ```

2. **Verify Agent Configuration**:
   ```typescript
   // Check agent node has MCP tools
   console.log('MCP Tools:', agentNode.data.mcpTools);
   console.log('MCP Server IDs:', agentNode.data.mcpServerIds);
   ```

3. **Check API Key Configuration**:
   ```bash
   # Verify API key is set
   echo $TAVILY_API_KEY
   ```

## 📊 **Testing MCP Integration**

### **1. Create Test Workflow**
```typescript
const testWorkflow = {
  name: "MCP Test Workflow",
  nodes: [
    {
      id: "start",
      type: "start",
      data: { nodeName: "Start" }
    },
    {
      id: "agent",
      type: "agent",
      data: {
        nodeName: "Web Search Agent",
        instructions: "Search for the latest AI news",
        mcpTools: [/* Tavily configuration */]
      }
    },
    {
      id: "end",
      type: "end",
      data: { nodeName: "End" }
    }
  ],
  edges: [
    { id: "e1", source: "start", target: "agent" },
    { id: "e2", source: "agent", target: "end" }
  ]
};
```

### **2. Execute and Monitor**
- Execute the workflow
- Check execution logs for MCP tool usage
- Verify agents can access web search capabilities
- Monitor for any MCP-related errors

## 🎉 **Success Indicators**

### **✅ Working MCP Integration**
- Agents can execute without "MCP server not implemented" errors
- Web search tools are available to agents
- MCP tool calls appear in execution logs
- Agents can access real-time web information

### **✅ Performance Metrics**
- MCP tool calls complete successfully
- Web search results are relevant and current
- Agent responses include web-sourced information
- No authentication or connection errors

## 🚀 **Next Steps**

1. **Create MCP-Enabled Workflows**: Build workflows with agents that use web search
2. **Test Different MCP Tools**: Experiment with various MCP capabilities
3. **Monitor Performance**: Track MCP tool usage and effectiveness
4. **Expand MCP Integration**: Add more MCP servers and tools
5. **Optimize Agent Instructions**: Craft instructions that effectively use MCP tools

**The agent MCP integration is now fully functional!** 🎯✨🚀
