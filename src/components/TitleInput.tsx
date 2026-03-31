'use client';

import { useState } from 'react';
import { updateDocumentTitle } from '@/app/actions/document';

export default function TitleInput({ initialTitle, documentId }: { initialTitle: string, documentId: string }) {
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);

  const handleBlur = async () => {
    if (title === initialTitle) return;
    
    setIsSaving(true);
    try {
      await updateDocumentTitle(documentId, title);
    } catch (error) {
      console.error("Failed to update title:", error);
      setTitle(initialTitle);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input 
        type="text" 
        value={title} 
        onChange={e => setTitle(e.target.value)} 
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          border: 'none', 
          backgroundColor: 'transparent',
          color: 'var(--text-main)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          cursor: 'text'
        }} 
        onFocus={e => e.target.style.backgroundColor = 'var(--bg-color)'}
        onBlurCapture={e => e.target.style.backgroundColor = 'transparent'}
      />
      {isSaving && <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
    </div>
  );
}
