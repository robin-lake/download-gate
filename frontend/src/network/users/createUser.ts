import { useRequest } from '../request';
import { useState, useCallback, useEffect } from 'react';
import type { User } from './types.ts';
import { isUser } from './types.ts';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface UseCreateUserResult {
  createUser: (name: string, email: string) => void;
  data: User | null;
  error: Error | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  isLoading: boolean;
}

/**
 * Hook to create a user via POST /api/users. Call createUser(name, email) on form submit.
 * Uses useRequest with enabled only when a payload is set (after submit).
 */
export function useCreateUser(): UseCreateUserResult {
  const [payload, setPayload] = useState<{ name: string; email: string } | null>(null);

  const result = useRequest<User>(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
    enabled: !!payload,
    typeGuard: isUser,
  });

  // Clear payload after request completes so the user can submit again
  useEffect(() => {
    if (result.status === 'success' || result.status === 'error') {
      setPayload(null);
    }
  }, [result.status]);

  const createUser = useCallback((name: string, email: string) => {
    setPayload({ name, email });
  }, []);

  return {
    ...result,
    createUser,
  };
}
