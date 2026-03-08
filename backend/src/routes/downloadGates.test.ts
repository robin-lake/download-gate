import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

const mockListByUserId = vi.fn();
const mockGetStatsByUserId = vi.fn();
const mockFindByUserAndGateId = vi.fn();
const mockDeleteGate = vi.fn();
vi.mock('../models/downloadGate.js', () => ({
  default: {
    listByUserId: (...args: unknown[]) => mockListByUserId(...args),
    getStatsByUserId: (...args: unknown[]) => mockGetStatsByUserId(...args),
    create: vi.fn(),
    findByUserAndGateId: (...args: unknown[]) => mockFindByUserAndGateId(...args),
    delete: (...args: unknown[]) => mockDeleteGate(...args),
  },
}));

const mockListByGateId = vi.fn();
const mockDeleteStep = vi.fn();
vi.mock('../models/gateStep.js', () => ({
  default: {
    listByGateId: (...args: unknown[]) => mockListByGateId(...args),
    delete: (...args: unknown[]) => mockDeleteStep(...args),
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

describe('GET /api/download-gates/stats', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: false, userId: null });

    const res = await request(app).get('/api/download-gates/stats');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(mockGetStatsByUserId).not.toHaveBeenCalled();
  });

  it('returns 200 and summed stats for authenticated user', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-123' });
    mockGetStatsByUserId.mockResolvedValueOnce({
      total_visits: 100,
      total_downloads: 25,
      total_emails_captured: 10,
    });

    const res = await request(app).get('/api/download-gates/stats');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total_visits: 100,
      total_downloads: 25,
      total_emails_captured: 10,
    });
    expect(mockGetStatsByUserId).toHaveBeenCalledTimes(1);
    expect(mockGetStatsByUserId).toHaveBeenCalledWith('user-123');
  });

  it('returns zeros when user has no gates', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-empty' });
    mockGetStatsByUserId.mockResolvedValueOnce({
      total_visits: 0,
      total_downloads: 0,
      total_emails_captured: 0,
    });

    const res = await request(app).get('/api/download-gates/stats');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total_visits: 0,
      total_downloads: 0,
      total_emails_captured: 0,
    });
  });
});

describe('DELETE /api/download-gates/:gateId', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: false, userId: null });

    const res = await request(app).delete('/api/download-gates/gate-123');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(mockFindByUserAndGateId).not.toHaveBeenCalled();
  });

  it('returns 404 when gate does not exist or user does not own it', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    mockFindByUserAndGateId.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/download-gates/gate-123');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Download gate not found' });
    expect(mockFindByUserAndGateId).toHaveBeenCalledWith('user-1', 'gate-123');
    expect(mockListByGateId).not.toHaveBeenCalled();
    expect(mockDeleteGate).not.toHaveBeenCalled();
  });

  it('returns 400 when gateId is missing or empty', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });

    const res = await request(app).delete('/api/download-gates/%20');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'gateId is required' });
    expect(mockFindByUserAndGateId).not.toHaveBeenCalled();
  });

  it('deletes all gate steps and the gate and returns 200', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    mockFindByUserAndGateId.mockResolvedValueOnce({
      user_id: 'user-1',
      gate_id: 'gate-123',
      artist_name: 'Artist',
      title: 'Track',
      audio_file_url: 'https://example.com/audio.mp3',
      visits: 0,
      downloads: 0,
      emails_captured: 0,
    });
    mockListByGateId.mockResolvedValueOnce([
      { gate_id: 'gate-123', step_id: 'step-1', service_type: 'email_capture', step_order: 1, is_skippable: false, config: {} },
      { gate_id: 'gate-123', step_id: 'step-2', service_type: 'spotify', step_order: 2, is_skippable: true, config: {} },
    ]);
    mockDeleteStep.mockResolvedValueOnce({}).mockResolvedValueOnce({});
    mockDeleteGate.mockResolvedValueOnce({});

    const res = await request(app).delete('/api/download-gates/gate-123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true });
    expect(mockFindByUserAndGateId).toHaveBeenCalledWith('user-1', 'gate-123');
    expect(mockListByGateId).toHaveBeenCalledWith('gate-123');
    expect(mockDeleteStep).toHaveBeenCalledTimes(2);
    expect(mockDeleteStep).toHaveBeenNthCalledWith(1, 'gate-123', 'step-1');
    expect(mockDeleteStep).toHaveBeenNthCalledWith(2, 'gate-123', 'step-2');
    expect(mockDeleteGate).toHaveBeenCalledWith('user-1', 'gate-123');
  });

  it('deletes gate with no steps', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    mockFindByUserAndGateId.mockResolvedValueOnce({
      user_id: 'user-1',
      gate_id: 'gate-empty',
      artist_name: 'Artist',
      title: 'Track',
      audio_file_url: 'https://example.com/audio.mp3',
      visits: 0,
      downloads: 0,
      emails_captured: 0,
    });
    mockListByGateId.mockResolvedValueOnce([]);
    mockDeleteGate.mockResolvedValueOnce({});

    const res = await request(app).delete('/api/download-gates/gate-empty');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true });
    expect(mockDeleteStep).not.toHaveBeenCalled();
    expect(mockDeleteGate).toHaveBeenCalledWith('user-1', 'gate-empty');
  });
});
