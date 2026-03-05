import { Router, type Request, type Response, type NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import DownloadGateModel from '../models/downloadGate.js';

const router = Router();

/** Query params for GET /api/download-gates */
interface ListDownloadGatesQuery {
  limit?: string;
  cursor?: string;
}

/** Require Clerk auth; call next() or send 401. */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const { isAuthenticated } = getAuth(req);
  if (!isAuthenticated) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

function getClerkUserId(req: Request): string | null {
  const auth = getAuth(req);
  if (!auth.isAuthenticated) return null;
  return (auth as { userId: string }).userId ?? null;
}

/** Request body for POST /api/download-gates */
export interface CreateDownloadGateBody {
  artist_name: string;
  title: string;
  audio_file_url: string;
  thumbnail_url?: string;
  short_code?: string;
}

router.use(requireAuth);

/**
 * GET /api/download-gates
 * List download gates for the authenticated user. Supports limit and cursor pagination.
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getClerkUserId(req);
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { limit, cursor } = req.query as ListDownloadGatesQuery;
      const limitNum = limit != null ? parseInt(limit, 10) : undefined;
      const effectiveLimit = limitNum != null && !Number.isNaN(limitNum) && limitNum > 0 ? Math.min(limitNum, 100) : 50;

      let exclusiveStartKey: Record<string, unknown> | undefined;
      if (cursor && typeof cursor === 'string') {
        try {
          const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
          exclusiveStartKey = JSON.parse(decoded) as Record<string, unknown>;
        } catch {
          res.status(400).json({ error: 'Invalid cursor' });
          return;
        }
      }

      const result = await DownloadGateModel.listByUserId(userId, {
        limit: effectiveLimit,
        ...(exclusiveStartKey !== undefined && { exclusiveStartKey }),
      });

      const nextToken =
        result.lastEvaluatedKey != null
          ? Buffer.from(JSON.stringify(result.lastEvaluatedKey), 'utf8').toString('base64url')
          : null;

      res.status(200).json({ items: result.items, nextToken });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/download-gates
 * Create a new download gate for the authenticated user.
 */
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const body = req.body as CreateDownloadGateBody;
    if (!body.artist_name || typeof body.artist_name !== 'string') {
      res.status(400).json({ error: 'artist_name is required and must be a string' });
      return;
    }
    if (!body.title || typeof body.title !== 'string') {
      res.status(400).json({ error: 'title is required and must be a string' });
      return;
    }
    if (typeof body.audio_file_url !== 'string') {
      res.status(400).json({ error: 'audio_file_url is required and must be a string' });
      return;
    }

    const thumbnailUrl =
      typeof body.thumbnail_url === 'string' && body.thumbnail_url.trim()
        ? body.thumbnail_url.trim()
        : undefined;
    const shortCode =
      typeof body.short_code === 'string' && body.short_code.trim()
        ? body.short_code.trim()
        : undefined;
    const gate = await DownloadGateModel.create({
      user_id: userId,
      artist_name: body.artist_name.trim(),
      title: body.title.trim(),
      audio_file_url: body.audio_file_url.trim() || '',
      ...(thumbnailUrl !== undefined && { thumbnail_url: thumbnailUrl }),
      ...(shortCode !== undefined && shortCode !== '' && { short_code: shortCode }),
    });

    res.status(201).json(gate);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('short_code') || message.includes('unique short_code')) {
      res.status(400).json({ error: message });
      return;
    }
    next(err);
  }
});

export default router;
