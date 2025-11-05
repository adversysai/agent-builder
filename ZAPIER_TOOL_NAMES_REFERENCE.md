# Zapier MCP Tool Names Reference

## ✅ Verified Working Tools

### Gmail
- ✅ `gmail_send_email` - Gmail: Send Email

### Google Calendar
- ✅ `google_calendar_create_detailed_event` - Google Calendar: Create Detailed Event
- ✅ `google_calendar_quick_add_event` - Google Calendar: Quick Add Event
- ❌ `google_calendar_create_event` - **DOES NOT EXIST**

### Google Sheets
- ✅ `google_sheets_create_spreadsheet_row` - Google Sheets: Create Spreadsheet Row
- ✅ `google_sheets_create_multiple_spreadsheet_rows` - Google Sheets: Create Multiple Spreadsheet Rows
- ❌ `google_sheets_add_row` - **DOES NOT EXIST**

### Slack
- Need to check actual names (likely `slack_post_message` or similar)

### Notion
- Need to check actual names (likely `notion_create_page` or similar)

### Smartsheet
- Need to check actual names

## Issues Found

1. **Wrong Tool Names**: The workflow is using tool names that don't exist in Zapier
2. **Parameter Transformation**: The transformation logic is matching wrong patterns (e.g., treating `slack_send_message` as email because it contains "message")

## Fixes Needed

1. Update tool name matching in parameter transformation
2. Use correct tool names in workflows
3. Improve parameter transformation to handle all tool types correctly

