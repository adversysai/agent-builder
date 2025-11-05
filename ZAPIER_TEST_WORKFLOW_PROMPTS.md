# Zapier MCP Test Workflow Prompts

## Prompt 1: Gmail Send Email Test

Create a simple test workflow named "Gmail Send Email Test" that uses Zapier MCP to send an email. The workflow should have:
1. A Start node
2. An MCP node configured to use the Zapier MCP server with tool name `gmail_send_email`
3. The MCP node should pass parameters: `{ "to": "test@example.com", "subject": "Test Email from Dexflow", "body": "This is a test email to verify Zapier MCP integration is working." }`
4. The workflow should output the result of the email send operation

Make sure the MCP node is configured to use the Zapier MCP server and the exact tool name `gmail_send_email`.

---

## Prompt 2: Google Calendar Create Event Test

Create a simple test workflow named "Google Calendar Create Event Test" that uses Zapier MCP to create a calendar event. The workflow should have:
1. A Start node
2. An MCP node configured to use the Zapier MCP server with tool name `google_calendar_quick_add_event`
3. The MCP node should pass parameters: `{ "summary": "Test Event from Dexflow", "start": "2024-01-01T10:00:00Z", "end": "2024-01-01T11:00:00Z" }`
4. The workflow should output the result of the calendar event creation

Make sure the MCP node is configured to use the Zapier MCP server and the exact tool name `google_calendar_quick_add_event`.

---

## Prompt 3: Google Sheets Create Spreadsheet and Row Test

Create a simple test workflow named "Google Sheets Create Spreadsheet and Row Test" that uses Zapier MCP to create a new Google Sheet, add column headers, and then add a test row. The workflow should have:
1. A Start node
2. First MCP node configured to use the Zapier MCP server with tool name `google_sheets_create_spreadsheet` to create a new spreadsheet
3. The first MCP node should pass parameters: `{ "instructions": "Create a new Google Sheet spreadsheet named 'Dexflow Test Sheet' for testing purposes." }`
4. Second MCP node configured to use the Zapier MCP server with tool name `google_sheets_create_spreadsheet_column` to create column headers
5. The second MCP node should pass parameters: `{ "instructions": "Create column headers in the 'Dexflow Test Sheet' spreadsheet with headers: Column1, Column2, Column3. Use the first available worksheet." }`
6. Third MCP node configured to use the Zapier MCP server with tool name `google_sheets_create_spreadsheet_row` to add a row to the newly created spreadsheet
7. The third MCP node should pass parameters: `{ "instructions": "Add a row to the 'Dexflow Test Sheet' spreadsheet with test data: Test, Data, From Dexflow. Use the first available worksheet." }`
8. The workflow should output the result of all three operations

Make sure all MCP nodes are configured to use the Zapier MCP server with the exact tool names: `google_sheets_create_spreadsheet`, `google_sheets_create_spreadsheet_column`, and `google_sheets_create_spreadsheet_row`.

---

## Prompt 4: Slack Send Message Test

Create a simple test workflow named "Slack Send Message Test" that uses Zapier MCP to send a Slack message. The workflow should have:
1. A Start node
2. An MCP node configured to use the Zapier MCP server with tool name `slack_send_channel_message`
3. The MCP node should pass parameters with instructions: `{ "instructions": "Send a test message to Slack channel #general with text 'Test message from Dexflow to verify Zapier MCP integration.'" }`
4. The workflow should output the result of the message send operation

Make sure the MCP node is configured to use the Zapier MCP server and the exact tool name `slack_send_channel_message`.

---

## Prompt 5: Notion Create Page Test

Create a simple test workflow named "Notion Create Page Test" that uses Zapier MCP to create a Notion page. The workflow should have:
1. A Start node
2. An MCP node configured to use the Zapier MCP server with tool name `notion_create_page` to create a new page
3. The MCP node should pass parameters: `{ "instructions": "Create a Notion page with title 'Test Page from Dexflow' and add some notes: 'This is a test page to verify Zapier MCP integration is working correctly. Created via Dexflow workflow.'", "parent_page": "20077fca8d8180888838cf3b96fad517" }`
4. The workflow should output the result of the page creation

Make sure the MCP node is configured to use the Zapier MCP server and the exact tool name `notion_create_page`. Note: `parent_page` is set to `20077fca8d8180888838cf3b96fad517` from the adversys workspace. Make sure this page is shared with your Zapier integration in Notion for the workflow to work.

---

## Prompt 6: Smartsheet Test

Create a simple test workflow named "Smartsheet Test" that uses Zapier MCP to interact with Smartsheet. The workflow should have:
1. A Start node
2. An MCP node configured to use the Zapier MCP server with a Smartsheet tool (check available tools starting with `smartsheet_`)
3. The MCP node should pass parameters with instructions: `{ "instructions": "Execute a Smartsheet action to test the integration. Use any available sheet and test data." }`
4. The workflow should output the result of the Smartsheet operation

Make sure the MCP node is configured to use the Zapier MCP server and use a Smartsheet tool name from the available Zapier tools.

---

## Prompt 7: Screenshot API Test

Create a simple test workflow named "Screenshot API Test" that uses Zapier MCP to capture a screenshot of a webpage. The workflow should have:
1. A Start node
2. An MCP node configured to use the Zapier MCP server with tool name `screenshot_api_take_screenshot`
3. The MCP node should pass parameters: `{ "instructions": "Capture a screenshot of the webpage at https://google.com. Return the screenshot image URL or data.", "url": "https://google.com" }` (Note: Include the URL parameter explicitly, and use instructions to tell Zapier what to do)
4. The workflow should output the result of the screenshot capture, including the screenshot URL or image data

Make sure the MCP node is configured to use the Zapier MCP server and the exact tool name `screenshot_api_take_screenshot`. Note: There is also `screenshot_api_scrolling_screenshot` available if you need a scrolling screenshot instead.

---

## Prompt 8: Browse AI (Browser API) Test

Create a simple test workflow named "Browse AI Test" that uses Zapier MCP to run a Browse AI task to scrape or browse a webpage. The workflow should have:
1. A Start node
2. An MCP node configured to use the Zapier MCP server with tool name `browse_ai_run_task`
3. The MCP node should pass parameters: `{ "instructions": "Run a Browse AI robot/task to scrape the webpage at https://google.com and return the page content or structure. Use 01. Extract the main content from the page.", "url": "https://adversys.ai", "robot_id": "01" }` (Note: `robot_id` is REQUIRED and must be explicitly provided. Even though Browse AI is connected in Zapier, you must provide a specific robot ID from your Browse AI account. To get a robot ID: 1) Go to your Browse AI dashboard, 2) Select a robot/task, 3) Copy the robot ID from the robot's settings or URL. Replace `YOUR_BROWSE_AI_ROBOT_ID_HERE` with your actual robot ID.)
4. The workflow should output the result of the Browse AI task execution, including the scraped content or data

Make sure the MCP node is configured to use the Zapier MCP server and the exact tool name `browse_ai_run_task`. Note: Browse AI requires an explicit `robot_id` parameter with a valid robot ID from your Browse AI account. Even though Browse AI is connected in Zapier, Zapier cannot automatically select a robot - you must provide a specific robot ID. Alternative tools available: `browse_ai_bulk_run_tasks` (for running multiple tasks) and `browse_ai_api_request_beta` (for API requests).

---

## Usage Instructions

1. Copy one prompt at a time
2. Paste it into the AI Workflow Generator
3. Let it create the workflow
4. Run the workflow to test
5. Check the console logs for any errors
6. Move to the next prompt once the current one works

## Notes

- All workflows use Zapier MCP server
- Tool names must match exactly (case-sensitive)
- Parameters can be passed directly - the executor will automatically transform them to instructions format
- If a tool doesn't exist, check the available Zapier tools in your MCP server configuration

