import { useDatabaseQuery, useDatabaseMutation } from './useDatabase';
import { useUser } from '@clerk/nextjs';

// Hook to get user's MCP servers (replaces useQuery(api.mcpServers.listUserMCPs))
export function useMCPServers() {
  const { user } = useUser();
  
  const { data, loading, error } = useDatabaseQuery(
    async () => {
      if (!user) return [];
      const response = await fetch(`/api/database/mcp-servers?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch MCP servers');
      return response.json();
    },
    [user?.id]
  );

  return { mcpServers: data, loading, error };
}

// Hook to get enabled MCP servers (replaces useQuery(api.mcpServers.getEnabledMCPs))
export function useEnabledMCPs() {
  const { user } = useUser();
  
  const { data, loading, error } = useDatabaseQuery(
    async () => {
      if (!user) return [];
      const response = await fetch(`/api/database/mcp-servers?userId=${user.id}&enabled=true`);
      if (!response.ok) throw new Error('Failed to fetch enabled MCP servers');
      return response.json();
    },
    [user?.id]
  );

  return { mcpServers: data, loading, error };
}

// Hook to add MCP server (replaces useMutation(api.mcpServers.addMCPServer))
export function useAddMCPServer() {
  const { mutate, loading, error } = useDatabaseMutation(
    async (serverData: { name: string; description?: string; url: string; userId?: string; tools?: any[]; [key: string]: any }) => {
      const response = await fetch('/api/database/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', ...serverData }),
      });
      if (!response.ok) throw new Error('Failed to add MCP server');
      return response.json();
    }
  );

  return { addMCPServer: mutate, loading, error };
}

// Hook to update MCP server (replaces useMutation(api.mcpServers.updateMCPServer))
export function useUpdateMCPServer() {
  const { mutate, loading, error } = useDatabaseMutation(
    async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const response = await fetch(`/api/database/mcp-servers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update MCP server');
      return response.json();
    }
  );

  return { updateMCPServer: mutate, loading, error };
}

// Hook to delete MCP server (replaces useMutation(api.mcpServers.deleteMCPServer))
export function useDeleteMCPServer() {
  const { mutate, loading, error } = useDatabaseMutation(
    async ({ id }: { id: string }) => {
      const response = await fetch(`/api/database/mcp-servers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete MCP server');
      return response.json();
    }
  );

  return { deleteMCPServer: mutate, loading, error };
}

// Hook to toggle MCP enabled (replaces useMutation(api.mcpServers.toggleMCPEnabled))
export function useToggleMCPEnabled() {
  const { mutate, loading, error } = useDatabaseMutation(
    async ({ id }: { id: string }) => {
      const response = await fetch(`/api/database/mcp-servers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      if (!response.ok) throw new Error('Failed to toggle MCP server');
      return response.json();
    }
  );

  return { toggleMCPEnabled: mutate, loading, error };
}

// Hook to seed official MCPs (replaces useMutation(api.mcpServers.seedOfficialMCPs))
export function useSeedOfficialMCPs() {
  const { mutate, loading, error } = useDatabaseMutation(
    async () => {
      const response = await fetch('/api/database/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });
      if (!response.ok) throw new Error('Failed to seed official MCPs');
      return response.json();
    }
  );

  return { seedOfficialMCPs: mutate, loading, error };
}

// Hook to update connection status (replaces useMutation(api.mcpServers.updateConnectionStatus))
export function useUpdateConnectionStatus() {
  const { mutate, loading, error } = useDatabaseMutation(
    async ({ id, status, tools, error: errorMsg }: { id: string; status: 'connected' | 'disconnected' | 'error'; tools?: any[]; error?: string }) => {
      const response = await fetch(`/api/database/mcp-servers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connection', status, tools, error: errorMsg }),
      });
      if (!response.ok) throw new Error('Failed to update connection status');
      return response.json();
    }
  );

  return { updateConnectionStatus: mutate, loading, error };
}

// Hook to cleanup official MCPs (replaces useMutation(api.mcpServers.cleanupOfficialMCPs))
export function useCleanupOfficialMCPs() {
  const { mutate, loading, error } = useDatabaseMutation(
    async () => {
      const response = await fetch('/api/database/mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' }),
      });
      if (!response.ok) throw new Error('Failed to cleanup official MCPs');
      return response.json();
    }
  );

  return { cleanupOfficialMCPs: mutate, loading, error };
}
