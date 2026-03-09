import { useEffect } from 'react';

const MESSAGE_TYPE = 'spotify-oauth-success';

/**
 * Page the backend redirects to after Spotify OAuth (SPOTIFY_SUCCESS_REDIRECT_URI).
 * If opened in a popup (window.opener exists), notifies the opener and closes.
 * Otherwise redirects to home.
 */
export default function OAuthSpotifySuccess() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.opener) {
      try {
        window.opener.postMessage({ type: MESSAGE_TYPE }, window.location.origin);
      } catch {
        // Ignore if opener is cross-origin or closed
      }
      window.close();
    } else {
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="app-page" style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Connecting… If this window doesn’t close automatically, you can close it.</p>
    </div>
  );
}

export { MESSAGE_TYPE };
