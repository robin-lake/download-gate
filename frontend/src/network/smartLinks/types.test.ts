import { describe, it, expect } from 'vitest';
import {
  isSmartLinkResponse,
  isSmartLinkPlatformResponse,
  isListSmartLinksResponse,
  type SmartLinkResponse,
  type SmartLinkPlatformResponse,
  type ListSmartLinksResponse,
} from './types';

const validLink: SmartLinkResponse = {
  user_id: 'user-1',
  link_id: 'link-1',
  title: 'My Link',
  short_url: 'abc',
  total_visits: 0,
  total_clicks: 0,
};

const validPlatform: SmartLinkPlatformResponse = {
  smart_link_id: 'link-1',
  id: 'plat-1',
  platform_name: 'spotify',
  url: 'https://open.spotify.com/track/x',
  click_count: 0,
};

describe('isSmartLinkResponse', () => {
  it('returns true for a valid SmartLinkResponse', () => {
    expect(isSmartLinkResponse(validLink)).toBe(true);
  });

  it('returns true when optional fields are present', () => {
    expect(
      isSmartLinkResponse({
        ...validLink,
        subtitle: 'Sub',
        cover_image_url: 'https://example.com/cover.jpg',
        copy_label: 'Copy',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      })
    ).toBe(true);
  });

  it('returns false for null', () => {
    expect(isSmartLinkResponse(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isSmartLinkResponse(42)).toBe(false);
    expect(isSmartLinkResponse('string')).toBe(false);
    expect(isSmartLinkResponse([])).toBe(false);
  });

  it('returns false when required string field is wrong type', () => {
    expect(isSmartLinkResponse({ ...validLink, user_id: 123 })).toBe(false);
    expect(isSmartLinkResponse({ ...validLink, link_id: null })).toBe(false);
    expect(isSmartLinkResponse({ ...validLink, title: undefined })).toBe(false);
    expect(isSmartLinkResponse({ ...validLink, short_url: 0 })).toBe(false);
  });

  it('returns false when required number field is wrong type', () => {
    expect(isSmartLinkResponse({ ...validLink, total_visits: '0' })).toBe(false);
    expect(isSmartLinkResponse({ ...validLink, total_clicks: null })).toBe(false);
  });

  it('returns false when object is missing required fields', () => {
    const { link_id: _, ...withoutLinkId } = validLink;
    expect(isSmartLinkResponse(withoutLinkId)).toBe(false);
  });

  it('returns true when platforms array is present and valid', () => {
    expect(
      isSmartLinkResponse({ ...validLink, platforms: [validPlatform] })
    ).toBe(true);
  });

  it('returns false when platforms is not an array', () => {
    expect(isSmartLinkResponse({ ...validLink, platforms: 'not-array' })).toBe(false);
  });

  it('returns false when platforms contains invalid item', () => {
    expect(
      isSmartLinkResponse({
        ...validLink,
        platforms: [{ ...validPlatform, url: 123 }],
      })
    ).toBe(false);
  });
});

describe('isSmartLinkPlatformResponse', () => {
  it('returns true for a valid SmartLinkPlatformResponse', () => {
    expect(isSmartLinkPlatformResponse(validPlatform)).toBe(true);
  });

  it('returns false for null or non-object', () => {
    expect(isSmartLinkPlatformResponse(null)).toBe(false);
    expect(isSmartLinkPlatformResponse(42)).toBe(false);
  });

  it('returns false when required field is wrong type', () => {
    expect(isSmartLinkPlatformResponse({ ...validPlatform, platform_name: 1 })).toBe(false);
    expect(isSmartLinkPlatformResponse({ ...validPlatform, click_count: '0' })).toBe(false);
  });
});

describe('isListSmartLinksResponse', () => {
  const validList: ListSmartLinksResponse = {
    items: [validLink],
    nextToken: null,
  };

  it('returns true for a valid ListSmartLinksResponse', () => {
    expect(isListSmartLinksResponse(validList)).toBe(true);
  });

  it('returns true when nextToken is a string', () => {
    expect(isListSmartLinksResponse({ items: [], nextToken: 'cursor-xyz' })).toBe(
      true
    );
  });

  it('returns false for null', () => {
    expect(isListSmartLinksResponse(null)).toBe(false);
  });

  it('returns false when items is not an array', () => {
    expect(
      isListSmartLinksResponse({ items: 'not-array', nextToken: null })
    ).toBe(false);
  });

  it('returns false when an item fails SmartLinkResponse guard', () => {
    expect(
      isListSmartLinksResponse({
        items: [{ ...validLink, title: 123 }],
        nextToken: null,
      })
    ).toBe(false);
  });

  it('returns false when nextToken is invalid type', () => {
    expect(
      isListSmartLinksResponse({ items: [], nextToken: 42 })
    ).toBe(false);
  });
});
