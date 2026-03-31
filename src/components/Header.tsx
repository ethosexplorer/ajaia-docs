import Link from 'next/link';
import { getAllUsers, getCurrentUser } from '@/lib/auth';
import UserSwitcher from './UserSwitcher';

export default async function Header() {
  const users = await getAllUsers();
  const currentUser = await getCurrentUser();

  return (
    <header className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
          A
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Ajaia Docs</h1>
      </Link>
      
      <div className="auth-header">
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Mock Auth:</span>
        <UserSwitcher users={users} currentUserId={currentUser?.id} />
      </div>
    </header>
  );
}
