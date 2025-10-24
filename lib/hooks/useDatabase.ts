import { useState, useEffect } from 'react';

// Generic hook for database queries
export function useDatabaseQuery<T>(
  queryFn: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await queryFn();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error };
}

// Hook for mutations
export function useDatabaseMutation<T, P>(
  mutationFn: (params: P) => Promise<T>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (params: P): Promise<T | undefined> => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutationFn(params);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
