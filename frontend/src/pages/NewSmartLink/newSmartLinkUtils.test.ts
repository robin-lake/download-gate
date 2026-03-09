import { describe, it, expect } from 'vitest';
import { slugFromTitle, buildCreateSmartLinkPayload } from './newSmartLinkUtils';

describe('slugFromTitle', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugFromTitle('My Song Title')).toBe('my-song-title');
  });

  it('strips non-alphanumeric characters except hyphen and underscore', () => {
    expect(slugFromTitle('Track #1 (Remix)')).toBe('track-1-remix');
  });

  it('truncates to 32 characters', () => {
    const long = 'a'.repeat(40);
    expect(slugFromTitle(long)).toHaveLength(32);
    expect(slugFromTitle(long)).toBe('a'.repeat(32));
  });

  it('returns "link" for empty or whitespace-only title', () => {
    expect(slugFromTitle('')).toBe('link');
    expect(slugFromTitle('   ')).toBe('link');
  });

  it('trims leading and trailing whitespace before slugifying', () => {
    expect(slugFromTitle('  hello world  ')).toBe('hello-world');
  });

  it('returns "link" when result would be empty after stripping', () => {
    expect(slugFromTitle('!!!')).toBe('link');
  });
});

describe('buildCreateSmartLinkPayload', () => {
  const emptyPlatformLinks = {
    spotify: { trackUrl: '' },
    itunes: { trackUrl: '' },
    youtube: { trackUrl: '' },
    amazon: { trackUrl: '' },
    google: { trackUrl: '' },
    deezer: { trackUrl: '' },
    soundcloud: { trackUrl: '' },
    apple_music: { trackUrl: '' },
    youtube_music: { trackUrl: '' },
    amazon_music: { trackUrl: '' },
    google_play: { trackUrl: '' },
    beatport: { trackUrl: '' },
  };

  it('builds payload with title and short_url from shortCode when provided', () => {
    const payload = buildCreateSmartLinkPayload({
      title: 'My Track',
      shortCode: 'my-track',
      platformLinks: emptyPlatformLinks,
    });
    expect(payload).toEqual({
      title: 'My Track',
      short_url: 'my-track',
      platforms: undefined,
    });
  });

  it('derives short_url from title when shortCode is empty', () => {
    const payload = buildCreateSmartLinkPayload({
      title: 'Summer Vibes',
      shortCode: '',
      platformLinks: emptyPlatformLinks,
    });
    expect(payload.short_url).toBe('summer-vibes');
    expect(payload.title).toBe('Summer Vibes');
  });

  it('derives short_url from title when shortCode is whitespace only', () => {
    const payload = buildCreateSmartLinkPayload({
      title: 'Winter Blues',
      shortCode: '   ',
      platformLinks: emptyPlatformLinks,
    });
    expect(payload.short_url).toBe('winter-blues');
  });

  it('includes subtitle when artist is provided', () => {
    const payload = buildCreateSmartLinkPayload({
      title: 'Track',
      artist: 'The Artist',
      shortCode: 'x',
      platformLinks: emptyPlatformLinks,
    });
    expect(payload.subtitle).toBe('The Artist');
  });

  it('omits subtitle when artist is empty or whitespace', () => {
    const payload = buildCreateSmartLinkPayload({
      title: 'Track',
      artist: '',
      shortCode: 'x',
      platformLinks: emptyPlatformLinks,
    });
    expect(payload.subtitle).toBeUndefined();
  });

  it('includes platforms for entries with non-empty trackUrl', () => {
    const platformLinks = {
      ...emptyPlatformLinks,
      spotify: { trackUrl: 'https://open.spotify.com/track/abc' },
      apple_music: { trackUrl: 'https://music.apple.com/track/xyz' },
    };
    const payload = buildCreateSmartLinkPayload({
      title: 'Track',
      shortCode: 't',
      platformLinks,
    });
    expect(payload.platforms).toHaveLength(2);
    expect(payload.platforms).toContainEqual({
      platform_name: 'spotify',
      url: 'https://open.spotify.com/track/abc',
    });
    expect(payload.platforms).toContainEqual({
      platform_name: 'apple_music',
      url: 'https://music.apple.com/track/xyz',
    });
  });

  it('omits platforms when no platform has trackUrl', () => {
    const payload = buildCreateSmartLinkPayload({
      title: 'Track',
      shortCode: 't',
      platformLinks: emptyPlatformLinks,
    });
    expect(payload.platforms).toBeUndefined();
  });

  it('trims title and shortCode', () => {
    const payload = buildCreateSmartLinkPayload({
      title: '  Trimmed Title  ',
      shortCode: '  custom-slug  ',
      platformLinks: emptyPlatformLinks,
    });
    expect(payload.title).toBe('Trimmed Title');
    expect(payload.short_url).toBe('custom-slug');
  });
});
