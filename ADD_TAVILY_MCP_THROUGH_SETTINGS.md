# 🔧 Adding Tavily MCP Through Settings - Proper Method

## ✅ **You're Absolutely Right!**

Instead of hard-coding the Tavily MCP server, we should add it through the proper settings interface. Here's how to do it correctly:

## 🎯 **Step-by-Step Guide**

### **1. Open Settings Panel**
1. In your workflow builder, click the **"Settings"** button
2. Navigate to the **"MCP Servers"** section
3. You should see existing MCP servers listed

### **2. Add Tavily MCP Server**
1. Click the **"Add MCP Server"** button
2. Fill in the following details:

#### **Basic Information:**
- **Name**: `Tavily`
- **URL**: `https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}`
- **Description**: `Advanced web search and content extraction`
- **Category**: `web-search` (or `custom`)

#### **Authentication:**
- **Auth Type**: `url` (URL-based authentication)
- **Access Token**: Leave empty (not needed for URL-based auth)

### **3. Test Connection**
1. Click **"Test Connection"** to verify the MCP server works
2. This should discover the available tools:
   - `search` - Web search functionality
   - `extract` - Content extraction
   - `crawl` - Website crawling
   - `map` - Website mapping

### **4. Save Configuration**
1. Click **"Save"** to add the Tavily MCP server
2. The server should now appear in your MCP servers list
3. Make sure it's **enabled** (toggle should be on)

## 🔧 **Alternative: Remove Hard-coded Version**

If you want to start fresh, you can:

1. **Remove the hard-coded Tavily MCP** from the database
2. **Add it properly through the settings interface**

### **Remove Hard-coded Version:**
```bash
# This will remove the hard-coded Tavily MCP
curl -X POST http://localhost:3000/api/database/mcp-servers \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup", "userId": "system-templates"}'
```

## 🎯 **Benefits of Using Settings Interface**

### **1. Proper Integration**
- ✅ **User Management**: MCP servers are tied to user accounts
- ✅ **Settings Persistence**: Configuration is saved properly
- ✅ **UI Integration**: Shows up in the MCP selection dropdowns
- ✅ **Tool Discovery**: Automatically discovers available tools

### **2. Better User Experience**
- ✅ **Visual Interface**: Easy to add, edit, and manage MCP servers
- ✅ **Test Connection**: Verify MCP servers work before saving
- ✅ **Tool Discovery**: See what tools are available
- ✅ **Enable/Disable**: Toggle MCP servers on/off

### **3. Proper Configuration**
- ✅ **User-specific**: Each user can have their own MCP servers
- ✅ **Secure**: API keys are handled properly
- ✅ **Persistent**: Settings are saved to database
- ✅ **Manageable**: Easy to update or remove

## 🚀 **How to Use Tavily MCP After Adding**

### **1. In Workflow Builder**
1. **Add Agent Node**: Create an agent node in your workflow
2. **Configure MCP Tools**: In the agent configuration, add Tavily MCP tools
3. **Set Instructions**: Write instructions that use web search capabilities

### **2. In MCP Nodes**
1. **Add MCP Node**: Create an MCP node in your workflow
2. **Select Tavily**: Choose Tavily from the MCP server dropdown
3. **Configure Action**: Set the action (search, extract, crawl, map)
4. **Set Parameters**: Configure search parameters

### **3. Available Operations**
- **Web Search**: `search` - Real-time web search
- **Content Extraction**: `extract` - Extract content from web pages
- **Website Crawling**: `crawl` - Crawl multiple pages
- **Website Mapping**: `map` - Map website structures

## 📋 **Example Configuration**

### **Tavily MCP Server Settings:**
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

### **Agent Node Configuration:**
```json
{
  "instructions": "Search for the latest AI developments and provide a comprehensive summary",
  "mcpTools": [
    {
      "name": "Tavily",
      "tools": ["search", "extract"]
    }
  ]
}
```

## 🎉 **Result**

By adding Tavily MCP through the settings interface, you get:

- ✅ **Proper Integration**: Fully integrated with the UI
- ✅ **User Management**: Tied to your user account
- ✅ **Tool Discovery**: Automatically discovers available tools
- ✅ **Easy Management**: Can be enabled/disabled, edited, or removed
- ✅ **Visual Interface**: Shows up in dropdowns and selection menus

**This is the correct way to add MCP servers to your agent builder!** 🎯✨🚀
