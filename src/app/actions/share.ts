'use server';

import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

import Brevo from '@getbrevo/brevo';

export type ShareInfo = {
  document_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: 'viewer' | 'commenter' | 'editor';
};

// Gets the users a document is shared with
export async function getDocumentShares(documentId: string): Promise<ShareInfo[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const query = `
    SELECT ds.document_id, ds.user_id, ds.role, u.name as user_name, u.email as user_email
    FROM document_shares ds
    JOIN users u ON ds.user_id = u.id
    WHERE ds.document_id = ?
  `;
  
  const stmt = db.prepare(query);
  return stmt.all(documentId) as ShareInfo[];
}

export async function addShare(documentId: string, email: string, role: string = 'viewer') {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // only owner can share
  const docStmt = db.prepare('SELECT owner_id, title FROM documents WHERE id = ?');
  const doc = docStmt.get(documentId) as { owner_id: string, title: string } | undefined;
  
  if (!doc) return { success: false, error: 'Document not found' };
  if (doc.owner_id !== user.id) return { success: false, error: 'Only owner can share' };

  // Find user by email safely
  const userStmt = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)');
  let targetUser = userStmt.get(email) as { id: string } | undefined;
  
  if (!targetUser) {
    // Auto-create a shadowed mock user for this email so they can log in later
    const newUserId = `user_${Date.now()}`;
    const newUserName = email.split('@')[0]; // Simple name from email prefix
    
    const insertUser = db.prepare('INSERT INTO users (id, name, email) VALUES (?, ?, ?)');
    insertUser.run(newUserId, newUserName, email);
    
    targetUser = { id: newUserId };
  }
  
  if (targetUser.id === user.id) return { success: false, error: 'Cannot share with yourself' };

  // Insert share if not exists, otherwise update role
  const insertStmt = db.prepare(`
    INSERT INTO document_shares (document_id, user_id, role) 
    VALUES (?, ?, ?)
    ON CONFLICT(document_id, user_id) DO UPDATE SET role = excluded.role
  `);
  insertStmt.run(documentId, targetUser.id, role);
  
  try {
    const apiInstance = new Brevo.TransactionalEmailsApi();
    const apiKey = process.env.BREVO_API_KEY || "re_a2gQtUo2_5BbDNxcFFirK1gxvW55Bg44y";
    apiInstance.setApiKey(0, apiKey);

    // Build absolute URL for the link (fallback to localhost in dev)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${baseUrl}/d/${documentId}`;

    await apiInstance.sendTransacEmail({
      sender: { email: "no-reply@ajaia.io" },
      to: [{ email: email }],
      subject: "Someone shared a document with you",
      htmlContent: `<p>Document title: <strong>${doc.title}</strong></p><p>You have been granted <em>${role}</em> access.</p><a href="${link}">Open Document</a>`
    });
    console.log(`[BREVO] Successfully sent sharing invitation to ${email}`);
  } catch (emailError) {
    console.error("[BREVO ERROR] Failed to send email", emailError);
    // non-blocking
  }
  
  revalidatePath(`/d/${documentId}`);
  return { success: true };
}

export async function updateShareRole(documentId: string, userId: string, role: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const docStmt = db.prepare('SELECT owner_id FROM documents WHERE id = ?');
  const doc = docStmt.get(documentId) as { owner_id: string } | undefined;
  
  if (!doc) return { success: false, error: 'Document not found' };
  if (doc.owner_id !== user.id) return { success: false, error: 'Only owner can update roles' };

  const stmt = db.prepare('UPDATE document_shares SET role = ? WHERE document_id = ? AND user_id = ?');
  stmt.run(role, documentId, userId);
  
  revalidatePath(`/d/${documentId}`);
  return { success: true };
}

export async function removeShare(documentId: string, userId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // only owner can remove
  const docStmt = db.prepare('SELECT owner_id FROM documents WHERE id = ?');
  const doc = docStmt.get(documentId) as { owner_id: string } | undefined;
  
  if (!doc) return { success: false, error: 'Document not found' };
  if (doc.owner_id !== user.id) return { success: false, error: 'Only owner can revoke shares' };

  const deleteStmt = db.prepare('DELETE FROM document_shares WHERE document_id = ? AND user_id = ?');
  deleteStmt.run(documentId, userId);
  
  revalidatePath(`/d/${documentId}`);
  return { success: true };
}
