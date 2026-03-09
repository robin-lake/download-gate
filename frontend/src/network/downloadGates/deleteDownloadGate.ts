import { useRequest, defineTypeGuard } from '../request';
import { useState, useCallback, useEffect } from 'react';
import type { DeleteDownloadGateResponse } from './types';
import { isDeleteDownloadGateResponse } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const isDeleteDownloadGateResponseGuard = defineTypeGuard(
  (data: unknown): data is DeleteDownloadGateResponse => isDeleteDownloadGateResponse(data)
);

export interface UseDeleteDownloadGateResult {
  deleteGate: (gateId: string) => void;
  data: DeleteDownloadGateResponse | null;
  error: Error | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  isLoading: boolean;
}

/**
 * Hook to delete a download gate (and its steps) via DELETE /api/download-gates/:gateId.
 * Call deleteGate(gateId) to trigger the request (e.g. on Folder icon click).
 * Uses useRequest with enabled only when a gateId is set.
 */
export function useDeleteDownloadGate(): UseDeleteDownloadGateResult {
  const [gateIdToDelete, setGateIdToDelete] = useState<string | null>(null);

  const url =
    gateIdToDelete != null && gateIdToDelete.trim() !== ''
      ? `${API_BASE}/api/download-gates/${encodeURIComponent(gateIdToDelete.trim())}`
      : null;

  const result = useRequest<DeleteDownloadGateResponse>(url, {
    method: 'DELETE',
    enabled: !!gateIdToDelete,
    typeGuard: isDeleteDownloadGateResponseGuard,
  });

  useEffect(() => {
    if (result.status === 'success' || result.status === 'error') {
      setGateIdToDelete(null);
    }
  }, [result.status]);

  const deleteGate = useCallback((gateId: string) => {
    if (gateId != null && gateId.trim() !== '') {
      setGateIdToDelete(gateId.trim());
    }
  }, []);

  return {
    ...result,
    deleteGate,
  };
}
