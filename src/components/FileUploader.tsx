'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDocument } from '@/app/actions/document';
import { Upload } from 'lucide-react';
import { marked } from 'marked';

export default function FileUploader() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate type
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setError('Only .txt and .md files are supported');
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();
      let htmlContent = '';
      
      if (file.name.endsWith('.md')) {
        // Parse markdown to HTML
        htmlContent = await marked.parse(text);
      } else {
        // Simple text wrap
        htmlContent = text
          .split('\\n')
          .map(line => `<p>${line}</p>`)
          .join('');
      }

      // Default title without extension
      const title = file.name.replace(/\\.[^/.]+$/, "");
      
      const newDocId = await createDocument(title, htmlContent);
      router.push(`/d/${newDocId}`);
    } catch (err) {
      setError('Failed to process file');
      console.error(err);
      setIsUploading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <label 
        className="btn btn-secondary" 
        style={{ cursor: isUploading ? 'wait' : 'pointer' }}
      >
        <Upload size={16} />
        {isUploading ? 'Processing...' : 'Upload File'}
        <input 
          type="file" 
          accept=".txt,.md" 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
      {error && (
        <div style={{ color: 'var(--danger-color)', fontSize: '12px', marginTop: '4px', position: 'absolute', top: '100%', whiteSpace: 'nowrap' }}>
          {error}
        </div>
      )}
    </div>
  );
}
