import { useDatabaseMutation } from './useDatabase';

// Hook to save as template (replaces useMutation(api.templates.saveAsTemplate))
export function useSaveAsTemplate() {
  const { mutate, loading, error } = useDatabaseMutation(
    async (templateData: any) => {
      const response = await fetch('/api/database/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });
      if (!response.ok) throw new Error('Failed to save template');
      return response.json();
    }
  );

  return { saveAsTemplate: mutate, loading, error };
}
