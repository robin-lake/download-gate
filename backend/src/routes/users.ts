import { Router, type Request, type Response, type NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { trace } from '@opentelemetry/api';
import UserModel from '../models/user.js';
import { tracer, withSpan } from '../tracing.js';

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

/**
 * @openapi
 * /api/users/webhooks/clerk:
 *   post:
 *     tags: [Users]
 *     summary: Clerk webhook (user.created)
 *     description: Called by Clerk when a user signs up. Creates the user in DynamoDB. Not authenticated by Bearer; secured by Clerk webhook secret.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string, example: user.created }
 *               data: { type: object }
 *     responses:
 *       200:
 *         description: Processed or ignored
 */
// Clerk webhook: create user in DB when someone signs up (must be before requireAuth)
router.post('/webhooks/clerk', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = req.body as { type: string; data?: { id?: string; first_name?: string; last_name?: string; email_addresses?: { email_address: string }[] } };
    if (event.type !== 'user.created' || !event.data?.id) {
      trace.getActiveSpan()?.setAttribute('clerkwebhook.added_user', event?.data?.id ?? 'skipped');
      res.status(200).send('ok');
      return;
    }
    const clerkUser = event.data;
    const clerkUserId = clerkUser.id;
    const email = clerkUser.email_addresses?.[0]?.email_address ?? '';
    const name = [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(' ').trim() || 'User';
    await UserModel.create({
      user_id: clerkUserId as string,
      name,
      email: email || `no-email-${clerkUser.id}@placeholder.local`,
    });
    res.status(200).send('ok');
  } catch (err) {
    next(err);
  }
});

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

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user
 *     description: Returns the DynamoDB user record for the authenticated Clerk user.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User record not found (create via POST /api/users)
 */
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
      trace.getActiveSpan()?.setAttribute('user.id.notfound', userId);
      res.status(404).json({ error: 'User record not found. Call POST /api/users to create one.' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Get-or-create current user
 *     description: Syncs DynamoDB with the authenticated Clerk identity. Creates user if missing; returns existing otherwise.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Existing user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Name and email are required
 *       401:
 *         description: Authentication required
 */
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

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Returns a user by user_id. Requires authentication.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Clerk user ID
 *     responses:
 *       200:
 *         description: User
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 */
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

// // GET /api/users - List users with pagination
// router.get('/', async (req: Request<object, object, object, ListUsersQuery>, res: Response, next: NextFunction): Promise<void> => {
//   console.log('get users request')
//   try {
//     const { limit, cursor } = req.query;
//     const limitNum = limit ? parseInt(limit, 10) : 20;
//     const result = await UserModel.list({
//       limit: Number.isNaN(limitNum) ? 20 : limitNum,
//       lastKey: cursor ?? null,
//     });
//     console.log('result: ', result)

//     res.json(result);
//   } catch (err) {
//     next(err);
//   }
// });


/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List users (paginated)
 *     description: Returns a paginated list of users. Use lastKey from the response as the cursor query param for the next page.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Max number of users to return
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *         description: Pagination cursor from previous response nextToken
 *     responses:
 *       200:
 *         description: Paginated users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListUsersResponse'
 *       401:
 *         description: Authentication required
 */
// GET /api/users - List users with pagination
router.get('/', async (req: Request<object, object, object, ListUsersQuery>, res: Response, next: NextFunction): Promise<void> => {
  const { limit, cursor } = req.query;
  const limitNum = limit ? parseInt(limit, 10) : 20;
  const effectiveLimit = Number.isNaN(limitNum) ? 20 : limitNum;

  try {
    const result = await withSpan(
      'users.list',
      async (span) => {
        span.setAttribute('users.list.limit', effectiveLimit);
        span.setAttribute('users.list.has_cursor', !!cursor);
        return UserModel.list({
          limit: effectiveLimit,
          lastKey: cursor ?? null,
        });
      },
      { 'users.list.limit': effectiveLimit }
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    trace.getActiveSpan()?.setAttribute('users.list.error', message);
    next(err);
  }
});


/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user
 *     description: Update the authenticated user. Caller may only update their own record (user_id must match).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Clerk user ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: No valid fields to update
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden (can only update own user)
 *       404:
 *         description: User not found
 */
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

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     description: Delete the user. Caller may only delete their own record (user_id must match).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Clerk user ID
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden (can only delete own user)
 *       404:
 *         description: User not found
 */
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