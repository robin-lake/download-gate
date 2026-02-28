import { Router, type Request, type Response, type NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import UserModel from '../models/user.js';

const router = Router();

/** Require Clerk auth; call next() or send 401. */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const { isAuthenticated } = getAuth(req);
  if (!isAuthenticated) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

// All /api/users routes require authentication
router.use(requireAuth);

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

/** Get Clerk user ID from request; only defined when authenticated (e.g. after requireAuth). */
function getClerkUserId(req: Request): string | null {
  const auth = getAuth(req);
  if (!auth.isAuthenticated) return null;
  return (auth as { userId: string }).userId ?? null;
}

// GET /api/users/me - Current user (DynamoDB record for the authenticated Clerk user)
router.get('/me', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User record not found. Call POST /api/users to create one.' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/users - Get-or-create current user (sync DynamoDB with Clerk identity)
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { name, email } = req.body as CreateUserBody;
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    const { user, created } = await UserModel.findOrCreateFromClerk(userId, { name, email });
    res.status(created ? 201 : 200).json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id - Get a user by ID (declare after /me so "me" is not treated as id)
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
  console.log('get users request')
  try {
    const { limit, cursor } = req.query;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await UserModel.list({
      limit: Number.isNaN(limitNum) ? 20 : limitNum,
      lastKey: cursor ?? null,
    });
    console.log('result: ', result)

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id - Update a user (caller may only update their own record unless you add admin checks)
router.patch('/:id', async (req: Request<{ id: string }, object, UpdateUserBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUserId = getClerkUserId(req);
    if (authUserId && authUserId !== req.params.id) {
      res.status(403).json({ error: 'Forbidden: you can only update your own user' });
      return;
    }

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

// DELETE /api/users/:id - Delete a user (caller may only delete their own record)
router.delete('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUserId = getClerkUserId(req);
    if (authUserId && authUserId !== req.params.id) {
      res.status(403).json({ error: 'Forbidden: you can only delete your own user' });
      return;
    }

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