import type { UserRecord } from '../types.js';
export declare function ensureUsersTable(): Promise<void>;
export declare function putUser(user: UserRecord): Promise<void>;
export declare function getUserById(id: string): Promise<UserRecord | null>;
export declare function getUserByEmail(email: string): Promise<UserRecord | null>;
//# sourceMappingURL=users.d.ts.map