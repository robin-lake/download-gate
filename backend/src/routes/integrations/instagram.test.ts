import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

const mockFindByShortCode = vi.fn();
const mockFindByGateId = vi.fn();
const mockListByGateId = vi.fn();

vi.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  getAuth: () => ({ isAuthenticated: false, userId: null }),
}));

vi.mock('../../models/downloadGate.js', () => ({
  default: {
    findByShortCode: (...args: unknown[]) => mockFindByShortCode(...args),
    findByGateId: (...args: unknown[]) => mockFindByGateId(...args),
  },
}));

vi.mock('../../models/gateStep.js', () => ({
  default: {
    listByGateId: (...args: unknown[]) => mockListByGateId(...args),
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

function resolveGateNotFound() {
  mockFindByShortCode.mockResolvedValue(null);
  mockFindByGateId.mockResolvedValue(null);
}

let app: Express;

beforeEach(async () => {
  vi.clearAllMocks();
  delete process.env.INSTAGRAM_CLIENT_ID;
  delete process.env.INSTAGRAM_CLIENT_SECRET;
  delete process.env.INSTAGRAM_REDIRECT_URI;
  delete process.env.INSTAGRAM_SUCCESS_REDIRECT_URI;

  mockListByGateId.mockResolvedValue([]);

  const m = await import('../../app.js');
  app = m.default;
});

describe('GET /api/integrations/signin/instagram', () => {
  it('returns 500 when Instagram OAuth is not configured', async () => {
    const res = await request(app).get('/api/integrations/signin/instagram');

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      error: 'Instagram OAuth not configured',
      missing_env: expect.any(Array),
    });
  });

  it('redirects to Instagram authorize URL when configured', async () => {
    process.env.INSTAGRAM_CLIENT_ID = 'client-123';
    process.env.INSTAGRAM_REDIRECT_URI = 'https://api.example.com/callback';

    const res = await request(app)
      .get('/api/integrations/signin/instagram')
      .redirects(0);

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/^https:\/\/api\.instagram\.com\/oauth\/authorize/);
    expect(res.headers.location).toContain('client_id=client-123');
    expect(res.headers.location).toContain('redirect_uri=');
    expect(res.headers.location).toContain('response_type=code');
    expect(res.headers.location).toContain('state=');
  });
});

describe('GET /api/integrations/auth/instagram/callback', () => {
  it('returns 400 when error param is present', async () => {
    const res = await request(app)
      .get('/api/integrations/auth/instagram/callback?error=access_denied');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: 'Instagram authorization denied',
      details: 'access_denied',
    });
  });

  it('returns 400 when code or state is missing', async () => {
    const res = await request(app)
      .get('/api/integrations/auth/instagram/callback');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing code or state');
  });

  it('returns 403 when state does not match stored cookie', async () => {
    process.env.INSTAGRAM_CLIENT_ID = 'client-123';
    process.env.INSTAGRAM_CLIENT_SECRET = 'secret';
    process.env.INSTAGRAM_REDIRECT_URI = 'https://api.example.com/callback';
    process.env.INSTAGRAM_SUCCESS_REDIRECT_URI = 'https://app.example.com/oauth/instagram/success';

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const res = await request(app)
      .get('/api/integrations/auth/instagram/callback?code=abc&state=wrong-state')
      .redirects(0);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Instagram auth state does not match' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('redirects to success URL after token exchange', async () => {
    process.env.INSTAGRAM_CLIENT_ID = 'client-123';
    process.env.INSTAGRAM_CLIENT_SECRET = 'secret';
    process.env.INSTAGRAM_REDIRECT_URI = 'https://api.example.com/callback';
    process.env.INSTAGRAM_SUCCESS_REDIRECT_URI = 'https://app.example.com/oauth/instagram/success';

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        access_token: 'ig-token-123',
        user_id: 'ig-user-456',
      }),
    });

    vi.stubGlobal('fetch', mockFetch);

    const res = await request(app)
      .get('/api/integrations/auth/instagram/callback?code=auth-code&state=valid-state')
      .set('Cookie', 'instagram_oauth_state=valid-state')
      .redirects(0);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://app.example.com/oauth/instagram/success');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.instagram.com/oauth/access_token',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('POST /api/integrations/instagram/execute', () => {
  it('returns 401 when not connected (no cookie)', async () => {
    resolveGateWithShortCode();

    const res = await request(app)
      .post('/api/integrations/instagram/execute')
      .send({ gateIdOrSlug: 'qsro6b' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Not connected to Instagram. Complete the connection first.' });
  });

  it('returns 400 when gateIdOrSlug is missing', async () => {
    const res = await request(app)
      .post('/api/integrations/instagram/execute')
      .send({})
      .set('Content-Type', 'application/json')
      .set('Cookie', 'instagram_access_token=token-123');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'gateIdOrSlug is required' });
  });

  it('returns 404 when gate is not found', async () => {
    resolveGateNotFound();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'ig-user-1', username: 'fan' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await request(app)
      .post('/api/integrations/instagram/execute')
      .send({ gateIdOrSlug: 'nonexistent' })
      .set('Content-Type', 'application/json')
      .set('Cookie', 'instagram_access_token=token-123');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Download gate not found' });
  });

  it('returns 204 when execute succeeds', async () => {
    resolveGateWithShortCode();
    mockListByGateId.mockResolvedValueOnce([
      {
        gate_id: 'gate-1',
        step_id: 'step-1',
        service_type: 'instagram',
        step_order: 1,
        is_skippable: false,
        config: {
          follow_profile_enabled: true,
          profile_urls: ['https://instagram.com/artist'],
        },
      },
    ]);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'ig-user-1', username: 'fan' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await request(app)
      .post('/api/integrations/instagram/execute')
      .send({ gateIdOrSlug: 'qsro6b' })
      .set('Content-Type', 'application/json')
      .set('Cookie', 'instagram_access_token=token-123');

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(mockFetch).toHaveBeenCalled();
  });

  it('returns 204 when gate has no Instagram steps', async () => {
    resolveGateWithShortCode();
    mockListByGateId.mockResolvedValueOnce([]);

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const res = await request(app)
      .post('/api/integrations/instagram/execute')
      .send({ gateIdOrSlug: 'qsro6b' })
      .set('Content-Type', 'application/json')
      .set('Cookie', 'instagram_access_token=token-123');

    expect(res.status).toBe(204);
    // No Instagram steps means no Graph API call
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
