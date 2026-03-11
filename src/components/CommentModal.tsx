import React, { useEffect, useState } from 'react';
import { useLockBodyScroll } from '../lib/useLockBodyScroll';
import { toast } from 'sonner';

interface CommentModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: (comment: string) => void | Promise<void>;
}

export const CommentModal: React.FC<CommentModalProps> = ({ open, title, onClose, onSubmit }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep page from scrolling under the comment modal
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) {
      setComment('');
      setIsSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="glass-secondary modal-stone-text border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] md:max-h-none overflow-y-auto hide-scrollbar overscroll-contain touch-pan-y"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold" id="comment-modal-title">{title}</h2>
            <p className="text-sm modal-stone-muted">Share your thoughts about this species.</p>
          </div>
          <button
            type="button"
            className="modal-stone-muted hover:opacity-80 text-2xl"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm modal-stone-muted">Your Comment</label>
            <span className={`text-xs ${comment.length > 500 ? 'text-red-400' : 'modal-stone-soft'}`}>
              {comment.length}/500
            </span>
          </div>
          <textarea
            rows={5}
            placeholder="Share your thoughts and observations..."
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, 500))}
            maxLength={500}
            className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm modal-stone-text placeholder:text-primary focus:outline-none focus:ring-2 focus:ring-white/30"
            autoFocus
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="text-sm modal-stone-muted hover:opacity-80"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-full glass-button px-5 py-2 text-sm font-semibold transition-colors"
            onClick={async () => {
              if (!comment.trim()) {
                toast.error('Please enter a comment.');
                return;
              }
              if (isSubmitting) return;
              setIsSubmitting(true);
              try {
                await onSubmit?.(comment);
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>
    </div>
  );
};
