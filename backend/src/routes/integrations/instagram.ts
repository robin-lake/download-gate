import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'node:crypto';
import DownloadGateModel from '../../models/downloadGate.js';
import GateStepModel from '../../models/gateStep.js';

const router = Router();

async function resolveGate(idOrSlug: string) {
  let gate = await DownloadGateModel.findByShortCode(idOrSlug);
  if (!gate) {
    gate = await DownloadGateModel.findByGateId(idOrSlug);
  }
  return gate;
}

/** Extract Instagram username from profile URL (instagram.com/username or instagram.com/username/). */
function extractInstagramUsername(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname !== 'instagram.com' && u.hostname !== 'www.instagram.com') {
      return null;
    }
    const segments = u.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;
    const username = segments[0];
    if (username === 'p' || username === 'reel' || username === 'reels' || username === 'explore') {
      return null;
    }
    return username;
  } catch {
    return null;
  }
}

function generateState(): string {
  return crypto.randomBytes(24).toString('base64url');
}

router.get(
  '/signin/instagram',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = process.env.INSTAGRAM_CLIENT_ID;
      const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
      if (!clientId || !redirectUri) {
        const missing = [];
        if (!clientId) missing.push('INSTAGRAM_CLIENT_ID');
        if (!redirectUri) missing.push('INSTAGRAM_REDIRECT_URI');
        res.status(500).json({
          error: 'Instagram OAuth not configured',
          missing_env: missing,
        });
        return;
      }

      const state = generateState();

      res.cookie('instagram_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000, // 10 minutes
        sameSite: 'lax',
      });

      const scopes = ['user_profile', 'user_media'].join(',');
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes,
        response_type: 'code',
        state,
      });
      const authorizeUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`;
      res.redirect(authorizeUrl);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Instagram OAuth callback. Instagram redirects the user here with ?code=...&state=...
 * We verify state (CSRF), exchange the code for tokens, then clear temp cookies,
 * store the access token, and redirect to the app.
 */
router.get(
  '/auth/instagram/callback',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state, error } = req.query as {
        code?: string;
        state?: string;
        error?: string;
      };

      if (error) {
        res.status(400).json({
          error: 'Instagram authorization denied',
          details: error,
        });
        return;
      }

      if (!code || !state) {
        res.status(400).json({
          error: 'Missing code or state in callback (user may have denied access)',
        });
        return;
      }

      const storedState = req.cookies?.['instagram_oauth_state'];
      if (!storedState || state !== storedState) {
        res.status(403).json({ error: 'Instagram auth state does not match' });
        return;
      }

      const clientId = process.env.INSTAGRAM_CLIENT_ID;
      const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
      const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
      if (!clientId || !clientSecret || !redirectUri) {
        res.status(500).json({ error: 'Instagram OAuth not configured' });
        return;
      }

      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code,
        }),
      });

      if (!tokenResponse.ok) {
        const errBody = await tokenResponse.text();
        console.error('Instagram token exchange failed', tokenResponse.status, errBody);
        res.status(502).json({
          error: 'Instagram token exchange failed',
          details: tokenResponse.statusText,
        });
        return;
      }

      const tokens = (await tokenResponse.json()) as {
        access_token: string;
        user_id?: string;
      };

      res.clearCookie('instagram_oauth_state', { path: '/' });

      res.cookie('instagram_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days (Instagram tokens are long-lived)
        sameSite: 'lax',
        path: '/',
      });

      const successRedirect = process.env.INSTAGRAM_SUCCESS_REDIRECT_URI ?? '/';
      res.redirect(successRedirect);
    } catch (err) {
      next(err);
    }
  }
);

/** Instagram step config shape (from gate step config). DATA_MODEL: follow_profile_enabled, profile_urls */
interface InstagramStepConfig {
  follow_profile_enabled?: boolean;
  profile_urls?: string[];
}

/**
 * POST /instagram/execute
 * Executes Instagram actions (follow profile) for a gate's Instagram steps.
 * Requires instagram_access_token cookie (set after OAuth). Body: { gateIdOrSlug: string }.
 * Note: Instagram Graph API has limited follow capabilities. This flow validates the token
 * and processes profile_urls; the actual follow may require user to complete in-app.
 */
router.post(
  '/instagram/execute',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accessToken = req.cookies?.['instagram_access_token'];
      if (!accessToken) {
        res.status(401).json({ error: 'Not connected to Instagram. Complete the connection first.' });
        return;
      }

      const { gateIdOrSlug } = req.body as { gateIdOrSlug?: string };
      const idOrSlug = typeof gateIdOrSlug === 'string' ? gateIdOrSlug.trim() : '';
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
      const instagramSteps = steps.filter((s) => s.service_type === 'instagram');

      const usernames: string[] = [];
      for (const step of instagramSteps) {
        const config = (step.config ?? {}) as InstagramStepConfig;
        if (!config.follow_profile_enabled || !Array.isArray(config.profile_urls)) continue;
        for (const url of config.profile_urls) {
          const username = extractInstagramUsername(url);
          if (username && !usernames.includes(username)) {
            usernames.push(username);
          }
        }
      }

      if (usernames.length === 0) {
        res.status(204).send();
        return;
      }

      // Validate token and process follows. Instagram Graph API does not expose a public
      // "follow user" endpoint for consumer accounts. For Basic Display API tokens,
      // we validate the token and mark the step as processed. The connect flow may
      // open profile URLs for the user to follow manually.
      const meRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`
      );
      if (!meRes.ok) {
        const errBody = await meRes.text();
        console.error('Instagram API me failed', meRes.status, errBody);
        res.status(502).json({
          error: 'Failed to verify Instagram connection',
          details: meRes.statusText,
        });
        return;
      }

      // Step processed - token valid, usernames collected for potential future API use
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
