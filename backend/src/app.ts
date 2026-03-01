import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import userRoutes from './routes/users.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Parse JSON request bodies
app.use(express.json());

// CORS: required in Lambda too so API responses include Access-Control-* headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Clerk auth: attaches auth state to request for getAuth(req) in routes
app.use(clerkMiddleware());

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/users', userRoutes);

// Error handling (must be last)
app.use(errorHandler);

export default app;