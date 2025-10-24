import { db } from './client';

export interface Approval {
  id: string;
  approvalId: string;
  workflowId: string;
  executionId?: string;
  nodeId?: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  userId?: string;
  createdBy?: string;
  respondedBy?: string;
  createdAt: string;
  respondedAt?: string;
}

// Create approval
export async function createApproval(approval: Omit<Approval, 'id' | 'createdAt'>): Promise<Approval> {
  const now = new Date().toISOString();
  
  const result = await db.query(`
    INSERT INTO approvals (
      "approvalId", "workflowId", "executionId", "nodeId", message, status, 
      "userId", "createdBy", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    approval.approvalId, approval.workflowId, approval.executionId, approval.nodeId,
    approval.message, approval.status, approval.userId, approval.createdBy, now
  ]);
  
  return result.rows[0];
}

// Get approval by ID
export async function getApprovalById(approvalId: string): Promise<Approval | null> {
  const result = await db.query(`
    SELECT * FROM approvals WHERE "approvalId" = $1
  `, [approvalId]);
  
  return result.rows[0] || null;
}

// Update approval status
export async function updateApprovalStatus(
  approvalId: string, 
  status: 'approved' | 'rejected', 
  respondedBy?: string
): Promise<Approval | null> {
  const now = new Date().toISOString();
  
  const result = await db.query(`
    UPDATE approvals 
    SET status = $1, "respondedBy" = $2, "respondedAt" = $3
    WHERE "approvalId" = $4
    RETURNING *
  `, [status, respondedBy, now, approvalId]);
  
  return result.rows[0] || null;
}

// Get pending approvals for a workflow
export async function getPendingApprovals(workflowId: string): Promise<Approval[]> {
  const result = await db.query(`
    SELECT * FROM approvals 
    WHERE "workflowId" = $1 AND status = 'pending'
    ORDER BY "createdAt" ASC
  `, [workflowId]);
  
  return result.rows;
}

// Get approvals for an execution
export async function getApprovalsByExecution(executionId: string): Promise<Approval[]> {
  const result = await db.query(`
    SELECT * FROM approvals 
    WHERE "executionId" = $1
    ORDER BY "createdAt" ASC
  `, [executionId]);
  
  return result.rows;
}

// Watch approval status (for real-time updates)
export async function watchApprovalStatus(approvalId: string): Promise<{
  status: string;
  approval?: Approval;
} | null> {
  const approval = await getApprovalById(approvalId);
  
  if (!approval) {
    return { status: 'not_found' };
  }
  
  return {
    status: approval.status,
    approval
  };
}
