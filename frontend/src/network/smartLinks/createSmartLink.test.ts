import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCreateSmartLink, isCreateSmartLinkResponse } from './createSmartLink';

const mockGetToken = vi.fn(() => Promise.resolve('mock-token'));
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

describe('isCreateSmartLinkResponse', () => {
  it('returns true for valid SmartLinkResponse', () => {
    expect(
      isCreateSmartLinkResponse({
        user_id: 'u1',
        link_id: 'l1',
        title: 'T',
        short_url: 'x',
        total_visits: 0,
        total_clicks: 0,
      })
    ).toBe(true);
  });

  it('returns false for invalid payload', () => {
    expect(isCreateSmartLinkResponse(null)).toBe(false);
    expect(isCreateSmartLinkResponse({ title: 'T' })).toBe(false);
  });
});

describe('useCreateSmartLink', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user_id: 'user-1',
              link_id: 'link-new',
              title: 'My Link',
              short_url: 'abc',
              total_visits: 0,
              total_clicks: 0,
              platforms: [],
            }),
        } as Response)
      )
    );
  });

  it('does not fetch until createSmartLink is called', async () => {
    const { result } = renderHook(() => useCreateSmartLink());
    expect(result.current.status).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends POST with payload when createSmartLink is called', async () => {
    const { result } = renderHook(() => useCreateSmartLink());

    await act(() => {
      result.current.createSmartLink({
        title: 'My Link',
        short_url: 'abc',
        subtitle: 'Sub',
        cover_image_url: 'https://example.com/cover.jpg',
        audio_file_url: 'https://example.com/audio.mp3',
      });
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/smart-links'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'My Link',
          short_url: 'abc',
          subtitle: 'Sub',
          cover_image_url: 'https://example.com/cover.jpg',
          audio_file_url: 'https://example.com/audio.mp3',
        }),
      })
    );
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.title).toBe('My Link');
    expect(result.current.data?.link_id).toBe('link-new');
    expect(Array.isArray(result.current.data?.platforms)).toBe(true);
  });

  it('sets error when response fails type guard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'shape' }),
        } as Response)
      )
    );
    const { result } = renderHook(() => useCreateSmartLink());

    await act(() => {
      result.current.createSmartLink({
        title: 'T',
        short_url: 'x',
        cover_image_url: 'https://example.com/cover.jpg',
        audio_file_url: 'https://example.com/audio.mp3',
      });
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('type guard');
  });

  it('sets error when request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Bad request' }),
        } as Response)
      )
    );
    const { result } = renderHook(() => useCreateSmartLink());

    await act(() => {
      result.current.createSmartLink({
        title: 'T',
        short_url: 'x',
        cover_image_url: 'https://example.com/cover.jpg',
        audio_file_url: 'https://example.com/audio.mp3',
      });
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.error?.message).toContain('Bad request');
  });
});
