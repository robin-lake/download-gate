import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

const mockFindByShortCode = vi.fn();
const mockFindByGateId = vi.fn();
const mockIncrementCount = vi.fn();

vi.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  getAuth: () => ({ isAuthenticated: false, userId: null }),
}));

vi.mock('../models/downloadGate.js', () => ({
  default: {
    findByShortCode: (...args: unknown[]) => mockFindByShortCode(...args),
    findByGateId: (...args: unknown[]) => mockFindByGateId(...args),
    incrementCount: (...args: unknown[]) => mockIncrementCount(...args),
  },
}));

vi.mock('../models/gateStep.js', () => ({
  default: {
    listByGateId: vi.fn().mockResolvedValue({ steps: [] }),
  },
}));

const mockGate = {
  user_id: 'user-1',
  gate_id: 'gate-1',
  artist_name: 'Artist',
  title: 'Track',
  audio_file_url: 'https://example.com/audio.mp3',
  visits: 0,
  downloads: 0,
  emails_captured: 0,
};

function resolveGateWithShortCode() {
  mockFindByShortCode.mockResolvedValue(mockGate);
  mockFindByGateId.mockResolvedValue(null);
}

function resolveGateWithGateId() {
  mockFindByShortCode.mockResolvedValue(null);
  mockFindByGateId.mockResolvedValue(mockGate);
}

function resolveGateNotFound() {
  mockFindByShortCode.mockResolvedValue(null);
  mockFindByGateId.mockResolvedValue(null);
}

let app: Express;
beforeEach(async () => {
  vi.clearAllMocks();
  const m = await import('../app.js');
  app = m.default;
});

describe('POST /api/gates/:gateIdOrSlug/visit', () => {
  it('returns 204 and increments visits when gate is found by short_code', async () => {
    resolveGateWithShortCode();
    mockIncrementCount.mockResolvedValueOnce({ ...mockGate, visits: 1 });

    const res = await request(app).post('/api/gates/qsro6b/visit');

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(mockFindByShortCode).toHaveBeenCalledWith('qsro6b');
    // When found by short_code, findByGateId is not called
    expect(mockIncrementCount).toHaveBeenCalledTimes(1);
    expect(mockIncrementCount).toHaveBeenCalledWith('user-1', 'gate-1', 'visits');
  });

  it('returns 204 and increments visits when gate is found by gate_id', async () => {
    resolveGateWithGateId();
    mockIncrementCount.mockResolvedValueOnce({ ...mockGate, visits: 1 });

    const res = await request(app).post('/api/gates/gate-1/visit');

    expect(res.status).toBe(204);
    expect(mockIncrementCount).toHaveBeenCalledWith('user-1', 'gate-1', 'visits');
  });

  it('returns 404 when gate is not found', async () => {
    resolveGateNotFound();

    const res = await request(app).post('/api/gates/nonexistent/visit');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Download gate not found' });
    expect(mockIncrementCount).not.toHaveBeenCalled();
  });

  it('returns 400 when gateIdOrSlug is missing', async () => {
    const res = await request(app).post('/api/gates/%20/visit');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'gateIdOrSlug is required' });
  });
});

describe('POST /api/gates/:gateIdOrSlug/download', () => {
  it('returns 204 and increments downloads when gate is found', async () => {
    resolveGateWithShortCode();
    mockIncrementCount.mockResolvedValueOnce({ ...mockGate, downloads: 1 });

    const res = await request(app).post('/api/gates/qsro6b/download');

    expect(res.status).toBe(204);
    expect(mockIncrementCount).toHaveBeenCalledWith('user-1', 'gate-1', 'downloads');
  });

  it('returns 404 when gate is not found', async () => {
    resolveGateNotFound();

    const res = await request(app).post('/api/gates/nonexistent/download');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Download gate not found' });
    expect(mockIncrementCount).not.toHaveBeenCalled();
  });
});
