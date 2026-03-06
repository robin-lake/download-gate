import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { clerkMiddleware } from '@clerk/express';
import userRoutes from './routes/users.js';
import downloadGateRoutes from './routes/downloadGates.js';
import publicGateRoutes from './routes/publicGates.js';
import soundcloudRoutes from './routes/integrations/soundCloud.js';
import mediaRoutes, { serveLocalUploads } from './routes/media.js';
import errorHandler from './middleware/errorHandler.js';
import swaggerSpec from './swagger.js';

const app = express();

// Parse JSON request bodies
app.use(express.json());
// Parse Cookie header into req.cookies (needed for OAuth callbacks that read PKCE/state cookies)
app.use(cookieParser());

// CORS: required in Lambda too so API responses include Access-Control-* headers
// CORS_ORIGINS = comma-separated list (from CDK); CORS_ORIGIN = single origin (legacy/local)
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : process.env.CORS_ORIGIN
    ? [process.env.CORS_ORIGIN]
    : ['*'];
app.use(cors({
  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'traceparent',
    'tracestate',
    'baggage',
  ],
}));

// Clerk auth: attaches auth state to request for getAuth(req) in routes
app.use(clerkMiddleware());

// Health check endpoint
/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns service health status and timestamp.
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 timestamp: { type: string, format: date-time }
 */
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// OpenAPI docs (Swagger UI + JSON spec)
app.get('/api-docs.json', (_req: Request, res: Response): void => {
  res.json(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Download Gate API' }));

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/download-gates', downloadGateRoutes);
app.use('/api/gates', publicGateRoutes);
app.use('/api/media', mediaRoutes);
// Local dev: serve uploaded files from disk when MEDIA_BUCKET is not set
app.get('/api/uploads/*key', serveLocalUploads);
app.use('/api/integrations', soundcloudRoutes);

// Error handling (must be last)
app.use(errorHandler);

export default app;