import { useState, useCallback, useEffect, useRef } from 'react';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseRequestResult<T> {
  data: T | null;
  error: Error | null;
  status: RequestStatus;
  isLoading: boolean;
  refetch: () => void;
}

export interface UseRequestOptions<T> extends Omit<RequestInit, 'signal'> {
  /** Type guard to validate and narrow the response body. If it returns false, the hook sets an error. */
  typeGuard?: (data: unknown) => data is T;
  /** If false, the request is not sent (and will not run on mount). Default true. */
  enabled?: boolean;
}

/**
 * Generic hook for network requests. Pass a URL and optional fetch options;
 * the hook calls fetch internally and optionally validates the JSON with a type guard.
 *
 * @example
 * const { data, error, isLoading, refetch } = useRequest<User[]>('/api/users', {
 *   typeGuard: isUserList,
 * });
 *
 * @example
 * // Conditional fetch
 * const { data } = useRequest(`/api/users/${id}`, { typeGuard: isUser, enabled: Boolean(id) });
 */
export function useRequest<T = unknown>(
  url: string | null,
  options: UseRequestOptions<T> = {}
): UseRequestResult<T> {
  const { typeGuard, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<RequestStatus>('idle');

  const urlRef = useRef(url);
  const optionsRef = useRef(options);
  urlRef.current = url;
  optionsRef.current = options;

  const run = useCallback(async () => {
    const currentUrl = urlRef.current;
    if (!currentUrl) return;

    const { typeGuard: tg, enabled: _en, ...init } = optionsRef.current;
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(currentUrl, init);
      const raw: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          raw &&
          typeof raw === 'object' &&
          'error' in raw &&
          typeof (raw as { error: unknown }).error === 'string'
            ? (raw as { error: string }).error
            : `Request failed: ${response.status}`;
        setError(new Error(message));
        setStatus('error');
        setData(null);
        return;
      }

      if (tg) {
        if (!tg(raw)) {
          setError(new Error('Response failed type guard'));
          setStatus('error');
          setData(null);
          return;
        }
        setData(raw);
      } else {
        setData(raw as T);
      }

      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus('error');
      setData(null);
    }
  }, [typeGuard]);

  const refetch = useCallback(() => {
    run();
  }, [run]);

  useEffect(() => {
    if (enabled && url) {
      run();
    }
  }, [enabled, url, run]);

  return {
    data,
    error,
    status,
    isLoading: status === 'loading',
    refetch,
  };
}

/** Helper to define a type guard for a request response. Use with useRequest's typeGuard option. */
export function defineTypeGuard<T>(guard: (data: unknown) => data is T): (data: unknown) => data is T {
  return guard;
}
