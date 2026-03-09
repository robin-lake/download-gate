import { useRequest } from '../request';
import { useState, useCallback, useEffect } from 'react';
import type { SmartLinkResponse, CreateSmartLinkRequest } from './types';
import { isSmartLinkResponse } from './types';
import { defineTypeGuard } from '../request';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Type guard for create smart link API response. */
export const isCreateSmartLinkResponse = defineTypeGuard(
  (data: unknown): data is SmartLinkResponse => isSmartLinkResponse(data)
);

export interface CreateSmartLinkOptions {
  /** Clerk getToken; required for authenticated request. */
  getToken: (() => Promise<string | null>) | null;
}

/**
 * Creates a new smart link via POST /api/smart-links.
 * @throws Error if the request fails or the response fails the type guard.
 */
export async function createSmartLink(
  payload: CreateSmartLinkRequest,
  options: CreateSmartLinkOptions
): Promise<SmartLinkResponse> {
  const { getToken } = options;
  const token = getToken ? await getToken() : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/smart-links`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      raw &&
      typeof raw === 'object' &&
      'error' in raw &&
      typeof (raw as { error: unknown }).error === 'string'
        ? (raw as { error: string }).error
        : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  if (!isCreateSmartLinkResponse(raw)) {
    throw new Error('Response failed type guard');
  }

  return raw;
}

export interface UseCreateSmartLinkResult {
  createSmartLink: (payload: CreateSmartLinkRequest) => void;
  data: SmartLinkResponse | null;
  error: Error | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  isLoading: boolean;
}

/**
 * Hook to create a smart link via POST /api/smart-links.
 * Call createSmartLink(payload) on form submit. Uses useRequest with enabled only when a payload is set.
 */
export function useCreateSmartLink(): UseCreateSmartLinkResult {
  const [payload, setPayload] = useState<CreateSmartLinkRequest | null>(null);

  const result = useRequest<SmartLinkResponse>(`${API_BASE}/api/smart-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
    enabled: !!payload,
    typeGuard: isCreateSmartLinkResponse,
  });

  useEffect(() => {
    if (result.status === 'success' || result.status === 'error') {
      setPayload(null);
    }
  }, [result.status]);

  const createSmartLink = useCallback((p: CreateSmartLinkRequest) => {
    setPayload(p);
  }, []);

  return {
    ...result,
    createSmartLink,
  };
}
