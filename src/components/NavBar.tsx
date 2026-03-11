import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './modern-ui/button';
import { cn } from '../lib/utils';
import { useModal } from './ModalContext';
import logoWhite from '../assets/e-lakbay_logo(white).svg';
import logoBlack from '../assets/E-lakbay_Logo.svg';
import type { Profile } from './AuthProvider';

interface NavBarProps {
  active: 'login' | 'signup';
  onActiveChange: (active: 'login' | 'signup') => void;
  isAuthenticated: boolean;
  profile: Profile | null;
  onLogout: () => void;
  onDashboard: () => void;
  onHome: () => void;
  onJumpToSection: (sectionId: string) => void;
  onNavigateEvents?: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  active,
  onActiveChange,
  isAuthenticated,
  profile,
  onLogout,
  onDashboard,
  onHome,
  onJumpToSection,
  onNavigateEvents,
}) => {
  const { openModal } = useModal();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu on scroll or click outside
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleScroll = () => {
      setIsMenuOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const displayName = useMemo(() => {
    return profile?.full_name || profile?.email || 'User';
  }, [profile]);

  const handleAuthClick = (mode: 'login' | 'signup') => {
    onActiveChange(mode);
    openModal(mode);
    setIsMenuOpen(false);
  };

  const handleSectionJump = (sectionId: string) => {
    setIsMenuOpen(false);
    onJumpToSection(sectionId);
  };

  const activeHash = location.hash.replace('#', '');
  const isHome = location.pathname === '/';
  const isDestinationsActive = location.pathname === '/destinations' || (isHome && activeHash === 'top-destinations');
  const isProductsActive = location.pathname === '/products' || (isHome && activeHash === 'products');
  const isMunicipalitiesActive = isHome && activeHash === 'municipalities';
  const isWildlifeActive = location.pathname === '/wildlife' || (isHome && activeHash === 'wildlife-conservation');
  const activeLinkClass = isHome ? 'font-semibold underline underline-offset-4 text-white' : 'font-semibold underline underline-offset-4 text-black';
  const navTextClass = isHome ? 'text-white' : 'text-black';

  return (
    <nav className="absolute top-0 left-0 z-[60] w-full flex items-center justify-between px-4 py-1 md:px-8 md:py-4">
      {/* Logo */}
      <button type="button" className="select-none" onClick={onHome} aria-label="Go to homepage">
        <img 
          src={isHome ? logoWhite : logoBlack} 
          alt="E-Lakbay" 
          className="h-7 md:h-14 w-auto opacity-90"
        />
      </button>
      {/* Navigation Items */}
      <div className="hidden md:flex items-center gap-6">
        <button
          type="button"
          onClick={() => handleSectionJump('top-destinations')}
          className={cn(`cursor-pointer transition-colors ${navTextClass}`, isHome ? 'hover:text-white/70' : 'hover:text-black/70', isDestinationsActive && activeLinkClass)}
        >
          Destinations
        </button>
        <button
          type="button"
          onClick={() => handleSectionJump('municipalities')}
          className={cn(`cursor-pointer transition-colors ${navTextClass}`, isHome ? 'hover:text-white/70' : 'hover:text-black/70', isMunicipalitiesActive && activeLinkClass)}
        >
          Municipalities
        </button>
        <button
          type="button"
          onClick={() => handleSectionJump('products')}
          className={cn(`cursor-pointer transition-colors ${navTextClass}`, isHome ? 'hover:text-white/70' : 'hover:text-black/70', isProductsActive && activeLinkClass)}
        >
          Products
        </button>
        <button
          type="button"
          onClick={() => onNavigateEvents?.()}
          className={cn(`cursor-pointer transition-colors ${navTextClass}`, isHome ? 'hover:text-white/70' : 'hover:text-black/70')}
        >
          Events
        </button>
        <button
          type="button"
          onClick={() => navigate('/wildlife')}
          className={cn(`cursor-pointer transition-colors ${navTextClass}`, isHome ? 'hover:text-white/70' : 'hover:text-black/70', isWildlifeActive && activeLinkClass)}
        >
          Wildlife Conservation
        </button>
        <button
          type="button"
          onClick={() => {
            navigate('/analytics');
            setIsMenuOpen(false);
          }}
          className={cn(`cursor-pointer transition-colors ${navTextClass}`, isHome ? 'hover:text-white/70' : 'hover:text-black/70')}
          aria-label="View visitor analytics"
        >
          Visitors
        </button>
        {!isAuthenticated ? (
          <>
            <Button
              variant={active === 'login' ? 'default' : 'outline'}
              className={cn('text-black rounded-full px-5 py-2 font-medium transition-colors', active === 'login' ? 'shadow-md' : '')}
              onClick={() => handleAuthClick('login')}
            >
              Log In
            </Button>
            <Button
              variant={active === 'signup' ? 'default' : 'outline'}
              className={cn('text-black rounded-full px-5 py-2 font-medium transition-colors', active === 'signup' ? 'shadow-md' : '')}
              onClick={() => handleAuthClick('signup')}
            >
              Sign Up
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onDashboard}
              className="px-4 py-2 rounded-full glass-button text-sm font-semibold transition-colors"
              aria-label="Open dashboard"
            >
              {displayName}
            </button>
            <Button
              variant="outline"
              className="rounded-full px-5 py-2 font-medium transition-colors text-black"
              onClick={() => setIsLogoutOpen(true)}
            >
              Log Out
            </Button>
          </div>
        )}
      </div>

      <button
        ref={menuButtonRef}
        type="button"
        className={cn('md:hidden inline-flex items-center justify-center rounded-full p-2 transition-colors', isHome ? 'text-white hover:text-white/70 hover:bg-white/10' : 'text-black/90 hover:text-black hover:bg-black/10')}
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <div
        ref={mobileMenuRef}
        className={cn(
          'md:hidden absolute left-4 right-4 mt-52 rounded-2xl glass-secondary border border-white/20 overflow-hidden transition-all',
          isMenuOpen ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'
        )}
      >
        <div className={cn("relative flex flex-col gap-2 px-4 py-4", isHome ? 'text-white' : 'text-black')}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className={cn("absolute right-3 top-3 inline-flex items-center justify-center rounded-full p-2 transition-colors", isHome ? 'text-white hover:text-white/70 hover:bg-white/10' : 'text-black/90 hover:text-black hover:bg-black/10')}
            aria-label="Close navigation menu"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleSectionJump('top-destinations')}
            className={cn(
              'text-left text-sm font-medium tracking-wide transition-colors',
              isHome ? 'hover:text-white/70' : 'hover:text-black/70',
              isDestinationsActive && (isHome ? 'text-white font-semibold' : 'text-black font-semibold')
            )}
          >
            Destinations
          </button>
          <button
            type="button"
            onClick={() => handleSectionJump('products')}
            className={cn(
              'text-left text-sm font-medium tracking-wide transition-colors',
              isHome ? 'hover:text-white/70' : 'hover:text-black/70',
              isProductsActive && (isHome ? 'text-white font-semibold' : 'text-black font-semibold')
            )}
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => handleSectionJump('municipalities')}
            className={cn(
              'text-left text-sm font-medium tracking-wide transition-colors',
              isHome ? 'hover:text-white/70' : 'hover:text-black/70',
              isMunicipalitiesActive && (isHome ? 'text-white font-semibold' : 'text-black font-semibold')
            )}
          >
            Municipalities
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigateEvents?.();
              setIsMenuOpen(false);
            }}
            className={cn('text-left text-sm font-medium tracking-wide transition-colors', isHome ? 'hover:text-white/70' : 'hover:text-black/70')}
          >
            Events
          </button>
          <button
            type="button"
            onClick={() => {
              navigate('/wildlife');
              setIsMenuOpen(false);
            }}
            className={cn('text-left text-sm font-medium tracking-wide transition-colors', isHome ? 'hover:text-white/70' : 'hover:text-black/70', isWildlifeActive && (isHome ? 'text-white font-semibold' : 'text-black font-semibold'))}
          >
            Wildlife Conservation
          </button>
          <button
            type="button"
            onClick={() => {
              navigate('/analytics');
              setIsMenuOpen(false);
            }}
            className={cn('text-left text-sm font-medium tracking-wide transition-colors', isHome ? 'hover:text-white/70' : 'hover:text-black/70')}
            aria-label="View visitor analytics"
          >
            Visitors
          </button>
          {!isAuthenticated ? (
            <>
              <Button
                variant={active === 'login' ? 'default' : 'outline'}
                className={cn('rounded-full px-4 py-2 text-sm font-medium transition-colors', active === 'login' ? 'shadow-md' : '')}
                onClick={() => handleAuthClick('login')}
              >
                Log In
              </Button>
              <Button
                variant={active === 'signup' ? 'default' : 'outline'}
                className={cn('rounded-full px-4 py-2 text-sm font-medium transition-colors', active === 'signup' ? 'shadow-md' : '')}
                onClick={() => handleAuthClick('signup')}
              >
                Sign Up
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onDashboard();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 text-sm font-medium"
              >
                <span className="font-semibold">{displayName}</span>
              </button>
              <Button
                variant="outline"
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors text-black"
                onClick={() => {
                  setIsLogoutOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                Log Out
              </Button>
            </>
          )}
        </div>
      </div>

      {isLogoutOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
          role="presentation"
          onClick={() => setIsLogoutOpen(false)}
        >
          <div
            className="glass-secondary rounded-2xl p-6 w-full max-w-sm text-black max-h-[85vh] md:max-h-none overflow-y-auto hide-scrollbar"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold" id="logout-title">
              Log out of your account?
            </h3>
            <p className="text-sm text-black/80 mt-2">
              You can log back in anytime.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="text-sm text-black/80 hover:text-white"
                onClick={() => setIsLogoutOpen(false)}
              >
                Cancel
              </button>
              <Button
                variant="default"
                className="rounded-full px-4 py-2 text-sm font-medium"
                onClick={() => {
                  setIsLogoutOpen(false);
                  onLogout();
                }}
              >
                Yes, log out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
