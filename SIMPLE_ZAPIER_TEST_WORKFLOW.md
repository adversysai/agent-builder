# Simple Zapier Test Workflow Guide

## ✅ Verified Working Tools

Based on direct testing, these tools work correctly:

1. **Gmail** - `gmail_send_email` ✅
2. **Google Calendar** - `google_calendar_quick_add_event` ✅
3. **Google Sheets** - `google_sheets_create_spreadsheet_row` ✅ (needs real spreadsheet ID)

## 🧪 How to Test One Node at a Time

### Step 1: Create a Simple MCP Node

1. Create a new workflow
2. Add an **MCP Node** (not Agent Node)
3. Configure it:
   - **MCP Server**: Select your Zapier server
   - **Tool Name**: Use one of these exact names:
     - `gmail_send_email`
     - `google_calendar_quick_add_event`
     - `google_sheets_create_spreadsheet_row`
   - **Parameters**: 
     - For Gmail: `{ "to": "test@example.com", "subject": "Test", "body": "Test email" }`
     - For Calendar: `{ "summary": "Test Event", "start": "2024-01-01T10:00:00Z", "end": "2024-01-01T11:00:00Z" }`
     - For Sheets: `{ "spreadsheetId": "YOUR_REAL_SPREADSHEET_ID", "range": "Sheet1!A1", "values": [["Test"]] }`

### Step 2: Run the Workflow

1. Click "Run" on the workflow
2. Check the console logs for:
   - `🔍 Calling Zapier MCP tool: ...`
   - `✅ Zapier MCP execution completed successfully`
   - Any error messages

### Step 3: Check the Results

- If it works: You'll see the result in the node output
- If it fails: Check the console logs for the exact error

## 🔍 Common Issues

### Issue 1: Wrong Tool Name
- **Problem**: Using `google_calendar_create_event` (doesn't exist)
- **Solution**: Use `google_calendar_quick_add_event` or `google_calendar_create_detailed_event`

### Issue 2: Wrong Tool Name
- **Problem**: Using `google_sheets_add_row` (doesn't exist)
- **Solution**: Use `google_sheets_create_spreadsheet_row`

### Issue 3: Missing Spreadsheet ID
- **Problem**: Using "test" as spreadsheet ID
- **Solution**: Use a real Google Sheets spreadsheet ID

### Issue 4: Using Agent Node Instead of MCP Node
- **Problem**: Agent nodes require MCP tools to be configured differently
- **Solution**: Use MCP nodes for direct tool calls

## 📝 Example: Simple Two-Node Workflow

1. **Start Node** → Input: `{ "test": "data" }`
2. **MCP Node** → Tool: `gmail_send_email`, Params: `{ "to": "test@example.com", "subject": "Test", "body": "Test email" }`

This should work immediately and send an email.

## 🐛 Debugging

If it still doesn't work, check:

1. **Console Logs**: Look for `🔍` and `✅` or `❌` prefixes
2. **Network Tab**: Check if the request is being made to Zapier
3. **Response**: Check if you're getting SSE responses or errors

## ✅ Next Steps

Once a single node works:
1. Add a second MCP node
2. Test with different tools
3. Gradually build up to a full workflow

