import jwt from 'jsonwebtoken';
import { getUserById } from '../db/users.js';
const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production';
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch {
        return null;
    }
}
export async function authMiddleware(req, res, next) {
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
//# sourceMappingURL=auth.js.map