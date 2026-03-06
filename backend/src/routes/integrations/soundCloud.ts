import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'node:crypto';

const router = Router();

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

export default router;