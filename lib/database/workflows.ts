import { db } from './client';

export interface Workflow {
  id: string;
  customId?: string;
  userId?: string;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  difficulty?: string;
  estimatedTime?: string;
  nodes: any[];
  edges: any[];
  version?: string;
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId?: string;
  status: string;
  input?: any;
  output?: any;
  nodeResults: any;
  variables: any;
  threadId?: string;
  currentNodeId?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}

// Get all workflows (filtered by user if authenticated)
export async function listWorkflows(userId?: string) {
  if (userId) {
    const result = await db.query(`
      SELECT * FROM workflow 
      WHERE "userId" = $1 AND "isTemplate" = false 
      ORDER BY "createdAt" DESC
    `, [userId]);
    return result.rows;
  }
  return [];
}

// Get workflow by ID (supports both UUID and custom ID)
export async function getWorkflow(id: string) {
  // First try to find by UUID (if it looks like a UUID)
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    const result = await db.query('SELECT * FROM workflow WHERE id = $1', [id]);
    if (result.rows[0]) {
      return result.rows[0];
    }
  }
  
  // If not found by UUID or doesn't look like UUID, try customId
  const result = await db.query('SELECT * FROM workflow WHERE "customId" = $1', [id]);
  return result.rows[0] || null;
}

// Get workflow by custom ID
export async function getWorkflowByCustomId(customId: string) {
  const result = await db.query('SELECT * FROM workflow WHERE "customId" = $1', [customId]);
  return result.rows[0] || null;
}

// Get template by custom ID
export async function getTemplateByCustomId(customId: string) {
  const result = await db.query(`
    SELECT * FROM workflow 
    WHERE "customId" = $1 AND "isTemplate" = true
  `, [customId]);
  return result.rows[0] || null;
}

// Save workflow
export async function saveWorkflow(workflow: Partial<Workflow>) {
  const now = new Date().toISOString();
  
  if (workflow.customId) {
    // Check if workflow with this customId already exists
    const existing = await getWorkflowByCustomId(workflow.customId);
    
    if (existing) {
      // Update existing workflow
      const result = await db.query(`
        UPDATE workflow 
        SET name = $1, description = $2, category = $3, tags = $4, 
            difficulty = $5, "estimatedTime" = $6, nodes = $7, edges = $8,
            "isTemplate" = $9, "updatedAt" = $10
        WHERE "customId" = $11
        RETURNING *
      `, [
        workflow.name, workflow.description, workflow.category, 
        workflow.tags, workflow.difficulty, workflow.estimatedTime,
        JSON.stringify(workflow.nodes), JSON.stringify(workflow.edges),
        workflow.isTemplate, now, workflow.customId
      ]);
      return result.rows[0];
    }
  }
  
  // Create new workflow
  const result = await db.query(`
    INSERT INTO workflow (
      "customId", "userId", name, description, category, tags, difficulty, 
      "estimatedTime", nodes, edges, "isTemplate", 
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [
    workflow.customId, workflow.userId, workflow.name, workflow.description,
    workflow.category, workflow.tags, workflow.difficulty, workflow.estimatedTime,
    JSON.stringify(workflow.nodes), JSON.stringify(workflow.edges),
    workflow.isTemplate || false,
    now, now
  ]);
  
  return result.rows[0];
}

// Get all templates
export async function getTemplates() {
  const result = await db.query(`
    SELECT * FROM workflow 
    WHERE "isTemplate" = true 
    ORDER BY "createdAt" DESC
  `);
  return result.rows;
}

// Delete workflow
export async function deleteWorkflow(id: string) {
  await db.query('DELETE FROM workflow WHERE id = $1', [id]);
  return { success: true };
}

// Update template structure
export async function updateTemplateStructure(customId: string, nodes: any[], edges: any[]) {
  const result = await db.query(`
    UPDATE workflow 
    SET nodes = $1, edges = $2, "updatedAt" = $3
    WHERE "customId" = $4 AND "isTemplate" = true
    RETURNING *
  `, [JSON.stringify(nodes), JSON.stringify(edges), new Date().toISOString(), customId]);
  
  if (result.rows.length === 0) {
    throw new Error(`Template ${customId} not found`);
  }
  
  return { success: true, message: `Updated template ${customId}` };
}
