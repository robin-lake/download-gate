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
      // create() calls generateUniqueShortCode() → findByShortCode() (Query), then PutCommand
      mockSend.mockResolvedValueOnce({ Items: [] }); // findByShortCode: no existing short_code
      mockSend.mockResolvedValueOnce(undefined); // PutCommand

      const result = await DownloadGateModel.create({
        user_id: 'user-1',
        artist_name: 'Artist',
        title: 'Track',
        audio_file_url: 'https://example.com/audio.mp3',
      });

      expect(mockSend).toHaveBeenCalledTimes(2);
      const [command] = mockSend.mock.calls[1]; // second call is PutCommand
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
      // create() still calls generateUniqueShortCode() when no short_code provided
      mockSend.mockResolvedValueOnce({ Items: [] }); // findByShortCode
      mockSend.mockResolvedValueOnce(undefined); // PutCommand

      const result = await DownloadGateModel.create({
        user_id: 'user-1',
        artist_name: 'Artist',
        title: 'Track',
        audio_file_url: 'https://example.com/audio.mp3',
        gate_id: 'my-gate-123',
      });

      expect(result.gate_id).toBe('my-gate-123');
      expect(mockSend.mock.calls[1][0].input.Item.gate_id).toBe('my-gate-123');
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

  describe('listByUserId', () => {
    it('sends QueryCommand with user_id and returns items and lastEvaluatedKey', async () => {
      const mockItems = [
        {
          user_id: 'user-1',
          gate_id: 'gate-1',
          artist_name: 'Artist',
          title: 'Track',
          audio_file_url: 'https://example.com/audio.mp3',
          visits: 0,
          downloads: 0,
          emails_captured: 0,
        },
      ];
      const mockLastKey = { user_id: 'user-1', gate_id: 'gate-1' };
      mockSend.mockResolvedValueOnce({ Items: mockItems, LastEvaluatedKey: mockLastKey });

      const result = await DownloadGateModel.listByUserId('user-1');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const [command] = mockSend.mock.calls[0];
      expect(command.input.KeyConditionExpression).toContain('user_id');
      expect(command.input.ExpressionAttributeValues).toEqual({ ':user_id': 'user-1' });
      expect(command.input.Limit).toBe(50);
      expect(result.items).toEqual(mockItems);
      expect(result.lastEvaluatedKey).toEqual(mockLastKey);
    });

    it('uses custom limit and exclusiveStartKey when provided', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      await DownloadGateModel.listByUserId('user-1', {
        limit: 10,
        exclusiveStartKey: { user_id: 'user-1', gate_id: 'prev-gate' },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const [command] = mockSend.mock.calls[0];
      expect(command.input.Limit).toBe(10);
      expect(command.input.ExclusiveStartKey).toEqual({ user_id: 'user-1', gate_id: 'prev-gate' });
    });

    it('returns empty items and undefined lastEvaluatedKey when no results', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await DownloadGateModel.listByUserId('user-1');

      expect(result.items).toEqual([]);
      expect(result.lastEvaluatedKey).toBeUndefined();
    });
  });

  describe('getStatsByUserId', () => {
    it('returns zeros when user has no gates', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await DownloadGateModel.getStatsByUserId('user-1');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend.mock.calls[0][0].input.KeyConditionExpression).toContain('user_id');
      expect(mockSend.mock.calls[0][0].input.ProjectionExpression).toContain('visits');
      expect(mockSend.mock.calls[0][0].input.ProjectionExpression).toContain('downloads');
      expect(mockSend.mock.calls[0][0].input.ProjectionExpression).toContain('emails_captured');
      expect(result).toEqual({
        total_visits: 0,
        total_downloads: 0,
        total_emails_captured: 0,
      });
    });

    it('sums visits, downloads, and emails_captured from all gates', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          { visits: 10, downloads: 3, emails_captured: 2 },
          { visits: 5, downloads: 1, emails_captured: 0 },
        ],
      });

      const result = await DownloadGateModel.getStatsByUserId('user-1');

      expect(result).toEqual({
        total_visits: 15,
        total_downloads: 4,
        total_emails_captured: 2,
      });
    });

    it('paginates and sums when LastEvaluatedKey is present', async () => {
      mockSend
        .mockResolvedValueOnce({
          Items: [{ visits: 1, downloads: 0, emails_captured: 1 }],
          LastEvaluatedKey: { user_id: 'user-1', gate_id: 'gate-1' },
        })
        .mockResolvedValueOnce({
          Items: [{ visits: 2, downloads: 1, emails_captured: 0 }],
        });

      const result = await DownloadGateModel.getStatsByUserId('user-1');

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        total_visits: 3,
        total_downloads: 1,
        total_emails_captured: 1,
      });
    });

    it('coerces non-number or missing count fields to zero', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          { visits: 1, downloads: undefined, emails_captured: null },
          {},
        ],
      });

      const result = await DownloadGateModel.getStatsByUserId('user-1');

      expect(result.total_visits).toBe(1);
      expect(result.total_downloads).toBe(0);
      expect(result.total_emails_captured).toBe(0);
    });
  });

  describe('incrementCount', () => {
    it('sends UpdateCommand with correct key and expression for visits', async () => {
      const updated = {
        user_id: 'user-1',
        gate_id: 'gate-1',
        artist_name: 'Artist',
        title: 'Track',
        audio_file_url: 'https://example.com/audio.mp3',
        visits: 1,
        downloads: 0,
        emails_captured: 0,
      };
      mockSend.mockResolvedValueOnce({ Attributes: updated });

      const result = await DownloadGateModel.incrementCount('user-1', 'gate-1', 'visits');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const [command] = mockSend.mock.calls[0];
      expect(command.input.Key).toEqual({ user_id: 'user-1', gate_id: 'gate-1' });
      expect(command.input.UpdateExpression).toContain('#field');
      expect(command.input.ExpressionAttributeNames).toMatchObject({
        '#field': 'visits',
        '#updated_at': 'updated_at',
      });
      expect(command.input.ExpressionAttributeValues).toMatchObject({
        ':zero': 0,
        ':one': 1,
      });
      expect(command.input.ConditionExpression).toContain('attribute_exists');
      expect(result).toEqual(updated);
    });

    it('increments downloads when field is downloads', async () => {
      const updated = {
        user_id: 'user-1',
        gate_id: 'gate-1',
        visits: 0,
        downloads: 1,
        emails_captured: 0,
      };
      mockSend.mockResolvedValueOnce({ Attributes: updated });

      await DownloadGateModel.incrementCount('user-1', 'gate-1', 'downloads');

      expect(mockSend.mock.calls[0][0].input.ExpressionAttributeNames['#field']).toBe('downloads');
    });

    it('increments emails_captured when field is emails_captured', async () => {
      const updated = {
        user_id: 'user-1',
        gate_id: 'gate-1',
        visits: 0,
        downloads: 0,
        emails_captured: 1,
      };
      mockSend.mockResolvedValueOnce({ Attributes: updated });

      await DownloadGateModel.incrementCount('user-1', 'gate-1', 'emails_captured');

      expect(mockSend.mock.calls[0][0].input.ExpressionAttributeNames['#field']).toBe(
        'emails_captured'
      );
    });
  });
});
