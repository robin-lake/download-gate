import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { getAuth } from '@clerk/express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { getStorage, getLocalStorageUploadDir } from '../storage/index.js';

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

const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100 MB
const COVER_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/ogg'];

const memoryStorage = multer.memoryStorage();

/** Multer: single file in field "file", max size from options. */
function uploadMiddleware(options: { maxSize: number }) {
  return multer({
    storage: memoryStorage,
    limits: { fileSize: options.maxSize },
  }).single('file');
}

/**
 * POST /api/media/upload-cover
 * Upload cover art image. Returns { url, key } for use in thumbnail_url.
 */
router.post(
  '/upload-cover',
  requireAuth,
  uploadMiddleware({ maxSize: MAX_COVER_SIZE }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded; use field name "file"' });
        return;
      }
      if (!COVER_TYPES.includes(file.mimetype)) {
        res.status(400).json({ error: 'Invalid type; allowed: image/jpeg, image/png, image/gif, image/webp' });
        return;
      }
      const ext = path.extname(file.originalname) || (file.mimetype === 'image/jpeg' ? '.jpg' : '.png');
      const key = `covers/${uuidv4()}${ext}`;
      const storage = getStorage();
      const result = await storage.upload({
        key,
        body: file.buffer,
        contentType: file.mimetype,
      });
      res.status(201).json({ url: result.url, key: result.key });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/media/upload-audio
 * Upload audio file. Returns { url, key } for use in audio_file_url.
 */
router.post(
  '/upload-audio',
  requireAuth,
  uploadMiddleware({ maxSize: MAX_AUDIO_SIZE }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded; use field name "file"' });
        return;
      }
      if (!AUDIO_TYPES.includes(file.mimetype)) {
        res.status(400).json({
          error: 'Invalid type; allowed: audio/mpeg, audio/mp3, audio/wav, audio/flac, audio/aac, audio/ogg',
        });
        return;
      }
      const ext = path.extname(file.originalname) || '.mp3';
      const key = `audio/${uuidv4()}${ext}`;
      const storage = getStorage();
      const result = await storage.upload({
        key,
        body: file.buffer,
        contentType: file.mimetype,
      });
      res.status(201).json({ url: result.url, key: result.key });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/media/stream?key=...
 * Redirects to a download URL (presigned for S3, or same origin for local).
 * Used for the URL we store in DB when using S3 so downloads work without exposing bucket.
 */
router.get('/stream', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = typeof req.query.key === 'string' ? req.query.key : undefined;
    if (!key) {
      res.status(400).json({ error: 'Missing query parameter: key' });
      return;
    }
    const storage = getStorage();
    const url = await storage.getDownloadUrl(key, 3600);
    res.redirect(302, url);
  } catch (err) {
    next(err);
  }
});

export default router;

/**
 * Serve local storage files (development only). Mount at /api/uploads so that
 * URLs returned by local storage (e.g. http://localhost:3000/api/uploads/...) work.
 */
export async function serveLocalUploads(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = (req.params as { key?: string }).key ?? (req.path.replace(/^\/api\/uploads\/?/, '') || '');
    if (!key || key.includes('..')) {
      res.status(400).json({ error: 'Invalid key' });
      return;
    }
    const dir = getLocalStorageUploadDir();
    const filePath = path.resolve(dir, key);
    await fs.access(filePath);
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    next(err);
  }
}
