'use server';

import { cookies } from 'next/headers';
import { MOCK_AUTH_COOKIE_NAME } from '@/lib/auth';

export async function setMockUser(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(MOCK_AUTH_COOKIE_NAME, userId, { path: '/' });
}
