/**
 * Lambda handler for API Gateway HTTP API (v2).
 * Wraps the Express app so all routes (/health, /api/users/*, etc.) are handled.
 *
 * Exported via module.exports so the ADOT Lambda layer can patch the handler
 * at runtime (required when using esbuild/CDK NodejsFunction).
 */
import type { RequestListener } from 'http';
import serverlessExpress from '@codegenie/serverless-express';
import app from './app.js';

type Configure = (params: { app: RequestListener }) => (event: unknown, context: unknown, callback?: unknown) => void | Promise<unknown>;
const handler = (serverlessExpress as unknown as Configure)({ app });
module.exports = { handler };
