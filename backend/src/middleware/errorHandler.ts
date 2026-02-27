import type { Request, Response, NextFunction } from 'express';

function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error(`Error: ${error.name} - ${error.message}`);

  // DynamoDB throttling - tell the client to retry
  if (error.name === 'ProvisionedThroughputExceededException') {
    res.status(429).json({
      error: 'Too many requests, please retry',
      retryAfter: 1,
    });
    return;
  }

  // Conditional check failed - item doesn't exist or version conflict
  if (error.name === 'ConditionalCheckFailedException') {
    res.status(409).json({
      error: 'Item was modified or does not exist',
    });
    return;
  }

  // Validation errors
  if (error.name === 'ValidationException') {
    res.status(400).json({
      error: 'Invalid request parameters',
      details: error.message,
    });
    return;
  }

  // Generic server error
  res.status(500).json({
    error: 'Internal server error',
  });
}

export default errorHandler;