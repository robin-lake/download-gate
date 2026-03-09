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

/** SoundCloud step config (from gate step). Uses keys from frontend (GateStep.tsx / SoundCloudStepConfigPopup). */
interface SoundCloudStepConfig {
  follow_profile?: boolean;
  like_track?: boolean;
  repost_track?: boolean;
  comment_on_track?: boolean;
  profile_url?: string;
  track_url?: string;
}

const SOUNDCLOUD_API = 'https://api.soundcloud.com';

function authHeader(accessToken: string): Record<string, string> {
  return { Authorization: `OAuth ${accessToken}` };
}

/** Resolve a SoundCloud URL to the resource (user, track, etc.) and return its id. */
async function resolveSoundCloudUrl(
  url: string,
  accessToken: string
): Promise<{ id: number; kind?: string } | null> {
  const res = await fetch(
    `${SOUNDCLOUD_API}/resolve?url=${encodeURIComponent(url.trim())}`,
    { headers: { Accept: 'application/json; charset=utf-8', ...authHeader(accessToken) } }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { id?: number; kind?: string };
  if (data.id == null) return null;
  return { id: data.id, ...(data.kind !== undefined && data.kind !== '' ? { kind: data.kind } : {}) };
}

function generateState(): string {
  return crypto.randomBytes(24).toString('base64url');
}

function generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

router.get(
  '/signin/soundcloud',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
      const redirectUri = process.env.SOUNDCLOUD_REDIRECT_URI;
      if (!clientId || !redirectUri) {
        const missing = []; if (!clientId) missing.push('SOUNDCLOUD_CLIENT_ID'); if (!redirectUri) missing.push('SOUNDCLOUD_REDIRECT_URI');
        res.status(500).json({
          error: 'SoundCloud OAuth not configured',
          missing_env: missing,
        });
        return;
      }

      const state = generateState();
      const { codeVerifier, codeChallenge } = generatePkcePair();

      // Store code_verifier in a cookie so the OAuth callback can exchange the code for a token
      res.cookie('soundcloud_code_verifier', codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000, // 10 minutes
        sameSite: 'lax',
      });
      res.cookie('soundcloud_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000,
        sameSite: 'lax',
      });

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
      });
      const authorizeUrl = `https://secure.soundcloud.com/authorize?${params.toString()}`;
      res.redirect(authorizeUrl);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * SoundCloud OAuth callback. SoundCloud redirects the user here with ?code=...&state=...
 * We verify state (CSRF), exchange the code for tokens using the stored code_verifier (PKCE),
 * then clear temp cookies, store the access token, and redirect the user to the app.
 */
router.get(
  '/auth/soundcloud/callback',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state } = req.query as { code?: string; state?: string };

      if (!code || !state) {
        res.status(400).json({
          error: 'Missing code or state in callback (user may have denied access)',
        });
        return;
      }

      // 1. CSRF check: state in the redirect must match the state we stored in the cookie
      const storedState = req.cookies?.['soundcloud_oauth_state'];
      if (!storedState || state !== storedState) {
        res.status(403).json({ error: 'SoundCloud auth state does not match' });
        return;
      }

      const codeVerifier = req.cookies?.['soundcloud_code_verifier'];
      if (!codeVerifier) {
        res.status(400).json({
          error: 'Missing code_verifier cookie (session expired or cookies disabled)',
        });
        return;
      }

      const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
      const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
      const redirectUri = process.env.SOUNDCLOUD_REDIRECT_URI;
      if (!clientId || !clientSecret || !redirectUri) {
        res.status(500).json({ error: 'SoundCloud OAuth not configured' });
        return;
      }

      // 2. Exchange the authorization code for an access token (PKCE: we send code_verifier)
      const tokenResponse = await fetch('https://secure.soundcloud.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json; charset=utf-8',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errBody = await tokenResponse.text();
        console.error('SoundCloud token exchange failed', tokenResponse.status, errBody);
        res.status(502).json({
          error: 'SoundCloud token exchange failed',
          details: tokenResponse.statusText,
        });
        return;
      }

      const tokens = (await tokenResponse.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        scope?: string;
      };

      // 3. Clear the one-time PKCE/state cookies (we no longer need them)
      res.clearCookie('soundcloud_code_verifier', { path: '/' });
      res.clearCookie('soundcloud_oauth_state', { path: '/' });

      // 4. Store the access token (e.g. in a cookie or session; here we use a cookie for simplicity)
      // In production you may want to store in DB linked to the logged-in user (Clerk user_id)
      res.cookie('soundcloud_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: (tokens.expires_in ?? 3600) * 1000, // SoundCloud tokens ~1 hour
        sameSite: 'lax',
        path: '/',
      });

      if (tokens.refresh_token) {
        res.cookie('soundcloud_refresh_token', tokens.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
          sameSite: 'lax',
          path: '/',
        });
      }

      // 5. Redirect the user to your app (e.g. dashboard or settings)
      const successRedirect =
        process.env.SOUNDCLOUD_SUCCESS_REDIRECT_URI ?? '/';
      res.redirect(successRedirect);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /soundcloud/execute
 * Executes SoundCloud actions (follow, like, repost, comment) for the gate's SoundCloud steps.
 * Requires soundcloud_access_token cookie (set after OAuth). Body: { gateIdOrSlug: string, comment?: string }.
 * Full path: /api/integrations/soundcloud/execute
 */
router.post(
  '/soundcloud/execute',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accessToken = req.cookies?.['soundcloud_access_token'];
      if (!accessToken) {
        res.status(401).json({
          error: 'Not connected to SoundCloud. Complete the connection first.',
        });
        return;
      }

      const { gateIdOrSlug, comment: commentBody } = req.body as {
        gateIdOrSlug?: string;
        comment?: string;
      };
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
      const soundcloudSteps = steps.filter((s) => s.service_type === 'soundcloud');
      const headers = {
        Accept: 'application/json; charset=utf-8',
        'Content-Type': 'application/json',
        ...authHeader(accessToken),
      };

      for (const step of soundcloudSteps) {
        const config = (step.config ?? {}) as SoundCloudStepConfig;

        if (config.follow_profile && config.profile_url?.trim()) {
          const resolved = await resolveSoundCloudUrl(
            config.profile_url.trim(),
            accessToken
          );
          if (resolved?.id != null) {
            const followRes = await fetch(
              `${SOUNDCLOUD_API}/me/followings/${resolved.id}`,
              { method: 'PUT', headers }
            );
            if (!followRes.ok) {
              const errBody = await followRes.text();
              console.error(
                'SoundCloud follow failed',
                followRes.status,
                errBody
              );
            }
          }
        }

        if (config.like_track && config.track_url?.trim()) {
          const resolved = await resolveSoundCloudUrl(
            config.track_url.trim(),
            accessToken
          );
          if (resolved?.id != null) {
            const likeRes = await fetch(
              `${SOUNDCLOUD_API}/likes/tracks/${resolved.id}`,
              { method: 'POST', headers }
            );
            if (!likeRes.ok) {
              const errBody = await likeRes.text();
              console.error('SoundCloud like failed', likeRes.status, errBody);
            }
          }
        }

        if (config.repost_track && config.track_url?.trim()) {
          const resolved = await resolveSoundCloudUrl(
            config.track_url.trim(),
            accessToken
          );
          if (resolved?.id != null) {
            const repostRes = await fetch(
              `${SOUNDCLOUD_API}/reposts/tracks/${resolved.id}`,
              { method: 'POST', headers }
            );
            if (!repostRes.ok) {
              const errBody = await repostRes.text();
              console.error(
                'SoundCloud repost failed',
                repostRes.status,
                errBody
              );
            }
          }
        }

        if (config.comment_on_track && config.track_url?.trim()) {
          const body =
            typeof commentBody === 'string' && commentBody.trim()
              ? commentBody.trim()
              : undefined;
          if (body) {
            const resolved = await resolveSoundCloudUrl(
              config.track_url.trim(),
              accessToken
            );
            if (resolved?.id != null) {
              const commentRes = await fetch(
                `${SOUNDCLOUD_API}/tracks/${resolved.id}/comments`,
                {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ comment: { body } }),
                }
              );
              if (!commentRes.ok) {
                const errBody = await commentRes.text();
                console.error(
                  'SoundCloud comment failed',
                  commentRes.status,
                  errBody
                );
              }
            }
          }
        }
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;