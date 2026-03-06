import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'node:crypto';

const router = Router();

function generateState(): string {
  return crypto.randomBytes(24).toString('base64url');
}

router.get(
  '/signin/spotify',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
      if (!clientId || !redirectUri) {
        const missing = [];
        if (!clientId) missing.push('SPOTIFY_CLIENT_ID');
        if (!redirectUri) missing.push('SPOTIFY_REDIRECT_URI');
        res.status(500).json({
          error: 'Spotify OAuth not configured',
          missing_env: missing,
        });
        return;
      }

      const state = generateState();

      res.cookie('spotify_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000, // 10 minutes
        sameSite: 'lax',
      });

      const scopes = [
        'user-follow-modify', // Follow artists
        'user-library-modify', // Save tracks/albums
      ].join(' ');
      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: scopes,
        state,
      });
      const authorizeUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
      res.redirect(authorizeUrl);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Spotify OAuth callback. Spotify redirects the user here with ?code=...&state=...
 * We verify state (CSRF), exchange the code for tokens, then clear temp cookies,
 * store the access token, and redirect the user to the app.
 */
router.get(
  '/auth/spotify/callback',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state, error } = req.query as {
        code?: string;
        state?: string;
        error?: string;
      };

      if (error) {
        res.status(400).json({
          error: 'Spotify authorization denied',
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

      const storedState = req.cookies?.['spotify_oauth_state'];
      if (!storedState || state !== storedState) {
        res.status(403).json({ error: 'Spotify auth state does not match' });
        return;
      }

      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
      if (!clientId || !clientSecret || !redirectUri) {
        res.status(500).json({ error: 'Spotify OAuth not configured' });
        return;
      }

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errBody = await tokenResponse.text();
        console.error('Spotify token exchange failed', tokenResponse.status, errBody);
        res.status(502).json({
          error: 'Spotify token exchange failed',
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

      res.clearCookie('spotify_oauth_state', { path: '/' });

      res.cookie('spotify_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: (tokens.expires_in ?? 3600) * 1000,
        sameSite: 'lax',
        path: '/',
      });

      if (tokens.refresh_token) {
        res.cookie('spotify_refresh_token', tokens.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
          sameSite: 'lax',
          path: '/',
        });
      }

      const successRedirect =
        process.env.SPOTIFY_SUCCESS_REDIRECT_URI ?? '/';
      res.redirect(successRedirect);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
