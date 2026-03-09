import { describe, it, expect } from 'vitest';
import {
  isDownloadGateResponse,
  isListDownloadGatesResponse,
  isDownloadGateStatsResponse,
  isDeleteDownloadGateResponse,
  type DownloadGateResponse,
  type ListDownloadGatesResponse,
  type DownloadGateStatsResponse,
} from './types';

const validGate: DownloadGateResponse = {
  user_id: 'user-1',
  gate_id: 'gate-1',
  artist_name: 'Artist',
  title: 'Track',
  audio_file_url: 'https://example.com/audio.mp3',
  visits: 0,
  downloads: 0,
  emails_captured: 0,
};

describe('isDownloadGateResponse', () => {
  it('returns true for a valid DownloadGateResponse', () => {
    expect(isDownloadGateResponse(validGate)).toBe(true);
  });

  it('returns true when optional fields are present', () => {
    expect(
      isDownloadGateResponse({
        ...validGate,
        thumbnail_url: 'https://example.com/thumb.jpg',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      })
    ).toBe(true);
  });

  it('returns false for null', () => {
    expect(isDownloadGateResponse(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isDownloadGateResponse(42)).toBe(false);
    expect(isDownloadGateResponse('string')).toBe(false);
    expect(isDownloadGateResponse([])).toBe(false);
  });

  it('returns false when required string field is wrong type', () => {
    expect(isDownloadGateResponse({ ...validGate, user_id: 123 })).toBe(false);
    expect(isDownloadGateResponse({ ...validGate, gate_id: null })).toBe(false);
    expect(isDownloadGateResponse({ ...validGate, artist_name: undefined })).toBe(false);
    expect(isDownloadGateResponse({ ...validGate, title: 0 })).toBe(false);
    expect(isDownloadGateResponse({ ...validGate, audio_file_url: false })).toBe(false);
  });

  it('returns false when required number field is wrong type', () => {
    expect(isDownloadGateResponse({ ...validGate, visits: '0' })).toBe(false);
    expect(isDownloadGateResponse({ ...validGate, downloads: null })).toBe(false);
    expect(isDownloadGateResponse({ ...validGate, emails_captured: undefined })).toBe(false);
  });

  it('returns false when optional thumbnail_url is wrong type', () => {
    expect(isDownloadGateResponse({ ...validGate, thumbnail_url: 123 })).toBe(false);
  });

  it('returns false when object is missing required fields', () => {
    const { gate_id: _, ...withoutGateId } = validGate;
    expect(isDownloadGateResponse(withoutGateId)).toBe(false);
  });
});

describe('isListDownloadGatesResponse', () => {
  const validList: ListDownloadGatesResponse = {
    items: [validGate],
    nextToken: null,
  };

  it('returns true for a valid ListDownloadGatesResponse', () => {
    expect(isListDownloadGatesResponse(validList)).toBe(true);
  });

  it('returns true when nextToken is a string', () => {
    expect(isListDownloadGatesResponse({ items: [], nextToken: 'cursor-abc' })).toBe(true);
  });

  it('returns true for empty items array', () => {
    expect(isListDownloadGatesResponse({ items: [], nextToken: null })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isListDownloadGatesResponse(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isListDownloadGatesResponse([])).toBe(false);
    expect(isListDownloadGatesResponse('string')).toBe(false);
  });

  it('returns false when items is not an array', () => {
    expect(isListDownloadGatesResponse({ items: {}, nextToken: null })).toBe(false);
    expect(isListDownloadGatesResponse({ items: null, nextToken: null })).toBe(false);
  });

  it('returns false when items contains invalid element', () => {
    expect(
      isListDownloadGatesResponse({
        items: [{ ...validGate, gate_id: 123 }],
        nextToken: null,
      })
    ).toBe(false);
  });

  it('returns false when nextToken is not null or string', () => {
    expect(isListDownloadGatesResponse({ items: [], nextToken: 0 })).toBe(false);
    expect(isListDownloadGatesResponse({ items: [], nextToken: {} })).toBe(false);
  });
});

describe('isDownloadGateStatsResponse', () => {
  const validStats: DownloadGateStatsResponse = {
    total_visits: 10,
    total_downloads: 3,
    total_emails_captured: 2,
  };

  it('returns true for a valid DownloadGateStatsResponse', () => {
    expect(isDownloadGateStatsResponse(validStats)).toBe(true);
  });

  it('returns true for zeros', () => {
    expect(
      isDownloadGateStatsResponse({
        total_visits: 0,
        total_downloads: 0,
        total_emails_captured: 0,
      })
    ).toBe(true);
  });

  it('returns false for null', () => {
    expect(isDownloadGateStatsResponse(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isDownloadGateStatsResponse(42)).toBe(false);
    expect(isDownloadGateStatsResponse('string')).toBe(false);
    expect(isDownloadGateStatsResponse([])).toBe(false);
  });

  it('returns false when a count is not a number', () => {
    expect(isDownloadGateStatsResponse({ ...validStats, total_visits: '10' })).toBe(false);
    expect(isDownloadGateStatsResponse({ ...validStats, total_downloads: null })).toBe(false);
    expect(isDownloadGateStatsResponse({ ...validStats, total_emails_captured: undefined })).toBe(
      false
    );
  });

  it('returns false when a count is not an integer', () => {
    expect(isDownloadGateStatsResponse({ ...validStats, total_visits: 1.5 })).toBe(false);
  });

  it('returns false when a count is negative', () => {
    expect(isDownloadGateStatsResponse({ ...validStats, total_visits: -1 })).toBe(false);
    expect(isDownloadGateStatsResponse({ ...validStats, total_downloads: -1 })).toBe(false);
  });

  it('returns false when object is missing required fields', () => {
    expect(
      isDownloadGateStatsResponse({
        total_visits: 10,
        total_downloads: 3,
      })
    ).toBe(false);
    expect(
      isDownloadGateStatsResponse({
        total_visits: 10,
        total_emails_captured: 2,
      })
    ).toBe(false);
  });
});

describe('isDeleteDownloadGateResponse', () => {
  it('returns true for { deleted: true }', () => {
    expect(isDeleteDownloadGateResponse({ deleted: true })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isDeleteDownloadGateResponse(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isDeleteDownloadGateResponse(42)).toBe(false);
    expect(isDeleteDownloadGateResponse('deleted')).toBe(false);
  });

  it('returns false when deleted is not true', () => {
    expect(isDeleteDownloadGateResponse({})).toBe(false);
    expect(isDeleteDownloadGateResponse({ deleted: false })).toBe(false);
    expect(isDeleteDownloadGateResponse({ deleted: 1 })).toBe(false);
    expect(isDeleteDownloadGateResponse({ deleted: 'true' })).toBe(false);
  });
});
