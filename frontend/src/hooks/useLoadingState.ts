import { useState, useCallback } from 'react';

interface UseLoadingStateReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

export const useLoadingState = (initialLoading = false): UseLoadingStateReturn => {
  const [loading, setLoading] = useState(initialLoading);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    setLoading,
    withLoading,
  };
};