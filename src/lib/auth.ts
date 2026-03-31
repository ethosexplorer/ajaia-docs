import { cookies } from 'next/headers';
import db from './db';

export const MOCK_AUTH_COOKIE_NAME = 'ajaia_mock_user_id';
const DEFAULT_USER_ID = 'user_moazzam';

export type User = {
  id: string;
  name: string;
  email: string;
};

// Gets the currently logged-in user from the mock cookie
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get(MOCK_AUTH_COOKIE_NAME);
  
  const userId = userIdCookie?.value || DEFAULT_USER_ID;

  const stmt = db.prepare('SELECT id, name, email FROM users WHERE id = ?');
  const user = stmt.get(userId) as User | undefined;

  return user || null;
}

export async function getAllUsers(): Promise<User[]> {
  const stmt = db.prepare('SELECT id, name, email FROM users');
  return stmt.all() as User[];
}
