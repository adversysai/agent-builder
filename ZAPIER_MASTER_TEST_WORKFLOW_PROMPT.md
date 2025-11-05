# Zapier MCP Master Test Workflow Prompt

## Prompt for Dexflow AI Workflow Generator

Create a comprehensive test workflow named "Zapier MCP Master Test" that tests multiple Zapier MCP tools in sequence. The workflow should have:

1. **Start node**
2. **MCP Node 1 - Screenshot API**: Use tool `screenshot_api_take_screenshot` with parameters: `{ "instructions": "Capture a screenshot of the webpage at https://google.com. Return the screenshot image URL or data.", "url": "https://google.com" }`
3. **MCP Node 2 - Browse AI**: Use tool `browse_ai_run_task` with parameters: `{ "instructions": "Run a Browse AI robot/task to scrape the webpage at https://adversys.ai and return the page content or structure. Use robot_id 01. Extract the main content from the page.", "url": "https://adversys.ai", "robot_id": "01" }`
4. **MCP Node 3 - Gmail**: Use tool `gmail_send_email` with parameters: `{ "to": "test@example.com", "subject": "Test Email from Dexflow", "body": "This is a test email to verify Zapier MCP integration is working." }`
5. **MCP Node 4 - Google Calendar**: Use tool `google_calendar_quick_add_event` with parameters: `{ "summary": "Test Event from Dexflow", "start": "2024-01-01T10:00:00Z", "end": "2024-01-01T11:00:00Z" }`
6. **MCP Node 5 - Google Sheets**: Use tool `google_sheets_create_spreadsheet` with parameters: `{ "instructions": "Create a new Google Sheet spreadsheet named 'Dexflow Test Sheet' for testing purposes." }`
7. **MCP Node 6 - Slack**: Use tool `slack_send_channel_message` with parameters: `{ "instructions": "Send a test message to Slack channel #general with text 'Test message from Dexflow to verify Zapier MCP integration.'" }`
8. **End node**

Make sure all MCP nodes are configured to use the Zapier MCP server. Each node should pass its output to the next node, and the final output should contain results from all tools tested.

The workflow should test these Zapier MCP tools in sequence:
- Screenshot API (screenshot capture)
- Browse AI (web scraping)
- Gmail (send email)
- Google Calendar (create event)
- Google Sheets (create spreadsheet)
- Slack (send message)

Note: Each tool should be tested independently, and the workflow should continue even if one tool fails, collecting all results for review.

