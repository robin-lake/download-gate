import { Router, type Request, type Response, type NextFunction } from 'express';
import SmartLinkModel from '../models/smartLink.js';
import SmartLinkPlatformModel from '../models/smartLinkPlatform.js';

const router = Router();

async function resolveSmartLink(idOrSlug: string) {
  // Try short_url first (slug like "my-track"), then link_id (uuid)
  let link = await SmartLinkModel.findByShortUrl(idOrSlug);
  if (!link) {
    // If it looks like a UUID, we'd need a separate lookup - findByShortUrl covers the common case
    // For now we only support short_url lookup
  }
  return link;
}

/**
 * GET /api/link/:idOrSlug
 * Public endpoint: fetch a smart link by short_url (no auth required).
 * Returns the smart link with platforms. Used for the public smart link page.
 */
router.get(
  '/:idOrSlug',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const raw = req.params.idOrSlug;
      const idOrSlug = (typeof raw === 'string' ? raw : raw?.[0] ?? '').trim();
      if (!idOrSlug) {
        res.status(400).json({ error: 'idOrSlug is required' });
        return;
      }

      const link = await resolveSmartLink(idOrSlug);
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

/**
 * POST /api/link/:idOrSlug/visit
 * Public endpoint: increment the smart link's total_visits by 1. No auth required.
 */
router.post(
  '/:idOrSlug/visit',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const raw = req.params.idOrSlug;
      const idOrSlug = (typeof raw === 'string' ? raw : raw?.[0] ?? '').trim();
      if (!idOrSlug) {
        res.status(400).json({ error: 'idOrSlug is required' });
        return;
      }

      const link = await resolveSmartLink(idOrSlug);
      if (!link) {
        res.status(404).json({ error: 'Smart link not found' });
        return;
      }

      await SmartLinkModel.incrementCount(link.user_id, link.link_id, 'total_visits');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/link/:idOrSlug/click/:platformId
 * Public endpoint: increment total_clicks and the platform's click_count by 1. No auth required.
 */
router.post(
  '/:idOrSlug/click/:platformId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const raw = req.params.idOrSlug;
      const idOrSlug = (typeof raw === 'string' ? raw : raw?.[0] ?? '').trim();
      const platformId = (typeof req.params.platformId === 'string'
        ? req.params.platformId
        : req.params.platformId?.[0] ?? ''
      ).trim();
      if (!idOrSlug) {
        res.status(400).json({ error: 'idOrSlug is required' });
        return;
      }
      if (!platformId) {
        res.status(400).json({ error: 'platformId is required' });
        return;
      }

      const link = await resolveSmartLink(idOrSlug);
      if (!link) {
        res.status(404).json({ error: 'Smart link not found' });
        return;
      }

      const platform = await SmartLinkPlatformModel.findBySmartLinkAndId(
        link.link_id,
        platformId
      );
      if (!platform) {
        res.status(404).json({ error: 'Platform not found' });
        return;
      }

      await SmartLinkPlatformModel.incrementClicks(link.link_id, platformId);
      await SmartLinkModel.incrementCount(link.user_id, link.link_id, 'total_clicks');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
