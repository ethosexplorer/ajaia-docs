'use server';

import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type DocumentRow = {
  id: string;
  title: string;
  content: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  last_edited_by: string | null;
  // added via joins sometimes
  owner_name?: string;
  owner_email?: string;
};

// Gets details of a specific document, enforcing access control
export async function getDocument(id: string): Promise<DocumentRow | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Check if owner or shared
  const query = `
    SELECT d.*, u.name as owner_name, u.email as owner_email 
    FROM documents d
    JOIN users u ON d.owner_id = u.id
    LEFT JOIN document_shares ds ON ds.document_id = d.id AND ds.user_id = ?
    WHERE d.id = ? AND (d.owner_id = ? OR ds.user_id IS NOT NULL)
  `;
  
  const stmt = db.prepare(query);
  const doc = stmt.get(user.id, id, user.id) as DocumentRow | undefined;
  
  return doc || null;
}

export async function getMyDocuments(): Promise<DocumentRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const stmt = db.prepare('SELECT * FROM documents WHERE owner_id = ? ORDER BY updated_at DESC');
  return stmt.all(user.id) as DocumentRow[];
}

export async function getSharedDocuments(): Promise<DocumentRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const query = `
    SELECT d.*, u.name as owner_name
    FROM documents d
    JOIN document_shares ds ON d.id = ds.document_id
    JOIN users u ON d.owner_id = u.id
    WHERE ds.user_id = ?
    ORDER BY d.updated_at DESC
  `;
  const stmt = db.prepare(query);
  return stmt.all(user.id) as DocumentRow[];
}

export async function createDocument(initialTitle: string = 'Untitled Document', initialContent: string = ''): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO documents (id, title, content, owner_id, last_edited_by) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, initialTitle, initialContent, user.id, user.id);
  
  revalidatePath('/');
  return id;
}

export async function updateDocumentTitle(id: string, title: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  
  // ensure access
  const doc = await getDocument(id);
  if (!doc) throw new Error("Document not found or access denied");

  const stmt = db.prepare('UPDATE documents SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(title, id);
  
  revalidatePath(`/d/${id}`);
}

export async function updateDocumentContent(id: string, content: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  
  // ensure access
  const doc = await getDocument(id);
  if (!doc) throw new Error("Document not found or access denied");

  const stmt = db.prepare('UPDATE documents SET content = ?, last_edited_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(content, user.id, id);
  
  revalidatePath(`/d/${id}`);
}
