import { Router, type Request, type Response, type NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import DownloadGateModel from '../models/downloadGate.js';

const router = Router();

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
}

router.use(requireAuth);

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
    const gate = await DownloadGateModel.create({
      user_id: userId,
      artist_name: body.artist_name.trim(),
      title: body.title.trim(),
      audio_file_url: body.audio_file_url.trim() || '',
      ...(thumbnailUrl !== undefined && { thumbnail_url: thumbnailUrl }),
    });

    res.status(201).json(gate);
  } catch (err) {
    next(err);
  }
});

export default router;
