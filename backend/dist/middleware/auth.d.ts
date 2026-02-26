import type { Request, Response, NextFunction } from 'express';
import type { AuthUser } from '../types.js';
export declare function signToken(payload: {
    sub: string;
}): string;
export declare function verifyToken(token: string): {
    sub: string;
} | null;
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map