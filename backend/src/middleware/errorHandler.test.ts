import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import errorHandler from './errorHandler.js';

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  return res;
}

describe('errorHandler', () => {
  it('returns 429 for ProvisionedThroughputExceededException', () => {
    const res = mockRes();
    const err = new Error('throttled');
    err.name = 'ProvisionedThroughputExceededException';
    errorHandler(err, {} as Request, res, {} as NextFunction);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Too many requests, please retry', retryAfter: 1 })
    );
  });

  it('returns 409 for ConditionalCheckFailedException', () => {
    const res = mockRes();
    const err = new Error('condition failed');
    err.name = 'ConditionalCheckFailedException';
    errorHandler(err, {} as Request, res, {} as NextFunction);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Item was modified or does not exist' })
    );
  });

  it('returns 400 for ValidationException', () => {
    const res = mockRes();
    const err = new Error('invalid param');
    err.name = 'ValidationException';
    errorHandler(err, {} as Request, res, {} as NextFunction);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid request parameters', details: 'invalid param' })
    );
  });

  it('returns 503 for database connection errors', () => {
    const res = mockRes();
    const err = new AggregateError([
      Object.assign(new Error('connect ECONNREFUSED ::1:8000'), { code: 'ECONNREFUSED' }),
      Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:8000'), { code: 'ECONNREFUSED' }),
    ]);

    errorHandler(err, {} as Request, res, {} as NextFunction);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Database connection failed',
        details: expect.stringContaining('local DynamoDB'),
      })
    );
  });

  it('returns 500 for unknown errors', () => {
    const res = mockRes();
    errorHandler(new Error('boom'), {} as Request, res, {} as NextFunction);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Internal server error' })
    );
  });
});
