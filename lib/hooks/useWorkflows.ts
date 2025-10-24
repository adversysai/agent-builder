import { useDatabaseQuery, useDatabaseMutation } from './useDatabase';
import { useUser } from '@clerk/nextjs';

// Hook to get template by custom ID (replaces useQuery(api.workflows.getTemplateByCustomId))
export function useTemplateByCustomId(customId: string | null) {
  const { data, loading, error } = useDatabaseQuery(
    async () => {
      if (!customId) return null;
      const response = await fetch(`/api/database/templates/${customId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch template');
      }
      return response.json();
    },
    [customId]
  );

  return { template: data, loading, error };
}

// Hook to get all templates (replaces useQuery(api.workflows.getTemplates))
export function useTemplates() {
  const { data, loading, error } = useDatabaseQuery(
    async () => {
      const response = await fetch('/api/database/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
    []
  );

  return { templates: data, loading, error };
}

// Hook to get user workflows (replaces useQuery(api.workflows.list))
export function useUserWorkflows() {
  const { user } = useUser();
  
  const { data, loading, error } = useDatabaseQuery(
    async () => {
      if (!user) return [];
      const response = await fetch(`/api/database/workflows?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch workflows');
      return response.json();
    },
    [user?.id]
  );

  return { workflows: data, loading, error };
}

// Hook to save workflow (replaces useMutation(api.workflows.saveWorkflow))
export function useSaveWorkflow() {
  const { mutate, loading, error } = useDatabaseMutation(
    async (workflow: any) => {
      const response = await fetch('/api/database/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });
      if (!response.ok) throw new Error('Failed to save workflow');
      return response.json();
    }
  );

  return { saveWorkflow: mutate, loading, error };
}

// Hook to update template structure (replaces useMutation(api.workflows.updateTemplateStructure))
export function useUpdateTemplateStructure() {
  const { mutate, loading, error } = useDatabaseMutation(
    async ({ customId, nodes, edges }: { customId: string; nodes: any[]; edges: any[] }) => {
      const response = await fetch('/api/database/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customId, nodes, edges }),
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    }
  );

  return { updateTemplateStructure: mutate, loading, error };
}
