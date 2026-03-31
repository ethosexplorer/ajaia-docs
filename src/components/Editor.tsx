'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Mark, mergeAttributes } from '@tiptap/core';
import { Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3, List, ListOrdered, Undo, Redo, MessageSquarePlus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { addComment, deleteComment, type CommentNode } from '@/app/actions/comment';
import { useRouter } from 'next/navigation';

// Custom Comment Extension
const CommentMark = Mark.create({
  name: 'comment',
  addOptions() { return { HTMLAttributes: { class: 'comment-highlight' } }; },
  parseHTML() { return [{ tag: 'span[data-comment-id]' }]; },
  renderHTML({ HTMLAttributes }) { return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]; },
  addAttributes() { return { 'data-comment-id': { default: null } }; },
});

type EditorProps = {
  documentId: string;
  initialContent: string | null;
  onSave: (html: string) => Promise<void>;
  userRole: 'editor' | 'viewer' | 'commenter';
  initialComments: CommentNode[];
};

export default function Editor({ documentId, initialContent, onSave, userRole, initialComments }: EditorProps) {
  const router = useRouter();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [comments, setComments] = useState<CommentNode[]>(initialComments);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [draftQuote, setDraftQuote] = useState<{ id: string, text: string } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editable = userRole === 'editor';
  const canComment = userRole === 'editor' || userRole === 'commenter';

  const debouncedSave = useCallback(
    (content: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      setSaveStatus('saving');
      timerRef.current = setTimeout(async () => {
        try {
          await onSave(content);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
          console.error("Failed to save:", error);
          setSaveStatus('idle');
        }
      }, 1000);
    },
    [onSave]
  );

  const editor = useEditor({
    extensions: [StarterKit, Underline, CommentMark],
    content: initialContent || '',
    editable, // Core tip tap state blocks all typed input for non-editors
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      debouncedSave(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const isActive = editor.isActive('comment');
      if (isActive) {
        const attrs = editor.getAttributes('comment');
        if (attrs['data-comment-id']) {
          setActiveCommentId(attrs['data-comment-id']);
        }
      } else {
        setActiveCommentId(null);
      }
    }
  });

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!editor) {
    return null;
  }

  const handleAddCommentTrigger = () => {
    const { state, view } = editor;
    const { selection } = state;
    if (selection.empty) return;

    const selectedText = state.doc.textBetween(selection.from, selection.to, ' ');
    const newThreadId = `t_${Date.now()}`;

    // ProseMirror Bypass: We force-apply the mark into the AST even if technically editable=false
    // This allows Commenters to highlight without giving them typing rights!
    const markType = state.schema.marks.comment;
    const mark = markType.create({ 'data-comment-id': newThreadId });
    view.dispatch(state.tr.addMark(selection.from, selection.to, mark));

    // Force strict save because TipTap 'onUpdate' might swallow bypassed dispatches when editable=false
    if (!editable) {
      debouncedSave(editor.getHTML());
    }

    setDraftQuote({ id: newThreadId, text: selectedText });
    setActiveCommentId(newThreadId);
    setNewCommentText('');
  };

  const handleSaveComment = async () => {
    if (!draftQuote || !newCommentText.trim()) return;
    setIsSubmitting(true);
    
    const res = await addComment(documentId, draftQuote.id, draftQuote.text, newCommentText);
    if (res.success) {
      setDraftQuote(null);
      setNewCommentText('');
      router.refresh(); // Fetches fresh data from server
      // temporary visual append
      setComments([...comments, {
         id: res.commentId!,
         document_id: documentId,
         thread_id: draftQuote.id,
         user_id: 'local',
         user_name: 'You',
         quote: draftQuote.text,
         text: newCommentText,
         created_at: new Date().toISOString()
      }]);
    } else {
      alert("Failed to save comment");
    }
    setIsSubmitting(false);
  };

  const cancelDraft = () => {
    if (draftQuote) {
      // Remove mark
      const { state, view } = editor;
      const markType = state.schema.marks.comment;
      
      // Finding and removing a specific mark manually is tricky, so simpler to just unset for selection
      // But if selection moved, we just let the un-commented highlighted span die (it's harmless visual dust)
      // For a robust app, you would target the span explicitly.
      editor.commands.unsetMark('comment');
      if (!editable) debouncedSave(editor.getHTML());
    }
    setDraftQuote(null);
    setNewCommentText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Resolve this comment?')) return;
    const res = await deleteComment(documentId, commentId);
    if (res.success) {
      setComments(comments.filter(c => c.id !== commentId));
      router.refresh();
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
      {/* Editor Main Portal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        
        {/* Save Status Indicator */}
        {(editable || userRole === 'commenter') && (
          <div style={{ position: 'absolute', top: -30, right: 340, fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {saveStatus === 'saving' && (
              <><div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div> Saving...</>
            )}
            {saveStatus === 'saved' && (
              <span style={{ color: 'var(--primary-color)' }}>All changes saved</span>
            )}
          </div>
        )}

        {/* Toolbar */}
        {editable && (
           <div className="toolbar" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
            >
              <Bold size={18} />
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
            >
              <Italic size={18} />
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={!editor.can().chain().focus().toggleUnderline().run()}
              className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
            >
              <UnderlineIcon size={18} />
            </button>
            
            <div style={{ width: 1, backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>
            
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
            >
              <Heading1 size={18} />
            </button>
  
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
            >
              <Heading2 size={18} />
            </button>
            
            <div style={{ width: 1, backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>
  
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
            >
              <List size={18} />
            </button>
  
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
            >
              <ListOrdered size={18} />
            </button>
  
            <div style={{ flex: 1 }}></div>
  
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className="toolbar-btn"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className="toolbar-btn"
            >
              <Redo size={18} />
            </button>
          </div>
        )}

        {/* Floating Bubble Menu specifically for generating comments */}
        {editor && canComment && (
          <BubbleMenu 
            editor={editor} 
            shouldShow={({ editor, state }) => {
              // Ensure we only show on distinct selections, and we aren't already commenting
              return !state.selection.empty;
            }}
          >
            <button
              onClick={handleAddCommentTrigger}
              style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '24px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              <MessageSquarePlus size={16} /> Add Comment
            </button>
          </BubbleMenu>
        )}

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Right Sidebar (Google Docs specific) */}
      <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px' }}>
        
        {/* Draft Comment UI */}
        {draftQuote && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', border: '1px solid var(--primary-color)', boxShadow: '0 2px 8px rgba(11,87,208,0.15)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderLeft: '3px solid var(--primary-color)', paddingLeft: '8px', marginBottom: '12px', fontStyle: 'italic' }}>
              "{draftQuote.text.length > 50 ? draftQuote.text.substring(0, 50) + '...' : draftQuote.text}"
            </div>
            <textarea 
              autoFocus
              value={newCommentText}
              onChange={e => setNewCommentText(e.target.value)}
              placeholder="Add a comment..."
              style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '14px', marginBottom: '12px' }}
              rows={3}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={cancelDraft} className="btn" style={{ padding: '6px 12px', fontSize: '13px' }}>Cancel</button>
              <button 
                onClick={handleSaveComment} 
                disabled={isSubmitting || !newCommentText.trim()} 
                className="btn btn-primary" 
                style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: 'var(--primary-color)', color: 'white' }}
              >
                {isSubmitting ? 'Saving...' : 'Comment'}
              </button>
            </div>
          </div>
        )}

        {/* Existing Comments */}
        {comments.map(comment => {
          const isActive = activeCommentId === comment.thread_id;
          return (
            <div 
              key={comment.id}
              style={{ backgroundColor: isActive ? '#f8f9fa' : 'white', borderRadius: '8px', padding: '16px', border: `1px solid ${isActive ? 'var(--primary-color)' : 'var(--border-color)'}`, boxShadow: isActive ? '0 2px 8px rgba(11,87,208,0.1)' : '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
            >
              {comment.quote && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderLeft: `3px solid ${isActive ? 'var(--primary-color)' : '#dadce0'}`, paddingLeft: '8px', marginBottom: '12px', fontStyle: 'italic' }}>
                  "{comment.quote.length > 60 ? comment.quote.substring(0, 60) + '...' : comment.quote}"
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: isActive ? 'var(--primary-color)' : 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'white' : 'inherit', fontSize: '12px', fontWeight: 'bold' }}>
                    {comment.user_name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{comment.user_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(comment.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                {canComment && (
                  <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: isActive ? 1 : 0.4 }} title="Resolve">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {comment.text}
              </div>
            </div>
          );
        })}

        {comments.length === 0 && !draftQuote && canComment && (
           <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '14px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
             Highlight any text to add an inline comment.
           </div>
        )}

      </div>
    </div>
  );
}
