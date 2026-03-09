import { defineTypeGuard } from '../request';
import type { DownloadGateResponse, CreateDownloadGateRequest } from './types';
import { isDownloadGateResponse } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Type guard for create download gate API response. */
export const isCreateDownloadGateResponse = defineTypeGuard(
  (data: unknown): data is DownloadGateResponse => isDownloadGateResponse(data)
);

export interface CreateDownloadGateOptions {
  /** Clerk getToken; required for authenticated request. */
  getToken: (() => Promise<string | null>) | null;
}

/**
 * Creates a new download gate via POST /api/download-gates.
 * Validates the response with a type guard.
 * @throws Error if the request fails or the response fails the type guard.
 */
export async function createDownloadGate(
  payload: CreateDownloadGateRequest,
  options: CreateDownloadGateOptions
): Promise<DownloadGateResponse> {
  const { getToken } = options;
  const token = getToken ? await getToken() : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/download-gates`, {
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

  if (!isCreateDownloadGateResponse(raw)) {
    throw new Error('Response failed type guard');
  }

  return raw;
}
