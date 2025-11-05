import { useState, useEffect, useCallback, useRef } from 'react';
import { Workflow, WorkflowNode, WorkflowEdge, MCPServer } from '@/lib/workflow/types';
import {
  saveWorkflow as saveWorkflowToStorage,
  getWorkflows,
  getWorkflow,
  deleteWorkflow as deleteWorkflowFromStorage,
  setCurrentWorkflow,
  getCurrentWorkflowId,
  saveMCPServer,
  getMCPServers,
} from '@/lib/workflow/storage';
import { cleanupInvalidEdges } from '@/lib/workflow/edge-cleanup';

/**
 * Safely serializes an object to JSON by removing circular references,
 * functions, React components, and other non-serializable values
 */
function safeStringify(obj: any, space?: number): string {
  const seen = new WeakSet();
  
  function cleanValue(value: any): any {
    // Handle null and undefined
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle primitives
    if (typeof value !== 'object') {
      return value;
    }
    
    // Handle circular references
    if (seen.has(value)) {
      return '[Circular]';
    }
    
    // Handle functions
    if (typeof value === 'function') {
      return '[Function]';
    }
    
    // Handle React components (objects with $$typeof property)
    if (value.$$typeof) {
      return '[React Component]';
    }
    
    // Handle Provider-like objects (common React context pattern)
    if (value.Provider || value.Consumer) {
      return '[React Context]';
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      seen.add(value);
      return value.map(cleanValue);
    }
    
    // Handle objects
    seen.add(value);
    const cleaned: any = {};
    
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        try {
          cleaned[key] = cleanValue(value[key]);
        } catch (error) {
          // Skip properties that can't be serialized
          cleaned[key] = '[Non-serializable]';
        }
      }
    }
    
    return cleaned;
  }
  
  try {
    const cleaned = cleanValue(obj);
    return JSON.stringify(cleaned, null, space);
  } catch (error) {
    console.error('Error in safeStringify:', error);
    // Fallback to regular stringify with error handling
    try {
      return JSON.stringify(obj, null, space);
    } catch (fallbackError) {
      console.error('Fallback stringify also failed:', fallbackError);
      return '{}';
    }
  }
}

export function useWorkflow(workflowId?: string) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null); // Track workflow ID
  const saveToDatabaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load workflow from Redis via API
  useEffect(() => {
    const loadWorkflow = async () => {
      setLoading(true);

      if (workflowId) {
        // Fetch workflow from API (Redis)
        try {
          const response = await fetch('/api/workflows');
          const data = await response.json();
          const workflows = data.workflows || [];
          const loaded = workflows.find((w: any) => w.id === workflowId);

          if (loaded) {
            // Fetch full workflow details
            const fullWorkflow = await fetch(`/api/workflows/${workflowId}`).then(r => r.json());
            let workflowData = fullWorkflow.workflow || loaded;

            // Clean up any invalid edges before setting the workflow
            const cleaned = cleanupInvalidEdges(workflowData.nodes, workflowData.edges);
            if (cleaned.removedCount > 0) {
              console.log(`🧹 Cleaned ${cleaned.removedCount} invalid edges from loaded workflow`);
              workflowData = {
                ...workflowData,
                nodes: cleaned.nodes,
                edges: cleaned.edges,
              };
            }

            setWorkflow(workflowData);
            // Store the workflow ID for future saves
            setCurrentWorkflowId(workflowData.id || null);
          } else {
            createNewWorkflow();
          }
        } catch (error) {
          console.error('Failed to load workflow from database:', error);
          createNewWorkflow();
        }
      } else {
        createNewWorkflow();
      }

      setLoading(false);
    };

    loadWorkflow();
  }, [workflowId]);

  // Load all workflows from API
  const loadWorkflows = useCallback(async () => {
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Failed to load workflows from API:', error);
      setWorkflows([]);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // Create new workflow
  const createNewWorkflow = useCallback(() => {
    const newWorkflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name: 'New Workflow',
      nodes: [
        {
          id: 'node_0',
          type: 'start',
          position: { x: 250, y: 100 },
          data: { label: 'Start' },
        },
        {
          id: 'node_1',
          type: 'agent',
          position: { x: 250, y: 250 },
          data: {
            label: 'Agent',
            name: 'My agent',
            instructions: 'You are a helpful assistant.',
            model: 'gpt-4.1',
            includeChatHistory: true,
            tools: [],
            outputFormat: 'Text',
          },
        },
      ],
      edges: [
        {
          id: 'edge_0_1',
          source: 'node_0',
          target: 'node_1',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWorkflow(newWorkflow);
    // No longer save to localStorage
    // Workflow will be saved via API when user makes changes

    return newWorkflow;
  }, []);

  // Save workflow with debounce to prevent multiple rapid saves
  // Use useCallback with minimal deps to prevent infinite loops
  const saveWorkflow = useCallback(async (updates?: Partial<Workflow>) => {
    // If no workflow exists yet, create a new one from updates
    if (!workflow) {
      if (!updates || !updates.nodes || !updates.edges) {
        console.warn('⚠️ Cannot save workflow: no workflow state and incomplete updates');
        return;
      }

      // Create a complete workflow from updates
      const newWorkflow: Workflow = {
        id: updates.id || `workflow_${Date.now()}`,
        name: updates.name || 'New Workflow',
        description: updates.description,
        nodes: updates.nodes,
        edges: updates.edges,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setWorkflow(newWorkflow);

      // Save immediately to database
      try {
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: safeStringify(newWorkflow),
        });
        const data = await response.json();
        console.log('💾 New workflow saved to database:', data.success ? 'SUCCESS' : 'FAILED');

        // Store the workflow ID from the response
        if (data.success && data.workflowId) {
          setCurrentWorkflowId(data.workflowId);
        }
      } catch (error) {
        console.error('Failed to save new workflow to database:', error);
      }
      return;
    }

    const updated: Workflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setWorkflow(updated);

    // Clear any pending save timeout
    if (saveToDatabaseTimeoutRef.current) {
      clearTimeout(saveToDatabaseTimeoutRef.current);
    }

    // Debounce the save to database to prevent rapid saves
    saveToDatabaseTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: safeStringify(updated),
        });
        const data = await response.json();
        console.log('💾 [AUTO-SAVE] Workflow synced to NeonDB:', data.success ? '✅ SUCCESS' : '❌ FAILED');

        // Store the workflow ID from the response
        if (data.success && data.workflowId) {
          setCurrentWorkflowId(data.workflowId);
        }

        // Don't reload workflows on every save - only when explicitly needed
        // This prevents unnecessary re-fetches and duplicate saves
      } catch (error) {
        console.error('❌ Failed to save workflow to database:', error);
      }
    }, 1000); // 1000ms debounce to batch rapid saves
  }, [workflow, loadWorkflows]);

  // Update nodes
  const updateNodes = useCallback((nodes: WorkflowNode[]) => {
    if (!workflow) {
      console.warn('⚠️ updateNodes called but no workflow exists');
      return;
    }

    console.log('📝 updateNodes called with', nodes.length, 'nodes');
    saveWorkflow({ nodes });
  }, [workflow, saveWorkflow]);

  // Update edges
  const updateEdges = useCallback((edges: WorkflowEdge[]) => {
    if (!workflow) return;

    saveWorkflow({ edges });
  }, [workflow, saveWorkflow]);

  // Update node data
  const updateNodeData = useCallback((nodeId: string, data: any) => {
    if (!workflow) return;

    const nodes = workflow.nodes.map(node =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } }
        : node
    );

    updateNodes(nodes);
  }, [workflow, updateNodes]);

  // Delete workflow
  const deleteWorkflow = useCallback((id: string) => {
    deleteWorkflowFromStorage(id);
    loadWorkflows();

    if (workflow?.id === id) {
      createNewWorkflow();
    }
  }, [workflow, loadWorkflows, createNewWorkflow]);

  // Save workflow immediately (non-debounced) - used before execution
  const saveWorkflowImmediate = useCallback(async (updates?: Partial<Workflow>) => {
    if (!workflow) {
      console.warn('⚠️ Cannot save workflow immediately: no workflow state');
      return;
    }

    const updated: Workflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setWorkflow(updated);

    // Cancel any pending debounced saves
    if (saveToDatabaseTimeoutRef.current) {
      clearTimeout(saveToDatabaseTimeoutRef.current);
      saveToDatabaseTimeoutRef.current = null;
    }

    // Save immediately without debounce
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeStringify(updated),
      });
      const data = await response.json();
      console.log('💾 [IMMEDIATE SAVE] Workflow saved to NeonDB:', data.success ? '✅ SUCCESS' : '❌ FAILED');

      if (data.success && data.workflowId) {
        setCurrentWorkflowId(data.workflowId);
      }

      return data.success;
    } catch (error) {
      console.error('❌ Failed to save workflow immediately:', error);
      return false;
    }
  }, [workflow]);

  return {
    workflow,
    workflows,
    loading,
    currentWorkflowId, // Expose workflow ID for templates and other features
    saveWorkflow,
    saveWorkflowImmediate, // Non-debounced save for before execution
    updateNodes,
    updateEdges,
    updateNodeData,
    deleteWorkflow,
    createNewWorkflow,
    loadWorkflows,
  };
}

export function useMCPServers() {
  const [servers, setServers] = useState<MCPServer[]>([]);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = () => {
    const loaded = getMCPServers();
    setServers(loaded);
  };

  const addServer = useCallback((server: MCPServer) => {
    saveMCPServer(server);
    loadServers();
  }, []);

  const updateServer = useCallback((id: string, updates: Partial<MCPServer>) => {
    const existing = servers.find(s => s.id === id);
    if (existing) {
      saveMCPServer({ ...existing, ...updates });
      loadServers();
    }
  }, [servers]);

  return {
    servers,
    addServer,
    updateServer,
    loadServers,
  };
}
