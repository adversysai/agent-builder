# 🔧 Zapier MCP Setup Guide

## 📋 Quick Setup Instructions

### Step 1: Add Zapier MCP Keys to `.env.local`

Based on your Zapier MCP server configuration, add the following to your `.env.local` file:

```bash
# Zapier MCP Integration
# Option 1: Server-specific URL (Recommended - contains auth info)
ZAPIER_MCP_SERVER_URL=https://mcp.zapier.com/api/mcp/s/YOUR_SERVER_ID/mcp

# Option 2: OAuth URL (Alternative - if using OAuth flow)
ZAPIER_MCP_OAUTH_URL=https://mcp.zapier.com/api/mcp/a/25145908/mcp?serverId=YOUR_SERVER_ID
```

**Note:** Replace `YOUR_SERVER_ID` with your actual Zapier MCP server ID from the Zapier dashboard.

### Step 2: Add Zapier MCP Server via Settings UI

1. **Open your Dexflow app**
2. **Navigate to Settings** → **MCP Servers**
3. **Click "Add MCP Server"**
4. **Fill in the form:**
   ```
   Name: Zapier
   URL: https://mcp.zapier.com/api/mcp/s/YOUR_SERVER_ID/mcp
   Description: Connect to 8,000+ apps via Zapier integrations
   Category: automation
   Authentication: Bearer Token (or None if URL contains auth)
   Access Token: (Leave empty if URL contains auth, or add Bearer token if needed)
   ```
5. **Click "Test Connection"** to discover available tools
6. **Click "Add to Registry"** to save

### Step 3: Verify Integration

After adding the Zapier MCP server:

1. **Check Tools Discovery**: The test connection should discover all your configured Zapier tools (Browse AI, Screenshot API, Google Drive, Gmail, Slack, etc.)
2. **Use in Workflows**: Add an MCP node to your workflow and select "Zapier" from the dropdown
3. **Test a Simple Action**: Try creating a task or sending a message via Zapier

---

## 🔍 What You Need from Zapier

From your Zapier MCP server dashboard, you'll need:

1. **Server-Specific URL** (from "Connect with server-specific URL" section):
   - Format: `https://mcp.zapier.com/api/mcp/s/•••••••/mcp`
   - This URL contains authentication info
   - **Treat this like a password!** It can access your Zapier data

2. **OAuth URL** (Optional - from "Connect with OAuth" section):
   - Format: `https://mcp.zapier.com/api/mcp/a/25145908/mcp?serverId=YOUR_SERVER_ID`
   - Use this if you want OAuth authentication flow

3. **Transport Type**: Streamable HTTP (already configured)

4. **Configured Tools**: Your selected integrations (Browse AI, Google Drive, Gmail, Slack, etc.)

---

## 📝 Environment Variables Reference

### Required Variables

Add these to your `.env.local` file:

```bash
# Zapier MCP Server URL (Server-specific URL - contains auth)
ZAPIER_MCP_SERVER_URL=https://mcp.zapier.com/api/mcp/s/YOUR_SERVER_ID/mcp
```

### Alternative: OAuth URL

If you prefer OAuth authentication:

```bash
# Zapier MCP OAuth URL
ZAPIER_MCP_OAUTH_URL=https://mcp.zapier.com/api/mcp/a/25145908/mcp?serverId=YOUR_SERVER_ID
```

**Note:** The code will automatically use `ZAPIER_MCP_SERVER_URL` if available, otherwise fall back to `ZAPIER_MCP_OAUTH_URL`.

---

## 🎯 Configuration Options

### Option 1: Server-Specific URL (Recommended)

**Pros:**
- ✅ Simple setup - just paste the URL
- ✅ No separate token management
- ✅ URL contains authentication info

**Cons:**
- ⚠️ URL is sensitive (like a password)
- ⚠️ Must be kept secure

**Setup:**
1. Copy the server-specific URL from Zapier dashboard
2. Add to `.env.local` as `ZAPIER_MCP_SERVER_URL`
3. Add MCP server in Settings UI with this URL
4. Set Authentication to "None" (URL contains auth)

### Option 2: OAuth URL

**Pros:**
- ✅ More secure OAuth flow
- ✅ Better for production environments
- ✅ User-specific authentication

**Cons:**
- ⚠️ Requires OAuth implementation
- ⚠️ More complex setup

**Setup:**
1. Copy the OAuth URL from Zapier dashboard
2. Add to `.env.local` as `ZAPIER_MCP_OAUTH_URL`
3. Implement OAuth flow (optional)
4. Add MCP server in Settings UI with OAuth URL

---

## 🚀 Testing the Integration

### Test Connection

1. **In Settings UI:**
   - Click "Test Connection" when adding/editing Zapier MCP server
   - Should discover all your configured Zapier tools
   - Tools should appear: Browse AI (3), Screenshot API (2), Google Drive (21), Gmail (12), Slack (31), etc.

### Test in Workflow

1. **Create a Test Workflow:**
   - Add an MCP node
   - Select "Zapier" as the MCP server
   - Choose a tool (e.g., "Gmail - Send Email")
   - Configure parameters
   - Run the workflow

### Expected Behavior

- ✅ Connection test discovers tools
- ✅ MCP node can execute Zapier tools
- ✅ Results are returned correctly
- ✅ Errors are logged properly

---

## 🔧 Troubleshooting

### Issue: "Connection failed" when testing

**Solutions:**
1. Check that the URL is correct (no extra spaces)
2. Verify the server ID is correct
3. Ensure the URL hasn't expired (refresh in Zapier dashboard)
4. Check that Zapier MCP server is enabled

### Issue: "No tools discovered"

**Solutions:**
1. Verify tools are configured in Zapier dashboard
2. Check that the server URL is correct
3. Try refreshing the connection test
4. Verify authentication is working

### Issue: "Authentication failed"

**Solutions:**
1. If using server-specific URL, ensure it's not expired
2. If using OAuth, verify OAuth flow is complete
3. Check that Bearer token is correct (if using)
4. Try regenerating the server URL in Zapier

### Issue: "Tool execution failed"

**Solutions:**
1. Check tool parameters are correct
2. Verify the Zapier integration is properly connected
3. Check Zapier logs for errors
4. Ensure the tool is enabled in Zapier dashboard

---

## 📚 Additional Resources

- [Zapier MCP Documentation](https://zapier.com/developer-platform)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Zapier Integrations](https://zapier.com/apps)

---

## 🎉 Next Steps

After setup:

1. ✅ **Test Connection** - Verify tools are discovered
2. ✅ **Create Test Workflow** - Try a simple Zapier action
3. ✅ **Explore Integrations** - Test different Zapier tools
4. ✅ **Build Workflows** - Create automated workflows using Zapier MCP

**Questions?** Check the main implementation guide: `ZAPIER_MCP_IMPLEMENTATION_ANALYSIS.md`

