import { describe, it, expect, vi, beforeEach } from 'vitest';
import DownloadGateModel from './downloadGate.js';

const mockSend = vi.fn();
vi.mock('../config/dynamodb.js', () => ({
  docClient: { send: (...args: unknown[]) => mockSend(...args) },
}));
vi.mock('uuid', () => ({ v4: () => 'fixed-uuid' }));

beforeEach(() => {
  mockSend.mockReset();
});

describe('DownloadGateModel', () => {
  describe('create', () => {
    it('sends PutCommand with correct table, item shape, and condition', async () => {
      mockSend.mockResolvedValueOnce(undefined);

      const result = await DownloadGateModel.create({
        user_id: 'user-1',
        artist_name: 'Artist',
        title: 'Track',
        audio_file_url: 'https://example.com/audio.mp3',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const [command] = mockSend.mock.calls[0];
      expect(command.input.TableName).toBeDefined();
      expect(command.input.Item).toMatchObject({
        user_id: 'user-1',
        artist_name: 'Artist',
        title: 'Track',
        audio_file_url: 'https://example.com/audio.mp3',
        visits: 0,
        downloads: 0,
        emails_captured: 0,
      });
      expect(command.input.Item?.gate_id).toBe('fixed-uuid');
      expect(command.input.Item?.created_at).toBeDefined();
      expect(command.input.Item?.updated_at).toBeDefined();
      expect(command.input.ConditionExpression).toContain('attribute_not_exists');

      expect(result.user_id).toBe('user-1');
      expect(result.gate_id).toBe('fixed-uuid');
      expect(result.visits).toBe(0);
    });

    it('uses provided gate_id when given', async () => {
      mockSend.mockResolvedValueOnce(undefined);

      const result = await DownloadGateModel.create({
        user_id: 'user-1',
        artist_name: 'Artist',
        title: 'Track',
        audio_file_url: 'https://example.com/audio.mp3',
        gate_id: 'my-gate-123',
      });

      expect(result.gate_id).toBe('my-gate-123');
      expect(mockSend.mock.calls[0][0].input.Item.gate_id).toBe('my-gate-123');
    });
  });

  describe('findByUserAndGateId', () => {
    it('sends GetCommand with correct key and returns item or null', async () => {
      const mockItem = {
        user_id: 'user-1',
        gate_id: 'gate-1',
        artist_name: 'Artist',
        title: 'Track',
        audio_file_url: 'https://example.com/audio.mp3',
        visits: 1,
        downloads: 0,
        emails_captured: 0,
      };
      mockSend.mockResolvedValueOnce({ Item: mockItem });

      const result = await DownloadGateModel.findByUserAndGateId('user-1', 'gate-1');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend.mock.calls[0][0].input.Key).toEqual({
        user_id: 'user-1',
        gate_id: 'gate-1',
      });
      expect(result).toEqual(mockItem);
    });

    it('returns null when item is missing', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await DownloadGateModel.findByUserAndGateId('user-1', 'gate-1');

      expect(result).toBeNull();
    });
  });

  describe('findByGateId', () => {
    it('sends QueryCommand with gate_id-index and returns first item or null', async () => {
      const mockItem = {
        user_id: 'user-1',
        gate_id: 'gate-1',
        artist_name: 'Artist',
        title: 'Track',
        audio_file_url: 'https://example.com/audio.mp3',
        visits: 0,
        downloads: 0,
        emails_captured: 0,
      };
      mockSend.mockResolvedValueOnce({ Items: [mockItem] });

      const result = await DownloadGateModel.findByGateId('gate-1');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend.mock.calls[0][0].input.IndexName).toBe('gate_id-index');
      expect(mockSend.mock.calls[0][0].input.KeyConditionExpression).toContain('gate_id');
      expect(result).toEqual(mockItem);
    });

    it('returns null when no items', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await DownloadGateModel.findByGateId('gate-1');

      expect(result).toBeNull();
    });
  });
});
