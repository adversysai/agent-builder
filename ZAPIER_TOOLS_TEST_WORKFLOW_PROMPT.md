# 🧪 Zapier Tools Test Workflow - AI Generator Prompt

## Prompt for Dexflow AI Workflow Generator

```
Create a comprehensive test workflow that systematically tests all Zapier MCP tools currently configured and accessible through our MCP server. The workflow should verify connectivity and basic functionality for each tool by performing simple, representative actions.

## Tools to Test (9 total):

1. **Browse AI** (3 connections available)
   - Action: Scrape a simple webpage (e.g., https://google.com)
   - Expected: Return webpage content or structure

2. **Screenshot API** (2 connections available)
   - Action: Capture a screenshot of a specified URL (e.g., https://google.com)

4. **Google Calendar** (13 connections available)
   - Action: Create a test calendar event or list upcoming events
   - Expected: Return event ID or event list

5. **Google Sheets** (28 connections available)
   - Action: Add a test row of data to a spreadsheet or read data from a sheet
   - Expected: Return row ID or sheet data

6. **Gmail** (12 connections available)
   - Action: Send a test email or list recent emails
   - Expected: Return email ID or email list

7. **Notion** (23 connections available)
   - Action: Create a test page or database entry, or read from a database
   - Expected: Return page ID or database entry

8. **Slack** (31 connections available)
   - Action: Send a test message to a channel or list messages
   - Expected: Return message timestamp or message list

9. **Smartsheet** (20 connections available)
   - Action: Add a row to a test sheet or read sheet data
   - Expected: Return row ID or sheet data

## Workflow Requirements:

1. **Structure**: Create a sequential workflow with each tool tested in order
2. **Error Handling**: Wrap each tool call in error handling that logs failures but continues to the next tool
3. **Output**: Collect results from each tool test and display them in a summary at the end
4. **Logging**: Log the start and completion of each tool test with clear labels
5. **Variables**: Store test results in workflow variables for easy inspection
6. **MCP Node Configuration**: 
   - Use MCP nodes for each tool
   - Select "Zapier" as the MCP server
   - Configure appropriate tool names and parameters for each service

## Expected Workflow Structure:

1. Start node
2. Browse AI test node (MCP node with Zapier)
3. Screenshot API test node (MCP node with Zapier)
4. Google Drive test node (MCP node with Zapier)
5. Google Calendar test node (MCP node with Zapier)
6. Google Sheets test node (MCP node with Zapier)
7. Gmail test node (MCP node with Zapier)
8. Notion test node (MCP node with Zapier)
9. Slack test node (MCP node with Zapier)
10. Smartsheet test node (MCP node with Zapier)
11. Summary/Results node (displays all test results)

## Output Format:

The workflow should output a structured summary showing:
- Tool name
- Test status (Success/Failure)
- Result data or error message
- Timestamp

## Notes:

- Use simple, safe test actions that won't create excessive data
- Ensure each tool test is independent (can fail without affecting others)
- Use appropriate test data (e.g., "Test from Dexflow" as message content)
- Make the workflow easy to run multiple times for verification
```

---

## Alternative Shorter Prompt

If you prefer a more concise version:

```
Create a test workflow that verifies all 9 Zapier MCP tools are working correctly. The workflow should test: Browse AI (scrape webpage), Screenshot API (capture URL), Google Drive (list/create file), Google Calendar (create/list event), Google Sheets (add/read row), Gmail (send/list email), Notion (create/read page), Slack (send/list message), and Smartsheet (add/read row). Each tool should be tested in sequence using MCP nodes connected to the Zapier MCP server. Include error handling so one failure doesn't stop the entire workflow. Output a summary of all test results at the end.
```

---

## Usage Instructions

1. Open your Dexflow workflow builder
2. Navigate to the AI workflow generator
3. Copy and paste one of the prompts above
4. Let the AI generate the workflow
5. Review and adjust the generated workflow as needed
6. Run the workflow to test all your Zapier tools

---

## Customization Tips

You can customize the prompt by:
- Adding specific test parameters (e.g., channel names, email addresses)
- Changing the order of tools to test
- Adding more detailed validation steps
- Including cleanup steps (delete test data after verification)
- Adding notifications when tests complete

