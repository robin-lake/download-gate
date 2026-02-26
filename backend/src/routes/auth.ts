import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { putUser, getUserByEmail } from '../db/users.js';
import { signToken } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import type { UserRecord, AuthUser } from '../types.js';

const router = Router();
const SALT_ROUNDS = 10;

router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
      return;
    }
    const existing = await getUserByEmail(email.trim());
    if (existing) {
      res.status(409).json({ message: 'An account with this email already exists' });
      return;
    }
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userName = typeof name === 'string' ? name.trim() || undefined : undefined;
    const user: UserRecord = {
      id,
      email: email.trim().toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    if (userName !== undefined) user.name = userName;
    await putUser(user);
    const token = signToken({ sub: id });
    const safeUser: AuthUser = { id: user.id, email: user.email };
    if (user.name !== undefined) safeUser.name = user.name;
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Sign up failed' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }
    const user = await getUserByEmail(email.trim());
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const token = signToken({ sub: user.id });
    const safeUser: AuthUser = { id: user.id, email: user.email };
    if (user.name !== undefined) safeUser.name = user.name;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  res.json(req.user);
});

export default router;
