import { Router, type Request, type Response, type NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import SmartLinkModel from '../models/smartLink.js';
import SmartLinkPlatformModel from '../models/smartLinkPlatform.js';

const router = Router();

/** Query params for GET /api/smart-links (list) */
interface ListSmartLinksQuery {
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

/** One platform in the create request body. */
export interface CreateSmartLinkPlatformBody {
  platform_name: string;
  url: string;
  action_label?: string;
}

/** Request body for POST /api/smart-links */
export interface CreateSmartLinkBody {
  title: string;
  subtitle?: string;
  cover_image_url?: string;
  short_url: string;
  copy_label?: string;
  platforms?: CreateSmartLinkPlatformBody[];
}

router.use(requireAuth);

/**
 * GET /api/smart-links
 * Return display info for all smart links for the authenticated user. Paginated.
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

      const { limit, cursor } = req.query as ListSmartLinksQuery;
      const limitNum = limit != null ? parseInt(limit, 10) : undefined;
      const effectiveLimit =
        limitNum != null && !Number.isNaN(limitNum) && limitNum > 0
          ? Math.min(limitNum, 100)
          : 50;

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

      const result = await SmartLinkModel.listByUserId(userId, {
        limit: effectiveLimit,
        ...(exclusiveStartKey !== undefined && { exclusiveStartKey }),
      });

      const itemsWithPlatforms = await Promise.all(
        result.items.map(async (link) => {
          const platforms = await SmartLinkPlatformModel.listBySmartLinkId(link.link_id);
          return { ...link, platforms };
        })
      );

      const nextToken =
        result.lastEvaluatedKey != null
          ? Buffer.from(JSON.stringify(result.lastEvaluatedKey), 'utf8').toString('base64url')
          : null;

      res.status(200).json({ items: itemsWithPlatforms, nextToken });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/smart-links
 * Create a new smart link for the authenticated user.
 */
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const body = req.body as CreateSmartLinkBody;
    if (!body.title || typeof body.title !== 'string') {
      res.status(400).json({ error: 'title is required and must be a string' });
      return;
    }
    if (!body.short_url || typeof body.short_url !== 'string') {
      res.status(400).json({ error: 'short_url is required and must be a string' });
      return;
    }

    const subtitle =
      typeof body.subtitle === 'string' && body.subtitle.trim() ? body.subtitle.trim() : undefined;
    const coverImageUrl =
      typeof body.cover_image_url === 'string' && body.cover_image_url.trim()
        ? body.cover_image_url.trim()
        : undefined;
    const copyLabel =
      typeof body.copy_label === 'string' && body.copy_label.trim() ? body.copy_label.trim() : undefined;

    const link = await SmartLinkModel.create({
      user_id: userId,
      title: body.title.trim(),
      short_url: body.short_url.trim(),
      ...(subtitle !== undefined && { subtitle }),
      ...(coverImageUrl !== undefined && { cover_image_url: coverImageUrl }),
      ...(copyLabel !== undefined && { copy_label: copyLabel }),
    });

    const createdPlatforms: Awaited<ReturnType<typeof SmartLinkPlatformModel.create>>[] = [];
    if (Array.isArray(body.platforms) && body.platforms.length > 0) {
      for (const p of body.platforms) {
        if (
          typeof p === 'object' &&
          p !== null &&
          typeof p.platform_name === 'string' &&
          p.platform_name.trim() &&
          typeof p.url === 'string' &&
          p.url.trim()
        ) {
          const actionLabel =
            typeof p.action_label === 'string' && p.action_label.trim()
              ? p.action_label.trim()
              : undefined;
          const platform = await SmartLinkPlatformModel.create({
            smart_link_id: link.link_id,
            platform_name: p.platform_name.trim(),
            url: p.url.trim(),
            ...(actionLabel !== undefined && { action_label: actionLabel }),
          });
          createdPlatforms.push(platform);
        }
      }
    }

    res.status(201).json({ ...link, platforms: createdPlatforms });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/smart-links/:linkId
 * Return a single smart link for the authenticated user.
 */
router.get(
  '/:linkId',
  async (req: Request<{ linkId: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getClerkUserId(req);
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { linkId } = req.params;
      if (!linkId || typeof linkId !== 'string' || linkId.trim() === '') {
        res.status(400).json({ error: 'linkId is required' });
        return;
      }

      const link = await SmartLinkModel.findByUserAndLinkId(userId, linkId.trim());
      if (!link) {
        res.status(404).json({ error: 'Smart link not found' });
        return;
      }

      const platforms = await SmartLinkPlatformModel.listBySmartLinkId(link.link_id);
      res.status(200).json({ ...link, platforms });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
