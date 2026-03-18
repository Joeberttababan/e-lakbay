import React, { useEffect, useState } from 'react';
import { useLockBodyScroll } from '../lib/useLockBodyScroll';
import { Button } from './modern-ui/button';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Prevent background from scrolling when modal is visible
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setIsSubmitting(false);
      setIsSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboardState = () => {
      const heightDiff = window.innerHeight - viewport.height;
      setIsKeyboardOpen(heightDiff > 140);
    };

    updateKeyboardState();
    viewport.addEventListener('resize', updateKeyboardState);
    viewport.addEventListener('scroll', updateKeyboardState);
    return () => {
      viewport.removeEventListener('resize', updateKeyboardState);
      viewport.removeEventListener('scroll', updateKeyboardState);
    };
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Import supabase directly to call resetPasswordForEmail
      const { supabase } = await import('../lib/supabaseClient');
      
      const redirectUrl = `${window.location.origin}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: redirectUrl,
        }
      );

      if (resetError) {
        setError(resetError.message);
        toast.error(resetError.message);
        return;
      }

      setIsSuccess(true);
      toast.success('Password reset email has been sent! Please check your inbox.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setError(null);
      setIsSuccess(false);
      onClose();
    }
  };

  const handleBackToLogin = () => {
    setEmail('');
    setError(null);
    setIsSuccess(false);
    onBackToLogin();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/50 px-4 overflow-y-auto ${
        isKeyboardOpen ? 'items-start py-3' : 'items-center py-6'
      }`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="glass-secondary modal-stone-text rounded-lg sm:rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-md relative max-h-[85vh] md:max-h-none overflow-y-auto hide-scrollbar"
        style={isKeyboardOpen ? { marginTop: '0.5rem' } : undefined}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-modal-title"
      >
        <button
          className="absolute top-2 right-2 sm:top-3 sm:right-3 text-black hover:opacity-80 text-xl sm:text-2xl font-bold"
          onClick={handleClose}
          aria-label="Close"
          disabled={isSubmitting}
        >
          ×
        </button>

        {!isSuccess ? (
          <>
            <h2 className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2 text-center text-black" id="forgot-password-modal-title">
              Reset your password
            </h2>
            <p className="text-xs sm:text-sm text-black/60 mb-4 sm:mb-6 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded px-3 sm:px-4 py-2 bg-white border border-white/20 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              />

              {error && (
                <div className="text-xs sm:text-sm text-black bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                className="w-full rounded-full mt-1 sm:mt-2 bg-hero-gradient text-white hover:brightness-110 text-sm sm:text-base py-2 sm:py-3"
                variant="default"
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Email'}
              </Button>
            </form>

            <div className="mt-4 sm:mt-5 text-center">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-xs sm:text-sm text-black/70 hover:text-black transition-colors"
                disabled={isSubmitting}
              >
                Back to log in
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">Check your email</h3>
              <p className="text-xs sm:text-sm text-black/60 mb-4">
                We've sent a password change link to <span className="font-semibold">{email}</span>
              </p>
              <p className="text-xs sm:text-sm text-black/50 mb-6">
                Please check your inbox (and spam folder) for the email. The link will expire in 24 hours.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3">
              <Button
                className="w-full rounded-full bg-hero-gradient text-white hover:brightness-110 text-sm sm:text-base py-2 sm:py-3"
                variant="default"
                onClick={handleBackToLogin}
              >
                Back to log in
              </Button>
              <button
                type="button"
                onClick={() => {
                  setEmail('');
                  setIsSuccess(false);
                }}
                className="w-full rounded-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium text-black/70 hover:text-black border border-black/20 transition-colors"
              >
                Try another email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
