# 🎯 Proper Tavily MCP Implementation Guide

## ✅ **Hard-coded Version Removed**

The hard-coded Tavily MCP server has been successfully removed from the database. Now we'll implement it properly through the settings interface.

## 🔍 **Current MCP Implementation Analysis**

### **MCP Settings Interface Flow:**
1. **Settings Panel** (`SettingsPanelSimple.tsx`) - Main settings interface
2. **MCP Hooks** (`useMCPServers.ts`) - Database operations
3. **API Endpoints** (`/api/database/mcp-servers`) - Server-side operations
4. **Add MCP Modal** - User interface for adding MCP servers

### **Key Components:**
- **`useMCPServers()`** - Get user's MCP servers
- **`useAddMCPServer()`** - Add new MCP server
- **`useUpdateMCPServer()`** - Update existing MCP server
- **`useDeleteMCPServer()`** - Delete MCP server
- **`useToggleMCPEnabled()`** - Enable/disable MCP server

## 🚀 **Step-by-Step Implementation**

### **Step 1: Access Settings Panel**
1. Open your workflow builder
2. Click the **"Settings"** button
3. Navigate to the **"MCP Servers"** section

### **Step 2: Add Tavily MCP Server**
1. Click **"Add MCP Server"** button
2. Fill in the following details:

#### **Basic Information:**
```
Name: Tavily
URL: https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}
Description: Advanced web search and content extraction
Category: web-search
```

#### **Authentication:**
```
Auth Type: url
Access Token: (leave empty)
```

### **Step 3: Test Connection**
1. Click **"Test Connection"** button
2. This should discover the available tools:
   - `search` - Web search functionality
   - `extract` - Content extraction
   - `crawl` - Website crawling
   - `map` - Website mapping

### **Step 4: Save and Enable**
1. Click **"Save"** to add the MCP server
2. Ensure it's **enabled** (toggle should be on)
3. The server should appear in your MCP servers list

## 🔧 **Technical Implementation Details**

### **Database Schema:**
```sql
CREATE TABLE "mcpServer" (
  id VARCHAR PRIMARY KEY,
  userId VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  url VARCHAR NOT NULL,
  description VARCHAR,
  category VARCHAR,
  authType VARCHAR,
  accessToken VARCHAR,
  tools VARCHAR[],
  enabled BOOLEAN DEFAULT true,
  connectionStatus VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### **API Endpoints:**
- **GET** `/api/database/mcp-servers?userId={userId}` - List user's MCP servers
- **POST** `/api/database/mcp-servers` - Add MCP server
- **PUT** `/api/database/mcp-servers/{id}` - Update MCP server
- **DELETE** `/api/database/mcp-servers/{id}` - Delete MCP server
- **PATCH** `/api/database/mcp-servers/{id}` - Toggle enabled status

### **Hooks Usage:**
```typescript
// Get MCP servers
const { mcpServers } = useMCPServers();

// Add MCP server
const { addMCPServer } = useAddMCPServer();
await addMCPServer({
  userId: user.id,
  name: 'Tavily',
  url: 'https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}',
  description: 'Advanced web search and content extraction',
  category: 'web-search',
  authType: 'url'
});

// Update MCP server
const { updateMCPServer } = useUpdateMCPServer();
await updateMCPServer({
  id: serverId,
  name: 'Updated Name',
  // ... other updates
});

// Delete MCP server
const { deleteMCPServer } = useDeleteMCPServer();
await deleteMCPServer({ id: serverId });

// Toggle enabled status
const { toggleMCPEnabled } = useToggleMCPEnabled();
await toggleMCPEnabled({ id: serverId });
```

## 🎯 **Usage in Workflows**

### **1. In Agent Nodes:**
```typescript
// Agent node configuration
{
  "type": "agent",
  "data": {
    "instructions": "Search for the latest AI developments and provide a comprehensive summary",
    "mcpTools": [
      {
        "name": "Tavily",
        "tools": ["search", "extract"]
      }
    ]
  }
}
```

### **2. In MCP Nodes:**
```typescript
// MCP node configuration
{
  "type": "mcp",
  "data": {
    "mcpServerId": "tavily-server-id",
    "mcpAction": "search",
    "mcpParams": {
      "query": "{{input.searchQuery}}",
      "max_results": 5,
      "include_answer": true
    }
  }
}
```

### **3. Available Operations:**
- **Web Search**: `search` - Real-time web search
- **Content Extraction**: `extract` - Extract content from web pages
- **Website Crawling**: `crawl` - Crawl multiple pages
- **Website Mapping**: `map` - Map website structures

## 🔧 **Configuration Examples**

### **Tavily MCP Server Configuration:**
```json
{
  "name": "Tavily",
  "url": "https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}",
  "description": "Advanced web search and content extraction",
  "category": "web-search",
  "authType": "url",
  "tools": ["search", "extract", "crawl", "map"],
  "enabled": true
}
```

### **Search Parameters:**
```json
{
  "query": "latest AI developments",
  "max_results": 5,
  "include_answer": true,
  "days": 7,
  "include_domains": ["techcrunch.com", "wired.com"],
  "exclude_domains": ["spam.com"]
}
```

### **Extract Parameters:**
```json
{
  "url": "https://example.com/article",
  "include_raw_content": false
}
```

### **Crawl Parameters:**
```json
{
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "crawler_mode": "crawl",
  "limit": 10
}
```

### **Map Parameters:**
```json
{
  "url": "https://example.com",
  "search_depth": "basic",
  "limit": 10
}
```

## 🎉 **Benefits of Proper Implementation**

### **✅ User Management:**
- **User-specific**: Each user can have their own MCP servers
- **Secure**: API keys are handled properly
- **Persistent**: Settings are saved to database

### **✅ UI Integration:**
- **Visual Interface**: Easy to add, edit, and manage MCP servers
- **Test Connection**: Verify MCP servers work before saving
- **Tool Discovery**: Automatically discovers available tools
- **Enable/Disable**: Toggle MCP servers on/off

### **✅ Workflow Integration:**
- **Agent Nodes**: Can use Tavily MCP tools
- **MCP Nodes**: Can execute Tavily operations
- **Dropdown Selection**: Shows up in MCP selection dropdowns
- **Tool Management**: Easy to configure and use

## 🚀 **Ready to Use**

After implementing Tavily MCP through the settings interface, you'll have:

- ✅ **Proper Integration**: Fully integrated with the UI
- ✅ **User Management**: Tied to your user account
- ✅ **Tool Discovery**: Automatically discovers available tools
- ✅ **Easy Management**: Can be enabled/disabled, edited, or removed
- ✅ **Visual Interface**: Shows up in dropdowns and selection menus

**This is the correct and proper way to implement Tavily MCP in your agent builder!** 🎯✨🚀
