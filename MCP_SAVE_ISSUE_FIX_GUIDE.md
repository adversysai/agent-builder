# 🔧 MCP Save Issue Fix Guide

## ✅ **Problem Identified**

**Issue**: Unable to test or save MCP servers in the settings interface.

**Root Cause**: The `mcpServer` database table is missing the `tools` and `lastError` columns that are required for storing discovered tools and error messages.

## 🔍 **Technical Details**

### **Missing Database Columns:**
- `tools` (TEXT[]) - Array to store discovered tools
- `lastError` (TEXT) - String to store error messages

### **Current Database Schema:**
```sql
CREATE TABLE "mcpServer" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  "connectionStatus" TEXT DEFAULT 'disconnected',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Required Database Schema:**
```sql
CREATE TABLE "mcpServer" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  "connectionStatus" TEXT DEFAULT 'disconnected',
  tools TEXT[],                    -- ← MISSING: Array of discovered tools
  "lastError" TEXT,                -- ← MISSING: Last error message
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🛠️ **Fix Required**

### **Step 1: Add Missing Columns**
Run these SQL commands in your database:

```sql
-- Add tools column (array of text)
ALTER TABLE "mcpServer" ADD COLUMN tools TEXT[];

-- Add lastError column (text)
ALTER TABLE "mcpServer" ADD COLUMN "lastError" TEXT;
```

### **Step 2: Verify the Changes**
After running the SQL commands, verify the columns were added:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mcpServer' 
AND column_name IN ('tools', 'lastError')
ORDER BY column_name;
```

Expected output:
```
 column_name | data_type
-------------+----------
 lastError   | text
 tools       | ARRAY
```

## 🎯 **How to Apply the Fix**

### **Option 1: Using Database Admin Interface**
1. Open your database admin interface (Neon Console, pgAdmin, etc.)
2. Navigate to your database
3. Run the SQL commands above
4. Verify the columns were added

### **Option 2: Using psql Command Line**
```bash
# Connect to your database
psql $DATABASE_URL

# Run the SQL commands
ALTER TABLE "mcpServer" ADD COLUMN tools TEXT[];
ALTER TABLE "mcpServer" ADD COLUMN "lastError" TEXT;

# Verify the changes
\dt "mcpServer"
```

### **Option 3: Using Database Migration Tool**
If you have a migration system, create a migration file:

```sql
-- Migration: Add MCP server columns
ALTER TABLE "mcpServer" ADD COLUMN tools TEXT[];
ALTER TABLE "mcpServer" ADD COLUMN "lastError" TEXT;
```

## 🧪 **Testing the Fix**

### **After applying the database changes:**

1. **Test MCP Connection:**
   ```bash
   node test-mcp-connection-and-save.js
   ```

2. **Expected Results:**
   - ✅ MCP connection test successful
   - ✅ Connection status updated
   - ✅ Tools discovered and saved
   - ✅ Database update successful

3. **Verify in Settings Panel:**
   - Open the settings panel in your workflow builder
   - Navigate to MCP Servers section
   - Click "Test Connection" on Tavily MCP server
   - Verify it shows as "Connected" with discovered tools

## 🎉 **Expected Functionality After Fix**

### **✅ MCP Connection Testing:**
- **Test Connection**: Click "Test Connection" button
- **Tool Discovery**: Automatically discovers available tools
- **Status Update**: Updates connection status to "Connected"
- **Error Handling**: Shows error messages if connection fails

### **✅ MCP Server Management:**
- **Save Tools**: Discovered tools are saved to database
- **Error Storage**: Error messages are stored for debugging
- **Status Tracking**: Connection status is properly tracked
- **UI Updates**: Settings panel shows current status

### **✅ Workflow Integration:**
- **Tool Selection**: Available tools show up in dropdowns
- **Agent Integration**: Tools can be added to agent nodes
- **MCP Nodes**: Tools can be used in MCP nodes
- **Workflow Execution**: MCP tools work in workflows

## 🚀 **Next Steps After Fix**

1. **Apply Database Changes**: Run the SQL commands above
2. **Test MCP Connection**: Use the test script to verify
3. **Check Settings Panel**: Verify MCP servers show as connected
4. **Test in Workflows**: Create workflows using MCP tools
5. **Verify Tool Discovery**: Ensure tools are properly discovered and saved

## 🔧 **Troubleshooting**

### **If the fix doesn't work:**

1. **Check Database Connection**: Ensure your database is accessible
2. **Verify Column Addition**: Run the verification SQL to confirm columns exist
3. **Check API Logs**: Look for database errors in the terminal
4. **Test API Endpoints**: Use the test script to verify functionality

### **Common Issues:**

- **Permission Denied**: Ensure you have ALTER TABLE permissions
- **Column Already Exists**: The columns might already exist (check first)
- **Database Connection**: Verify DATABASE_URL is correct
- **Schema Lock**: Ensure no other processes are using the table

**Once the database columns are added, the MCP testing and saving functionality should work perfectly!** 🎯✨🚀
