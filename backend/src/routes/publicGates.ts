import { Router, type Request, type Response, type NextFunction } from 'express';
import DownloadGateModel from '../models/downloadGate.js';

const router = Router();

/**
 * GET /api/gates/:gateIdOrSlug
 * Public endpoint: fetch a single download gate by gate_id or short_code (no auth required).
 * Tries short_code first, then gate_id. Used for the public gate landing page (e.g. example.com/qsro6b).
 */
router.get(
  '/:gateIdOrSlug',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idOrSlug = req.params.gateIdOrSlug?.trim();
      if (!idOrSlug) {
        res.status(400).json({ error: 'gateIdOrSlug is required' });
        return;
      }

      let gate = await DownloadGateModel.findByShortCode(idOrSlug);
      if (!gate) {
        gate = await DownloadGateModel.findByGateId(idOrSlug);
      }
      if (!gate) {
        res.status(404).json({ error: 'Download gate not found' });
        return;
      }

      res.status(200).json(gate);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
