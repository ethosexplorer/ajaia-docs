'use client';

import { useState, useEffect } from 'react';
import { Share2, X, Link as LinkIcon, Lock, Users, HelpCircle, Settings } from 'lucide-react';
import { addShare, removeShare, updateShareRole } from '@/app/actions/share';
import type { ShareInfo } from '@/app/actions/share';

type UserData = { id: string, name: string, email: string };

export default function ShareDialog({ 
  documentId, 
  documentTitle,
  initialShares, 
  isOwner,
  currentUser,
  owner
}: { 
  documentId: string;
  documentTitle: string;
  initialShares: ShareInfo[];
  isOwner: boolean;
  currentUser: UserData;
  owner: UserData;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local state for optimistic UI updates
  const [shares, setShares] = useState(initialShares);
  const [showToast, setShowToast] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsAdding(true);
    setError(null);

    const result = await addShare(documentId, email, role);
    
    if (result.success) {
      // Optimistically add to UI without reload
      // We don't have the exact name/ID of the user, so just reloading is safer
      // but to show "Access updated" toast perfectly, let's fake it or reload with query param
      setEmail('');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      // refresh data nicely using router or just reload
      window.location.reload(); 
    } else {
      setError(result.error || 'Failed to share');
    }

    setIsAdding(false);
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const result = await updateShareRole(documentId, userId, newRole);
    if (result.success) {
      setShares(shares.map(s => s.user_id === userId ? { ...s, role: newRole as any } : s));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      alert(result.error || 'Failed to update access');
    }
  };

  const handleRevoke = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke access?')) return;
    
    const result = await removeShare(documentId, userId);
    if (result.success) {
      setShares(shares.filter(s => s.user_id !== userId));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      alert(result.error || 'Failed to revoke access');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)} style={{ borderRadius: '20px', padding: '10px 24px', backgroundColor: '#c2e7ff', color: '#001d35' }}>
        <Lock size={16} fill="#001d35" color="#001d35" /> Share
      </button>

      {/* Access Updated Toast */}
      {showToast && (
        <div style={{ position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#323232', color: 'white', padding: '12px 24px', borderRadius: '4px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          <Users size={16} /> Access updated
        </div>
      )}

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '0', borderRadius: '8px', overflow: 'hidden', maxWidth: '500px', width: '100%', boxSizing: 'border-box' }}>
            
            <div style={{ padding: '24px 24px 12px 24px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 400, color: '#1f1f1f', margin: 0, paddingRight: '16px' }}>Share "{documentTitle}"</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ padding: '4px', borderRadius: '50%', color: '#444746', cursor: 'pointer', background: 'none', border: 'none' }}>
                    <HelpCircle size={20} />
                  </button>
                  <button style={{ padding: '4px', borderRadius: '50%', color: '#444746', cursor: 'pointer', background: 'none', border: 'none' }}>
                    <Settings size={20} />
                  </button>
                </div>
              </div>

              {/* Add People Input */}
              {isOwner ? (
                <form onSubmit={handleShare} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  <div style={{ position: 'relative' }}>
                    {!email ? (
                      <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Add people, groups, spaces, and calendar events" 
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #747775', backgroundColor: 'transparent', fontSize: '14px', fontFamily: 'inherit', color: '#1f1f1f', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', border: '1px solid #747775', borderRadius: '4px', padding: '8px' }}>
                        <input 
                          type="email" 
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="Email" 
                          style={{ flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '14px', fontFamily: 'inherit', color: '#1f1f1f' }}
                          autoFocus
                        />
                        <select 
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '0 8px', color: '#444746', fontSize: '14px' }}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="commenter">Commenter</option>
                          <option value="editor">Editor</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {email && (
                    <>
                      <div style={{ border: '1px solid #c7c7c7', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '8px 16px', borderBottom: '1px solid #c7c7c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="checkbox" defaultChecked id="notify" style={{ cursor: 'pointer' }}/> 
                          <label htmlFor="notify" style={{ fontSize: '14px', color: '#1f1f1f', cursor: 'pointer', margin: 0 }}>Notify people</label>
                        </div>
                        <textarea 
                          rows={3} 
                          placeholder="Message" 
                          style={{ width: '100%', border: 'none', resize: 'none', padding: '16px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                        <button type="button" onClick={() => setEmail('')} className="btn" style={{ color: '#0b57d0', padding: '8px 16px', borderRadius: '20px', backgroundColor: 'transparent' }}>Cancel</button>
                        <button type="submit" disabled={isAdding} className="btn btn-primary" style={{ backgroundColor: '#0b57d0', borderRadius: '20px', padding: '8px 24px', color: 'white' }}>
                          {isAdding ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </>
                  )}

                  {error && <div style={{ color: 'var(--danger-color)', fontSize: '14px', marginTop: '4px' }}>{error}</div>}
                </form>
              ) : (
                <p style={{ color: '#444746', fontSize: '14px', marginBottom: '24px' }}>
                  Only the owner can manage sharing settings.
                </p>
              )}

              {/* People with access list */}
              {!email && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#444746', marginBottom: '16px', margin: 0 }}>People with access</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Owner Row */}
                    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <img src={"https://api.dicebear.com/7.x/initials/svg?seed=" + owner.name + "&backgroundColor=0b57d0"} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 500, fontSize: '14px', color: '#1f1f1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {owner.name} {isOwner ? '(you)' : ''}
                          </div>
                          <div style={{ color: '#444746', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{owner.email}</div>
                        </div>
                      </div>
                      <div style={{ color: '#444746', fontSize: '14px', paddingLeft: '8px' }}>Owner</div>
                    </li>

                    {/* Shared Users */}
                    {shares.map(share => (
                      <li key={share.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <img src={"https://api.dicebear.com/7.x/initials/svg?seed=" + share.user_name + "&backgroundColor=4285f4"} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 500, fontSize: '14px', color: '#1f1f1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {share.user_name} {currentUser.id === share.user_id ? '(you)' : ''}
                            </div>
                            <div style={{ color: '#444746', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{share.user_email}</div>
                          </div>
                        </div>
                        
                        {isOwner ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
                            <select 
                              value={share.role}
                              onChange={(e) => {
                                if (e.target.value === 'remove') {
                                  handleRevoke(share.user_id);
                                } else {
                                  handleUpdateRole(share.user_id, e.target.value);
                                }
                              }}
                              style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#444746', fontSize: '14px', appearance: 'none' }}
                            >
                              <option value="viewer">Viewer</option>
                              <option value="commenter">Commenter</option>
                              <option value="editor">Editor</option>
                              <option value="remove" style={{ color: 'red' }}>Remove access</option>
                            </select>
                            <span style={{ fontSize: '10px' }}>▼</span>
                          </div>
                        ) : (
                          <span style={{ color: '#444746', fontSize: '14px', paddingLeft: '8px' }}>{share.role.charAt(0).toUpperCase() + share.role.slice(1)}</span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* General access box */}
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#444746', marginBottom: '8px', margin: 0 }}>General access</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f1f3f4', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444746' }}>
                        <Lock size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <span style={{ fontWeight: 500, fontSize: '14px', color: '#1f1f1f' }}>Restricted</span>
                          <span style={{ fontSize: '10px', marginLeft: '4px', color: '#444746' }}>▼</span>
                        </div>
                        <div style={{ color: '#444746', fontSize: '12px' }}>Only people with access can open with the link</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with copy link */}
            {!email && (
              <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={copyLink} style={{ color: '#0b57d0', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #747775', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 500 }}>
                  <LinkIcon size={16} /> Copy link
                </button>
                <button onClick={() => setIsOpen(false)} style={{ backgroundColor: '#0b57d0', color: 'white', borderRadius: '20px', padding: '10px 24px', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>
                  Done
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}
    </>
  );
}
