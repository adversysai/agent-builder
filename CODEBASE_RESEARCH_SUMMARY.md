# Codebase Research Summary

## Overview
This document provides a comprehensive understanding of the Agent Builder codebase, covering templates, workflows, drag-and-drop creation, AI workflow generation, and MCP (Model Context Protocol) configuration.

---

## 1. Templates System

### 1.1 What Are Templates?
Templates are pre-built workflow structures stored in the database that users can load as starting points for their workflows. Templates include:
- Node configurations
- Edge connections
- Metadata (name, description, category, tags, difficulty, estimated time)

### 1.2 Template Storage
Templates are stored in multiple locations:

#### Static Templates (`lib/workflow/templates.ts`)
- **Location**: `lib/workflow/templates.ts`
- **Structure**: Large object with template definitions
- **Function**: `getTemplate(templateId)` - retrieves a template by ID
- **Function**: `listTemplates()` - returns all available templates
- Contains 30+ security-focused templates and general templates

#### Database Templates
- **Table**: `workflow` in Convex/NeonDB
- **Field**: `isTemplate: true` marks a workflow as a template
- **Field**: `customId` - unique identifier for the template
- **API Endpoint**: `/api/database/templates/insert` - insert new templates
- **API Endpoint**: `/api/database/templates/seed` - seed official templates

#### Convex Templates (`convex/templates.ts`)
- Convex functions for template management
- `saveAsTemplate` - save workflow as template
- `getTemplates` - query templates

### 1.3 Current Available Templates

Templates are categorized into:

#### Security Templates
Located in `lib/workflow/templates.ts`, examples include:
- `test-security-template` - Simple test template
- Various OWASP-focused security testing templates
- LLM security templates
- Multi-agent security workflows

#### General Templates
- Basic workflow templates
- Example templates (`lib/workflow/templates/examples/index.ts`)

#### Template Categories
- `Security` - Security testing and analysis
- `Web Scraping` - Web content extraction
- `Data Analysis` - Data processing workflows
- `AI Analysis` - LLM-powered analysis

### 1.4 How to Create a New Template

#### Method 1: Via API
```typescript
POST /api/database/templates/insert
{
  customId: "my-template-id",
  name: "My Template",
  description: "Template description",
  category: "Security",
  tags: ["security", "test"],
  difficulty: "beginner",
  estimatedTime: "5 minutes",
  nodes: [...], // Array of workflow nodes
  edges: [...], // Array of workflow edges
  isTemplate: true
}
```

#### Method 2: Via Code (Static Templates)
1. Open `lib/workflow/templates.ts`
2. Add a new entry to the `templates` object:
```typescript
'my-template-id': {
  id: 'my-template-id',
  name: 'My Template',
  description: 'Template description',
  category: 'Security',
  tags: ['security'],
  difficulty: 'beginner',
  estimatedTime: '5 minutes',
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 100, y: 200 },
      data: {
        nodeType: 'start',
        label: 'Start',
        inputVariables: [...]
      }
    },
    // ... more nodes
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'end' }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
```

#### Method 3: Save Workflow as Template (UI)
1. Build a workflow in the Workflow Builder
2. Click "Save as Template" button
3. Fill in template metadata (name, description, category)
4. Template is saved with `isTemplate: true`

### 1.5 Loading Templates
- **From UI**: Templates are displayed in `Step2Placeholder.tsx`
- **Click template**: Triggers `onLoadTemplate(templateId)`
- **Workflow Builder**: Loads template via `initialTemplateId` prop
- **API**: GET `/api/database/templates` or query Convex

---

## 2. Workflows System

### 2.1 Workflow Structure
A workflow consists of:

#### Nodes (`lib/workflow/types.ts`)
- **id**: Unique identifier
- **type**: Node type (start, agent, mcp, if-else, while, transform, etc.)
- **position**: { x, y } coordinates
- **data**: Node-specific configuration

#### Node Types Available
1. **start** - Entry point with input variables
2. **agent** - AI processing node (LLM)
3. **mcp** - MCP server action node
4. **if-else** - Conditional logic
5. **while** - Loop with condition
6. **transform** - Data transformation (JavaScript)
7. **set-state** - Set workflow state
8. **user-approval** - Human approval step
9. **extract** - Extract structured data
10. **http** - HTTP request node
11. **end** - Workflow termination
12. **note** - Documentation node

#### Edges
- **id**: Unique identifier
- **source**: Source node ID
- **target**: Target node ID
- **label**: Optional edge label
- **sourceHandle**: Optional handle identifier (e.g., "loop" for while nodes)

### 2.2 Workflow Storage

#### Convex Database
- **Table**: `workflows`
- **Schema**: `convex/schema.ts`
- **Fields**:
  - `userId` - Owner (Clerk user ID)
  - `customId` - Original workflow ID
  - `name`, `description`, `category`, `tags`
  - `nodes`, `edges` - JSON arrays
  - `isTemplate` - Boolean flag
  - `isPublic` - Sharing flag
  - `createdAt`, `updatedAt` - Timestamps

#### API Endpoints
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Save workflow
- `DELETE /api/workflows/[id]` - Delete workflow

#### Hooks (`hooks/useWorkflow.ts`)
- `useWorkflow(workflowId)` - Manage workflow state
- `createNewWorkflow()` - Create blank workflow
- `saveWorkflow(data)` - Save workflow changes
- `deleteWorkflow()` - Delete workflow

---

## 3. Drag and Drop Workflow Creation

### 3.1 How Drag and Drop Works

#### Node Palette (`WorkflowBuilder.tsx`)
Located in the left sidebar, nodes are organized by categories:
- **Flow Control**: Start, End, If-Else, While, User Approval
- **AI & Logic**: Agent, Transform, Extract
- **Tools**: MCP, HTTP
- **Documentation**: Note

#### Drag Operation (`onDragStart`)
```typescript
const onDragStart = (event: DragEvent, nodeType: string, nodeLabel: string, nodeColor: string) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.setData('application/reactflow-label', nodeLabel);
  event.dataTransfer.setData('application/reactflow-color', nodeColor);
  event.dataTransfer.effectAllowed = 'move';
};
```

#### Drop Operation (`onDrop`)
```typescript
const onDrop = useCallback((event: DragEvent) => {
  event.preventDefault();
  
  const type = event.dataTransfer.getData('application/reactflow');
  const label = event.dataTransfer.getData('application/reactflow-label');
  const color = event.dataTransfer.getData('application/reactflow-color');
  
  const position = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });
  
  const newNode: Node = {
    id: getId(), // Generate unique ID
    type: type === 'firecrawl' ? 'mcp' : type,
    position,
    data: {
      label,
      nodeType: type === 'firecrawl' ? 'mcp' : type,
      nodeName: label,
      // Node-specific pre-configuration
    },
  };
  
  setNodes((nds) => nds.concat(newNode));
}, [screenToFlowPosition, setNodes]);
```

#### Connecting Nodes
- **Click and drag** from a node's output handle to another node's input handle
- **onConnect** callback creates edges:
```typescript
const onConnect: OnConnect = useCallback((connection) => {
  setEdges((eds) => addEdge(connection, eds));
}, [setEdges]);
```

### 3.2 Node Configuration

After dropping a node, click it to configure:

#### Node Panels
- **NodePanel** - Main node configuration
- **AgentNodePanel** - AI agent settings (instructions, model, tools)
- **MCPPanel** - MCP server and action configuration
- **StartNodePanel** - Input variables
- **LogicNodePanel** - Conditional logic
- **TransformNodePanel** - Data transformation scripts
- **HTTPNodePanel** - HTTP request configuration

#### Configuration Flow
1. Click node → Opens appropriate panel
2. Configure node-specific settings
3. Click "Save" or auto-save
4. Node data is updated in workflow state

---

## 4. AI Workflow Generator

### 4.1 Overview
The AI Workflow Generator uses LLMs (GPT-4o, Claude, Gemini) to generate complete workflows from natural language descriptions.

### 4.2 Components

#### AI Workflow Chat (`AIWorkflowChat.tsx`)
- **Location**: `components/app/(home)/sections/workflow-builder/AIWorkflowChat.tsx`
- **UI**: Chat interface with conversation history
- **Features**:
  - Model selection (Auto, OpenAI, Anthropic, Google, Groq)
  - Tool selection (web search, data analysis, workflow builder)
  - Conversation management
  - Workflow preview and download
  - Execution context integration

#### API Endpoint (`/api/workflows/generate`)
- **Location**: `app/api/workflows/generate/route.ts`
- **Method**: POST
- **Request Body**:
  ```typescript
  {
    prompt: string,
    conversationHistory: ChatMessage[],
    currentWorkflow?: Workflow,
    preferredModel?: string,
    selectedTools?: string[],
    executionContext?: ExecutionContext
  }
  ```

#### System Prompt (`workflow-generator-prompt.ts`)
- **Location**: `lib/workflow/prompts/workflow-generator-prompt.ts`
- **Content**: Comprehensive prompt with:
  - Node type definitions
  - Required fields per node type
  - Model selection guidelines
  - Positioning logic
  - Example workflows
  - GitHub scoping rules

### 4.3 How It Works

#### Step 1: User Input
User types a natural language description:
- "Create a workflow that scrapes a website and summarizes the content"
- "Build a multi-agent security analysis workflow"
- "Add error handling to this workflow"

#### Step 2: Intent Detection
The system detects if the user wants:
- **Workflow generation**: Keywords like "create", "build", "generate"
- **Conversational response**: Greetings, questions

#### Step 3: Model Selection
Priority order:
1. User preference (`preferredModel`)
2. Available API keys (user keys > env keys)
3. Fallback to OpenAI GPT-4o

#### Step 4: LLM Generation
- System prompt includes current workflow context (if editing)
- LLM generates complete workflow JSON
- Includes: nodes, edges, metadata

#### Step 5: Validation
Workflow is validated against schema:
- `WorkflowSchema` (Zod schema)
- Node requirements validation
- Structure validation (start/end nodes, connections)

#### Step 6: Response
- **Conversational**: Returns text response
- **Workflow**: Returns JSON workflow object
- User can preview, apply, or download

### 4.4 Workflow Modification Modes

The AI can:
1. **CREATE NEW**: Generate completely new workflow
2. **ADD TO EXISTING**: Add nodes to current workflow
3. **MODIFY EXISTING**: Change specific nodes
4. **ENHANCE EXISTING**: Improve workflow structure

### 4.5 Model Selection Guidelines

From the prompt:
- **MCP-enabled workflows**: Anthropic Claude (claude-sonnet-4-5-20250929)
- **AI analysis tasks**: OpenAI GPT-4o (default)
- **Large context needs**: Google Gemini (gemini-2.5-pro)

---

## 5. MCP (Model Context Protocol) System

### 5.1 What Are MCPs?
MCP Servers provide tools and capabilities that can be used in workflows:
- **Firecrawl**: Web scraping and content extraction
- **Tavily**: Web search and content extraction
- **GitHub**: Repository management and code search
- **Custom**: User-defined MCP servers

### 5.2 MCP Storage

#### Database Schema (`convex/schema.ts`)
```typescript
mcpServers: {
  _id: Id<"mcpServers">,
  userId: string,
  name: string,
  url: string,
  description?: string,
  category: string, // 'web', 'ai', 'data', 'automation'
  authType: string, // 'none', 'api-key', 'bearer', 'url'
  accessToken?: string,
  tools?: string[],
  connectionStatus: string, // 'connected', 'disconnected', 'error', 'untested'
  enabled: boolean,
  isOfficial: boolean,
  lastTested?: string,
  lastError?: string,
  headers?: any,
  createdAt: string,
  updatedAt: string
}
```

#### API Endpoints
- `GET /api/database/mcp-servers?userId=...` - List user's MCPs
- `POST /api/database/mcp-servers` - Add MCP server
- `PUT /api/database/mcp-servers/[id]` - Update MCP
- `DELETE /api/database/mcp-servers/[id]` - Delete MCP
- `PATCH /api/database/mcp-servers/[id]` - Toggle enabled, test connection

#### Convex Functions (`convex/mcpServers.ts`)
- `listUserMCPs` - Query user's MCPs
- `getEnabledMCPs` - Get enabled MCPs only
- `addMCPServer` - Create new MCP
- `updateMCPServer` - Update MCP config
- `deleteMCPServer` - Delete MCP
- `toggleMCPEnabled` - Enable/disable
- `testConnection` - Test MCP connection
- `seedOfficialMCPs` - Seed Firecrawl by default
- `updateConnectionStatus` - Update after testing

#### Hooks (`lib/hooks/useMCPServers.ts`)
- `useMCPServers()` - Get user's MCP servers
- `useEnabledMCPs()` - Get enabled MCPs
- `useAddMCPServer()` - Add new MCP
- `useUpdateMCPServer()` - Update MCP
- `useDeleteMCPServer()` - Delete MCP
- `useToggleMCPEnabled()` - Toggle enabled status
- `useSeedOfficialMCPs()` - Seed official MCPs
- `useUpdateConnectionStatus()` - Update connection status

### 5.3 How to Add an MCP Server

#### Method 1: Via Settings UI

1. **Open Settings Panel**
   - Click "Settings" button in Workflow Builder
   - Navigate to "MCP Servers" section

2. **Click "Add MCP Server"**
   - Opens `AddMCPModal` component

3. **Fill in MCP Details**:
   ```
   Name: Tavily (example)
   URL: https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}
   Description: Advanced web search and content extraction
   Category: web-search (or custom)
   Auth Type: url (or api-key, bearer)
   Access Token: (if needed)
   ```

4. **Test Connection**:
   - Click "Test Connection" button
   - System discovers available tools
   - Shows discovered tools in UI

5. **Save**
   - MCP is added to database
   - Appears in MCP servers list
   - Enabled by default

#### Method 2: Via API
```typescript
POST /api/database/mcp-servers
{
  action: "add",
  userId: "user_123",
  name: "Tavily",
  url: "https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}",
  description: "Web search",
  category: "web-search",
  authType: "url"
}
```

#### Method 3: Via Code (Seed Script)
```javascript
// Example: add-tavily-mcp-server.js
const response = await fetch('/api/database/mcp-servers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add',
    userId: 'user_id',
    name: 'Tavily',
    url: 'https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}',
    category: 'web-search',
    authType: 'url'
  })
});
```

### 5.4 How to Configure MCP Servers

#### Settings Panel (`SettingsPanelSimple.tsx`)
The main interface for MCP configuration:

1. **View MCP Servers**
   - List of all user's MCP servers
   - Shows: name, status, tools count
   - Expandable cards with details

2. **Edit MCP Server**
   - Click "Edit" on any MCP card
   - Opens `AddMCPModal` in edit mode
   - Update: name, URL, description, auth
   - Save changes

3. **Test Connection**
   - Click "Test" button on MCP card
   - Tests MCP server connection
   - Discovers available tools
   - Updates `connectionStatus`, `tools`, `lastTested`

4. **Toggle Enabled**
   - Enable/disable MCP server
   - Disabled MCPs won't be available in workflows

5. **Delete MCP**
   - Click "Delete" button
   - Removes MCP from database
   - Confirmation dialog

#### MCP Panel (`MCPPanel.tsx`)
For configuring MCP nodes in workflows:

1. **Select MCP Server**
   - Dropdown of enabled MCP servers
   - Shows: name, category, tools count

2. **Select MCP Action**
   - Dropdown of available tools from selected server
   - Example: Firecrawl → scrape, search, crawl

3. **Configure Parameters**
   - Tool-specific parameter fields
   - Variable substitution: `{{input.url}}`

4. **Add to Agent** (optional)
   - Add MCP as tool to Agent node
   - Makes MCP available in agent's tool list

### 5.5 MCP Authentication Types

#### 1. URL-based (`authType: "url"`)
- API key embedded in URL
- Example: `https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}`
- No separate access token needed

#### 2. API Key (`authType: "api-key"`)
- API key sent in request headers
- Example: `X-API-Key: sk-...`
- Stored in `accessToken` field

#### 3. Bearer Token (`authType: "bearer"`)
- Bearer token in Authorization header
- Example: `Authorization: Bearer token_here`
- Stored in `accessToken` field

#### 4. None (`authType: "none"`)
- No authentication required
- Public MCP servers

### 5.6 MCP Tool Discovery

When testing an MCP connection:
1. Frontend calls `/api/test-mcp-connection`
2. Backend connects to MCP server
3. Calls MCP `tools/list` method
4. Returns available tools
5. Tools are stored in `mcpServers.tools` array

### 5.7 Using MCPs in Workflows

#### MCP Node
1. Drag "MCP" node to canvas
2. Click to configure
3. Select MCP server from dropdown
4. Select action/tool
5. Configure parameters
6. Connect to other nodes

#### Agent Node with MCP Tools
1. Drag "Agent" node
2. Configure agent (instructions, model)
3. Click "Add MCP Tools" or "Add Tools"
4. Select enabled MCP servers
5. MCP tools become available to agent
6. Agent can call MCP tools during execution

---

## 6. Key Files Reference

### Templates
- `lib/workflow/templates.ts` - Static template definitions
- `lib/workflow/templates/examples/index.ts` - Example templates
- `app/api/database/templates/insert/route.ts` - Insert template API
- `app/api/database/templates/seed/route.ts` - Seed templates API
- `convex/templates.ts` - Convex template functions

### Workflows
- `lib/workflow/types.ts` - Workflow type definitions
- `lib/workflow/schemas/workflow-schema.ts` - Validation schemas
- `hooks/useWorkflow.ts` - Workflow management hooks
- `app/api/workflows/route.ts` - Workflow API endpoints
- `convex/workflows.ts` - Convex workflow functions

### Workflow Builder
- `components/app/(home)/sections/workflow-builder/WorkflowBuilder.tsx` - Main builder component
- `components/app/(home)/sections/workflow-builder/AIWorkflowChat.tsx` - AI generator chat
- `components/app/(home)/sections/workflow-builder/NodePanel.tsx` - Node configuration
- `components/app/(home)/sections/workflow-builder/MCPPanel.tsx` - MCP configuration

### MCP
- `convex/mcpServers.ts` - Convex MCP functions
- `lib/hooks/useMCPServers.ts` - MCP hooks
- `components/app/(home)/sections/workflow-builder/SettingsPanelSimple.tsx` - MCP settings UI
- `app/api/database/mcp-servers/route.ts` - MCP API endpoints
- `lib/mcp/resolver.ts` - MCP server resolution

### AI Generation
- `app/api/workflows/generate/route.ts` - Workflow generation API
- `lib/workflow/prompts/workflow-generator-prompt.ts` - System prompt

---

## 7. Common Workflows

### Creating a Workflow from Scratch
1. Click "Create New Workflow"
2. Drag nodes from palette
3. Connect nodes with edges
4. Configure each node
5. Click "Save" button
6. Workflow saved to database

### Loading a Template
1. Go to templates view
2. Browse templates by category
3. Click a template card
4. Template loads in Workflow Builder
5. Modify as needed
6. Save as new workflow

### AI-Generated Workflow
1. Click "AI Generator" button
2. Type workflow description
3. Select model (optional)
4. AI generates workflow JSON
5. Click "Apply" to load into builder
6. Review and modify
7. Save workflow

### Adding MCP to Workflow
1. Add MCP server in Settings (if not exists)
2. Drag "MCP" node to canvas
3. Configure: select server, action, parameters
4. Connect to other nodes
5. Or add MCP tools to Agent node

---

## 8. Database Schema Summary

### Workflows Table
- `id` (PK)
- `userId` - Owner
- `customId` - Unique identifier
- `name`, `description`, `category`, `tags`
- `nodes` (JSON), `edges` (JSON)
- `isTemplate`, `isPublic`
- `createdAt`, `updatedAt`

### MCP Servers Table
- `_id` (PK)
- `userId` - Owner
- `name`, `url`, `description`, `category`
- `authType`, `accessToken`
- `tools` (array)
- `connectionStatus`, `enabled`, `isOfficial`
- `lastTested`, `lastError`
- `createdAt`, `updatedAt`

---

## 9. Best Practices

### Templates
- Use descriptive names and categories
- Include comprehensive descriptions
- Set appropriate difficulty levels
- Add relevant tags
- Test templates before publishing

### Workflows
- Always include Start and End nodes
- Validate connections before saving
- Use meaningful node names
- Document complex logic in Note nodes
- Test workflows with sample data

### MCP Servers
- Test connections before use
- Use URL-based auth when possible
- Store API keys securely
- Document tool parameters
- Enable only necessary MCPs

### AI Generation
- Be specific in descriptions
- Mention required node types
- Include example use cases
- Review generated workflows
- Validate before saving

---

This summary provides a comprehensive overview of the codebase architecture and functionality. For specific implementation details, refer to the source files mentioned in each section.

