import { useEffect, useRef, useState } from "react";
import { watchApprovalStatus, getPendingApprovals, getApprovalsByExecution } from "@/lib/database/approvals";

/**
 * Real-time approval watcher using database polling
 *
 * Note: This replaces Convex subscriptions with polling-based updates
 * For true real-time updates, consider implementing WebSocket or Server-Sent Events
 *
 * Example workflow:
 * -----------------
 * 1. Workflow hits "User Approval" node → pauses execution
 * 2. Create approval record in database
 * 3. Frontend watches approval with this hook
 * 4. User approves via UI
 * 5. Database is updated
 * 6. Polling detects change and updates UI
 *
 * Usage:
 * ```tsx
 * const { status, approval, isApproved, isRejected, isPending } = useApprovalWatch(approvalId);
 *
 * if (isPending) {
 *   return <ApprovalButton onApprove={() => approveWorkflow()} />;
 * }
 *
 * if (isApproved) {
 *   // Workflow will auto-resume!
 *   return <div>Approved - workflow continuing...</div>;
 * }
 * ```
 */
export function useApprovalWatch(approvalId: string | null | undefined) {
  const [result, setResult] = useState<{
    status: string;
    approval?: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!approvalId) {
      setResult(null);
      setLoading(false);
      return;
    }

    let intervalId: NodeJS.Timeout;

    const fetchApprovalStatus = async () => {
      try {
        const status = await watchApprovalStatus(approvalId);
        setResult(status);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching approval status:', error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchApprovalStatus();

    // Poll every 2 seconds for updates
    intervalId = setInterval(fetchApprovalStatus, 2000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [approvalId]);

  const status = result?.status || "not_found";
  const approval = result?.approval;

  const isPending = status === "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isResolved = isApproved || isRejected;

  // Detect status changes for callbacks
  useEffect(() => {
    if (status && status !== prevStatusRef.current) {
      console.log(`Approval ${approvalId} status changed: ${prevStatusRef.current} → ${status}`);
      prevStatusRef.current = status;
    }
  }, [status, approvalId]);

  return {
    status,
    approval,
    isPending,
    isApproved,
    isRejected,
    isResolved,
    isLoading: loading,
  };
}

/**
 * Hook for watching multiple pending approvals for a workflow
 *
 * Usage:
 * ```tsx
 * const { pendingApprovals, hasPending } = usePendingApprovals(workflowId);
 *
 * return (
 *   <div>
 *     {hasPending && (
 *       <div>
 *         {pendingApprovals.map(approval => (
 *           <ApprovalCard key={approval.approvalId} approval={approval} />
 *         ))}
 *       </div>
 *     )}
 *   </div>
 * );
 * ```
 */
export function usePendingApprovals(workflowId: string | null | undefined) {
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workflowId) {
      setPendingApprovals([]);
      setLoading(false);
      return;
    }

    let intervalId: NodeJS.Timeout;

    const fetchPendingApprovals = async () => {
      try {
        const approvals = await getPendingApprovals(workflowId);
        setPendingApprovals(approvals);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPendingApprovals();

    // Poll every 3 seconds for updates
    intervalId = setInterval(fetchPendingApprovals, 3000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [workflowId]);

  const hasPending = pendingApprovals.length > 0;

  return {
    pendingApprovals,
    hasPending,
    count: pendingApprovals.length,
    loading,
  };
}

/**
 * Hook for watching approvals for a specific execution
 *
 * Useful for showing "Waiting for approval" status in execution panel
 */
export function useExecutionApprovals(executionId: string | null | undefined) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!executionId) {
      setApprovals([]);
      setLoading(false);
      return;
    }

    let intervalId: NodeJS.Timeout;

    const fetchExecutionApprovals = async () => {
      try {
        const allApprovals = await getApprovalsByExecution(executionId);
        setApprovals(allApprovals);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching execution approvals:', error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchExecutionApprovals();

    // Poll every 3 seconds for updates
    intervalId = setInterval(fetchExecutionApprovals, 3000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [executionId]);

  const pendingApprovals = approvals.filter(a => a.status === "pending");
  const hasPending = pendingApprovals.length > 0;

  return {
    approvals,
    pendingApprovals,
    hasPending,
    isPaused: hasPending, // Execution is paused if any approvals are pending
    loading,
  };
}
