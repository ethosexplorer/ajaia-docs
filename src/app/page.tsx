import { getMyDocuments, getSharedDocuments, createDocument, DocumentRow } from './actions/document';
import { getCurrentUser } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Plus, FileText, Users, Clock } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await getCurrentUser();
  
  if (!user) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <h2>Welcome to Ajaia Docs</h2>
        <p>Please select a mock user from the header.</p>
      </div>
    );
  }

  const myDocs = await getMyDocuments();
  const sharedDocs = await getSharedDocuments();

  const handleCreateNew = async () => {
    'use server';
    const newDocId = await createDocument();
    redirect(`/d/${newDocId}`);
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Welcome, {user.name}</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <FileUploader />
          <form action={handleCreateNew}>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> New Document
            </button>
          </form>
        </div>
      </div>

      <section style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} color="var(--text-muted)" /> My Documents
        </h3>
        
        {myDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
            No documents yet. Create one or upload a file to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {myDocs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="var(--text-muted)" /> Shared with Me
        </h3>
        
        {sharedDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
            No documents have been shared with you.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {sharedDocs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} isShared />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DocumentCard({ doc, isShared = false }: { doc: DocumentRow, isShared?: boolean }) {
  const updatedDate = new Date(doc.updated_at);
  const timeAgo = formatDistanceToNow(updatedDate, { addSuffix: true });

  return (
    <Link href={`/d/${doc.id}`} className="card" style={{ display: 'block', textDecoration: 'none' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {doc.title || 'Untitled Document'}
      </h4>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={14} /> {timeAgo}
        </div>
        {isShared && doc.owner_name && (
          <span style={{ backgroundColor: 'var(--bg-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
            {doc.owner_name}
          </span>
        )}
      </div>
    </Link>
  );
}
