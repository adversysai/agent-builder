import { z } from 'zod';

/**
 * JSON Schema for AI-generated workflow validation
 * Ensures Claude generates valid workflow structures
 */

// Input variable schema
const InputVariableSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
  description: z.string(),
  defaultValue: z.any().optional()
});

// MCP Server schema
const MCPServerSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1), // Allow template URLs with placeholders
  authType: z.string(),
  label: z.string(),
  accessToken: z.string().optional(),
  tools: z.array(z.any()).optional()
});

// Node data schema with all possible fields
const NodeDataSchema = z.object({
  // Common fields
  label: z.string().min(1),
  nodeType: z.string().optional(),
  nodeName: z.string().optional(),
  
  // Agent node fields
  name: z.string().optional(),
  instructions: z.string().optional(),
  model: z.string().optional(),
  includeChatHistory: z.boolean().optional(),
  tools: z.array(z.string()).optional(),
  outputFormat: z.enum(['Text', 'JSON']).optional(),
  reasoningEffort: z.string().optional(),
  jsonOutputSchema: z.string().optional(),
  jsonSchema: z.any().optional(),
  mcpTools: z.array(z.any()).optional(),
  systemPrompt: z.string().optional(),
  
  // MCP node fields
  mcpServers: z.array(MCPServerSchema).optional(),
  mcpAction: z.string().optional(),
  outputField: z.string().optional(),
  
  // Arcade node fields
  arcadeTool: z.string().optional(),
  arcadeInput: z.any().optional(),
  arcadeUserId: z.string().optional(),
  
  // Extract node fields
  extractConfig: z.any().optional(),
  extractTool: z.string().optional(),
  
  // Start node fields
  inputVariables: z.array(InputVariableSchema).optional(),
  
  // Logic node fields
  condition: z.string().optional(),
  truePath: z.string().optional(),
  falsePath: z.string().optional(),
  trueLabel: z.string().optional(),
  falseLabel: z.string().optional(),
  
  // Transform node fields
  transformScript: z.string().optional(),
  transformation: z.string().optional(),
  
  // State node fields
  stateKey: z.string().optional(),
  stateValue: z.string().optional(),
  
  // Note node fields
  noteText: z.string().optional(),
  
  // Additional fields
  transformType: z.string().optional(),
  mcpTool: z.string().optional(),
  piiEnabled: z.boolean().optional(),
  searchQuery: z.string().optional(),
  mapUrl: z.string().optional(),
  batchUrls: z.string().optional(),
  guardrailType: z.string().optional(),
  scrapeUrl: z.string().optional(),
  whileCondition: z.string().optional(),
  approvalMessage: z.string().optional(),
  outputMapping: z.any().optional(),
  scrapeFormats: z.array(z.string()).optional(),
  mcpParams: z.any().optional(),
  moderationEnabled: z.boolean().optional(),
  jailbreakEnabled: z.boolean().optional(),
  hallucinationEnabled: z.boolean().optional(),
  searchLimit: z.number().optional(),
  mapLimit: z.number().optional(),
  actionOnViolation: z.string().optional(),
  maxIterations: z.union([z.number(), z.string()]).optional(),
  timeoutMinutes: z.union([z.number(), z.string()]).optional(),
  
  // HTTP node fields
  httpUrl: z.string().optional(),
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  httpHeaders: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional(),
  httpBody: z.string().optional(),
  httpAuthType: z.enum(['bearer', 'api-key', 'basic']).optional(),
  httpAuthToken: z.string().optional()
});

// Workflow node schema
const WorkflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'agent', 'mcp', 'if-else', 'while', 'user-approval', 'transform', 
    'set-state', 'end', 'start', 'guardrails', 'arcade', 'note', 'extract', 'http'
  ]),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  data: NodeDataSchema
});

// Workflow edge schema
const WorkflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.string().optional(),
  label: z.string().optional(),
  sourceHandle: z.string().optional()
});

// Complete workflow schema
export const WorkflowSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimatedTime: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  nodes: z.array(WorkflowNodeSchema).min(1),
  edges: z.array(WorkflowEdgeSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// Type inference
export type GeneratedWorkflow = z.infer<typeof WorkflowSchema>;

/**
 * Validate a generated workflow against the schema
 */
export function validateWorkflowSchema(workflow: any): { success: boolean; errors: string[] } {
  try {
    WorkflowSchema.parse(workflow);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate specific node types have required fields
 */
export function validateNodeRequirements(workflow: GeneratedWorkflow): string[] {
  const errors: string[] = [];
  
  for (const node of workflow.nodes) {
    const nodeType = node.data.nodeType || node.type;
    
    switch (nodeType) {
      case 'agent':
        if (!node.data.instructions) {
          errors.push(`Agent node ${node.id} missing instructions`);
        }
        if (!node.data.model) {
          errors.push(`Agent node ${node.id} missing model`);
        }
        break;
        
      case 'mcp':
        if (!node.data.mcpServers || node.data.mcpServers.length === 0) {
          errors.push(`MCP node ${node.id} missing mcpServers`);
        }
        if (!node.data.mcpAction) {
          errors.push(`MCP node ${node.id} missing mcpAction`);
        }

        // GitHub scoping guard: for search_code ensure repo scoping; for advisories ensure owner/repo
        try {
          const serverNames = (node.data.mcpServers || []).map((s: any) => (s?.name || '').toLowerCase());
          const isGitHub = serverNames.some((n: string) => n.includes('github')) || (node.data.mcpServers || []).some((s: any) => String(s?.url || '').includes('api.github.com'));
          const action = node.data.mcpAction;
          if (isGitHub && action === 'search_code') {
            const q = node.data.mcpParams?.query;
            if (typeof q !== 'string' || !q.includes('repo:')) {
              errors.push(`MCP node ${node.id} (GitHub search_code) must include repo:OWNER/REPO in query`);
            }
          }
          if (isGitHub && action === 'list_repository_security_advisories') {
            const p = node.data.mcpParams || {};
            if (!p.owner || !p.repo) {
              errors.push(`MCP node ${node.id} (GitHub advisories) must include owner and repo parameters`);
            }
          }
        } catch {}
        break;
        
      case 'transform':
        if (!node.data.transformScript && !node.data.transformation) {
          errors.push(`Transform node ${node.id} missing transformScript`);
        }
        break;
        
      case 'if-else':
        if (!node.data.condition) {
          errors.push(`If-else node ${node.id} missing condition`);
        }
        break;
        
      case 'while':
        if (!node.data.whileCondition) {
          errors.push(`While node ${node.id} missing whileCondition`);
        }
        if (!node.data.maxIterations) {
          errors.push(`While node ${node.id} missing maxIterations`);
        }
        break;
        
      case 'http':
        if (!node.data.httpUrl) {
          errors.push(`HTTP node ${node.id} missing httpUrl`);
        }
        if (!node.data.httpMethod) {
          errors.push(`HTTP node ${node.id} missing httpMethod`);
        }
        break;
        
      case 'extract':
        if (!node.data.instructions) {
          errors.push(`Extract node ${node.id} missing instructions`);
        }
        if (!node.data.jsonSchema) {
          errors.push(`Extract node ${node.id} missing jsonSchema`);
        }
        break;
        
      case 'user-approval':
        if (!node.data.approvalMessage) {
          errors.push(`User approval node ${node.id} missing approvalMessage`);
        }
        break;
        
      case 'set-state':
        if (!node.data.stateKey) {
          errors.push(`Set state node ${node.id} missing stateKey`);
        }
        if (!node.data.stateValue) {
          errors.push(`Set state node ${node.id} missing stateValue`);
        }
        break;
        
      case 'start':
        if (!node.data.inputVariables) {
          errors.push(`Start node ${node.id} missing inputVariables`);
        }
        // Note: Empty inputVariables array is valid for workflows that don't require user input
        break;
        
      case 'note':
        if (!node.data.noteText) {
          errors.push(`Note node ${node.id} missing noteText`);
        }
        break;
    }
  }
  
  return errors;
}

/**
 * Validate workflow structure (start/end nodes, connections)
 */
export function validateWorkflowStructure(workflow: GeneratedWorkflow): string[] {
  const errors: string[] = [];
  
  // Check for start and end nodes
  const hasStart = workflow.nodes.some(n => n.type === 'start');
  const hasEnd = workflow.nodes.some(n => n.type === 'end');
  
  if (!hasStart) {
    errors.push('Workflow must have at least one start node');
  }
  
  if (!hasEnd) {
    errors.push('Workflow must have at least one end node');
  }
  
  // Check edge connections
  const nodeIds = new Set(workflow.nodes.map(n => n.id));
  
  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
    }
  }
  
  // Check for orphaned nodes (nodes not connected to anything)
  const connectedNodes = new Set<string>();
  for (const edge of workflow.edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }
  
  for (const node of workflow.nodes) {
    if (node.type !== 'start' && node.type !== 'end' && node.type !== 'note' && !connectedNodes.has(node.id)) {
      errors.push(`Node ${node.id} is not connected to the workflow`);
    }
  }
  
  return errors;
}

/**
 * Complete workflow validation
 */
export function validateGeneratedWorkflow(workflow: any): { success: boolean; errors: string[] } {
  // First validate schema
  const schemaResult = validateWorkflowSchema(workflow);
  if (!schemaResult.success) {
    return schemaResult;
  }
  
  // Then validate requirements
  const requirementErrors = validateNodeRequirements(workflow);
  const structureErrors = validateWorkflowStructure(workflow);
  
  const allErrors = [...requirementErrors, ...structureErrors];
  
  return {
    success: allErrors.length === 0,
    errors: allErrors
  };
}
