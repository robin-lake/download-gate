import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGetDownloadGates, mapDownloadGateResponseToCard, isListDownloadGatesResponseGuard } from './getDownloadGates';

const mockGetToken = vi.fn(() => Promise.resolve('mock-token'));
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

describe('isListDownloadGatesResponseGuard', () => {
  it('returns true for valid list response', () => {
    expect(
      isListDownloadGatesResponseGuard({
        items: [
          {
            user_id: 'u1',
            gate_id: 'g1',
            artist_name: 'Artist',
            title: 'Track',
            audio_file_url: 'https://example.com/a.mp3',
            visits: 0,
            downloads: 0,
            emails_captured: 0,
          },
        ],
        nextToken: null,
      })
    ).toBe(true);
  });

  it('returns false for invalid payload', () => {
    expect(isListDownloadGatesResponseGuard(null)).toBe(false);
    expect(isListDownloadGatesResponseGuard({ items: 'not-array', nextToken: null })).toBe(false);
  });
});

describe('mapDownloadGateResponseToCard', () => {
  it('maps API response to dashboard card shape', () => {
    const apiGate = {
      user_id: 'user-1',
      gate_id: 'gate-abc',
      artist_name: 'The Artist',
      title: 'Song Title',
      thumbnail_url: 'https://example.com/thumb.jpg',
      audio_file_url: 'https://example.com/audio.mp3',
      visits: 10,
      downloads: 3,
      emails_captured: 2,
    };
    const card = mapDownloadGateResponseToCard(apiGate);
    expect(card).toEqual({
      id: 'gate-abc',
      title: 'Song Title',
      subtitle: 'The Artist',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      visits: 10,
      downloads: 3,
      emailsCaptured: 2,
    });
  });

  it('omits thumbnailUrl when thumbnail_url is undefined', () => {
    const apiGate = {
      user_id: 'user-1',
      gate_id: 'gate-1',
      artist_name: 'Artist',
      title: 'Track',
      audio_file_url: 'https://example.com/a.mp3',
      visits: 0,
      downloads: 0,
      emails_captured: 0,
    };
    const card = mapDownloadGateResponseToCard(apiGate);
    expect(card).toHaveProperty('thumbnailUrl', undefined);
  });
});

describe('useGetDownloadGates', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  user_id: 'user-1',
                  gate_id: 'gate-1',
                  artist_name: 'Artist',
                  title: 'Track',
                  audio_file_url: 'https://example.com/a.mp3',
                  visits: 0,
                  downloads: 0,
                  emails_captured: 0,
                },
              ],
              nextToken: null,
            }),
        } as Response)
      )
    );
  });

  it('fetches GET /api/download-gates when enabled', async () => {
    const { result } = renderHook(() => useGetDownloadGates());
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].gate_id).toBe('gate-1');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/download-gates'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useGetDownloadGates({ enabled: false }));
    await waitFor(() => {}, { timeout: 100 });
    expect(result.current.status).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('appends limit and cursor to URL when provided', async () => {
    renderHook(() => useGetDownloadGates({ limit: 20, cursor: 'cursor-xyz' }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('limit=20');
    expect(callUrl).toContain('cursor=cursor-xyz');
  });

  it('sets error when response fails type guard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: 'invalid', nextToken: null }),
        } as Response)
      )
    );
    const { result } = renderHook(() => useGetDownloadGates());
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('type guard');
  });
});
