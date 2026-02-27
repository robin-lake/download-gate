import express, { type Request, type Response } from 'express';
import userRoutes from './routes/users.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/users', userRoutes);

// Error handling (must be last)
app.use(errorHandler);

export default app;