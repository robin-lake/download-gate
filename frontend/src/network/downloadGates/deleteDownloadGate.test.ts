import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDeleteDownloadGate } from './deleteDownloadGate';

const mockGetToken = vi.fn(() => Promise.resolve('mock-token'));
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

describe('useDeleteDownloadGate', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ deleted: true }),
        } as Response)
      )
    );
  });

  it('starts idle and does not fetch until deleteGate is called', async () => {
    const { result } = renderHook(() => useDeleteDownloadGate());

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    await waitFor(() => {}, { timeout: 50 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends DELETE request with correct URL when deleteGate is called', async () => {
    const { result } = renderHook(() => useDeleteDownloadGate());

    act(() => {
      result.current.deleteGate('gate-123');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/download-gates\/gate-123$/),
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(result.current.data).toEqual({ deleted: true });
  });

  it('encodes gateId in URL', async () => {
    const { result } = renderHook(() => useDeleteDownloadGate());

    act(() => {
      result.current.deleteGate('gate/with/slashes');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain(encodeURIComponent('gate/with/slashes'));
  });

  it('does not trigger request when deleteGate is called with empty string', async () => {
    const { result } = renderHook(() => useDeleteDownloadGate());

    act(() => {
      result.current.deleteGate('');
    });

    await waitFor(() => {}, { timeout: 100 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sets error when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Download gate not found' }),
        } as Response)
      )
    );

    const { result } = renderHook(() => useDeleteDownloadGate());

    act(() => {
      result.current.deleteGate('gate-missing');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Download gate not found');
  });

  it('sets error when response fails type guard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ wrong: 'shape' }),
        } as Response)
      )
    );

    const { result } = renderHook(() => useDeleteDownloadGate());

    act(() => {
      result.current.deleteGate('gate-1');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('type guard');
  });

  it('clears gateId after success so hook can be used again', async () => {
    const { result } = renderHook(() => useDeleteDownloadGate());

    act(() => {
      result.current.deleteGate('gate-1');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).toEqual({ deleted: true });

    act(() => {
      result.current.deleteGate('gate-2');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[1][0]).toContain('gate-2');
  });
});
