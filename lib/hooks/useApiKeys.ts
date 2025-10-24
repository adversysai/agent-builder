import { useDatabaseQuery, useDatabaseMutation } from './useDatabase';
import { useUser } from '@clerk/nextjs';

// Hook to get API keys (replaces useQuery(api.apiKeys.list))
export function useApiKeys() {
  const { user } = useUser();
  
  const { data, loading, error } = useDatabaseQuery(
    async () => {
      if (!user) return [];
      const response = await fetch(`/api/database/api-keys?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch API keys');
      return response.json();
    },
    [user?.id]
  );

  return { apiKeys: data, loading, error };
}

// Hook to generate API key (replaces useMutation(api.apiKeys.generate))
export function useGenerateApiKey() {
  const { mutate, loading, error } = useDatabaseMutation(
    async ({ name }: { name: string }) => {
      const response = await fetch('/api/database/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to generate API key');
      return response.json();
    }
  );

  return { generateKey: mutate, loading, error };
}

// Hook to revoke API key (replaces useMutation(api.apiKeys.revoke))
export function useRevokeApiKey() {
  const { mutate, loading, error } = useDatabaseMutation(
    async ({ id }: { id: string }) => {
      const response = await fetch(`/api/database/api-keys/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to revoke API key');
      return response.json();
    }
  );

  return { revokeKey: mutate, loading, error };
}
