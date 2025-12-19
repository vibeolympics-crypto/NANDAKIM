import { useState, useEffect, useCallback, useRef } from 'react';
import { FetchOptions } from '../lib/api';

export interface DataLoaderState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isEmpty: boolean;
}

export interface UseDataLoaderOptions extends FetchOptions {
  loadOnMount?: boolean;
}

/**
 * Custom hook for loading data with loading state, error handling, and empty state
 */
export function useDataLoader<T>(
  fetchFn: (options?: FetchOptions) => Promise<T>,
  options: UseDataLoaderOptions = {}
): DataLoaderState<T> & { reload: () => Promise<void> } {
  const { loadOnMount = true, ...fetchOptions } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(loadOnMount);
  const [error, setError] = useState<Error | null>(null);
  
  // fetchOptions를 ref로 관리하여 불필요한 리렌더링 방지
  const fetchOptionsRef = useRef(fetchOptions);
  fetchOptionsRef.current = fetchOptions;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(fetchOptionsRef.current);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (loadOnMount) {
      loadData();
    }
  }, [loadOnMount, loadData]);

  // Check if data is empty
  const isEmpty =
    data !== null &&
    ((Array.isArray(data) && data.length === 0) ||
      (typeof data === 'object' && Object.keys(data).length === 0));

  return {
    data,
    loading,
    error,
    isEmpty,
    reload: loadData,
  };
}
