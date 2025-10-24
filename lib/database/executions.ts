import { db } from './client';

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

// Create execution record
export async function createExecution(workflowId: string, input?: any, threadId?: string, userId?: string) {
  const now = new Date().toISOString();
  
  const result = await db.query(`
    INSERT INTO "workflowExecution" (
      "workflowId", "userId", status, input, "nodeResults", variables, "threadId", "startedAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    workflowId, userId, 'running', 
    input ? JSON.stringify(input) : null,
    JSON.stringify({}),
    JSON.stringify({}),
    threadId, now, now
  ]);
  
  return result.rows[0];
}

// Update execution state
export async function updateExecution(
  id: string, 
  updates: {
    status?: string;
    currentNodeId?: string;
    nodeResults?: any;
    variables?: any;
    output?: any;
    error?: string;
  }
) {
  const now = new Date().toISOString();
  const setClause: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.status !== undefined) {
    setClause.push(`status = $${paramCount++}`);
    values.push(updates.status);
  }
  if (updates.currentNodeId !== undefined) {
    setClause.push(`"currentNodeId" = $${paramCount++}`);
    values.push(updates.currentNodeId);
  }
  if (updates.nodeResults !== undefined) {
    setClause.push(`"nodeResults" = $${paramCount++}`);
    values.push(JSON.stringify(updates.nodeResults));
  }
  if (updates.variables !== undefined) {
    setClause.push(`variables = $${paramCount++}`);
    values.push(JSON.stringify(updates.variables));
  }
  if (updates.output !== undefined) {
    setClause.push(`output = $${paramCount++}`);
    values.push(JSON.stringify(updates.output));
  }
  if (updates.error !== undefined) {
    setClause.push(`error = $${paramCount++}`);
    values.push(updates.error);
  }
  
  setClause.push(`"updatedAt" = $${paramCount++}`);
  values.push(now);
  values.push(id);

  const result = await db.query(`
    UPDATE "workflowExecution" 
    SET ${setClause.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `, values);
  
  return result.rows[0];
}

// Complete execution
export async function completeExecution(id: string, output?: any, error?: string) {
  const now = new Date().toISOString();
  const status = error ? 'failed' : 'completed';
  
  const result = await db.query(`
    UPDATE "workflowExecution" 
    SET status = $1, output = $2, error = $3, "completedAt" = $4, "updatedAt" = $5
    WHERE id = $6
    RETURNING *
  `, [status, output ? JSON.stringify(output) : null, error, now, now, id]);
  
  return result.rows[0];
}

// Get execution by ID
export async function getExecution(id: string) {
  const result = await db.query('SELECT * FROM "workflowExecution" WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// Get executions for a workflow
export async function getWorkflowExecutions(workflowId: string) {
  const result = await db.query(`
    SELECT * FROM "workflowExecution" 
    WHERE "workflowId" = $1 
    ORDER BY "startedAt" DESC
  `, [workflowId]);
  return result.rows;
}
