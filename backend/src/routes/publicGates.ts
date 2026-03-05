import { Router, type Request, type Response, type NextFunction } from 'express';
import DownloadGateModel from '../models/downloadGate.js';

const router = Router();

/**
 * GET /api/gates/:gateId
 * Public endpoint: fetch a single download gate by gate_id (no auth required).
 * Used for the public gate landing page (e.g. example.com/abc123).
 */
router.get(
  '/:gateId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { gateId } = req.params;
      if (!gateId || !gateId.trim()) {
        res.status(400).json({ error: 'gateId is required' });
        return;
      }

      const gate = await DownloadGateModel.findByGateId(gateId.trim());
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
