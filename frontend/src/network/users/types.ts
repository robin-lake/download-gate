/** User shape returned by GET /api/users (list) and GET /api/users/:id */
export interface User {
  user_id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function isUser(d: unknown): d is User {
  return (
    typeof d === 'object' &&
    d !== null &&
    'user_id' in d &&
    'name' in d &&
    'email' in d &&
    'status' in d &&
    'created_at' in d &&
    'updated_at' in d &&
    typeof (d as User).user_id === 'string' &&
    typeof (d as User).name === 'string' &&
    typeof (d as User).email === 'string' &&
    typeof (d as User).created_at === 'string' &&
    typeof (d as User).updated_at === 'string'
  );
}

