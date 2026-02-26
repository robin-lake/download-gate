import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserById } from '../db/users.js';
import type { AuthUser } from '../types.js';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production';

export function signToken(payload: { sub: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    return decoded;
  } catch {
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
  const user = await getUserById(decoded.sub);
  if (!user) {
    res.status(401).json({ message: 'User not found' });
    return;
  }
  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
  };
  next();
}
