'use client';

import { setMockUser } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { User } from '@/lib/auth';

export default function UserSwitcher({ users, currentUserId }: { users: User[], currentUserId?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUserId = e.target.value;
    startTransition(async () => {
      await setMockUser(newUserId);
      router.refresh();
    });
  };

  return (
    <select 
      value={currentUserId || ''} 
      onChange={handleChange}
      disabled={isPending}
    >
      {users.map(u => (
        <option key={u.id} value={u.id}>
          {u.name} ({u.email})
        </option>
      ))}
    </select>
  );
}
