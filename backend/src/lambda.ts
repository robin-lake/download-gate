/**
 * Lambda handler for API Gateway HTTP API (v2).
 * Wraps the Express app so all routes (/health, /api/users/*, etc.) are handled.
 *
 * Exported via module.exports so the ADOT Lambda layer can patch the handler
 * at runtime (required when using esbuild/CDK NodejsFunction).
 *
 * Path fix: API Gateway HTTP API v2 includes the stage in rawPath (e.g. /$default/health).
 * Express routes expect the path without the stage (e.g. /health). We strip the stage
 * prefix so that /health and other routes match when using custom domains or stage URLs.
 */
import type { RequestListener } from 'http';
import serverlessExpress from '@codegenie/serverless-express';
import app from './app.js';

type Configure = (params: { app: RequestListener }) => (event: unknown, context: unknown, callback?: unknown) => void | Promise<unknown>;
const serverlessHandler = (serverlessExpress as unknown as Configure)({ app });

function handler(event: unknown, context: unknown, callback?: unknown): void | Promise<unknown> {
  const e = event as { rawPath?: string; requestContext?: { stage?: string } };
  const stage = e.requestContext?.stage;
  if (stage != null && e.rawPath?.startsWith(`/${stage}`)) {
    e.rawPath = e.rawPath.slice(`/${stage}`.length) || '/';
  }
  return serverlessHandler(event, context, callback);
}

module.exports = { handler };
