import { useRequest, defineTypeGuard } from '../request';
import type { DownloadGateResponse } from './types';
import { isDownloadGateResponse } from './types';

export const isDownloadGateResponseGuard = defineTypeGuard(
  (data: unknown): data is DownloadGateResponse => isDownloadGateResponse(data)
);

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface UseGetDownloadGateByIdParams {
  gateId: string | undefined;
  enabled?: boolean;
}

/**
 * Fetches GET /api/gates/:gateId (public, no auth required).
 * Use for the public download gate landing page.
 */
export function useGetDownloadGateById(params: UseGetDownloadGateByIdParams) {
  const { gateId, enabled = true } = params;
  const url =
    gateId && gateId.trim()
      ? `${API_BASE}/api/gates/${encodeURIComponent(gateId.trim())}`
      : null;

  return useRequest<DownloadGateResponse>(url, {
    method: 'GET',
    typeGuard: isDownloadGateResponseGuard,
    enabled: Boolean(gateId?.trim()) && enabled,
  });
}
