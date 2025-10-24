import { useDatabaseQuery, useDatabaseMutation } from './useDatabase';
import { useUser } from '@clerk/nextjs';

// Hook to get user LLM keys (replaces useQuery(api.userLLMKeys.getUserLLMKeys))
export function useUserLLMKeys() {
  const { user } = useUser();
  
  const { data, loading, error } = useDatabaseQuery(
    async () => {
      if (!user) return [];
      const response = await fetch(`/api/database/user-llm-keys?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch user LLM keys');
      return response.json();
    },
    [user?.id]
  );

  return { userLLMKeys: data, loading, error };
}

// Hook to upsert LLM key (replaces useMutation(api.userLLMKeys.upsertLLMKey))
export function useUpsertLLMKey() {
  const { mutate, loading, error } = useDatabaseMutation(
    async (keyData: any) => {
      const response = await fetch('/api/database/user-llm-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyData),
      });
      if (!response.ok) throw new Error('Failed to upsert LLM key');
      return response.json();
    }
  );

  return { upsertLLMKey: mutate, loading, error };
}

// Hook to delete LLM key (replaces useMutation(api.userLLMKeys.deleteLLMKey))
export function useDeleteLLMKey() {
  const { mutate, loading, error } = useDatabaseMutation(
    async ({ id, userId }: { id: string; userId: string }) => {
      const response = await fetch(`/api/database/user-llm-keys/${id}?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete LLM key');
      return response.json();
    }
  );

  return { deleteLLMKey: mutate, loading, error };
}

// Hook to toggle LLM key active (replaces useMutation(api.userLLMKeys.toggleKeyActive))
export function useToggleLLMKeyActive() {
  const { mutate, loading, error } = useDatabaseMutation(
    async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/database/user-llm-keys/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error('Failed to toggle LLM key');
      return response.json();
    }
  );

  return { toggleLLMKeyActive: mutate, loading, error };
}
