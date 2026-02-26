export interface User {
  id: string;
  email: string;
  name?: string | undefined;
  createdAt: string;
}

export interface UserRecord extends User {
  passwordHash: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | undefined;
}
