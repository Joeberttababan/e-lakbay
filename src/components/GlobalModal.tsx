import React, { useEffect, useMemo, useState } from 'react';
import { useLockBodyScroll } from '../lib/useLockBodyScroll';
import { useModal } from './ModalContext';
import { Button } from './modern-ui/button';
import { useAuth } from './AuthProvider';
import {
  type AuthFormState,
  type AuthMode,
  validateAuthForm,
  validatePasswordStrength,
} from '../lib/utils';

interface GlobalModalProps {
  onModeChange?: (mode: AuthMode) => void;
}

const initialFormState: AuthFormState = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  remember: false,
  nationality: '',
  contactNumber: '',
  gender: '',
};

export const GlobalModal: React.FC<GlobalModalProps> = ({ onModeChange }) => {
  const { open, type, closeModal, openModal } = useModal();

  // prevent background from scrolling when auth modal is visible
  useLockBodyScroll(open);
  const { signIn, signInWithGoogle, signUp } = useAuth();
  const [formState, setFormState] = useState<AuthFormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  useEffect(() => {
    setFormState(initialFormState);
    setFormError(null);
    setIsSubmitting(false);
  }, [type]);

  const isSignup = type === 'signup';

  const primaryLabel = useMemo(() => (isSignup ? 'Create Account' : 'Log In'), [isSignup]);
  const switchLabel = useMemo(
    () => (isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"),
    [isSignup]
  );

  const handleChange = (key: keyof AuthFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = key === 'remember' ? event.target.checked : event.target.value;
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!type) return;
    if (isSubmitting) return;

    const validationError = validateAuthForm(type, formState);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const errorMessage = isSignup
        ? await signUp(
            formState.email,
            formState.password,
            formState.fullName,
            formState.nationality,
            formState.contactNumber,
            formState.gender
          )
        : await signIn(formState.email, formState.password);

      if (errorMessage) {
        setFormError(errorMessage);
        return;
      }

      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/50 px-4 overflow-y-auto ${
        isKeyboardOpen ? 'items-start py-3' : 'items-center py-6'
      }`}
      onClick={closeModal}
      role="presentation"
    >
      <div
        className="glass-secondary modal-stone-text rounded-lg sm:rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-md relative max-h-[85vh] md:max-h-none overflow-y-auto hide-scrollbar"
        style={isKeyboardOpen ? { marginTop: '0.5rem' } : undefined}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          className="absolute top-2 right-2 sm:top-3 sm:right-3 text-black hover:opacity-80 text-xl sm:text-2xl font-bold"
          onClick={closeModal}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2 text-center text-black" id="auth-modal-title">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-xs sm:text-sm text-black/60 mb-4 sm:mb-6 text-center">
          {isSignup ? 'Start planning your next journey in minutes.' : 'Sign in to continue exploring.'}
        </p>
        <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
          {!isSignup && (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full bg-hero-gradient text-black hover:brightness-110 border-0 text-sm sm:text-base py-2 sm:py-3"
              onClick={async () => {
                if (isSubmitting) return;
                setFormError(null);
                setIsSubmitting(true);
                try {
                  const errorMessage = await signInWithGoogle();
                  if (errorMessage) {
                    setFormError(errorMessage);
                  }
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
                  setFormError(message);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              loading={isSubmitting}
            >
              Continue with Google
            </Button>
          )}
          {!isSignup && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-black/40">
              <span className="h-px flex-1 bg-black/20" />
              OR
              <span className="h-px flex-1 bg-black/20" />
            </div>
          )}
          {isSignup && (
            <input
              type="text"
              placeholder="Full name"
              value={formState.fullName}
              onChange={handleChange('fullName')}
              className="rounded px-3 sm:px-4 py-2 bg-white border border-white/20 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}
          {isSignup && (
            <input
              type="text"
              placeholder="Nationality"
              value={formState.nationality || ''}
              onChange={handleChange('nationality')}
              className="rounded px-3 sm:px-4 py-2 bg-white border border-white/20 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}
          {isSignup && (
            <input
              type="tel"
              placeholder="Contact number"
              value={formState.contactNumber || ''}
              onChange={handleChange('contactNumber')}
              className="rounded px-3 sm:px-4 py-2 bg-white border border-white/20 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}
          {isSignup && (
            <select
              value={formState.gender || ''}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, gender: event.target.value }));
              }}
              className="rounded px-3 sm:px-4 py-2 bg-white border border-white/20 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          )}
          <input
            type="email"
            placeholder="Email address"
            value={formState.email}
            onChange={handleChange('email')}
            className="rounded px-3 sm:px-4 py-2 bg-white border border-white/20 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formState.password}
              onChange={handleChange('password')}
              className="w-full rounded px-3 sm:px-4 py-2 pr-9 sm:pr-10 bg-white border border-white/20 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black/90 transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {isSignup && formState.password && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black/70">Password Requirements:</label>
              {(() => {
                const validation = validatePasswordStrength(formState.password);
                return (
                  <div className="space-y-1">
                    <div className={`text-xs flex items-center gap-2 ${formState.password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{formState.password.length >= 8 ? '✓' : '✗'}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${/[a-z]/.test(formState.password) ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{/[a-z]/.test(formState.password) ? '✓' : '✗'}</span>
                      <span>Lowercase letters (a-z)</span>
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${/[A-Z]/.test(formState.password) ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{/[A-Z]/.test(formState.password) ? '✓' : '✗'}</span>
                      <span>Uppercase letters (A-Z)</span>
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${/[0-9]/.test(formState.password) ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{/[0-9]/.test(formState.password) ? '✓' : '✗'}</span>
                      <span>Numbers (0-9)</span>
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formState.password) ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formState.password) ? '✓' : '✗'}</span>
                      <span>Special character (!@#$%^&*...)</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          {isSignup && (
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={formState.confirmPassword}
                onChange={handleChange('confirmPassword')}
                className="w-full rounded px-3 sm:px-4 py-2 pr-9 sm:pr-10 bg-white border border-white/20 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black/90 transition-colors p-1"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          )}
          {!isSignup && (
            <label className="flex items-center gap-2 text-xs sm:text-sm text-black/60">
              <input
                type="checkbox"
                checked={formState.remember}
                onChange={handleChange('remember')}
                className="h-4 w-4 rounded border-black/40 bg-black/5 cursor-pointer"
              />
              Remember me
            </label>
          )}
          {formError && (
            <div className="text-xs sm:text-sm text-black bg-red-50 border border-red-200 rounded px-3 py-2">
              {formError}
            </div>
          )}
          <Button
            className="w-full rounded-full mt-1 sm:mt-2 bg-hero-gradient text-white hover:brightness-110 text-sm sm:text-base py-2 sm:py-3"
            variant="default"
            type="submit"
            loading={isSubmitting}
          >
            {isSubmitting ? 'Please wait...' : primaryLabel}
          </Button>
        </form>
        <div className="mt-4 sm:mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              const nextMode = isSignup ? 'login' : 'signup';
              onModeChange?.(nextMode);
              openModal(nextMode);
            }}
            className="text-xs sm:text-sm text-black/70 hover:text-black transition-colors"
          >
            {switchLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
