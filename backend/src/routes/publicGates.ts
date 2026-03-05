import { Router, type Request, type Response, type NextFunction } from 'express';
import DownloadGateModel from '../models/downloadGate.js';
import GateStepModel from '../models/gateStep.js';

const router = Router();

async function resolveGate(idOrSlug: string) {
  let gate = await DownloadGateModel.findByShortCode(idOrSlug);
  if (!gate) {
    gate = await DownloadGateModel.findByGateId(idOrSlug);
  }
  return gate;
}

/**
 * GET /api/gates/:gateIdOrSlug/steps
 * Public endpoint: list gate steps for a download gate (by gate_id or short_code). Used on the live gate page.
 * Must be registered before the single-param route so /abc123/steps matches here.
 */
router.get(
  '/:gateIdOrSlug/steps',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idOrSlug = req.params.gateIdOrSlug?.trim();
      if (!idOrSlug) {
        res.status(400).json({ error: 'gateIdOrSlug is required' });
        return;
      }

      const gate = await resolveGate(idOrSlug);
      if (!gate) {
        res.status(404).json({ error: 'Download gate not found' });
        return;
      }

      const steps = await GateStepModel.listByGateId(gate.gate_id);
      res.status(200).json({ steps });
    } catch (err) {
      next(err);
    }
  }
);

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

      const gate = await resolveGate(idOrSlug);
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
