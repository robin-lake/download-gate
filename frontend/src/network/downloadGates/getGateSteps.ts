import { useRequest, defineTypeGuard } from '../request';
import type { GateStepsResponse } from './types';
import { isGateStepsResponse } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const gateStepsResponseGuard = defineTypeGuard(
  (data: unknown): data is GateStepsResponse => isGateStepsResponse(data)
);

export interface UseGetGateStepsParams {
  gateId: string | undefined;
  enabled?: boolean;
}

/**
 * Fetches GET /api/gates/:gateId/steps (public). Use on the live download gate page.
 */
export function useGetGateSteps(params: UseGetGateStepsParams) {
  const { gateId, enabled = true } = params;
  const url =
    gateId && gateId.trim()
      ? `${API_BASE}/api/gates/${encodeURIComponent(gateId.trim())}/steps`
      : null;

  return useRequest<GateStepsResponse>(url, {
    method: 'GET',
    typeGuard: gateStepsResponseGuard,
    enabled: Boolean(gateId?.trim()) && enabled,
  });
}
