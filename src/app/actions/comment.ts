'use server';

import { cookies } from 'next/headers';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export type CommentNode = {
  id: string;
  document_id: string;
  thread_id: string;
  user_id: string;
  user_name: string;
  quote: string | null;
  text: string;
  created_at: string;
};

export async function getDocumentComments(documentId: string): Promise<CommentNode[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  // ensure access
  const docStmt = db.prepare('SELECT owner_id FROM documents WHERE id = ?');
  const doc = docStmt.get(documentId) as { owner_id: string } | undefined;
  
  if (!doc) return [];
  
  const query = `
    SELECT * FROM document_comments 
    WHERE document_id = ?
    ORDER BY created_at ASC
  `;
  
  const stmt = db.prepare(query);
  return stmt.all(documentId) as CommentNode[];
}

export async function addComment(documentId: string, threadId: string, quote: string | null, text: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  if (!text || text.trim() === '') return { success: false, error: 'Empty comment' };

  const id = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  const insertStmt = db.prepare(`
    INSERT INTO document_comments (id, document_id, thread_id, user_id, user_name, quote, text) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertStmt.run(id, documentId, threadId, user.id, user.name, quote || null, text);
  
  revalidatePath(`/d/${documentId}`);
  return { success: true, commentId: id };
}

export async function deleteComment(documentId: string, commentId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Only the author or document owner can delete a comment
  const docStmt = db.prepare('SELECT owner_id FROM documents WHERE id = ?');
  const doc = docStmt.get(documentId) as { owner_id: string };

  const commentStmt = db.prepare('SELECT user_id FROM document_comments WHERE id = ?');
  const comment = commentStmt.get(commentId) as { user_id: string };

  if (comment.user_id !== user.id && doc.owner_id !== user.id) {
    return { success: false, error: 'Permission denied' };
  }

  const del = db.prepare('DELETE FROM document_comments WHERE id = ?');
  del.run(commentId);

  revalidatePath(`/d/${documentId}`);
  return { success: true };
}
