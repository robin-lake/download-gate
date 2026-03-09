import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

const mockListByUserId = vi.fn();
const mockCreate = vi.fn();
const mockFindByUserAndLinkId = vi.fn();

vi.mock('../models/smartLink.js', () => ({
  default: {
    listByUserId: (...args: unknown[]) => mockListByUserId(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    findByUserAndLinkId: (...args: unknown[]) => mockFindByUserAndLinkId(...args),
  },
}));

const mockListBySmartLinkId = vi.fn();
const mockCreatePlatform = vi.fn();

vi.mock('../models/smartLinkPlatform.js', () => ({
  default: {
    listBySmartLinkId: (...args: unknown[]) => mockListBySmartLinkId(...args),
    create: (...args: unknown[]) => mockCreatePlatform(...args),
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

describe('GET /api/smart-links', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: false, userId: null });

    const res = await request(app).get('/api/smart-links');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(mockListByUserId).not.toHaveBeenCalled();
  });

  it('returns 200 and items with platforms for authenticated user', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-123' });
    const mockItems = [
      {
        user_id: 'user-123',
        link_id: 'link-1',
        title: 'My Link',
        short_url: 'abc',
        total_visits: 0,
        total_clicks: 0,
      },
    ];
    mockListByUserId.mockResolvedValueOnce({ items: mockItems });
    mockListBySmartLinkId.mockResolvedValueOnce([
      {
        smart_link_id: 'link-1',
        id: 'plat-1',
        platform_name: 'spotify',
        url: 'https://open.spotify.com/track/abc',
        click_count: 0,
      },
    ]);

    const res = await request(app).get('/api/smart-links');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject(mockItems[0]);
    expect(res.body.items[0].platforms).toHaveLength(1);
    expect(res.body.items[0].platforms[0].platform_name).toBe('spotify');
    expect(res.body.nextToken).toBeNull();
    expect(mockListByUserId).toHaveBeenCalledTimes(1);
    expect(mockListBySmartLinkId).toHaveBeenCalledWith('link-1');
  });

  it('passes limit query param and caps at 100', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    mockListByUserId.mockResolvedValueOnce({ items: [] });
    mockListBySmartLinkId.mockResolvedValue([]);

    await request(app).get('/api/smart-links?limit=10');

    expect(mockListByUserId).toHaveBeenCalledWith('user-1', {
      limit: 10,
      exclusiveStartKey: undefined,
    });
  });

  it('uses default limit when limit is invalid', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    mockListByUserId.mockResolvedValueOnce({ items: [] });
    mockListBySmartLinkId.mockResolvedValue([]);

    await request(app).get('/api/smart-links?limit=invalid');

    expect(mockListByUserId).toHaveBeenCalledWith('user-1', {
      limit: 50,
      exclusiveStartKey: undefined,
    });
  });

  it('returns nextToken when lastEvaluatedKey is present', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    const lastKey = { user_id: 'user-1', link_id: 'link-5' };
    mockListByUserId.mockResolvedValueOnce({ items: [], lastEvaluatedKey: lastKey });
    mockListBySmartLinkId.mockResolvedValue([]);

    const res = await request(app).get('/api/smart-links');

    expect(res.status).toBe(200);
    expect(res.body.nextToken).not.toBeNull();
    const decoded = JSON.parse(
      Buffer.from(res.body.nextToken, 'base64url').toString('utf8')
    );
    expect(decoded).toEqual(lastKey);
  });

  it('returns 400 for invalid cursor', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });

    const res = await request(app).get(
      '/api/smart-links?cursor=not-valid-base64!!!'
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid cursor' });
    expect(mockListByUserId).not.toHaveBeenCalled();
  });

  it('passes decoded cursor as exclusiveStartKey', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    const lastKey = { user_id: 'user-1', link_id: 'link-3' };
    const cursor = Buffer.from(JSON.stringify(lastKey), 'utf8').toString(
      'base64url'
    );
    mockListByUserId.mockResolvedValueOnce({ items: [] });
    mockListBySmartLinkId.mockResolvedValue([]);

    await request(app).get(`/api/smart-links?cursor=${encodeURIComponent(cursor)}`);

    expect(mockListByUserId).toHaveBeenCalledWith('user-1', {
      limit: 50,
      exclusiveStartKey: lastKey,
    });
  });
});

describe('POST /api/smart-links', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: false, userId: null });

    const res = await request(app)
      .post('/api/smart-links')
      .send({ title: 'Link', short_url: 'xyz' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when title is missing', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });

    const res = await request(app)
      .post('/api/smart-links')
      .send({ short_url: 'xyz' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required and must be a string' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when short_url is missing', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });

    const res = await request(app)
      .post('/api/smart-links')
      .send({ title: 'My Link' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'short_url is required and must be a string',
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates smart link and returns 201', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    const created = {
      user_id: 'user-1',
      link_id: 'link-new',
      title: 'My Link',
      short_url: 'abc',
      total_visits: 0,
      total_clicks: 0,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };
    mockCreate.mockResolvedValueOnce(created);

    const res = await request(app)
      .post('/api/smart-links')
      .send({
        title: 'My Link',
        short_url: 'abc',
        subtitle: 'Sub',
        cover_image_url: 'https://example.com/cover.jpg',
        copy_label: 'Copy',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(created);
    expect(res.body.platforms).toEqual([]);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreatePlatform).not.toHaveBeenCalled();
  });

  it('creates smart link with platforms and returns 201 with platforms', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    const created = {
      user_id: 'user-1',
      link_id: 'link-new',
      title: 'My Link',
      short_url: 'abc',
      total_visits: 0,
      total_clicks: 0,
    };
    mockCreate.mockResolvedValueOnce(created);
    const platform1 = {
      smart_link_id: 'link-new',
      id: 'plat-1',
      platform_name: 'spotify',
      url: 'https://open.spotify.com/track/x',
      click_count: 0,
    };
    const platform2 = {
      smart_link_id: 'link-new',
      id: 'plat-2',
      platform_name: 'apple_music',
      url: 'https://music.apple.com/track/y',
      click_count: 0,
    };
    mockCreatePlatform.mockResolvedValueOnce(platform1).mockResolvedValueOnce(platform2);

    const res = await request(app)
      .post('/api/smart-links')
      .send({
        title: 'My Link',
        short_url: 'abc',
        platforms: [
          { platform_name: 'spotify', url: 'https://open.spotify.com/track/x' },
          { platform_name: 'apple_music', url: 'https://music.apple.com/track/y' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(created);
    expect(res.body.platforms).toHaveLength(2);
    expect(res.body.platforms[0]).toMatchObject(platform1);
    expect(res.body.platforms[1]).toMatchObject(platform2);
    expect(mockCreatePlatform).toHaveBeenCalledTimes(2);
    expect(mockCreatePlatform).toHaveBeenNthCalledWith(1, {
      smart_link_id: 'link-new',
      platform_name: 'spotify',
      url: 'https://open.spotify.com/track/x',
    });
    expect(mockCreatePlatform).toHaveBeenNthCalledWith(2, {
      smart_link_id: 'link-new',
      platform_name: 'apple_music',
      url: 'https://music.apple.com/track/y',
    });
  });

  it('creates with only required fields', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    const created = {
      user_id: 'user-1',
      link_id: 'link-min',
      title: 'Min',
      short_url: 'min',
      total_visits: 0,
      total_clicks: 0,
    };
    mockCreate.mockResolvedValueOnce(created);

    const res = await request(app)
      .post('/api/smart-links')
      .send({ title: 'Min', short_url: 'min' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(created);
    expect(res.body.platforms).toEqual([]);
    expect(mockCreate).toHaveBeenCalledWith({
      user_id: 'user-1',
      title: 'Min',
      short_url: 'min',
    });
  });
});

describe('GET /api/smart-links/:linkId', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: false, userId: null });

    const res = await request(app).get('/api/smart-links/link-123');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(mockFindByUserAndLinkId).not.toHaveBeenCalled();
  });

  it('returns 400 when linkId is empty', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });

    const res = await request(app).get('/api/smart-links/%20');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'linkId is required' });
    expect(mockFindByUserAndLinkId).not.toHaveBeenCalled();
  });

  it('returns 404 when smart link does not exist', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    mockFindByUserAndLinkId.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/smart-links/link-123');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Smart link not found' });
    expect(mockFindByUserAndLinkId).toHaveBeenCalledWith('user-1', 'link-123');
  });

  it('returns 200 and smart link with platforms when found', async () => {
    mockGetAuth.mockReturnValue({ isAuthenticated: true, userId: 'user-1' });
    const link = {
      user_id: 'user-1',
      link_id: 'link-123',
      title: 'My Link',
      short_url: 'xyz',
      total_visits: 10,
      total_clicks: 5,
    };
    mockFindByUserAndLinkId.mockResolvedValueOnce(link);
    const platforms = [
      {
        smart_link_id: 'link-123',
        id: 'plat-1',
        platform_name: 'spotify',
        url: 'https://open.spotify.com/track/abc',
        click_count: 2,
      },
    ];
    mockListBySmartLinkId.mockResolvedValueOnce(platforms);

    const res = await request(app).get('/api/smart-links/link-123');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(link);
    expect(res.body.platforms).toEqual(platforms);
    expect(mockFindByUserAndLinkId).toHaveBeenCalledWith('user-1', 'link-123');
    expect(mockListBySmartLinkId).toHaveBeenCalledWith('link-123');
  });
});
