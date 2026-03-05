import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

const mockListByUserId = vi.fn();
vi.mock('../models/downloadGate.js', () => ({
  default: {
    listByUserId: (...args: unknown[]) => mockListByUserId(...args),
    create: vi.fn(),
  },
}));

const mockGetAuth = vi.fn();
vi.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  getAuth: (req: unknown) => mockGetAuth(req),
}));

let app: Express;
beforeEach(async () => {
  vi.clearAllMocks();
  const m = await import('../app.js');
  app = m.default;
});

describe('GET /api/download-gates', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: false, userId: null });

    const res = await request(app).get('/api/download-gates');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(mockListByUserId).not.toHaveBeenCalled();
  });

  it('returns 200 and items for authenticated user', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-123' });
    const mockItems = [
      {
        user_id: 'user-123',
        gate_id: 'gate-1',
        artist_name: 'Artist',
        title: 'Track',
        audio_file_url: 'https://example.com/audio.mp3',
        visits: 0,
        downloads: 0,
        emails_captured: 0,
      },
    ];
    mockListByUserId.mockResolvedValueOnce({ items: mockItems });

    const res = await request(app).get('/api/download-gates');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body.items).toEqual(mockItems);
    expect(res.body.nextToken).toBeNull();
    expect(mockListByUserId).toHaveBeenCalledTimes(1);
    expect(mockListByUserId).toHaveBeenCalledWith('user-123', { limit: 50, exclusiveStartKey: undefined });
  });

  it('passes limit query param and caps at 100', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    mockListByUserId.mockResolvedValueOnce({ items: [] });

    await request(app).get('/api/download-gates?limit=10');

    expect(mockListByUserId).toHaveBeenCalledWith('user-1', { limit: 10, exclusiveStartKey: undefined });
  });

  it('uses default limit when limit is invalid', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    mockListByUserId.mockResolvedValueOnce({ items: [] });

    await request(app).get('/api/download-gates?limit=invalid');

    expect(mockListByUserId).toHaveBeenCalledWith('user-1', { limit: 50, exclusiveStartKey: undefined });
  });

  it('returns nextToken when lastEvaluatedKey is present', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    const lastKey = { user_id: 'user-1', gate_id: 'gate-5' };
    mockListByUserId.mockResolvedValueOnce({ items: [], lastEvaluatedKey: lastKey });

    const res = await request(app).get('/api/download-gates');

    expect(res.status).toBe(200);
    expect(res.body.nextToken).not.toBeNull();
    const decoded = JSON.parse(Buffer.from(res.body.nextToken, 'base64url').toString('utf8'));
    expect(decoded).toEqual(lastKey);
  });

  it('returns 400 for invalid cursor', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });

    const res = await request(app).get('/api/download-gates?cursor=not-valid-base64!!!');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid cursor' });
    expect(mockListByUserId).not.toHaveBeenCalled();
  });

  it('passes decoded cursor as exclusiveStartKey', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    const lastKey = { user_id: 'user-1', gate_id: 'gate-3' };
    const cursor = Buffer.from(JSON.stringify(lastKey), 'utf8').toString('base64url');
    mockListByUserId.mockResolvedValueOnce({ items: [] });

    await request(app).get(`/api/download-gates?cursor=${encodeURIComponent(cursor)}`);

    expect(mockListByUserId).toHaveBeenCalledWith('user-1', { limit: 50, exclusiveStartKey: lastKey });
  });
});
