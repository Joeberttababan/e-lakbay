import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/modern-ui/button';
import { toast } from 'sonner';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    // Process Supabase recovery token from URL hash
    const processRecoveryToken = async () => {
      try {
        // Supabase automatically processes recovery tokens from the URL hash
        // No need to manually handle it, just check if we have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is authenticated via recovery link
          setHasValidSession(true);
        } else {
          setError('Invalid or expired password change request. Please request a new one.');
          setHasValidSession(false);
        }
      } catch (err) {
        console.error('Recovery token error:', err);
        setError('Failed to process password change request. Please try again.');
        setHasValidSession(false);
      } finally {
        setIsLoading(false);
      }
    };

    processRecoveryToken();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Update the password using the current session
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        toast.error(updateError.message);
        return;
      }

      setIsSuccess(true);
      toast.success('Password reset successfully! You can now log in with your new password.');
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Verifying reset link...</p>
      </main>
    );
  }

  if (!hasValidSession) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center py-6 px-4">
        <div className="glass-secondary rounded-lg sm:rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Request Invalid</h2>
          <p className="text-white/60 mb-6">{error || 'The password change request has expired or is invalid. Please request a new one.'}</p>
          <Button
            className="w-full rounded-full bg-hero-gradient text-white hover:brightness-110 text-base py-3"
            variant="default"
            onClick={() => navigate('/')}
          >
            Back to home
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center py-6 px-4">
      <div className="glass-secondary rounded-lg sm:rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-md">
        {!isSuccess ? (
          <>
            <h1 className="text-2xl sm:text-3xl font-semibold text-center text-white mb-2">
              Reset your password
            </h1>
            <p className="text-sm text-white/60 text-center mb-6">
              Enter your new password below. Make sure it's strong and secure.
            </p>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded px-4 py-3 pr-12 bg-white border border-white/20 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black/90 transition-colors p-1"
                  tabIndex={-1}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded px-4 py-3 pr-12 bg-white border border-white/20 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black/90 transition-colors p-1"
                  tabIndex={-1}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <div className="text-sm text-white bg-red-500/20 border border-red-500/50 rounded px-4 py-3">
                  {error}
                </div>
              )}

              <Button
                className="w-full rounded-full mt-2 bg-hero-gradient text-white hover:brightness-110 text-base py-3"
                variant="default"
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Resetting password...' : 'Reset Password'}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Password reset successful!</h2>
            <p className="text-white/60">Redirecting you to the home page...</p>
          </div>
        )}
      </div>
    </main>
  );
};
