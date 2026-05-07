import type { Request, Response, NextFunction } from 'express';

type ErrorWithCode = Error & { code?: string; errors?: unknown[] };

function toError(err: unknown): ErrorWithCode {
  return err instanceof Error ? err : new Error(String(err));
}

function flattenErrors(error: ErrorWithCode): ErrorWithCode[] {
  const errors = error instanceof AggregateError
    ? error.errors
    : Array.isArray(error.errors)
      ? error.errors
      : [];

  return [
    error,
    ...errors.map(toError),
  ];
}

function isDatabaseConnectionError(error: ErrorWithCode): boolean {
  return flattenErrors(error).some((cause) => {
    const code = cause.code;
    return code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT';
  });
}

function logError(error: ErrorWithCode): void {
  console.error(`Error: ${error.name} - ${error.message}`);

  const causes = flattenErrors(error).slice(1);
  for (const cause of causes) {
    const code = cause.code ? ` (${cause.code})` : '';
    console.error(`  Cause: ${cause.name}${code} - ${cause.message}`);
  }
}

function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const error = toError(err);
  logError(error);

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

  // Local DynamoDB/AWS endpoint unavailable
  if (isDatabaseConnectionError(error)) {
    res.status(503).json({
      error: 'Database connection failed',
      details: 'The database endpoint is unavailable. Check that local DynamoDB is running.',
    });
    return;
  }

  // Generic server error
  res.status(500).json({
    error: 'Internal server error',
  });
}

export default errorHandler;