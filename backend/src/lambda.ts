/**
 * Lambda handler for API Gateway HTTP API (v2).
 * Wraps the Express app so all routes (/health, /api/users/*, etc.) are handled.
 */
import serverlessExpress from '@codegenie/serverless-express';
import app from './app.js';

export const handler = serverlessExpress({ app });
