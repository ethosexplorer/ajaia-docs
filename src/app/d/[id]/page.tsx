import { getDocument, updateDocumentContent } from '@/app/actions/document';
import { getDocumentShares } from '@/app/actions/share';
import { getDocumentComments } from '@/app/actions/comment';
import { getCurrentUser } from '@/lib/auth';
import Editor from '@/components/Editor';
import ShareDialog from '@/components/ShareDialog';
import TitleInput from '@/components/TitleInput';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/');
  }

  const doc = await getDocument(id);
  
  if (!doc) {
    return (
      <div className="container" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <h2>Document not found</h2>
        <p style={{ color: 'var(--text-muted)' }}>It may have been deleted, or you don't have access.</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isOwner = doc.owner_id === user.id;
  const shares = await getDocumentShares(id);
  
  // Determine if the current user can edit
  const myShare = shares.find(s => s.user_id === user.id);
  const userRole = isOwner ? 'editor' : (myShare ? myShare.role : 'viewer');
  const canEdit = userRole === 'editor' || isOwner;
  
  const comments = await getDocumentComments(id);

  // Create a bound Server Action for saving to pass to Editor
  const saveContent = async (html: string) => {
    'use server';
    await updateDocumentContent(id, html);
  };

  return (
    <div className="container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/" className="btn btn-secondary" style={{ padding: '6px' }} title="Back">
            <ChevronLeft size={20} />
          </Link>
          {canEdit ? (
             <TitleInput initialTitle={doc.title} documentId={id} />
          ) : (
             <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', padding: '4px 8px' }}>
               {doc.title}
             </h1>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {isOwner ? 'Owner' : `Shared by ${doc.owner_name} (${userRole})`}
            </span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
              {user.name.charAt(0)}
            </div>
          </div>
            <ShareDialog 
              documentId={id} 
              documentTitle={doc.title}
              initialShares={shares} 
              isOwner={isOwner} 
              currentUser={{ id: user.id, name: user.name, email: user.email }}
              owner={{ id: doc.owner_id, name: doc.owner_name || '', email: doc.owner_email || '' }}
            />
          </div>
        </div>

        <Editor 
          documentId={id}
          initialContent={doc.content} 
          onSave={saveContent} 
          userRole={userRole}
          initialComments={comments}
        />
      </div>
    );
  }
