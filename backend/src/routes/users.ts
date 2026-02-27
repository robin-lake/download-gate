import { Router, type Request, type Response, type NextFunction } from 'express';
import UserModel from '../models/user.js';

const router = Router();

interface CreateUserBody {
  name?: string;
  email?: string;
}

interface ListUsersQuery {
  limit?: string;
  cursor?: string;
}

interface UpdateUserBody {
  name?: string;
  email?: string;
  status?: string;
}

// POST /api/users - Create a new user
router.post('/', async (req: Request<object, object, CreateUserBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    const user = await UserModel.create({ name, email });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id - Get a user by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/users - List users with pagination
router.get('/', async (req: Request<object, object, object, ListUsersQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit, cursor } = req.query;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await UserModel.list({
      limit: Number.isNaN(limitNum) ? 20 : limitNum,
      lastKey: cursor ?? null,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id - Update a user
router.patch('/:id', async (req: Request<{ id: string }, object, UpdateUserBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allowedFields = ['name', 'email', 'status'] as const;
    const updates: Record<string, unknown> = {};

    // Only allow updating specific fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field] as unknown;
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const user = await UserModel.update(req.params.id, updates);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id - Delete a user
router.delete('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await UserModel.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted', user: deleted });
  } catch (err) {
    next(err);
  }
});

export default router;