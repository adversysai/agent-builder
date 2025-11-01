import { WorkflowNode, WorkflowEdge, Workflow } from '../types';
import { z } from 'zod';

interface NodeFixContext {
  node: WorkflowNode;
  workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    name?: string;
    description?: string;
  };
  error?: {
    message: string;
    type?: string;
    nodeId?: string;
  };
  executionContext?: {
    nodeResults?: Record<string, any>;
    variables?: Record<string, any>;
  };
}

/**
 * Generate comprehensive system prompt for AI-powered node fixing
 * This prompt provides full workflow context to help Gemini understand
 * the node's role and fix issues intelligently
 */
export async function getNodeFixPrompt(context: NodeFixContext): Promise<string> {
  const { node, workflow, error, executionContext } = context;

  // Analyze workflow structure to understand node's role
  const nodeEdges = workflow.edges.filter(
    e => e.source === node.id || e.target === node.id
  );
  const upstreamNodes = workflow.nodes.filter(
    n => workflow.edges.some(e => e.target === node.id && e.source === n.id)
  );
  const downstreamNodes = workflow.nodes.filter(
    n => workflow.edges.some(e => e.source === node.id && e.target === n.id)
  );

  // Get workflow objective from description or infer from structure
  const workflowObjective = workflow.description || 
    workflow.name || 
    inferWorkflowObjective(workflow);

  // Extract node-specific requirements based on node type
  const nodeType = node.data.nodeType || node.type;
  const nodeRequirements = getNodeTypeRequirements(nodeType);

  // Build error context
  const errorContext = error ? `
## Error Information
**Error Type:** ${error.type || 'Unknown'}
**Error Message:** ${error.message}
**Node ID:** ${error.nodeId || node.id}
` : `
## Error Information
No specific error message provided. This may be a proactive fix or configuration improvement.
`;

  // Build execution context if available (truncate to prevent token limits)
  const executionContextInfo = executionContext ? `
## Execution Context

### Previous Node Outputs
${Object.entries(executionContext.nodeResults || {})
  .slice(0, 5) // Limit to 5 most recent nodes to save tokens
  .map(([nodeId, result]: [string, any]) => {
    const resultNode = workflow.nodes.find(n => n.id === nodeId);
    const nodeName = resultNode?.data?.nodeName || resultNode?.data?.label || nodeId;
    const outputStr = JSON.stringify(result.output || result.data || {});
    return `**${nodeName}** (${nodeId}):
- Status: ${result.status || 'unknown'}
- Output type: ${typeof result.output}
- Output preview: ${outputStr.length > 200 ? outputStr.substring(0, 200) + '...' : outputStr}`;
  }).join('\n')}

### Available Variables
${Object.entries(executionContext.variables || {})
  .slice(0, 10) // Limit to 10 variables to save tokens
  .map(([key, value]) => {
    const valueStr = JSON.stringify(value);
    return `- \`${key}\`: ${typeof value}${valueStr.length > 100 ? ` (${valueStr.length} chars)` : ` = ${valueStr.substring(0, 100)}`}`;
  }).join('\n')}
` : '';

  // Build prompt
  const prompt = `You are an expert workflow debugging assistant. Your task is to analyze a broken node in a workflow and provide a fixed configuration that maintains workflow integrity while resolving the issue.

## Workflow Overview
**Workflow Name:** ${workflow.name || 'Unnamed Workflow'}
**Workflow Objective:** ${workflowObjective}

## Workflow Structure
**Total Nodes:** ${workflow.nodes.length}
**Total Edges:** ${workflow.edges.length}

**Node Types:**
${workflow.nodes.map(n => `- ${n.data.nodeName || n.data.label || n.id}: ${n.data.nodeType || n.type}`).join('\n')}

## Target Node Information

### Node Details
- **Node ID:** ${node.id}
- **Node Type:** ${nodeType}
- **Node Name:** ${node.data.nodeName || node.data.label || 'Unnamed'}
- **Current Position:** (${node.position.x}, ${node.position.y})

### Node's Role in Workflow
${nodeEdges.length > 0 ? `
**Connections:**
- **Upstream Nodes:** ${upstreamNodes.length > 0 ? upstreamNodes.map(n => n.data.nodeName || n.data.label || n.id).join(', ') : 'None (may be start node)'}
- **Downstream Nodes:** ${downstreamNodes.length > 0 ? downstreamNodes.map(n => n.data.nodeName || n.data.label || n.id).join(', ') : 'None (may be end node)'}
` : '**No connections** - This node may be disconnected or newly added.'}

### Current Node Configuration
\`\`\`json
${(function() {
  const nodeDataStr = JSON.stringify(node.data, null, 2);
  return nodeDataStr.length > 2000 ? nodeDataStr.substring(0, 2000) + '\n... (truncated - showing key fields only)' : nodeDataStr;
})()}
\`\`\`

${errorContext}

${executionContextInfo}

## Node Type Requirements

${nodeRequirements}

## Your Task

Analyze the node configuration and error information. Identify the issue(s) and provide a fixed node configuration that:

1. **Resolves the error** - Address all issues mentioned in the error message
2. **Maintains workflow integrity** - Ensures the fixed node still works with upstream and downstream nodes
3. **Preserves node's purpose** - Keeps the node's role in achieving the workflow objective
4. **Uses correct variable references** - Ensures variable references match available variables from previous nodes
5. **Follows node type requirements** - Includes all required fields and uses correct formats
6. **Maintains data flow** - Ensures output format matches what downstream nodes expect

## Response Format

**CRITICAL: You MUST return ONLY valid JSON. Do not include markdown code blocks, explanations, or any other text outside the JSON object.**

Return a JSON object with the following structure:

{
  "fixedNode": {
    "id": "${node.id}",
    "type": "${node.type}",
    "position": ${JSON.stringify(node.position)},
    "data": {
      // Complete fixed node data here - include ALL fields, not just changed ones
    }
  },
  "explanation": "Clear explanation of what was wrong and how you fixed it",
  "issues": [
    "Issue 1: description",
    "Issue 2: description"
  ],
  "changes": [
    "Changed field X from value Y to value Z",
    "Added missing field W"
  ],
  "confidence": "high|medium|low"
}

**IMPORTANT: Return ONLY the JSON object above, with no markdown formatting, no code blocks, and no additional text.**

## Important Guidelines

1. **Return complete node data** - Don't just return changed fields, return the entire fixed node data object
2. **Preserve node ID and position** - Keep the same ID and position unless there's a structural issue
3. **Validate variable references** - Ensure all variable references like {{input.field}} or {{lastOutput}} are correct
4. **Check node type requirements** - Ensure all required fields for this node type are present
5. **Maintain workflow connections** - Don't break edge connections unless necessary for fix
6. **Explain clearly** - Provide a clear explanation of what was wrong and why your fix addresses it
7. **Be specific** - List all issues found and all changes made

## Example Fix Process

1. Identify the root cause of the error
2. Determine which fields need to be fixed
3. Check if fixes affect downstream nodes
4. Validate variable references match available data
5. Ensure fixed configuration meets node type requirements
6. Return complete fixed node with explanation

Now analyze the provided node and return the fixed configuration.`;

  return prompt;
}

/**
 * Infer workflow objective from structure
 */
function inferWorkflowObjective(workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }): string {
  const nodeTypes = workflow.nodes.map(n => n.data.nodeType || n.type);
  
  // Simple inference based on node types
  if (nodeTypes.includes('mcp') && nodeTypes.includes('agent')) {
    return 'AI-powered data processing with external tools';
  }
  if (nodeTypes.includes('if-else') || nodeTypes.includes('while')) {
    return 'Conditional logic and iteration workflow';
  }
  if (nodeTypes.includes('transform')) {
    return 'Data transformation and processing workflow';
  }
  if (nodeTypes.includes('http')) {
    return 'API integration workflow';
  }
  
  return 'Automated workflow execution';
}

/**
 * Get node type-specific requirements
 */
function getNodeTypeRequirements(nodeType: string): string {
  const requirements: Record<string, string> = {
    'agent': `
**Required Fields:**
- \`instructions\` (string): Clear instructions for what the agent should do
- \`model\` (string): LLM model in format "provider/model-name" (e.g., "openai/gpt-4o", "google/gemini-2.5-pro")

**Optional Fields:**
- \`includeChatHistory\` (boolean): Whether to include chat history in context
- \`outputFormat\` (enum: "Text" | "JSON"): Output format preference
- \`tools\` (array): MCP server IDs for tool integration
- \`mcpTools\` (array): MCP tool configurations
- \`jsonOutputSchema\` (string): JSON schema if outputFormat is JSON

**Variable Substitution:**
- Use {{input.fieldName}} to reference input variables
- Use {{lastOutput}} to reference previous node output
- Use {{state.variableName}} to reference workflow state variables
`,

    'if-else': `
**Required Fields:**
- \`condition\` (string): JavaScript expression that evaluates to boolean
- \`truePath\` (string): Handle ID for true condition path
- \`falsePath\` (string): Handle ID for false condition path

**Variable Access in Condition:**
- Access input variables via \`state.variables.input\`
- Access previous node output via \`state.variables.lastOutput\`
- Access state variables via \`state.variables.variableName\`
`,

    'while': `
**Required Fields:**
- \`whileCondition\` (string): JavaScript expression that evaluates to boolean
- \`maxIterations\` (number | string): Maximum number of iterations

**Variable Access in Condition:**
- Access iteration count via \`state.variables.iteration\`
- Access previous outputs and state variables as in if-else
`,

    'transform': `
**Required Fields:**
- \`transformScript\` (string): JavaScript code for transformation

**Transform Script Requirements:**
- Must return a value (will become output)
- Access input via \`input\` parameter
- Access previous output via \`lastOutput\` parameter
- Access state via \`state\` parameter
- Use arrow function syntax: \`(input, lastOutput, state) => { return transformedValue; }\`
`,

    'mcp': `
**Required Fields:**
- \`mcpAction\` (string): Action to perform (e.g., "scrape", "search")
- \`mcpParams\` (object): Parameters for the action

**Common MCP Actions:**
- Firecrawl: "scrape", "search", "crawl", "map"
- Tavily: "search", "extract"
- GitHub: Various repository operations
`,

    'set-state': `
**Required Fields:**
- \`stateKey\` (string): Key name for the state variable
- \`stateValue\` (string): Value to set (can use variable substitution)

**Variable Substitution in stateValue:**
- Use {{input.fieldName}} or {{lastOutput}} for dynamic values
`,

    'http': `
**Required Fields:**
- \`httpUrl\` (string): URL to call
- \`httpMethod\` (enum: "GET" | "POST" | "PUT" | "PATCH" | "DELETE")

**Optional Fields:**
- \`httpHeaders\` (array): HTTP headers array with {key, value} objects
- \`httpBody\` (string): Request body for POST/PUT/PATCH
- \`httpAuthType\` (enum): Authentication type
- \`httpAuthToken\` (string): Authentication token

**Variable Substitution:**
- URL and body can contain {{variable}} references
`,

    'start': `
**Required Fields:**
- \`inputVariables\` (array): Array of input variable definitions

**Input Variable Structure:**
- \`name\` (string): Variable name
- \`type\` (string): Variable type
- \`required\` (boolean): Whether required
- \`description\` (string): Description
- \`defaultValue\` (any): Default value (optional)
`,
  };

  return requirements[nodeType] || `
**Node Type:** ${nodeType}
**Requirements:** Check workflow schema for required fields for this node type.
**Variable Substitution:** Use {{variable}} syntax to reference workflow variables.
`;
}

