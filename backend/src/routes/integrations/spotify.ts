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

/** Extract Spotify resource ID from URL (artist, track, or album). */
function extractSpotifyId(url: string, type: 'artist' | 'track' | 'album'): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname !== 'open.spotify.com' && u.hostname !== 'spotify.link') return null;
    const match = u.pathname.match(new RegExp(`\\/${type}\\/([a-zA-Z0-9]+)`));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

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

/** Spotify step config shape (from gate step config). */
interface SpotifyStepConfig {
  follow_artist?: boolean;
  save_track_or_album?: boolean;
  artist_profile_url?: string;
  track_or_album_url?: string;
}

/**
 * POST /spotify/execute
 * Executes Spotify actions (follow artist, save track/album) for a gate's Spotify steps.
 * Requires spotify_access_token cookie (set after OAuth). Body: { gateIdOrSlug: string }.
 * Full path: /api/integrations/spotify/execute
 */
router.post(
  '/spotify/execute',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accessToken = req.cookies?.['spotify_access_token'];
      if (!accessToken) {
        res.status(401).json({ error: 'Not connected to Spotify. Complete the connection first.' });
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
      const spotifySteps = steps.filter((s) => s.service_type === 'spotify');

      const uris: string[] = [];
      for (const step of spotifySteps) {
        const config = (step.config ?? {}) as SpotifyStepConfig;
        if (config.follow_artist && config.artist_profile_url) {
          const artistId = extractSpotifyId(config.artist_profile_url, 'artist');
          if (artistId) uris.push(`spotify:artist:${artistId}`);
        }
        if (config.save_track_or_album && config.track_or_album_url) {
          const trackId = extractSpotifyId(config.track_or_album_url, 'track');
          const albumId = extractSpotifyId(config.track_or_album_url, 'album');
          if (trackId) uris.push(`spotify:track:${trackId}`);
          else if (albumId) uris.push(`spotify:album:${albumId}`);
        }
      }

      if (uris.length === 0) {
        res.status(204).send();
        return;
      }

      const libraryUrl = `https://api.spotify.com/v1/me/library?uris=${encodeURIComponent(uris.join(','))}`;
      const libraryRes = await fetch(libraryUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!libraryRes.ok) {
        const errBody = await libraryRes.text();
        console.error('Spotify save to library failed', libraryRes.status, errBody);
        res.status(502).json({
          error: 'Failed to save items to Spotify library',
          details: libraryRes.statusText,
        });
        return;
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
