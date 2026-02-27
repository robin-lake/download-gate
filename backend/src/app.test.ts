import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

vi.mock('@clerk/express', () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  getAuth: () => ({ isAuthenticated: false, userId: null }),
}));

let app: Express;
beforeAll(async () => {
  const m = await import('./app.js');
  app = m.default;
});

describe('app', () => {
  describe('GET /health', () => {
    it('returns 200 and status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
      expect(res.body).toHaveProperty('timestamp');
    });
  });
});
