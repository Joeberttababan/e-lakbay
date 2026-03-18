import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { ModalProvider } from './components/ModalContext';
import { GlobalModal } from './components/GlobalModal';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { DestinationsPage } from './pages/DestinationsPage';
import { ProductsPage } from './pages/ProductsPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { EventsPage } from './pages/EventsPage';
import { WildlifePage } from './pages/WildlifePage';
import { TermsAndPrivacyPage } from './pages/TermsAndPrivacyPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TouristProfileDashboard from './pages/TouristProfileDashboard';
import NotFoundPage from './pages/NotFoundPage';
import { SonnerGlobal } from './components/modern-ui/sonner';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import Footer from './sections/footer';
import ComingSoonModal from './components/ui/coming_soon';
import loadingVideo from './assets/Loading_chatbot.webm';
import { useAnalytics } from './lib/useAnalytics';

const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect';

const ProfileRoute: React.FC<{ onBackHome: () => void }> = ({ onBackHome }) => {
  const { profileId } = useParams();

  if (!profileId) {
    return <Navigate to="/" replace />;
  }

  return <ProfilePage profileId={profileId} onBackHome={onBackHome} />;
};

const AdminRoute: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Loading...</p>
      </main>
    );
  }

  if (!user || (profile?.role !== 'developer' && profile?.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  return <AdminPage />;
};

// Route guard for analytics - accessible to all authenticated users
// Analytics route - public access for all visitors
const AnalyticsRoute: React.FC = () => {
  return <AnalyticsPage />;
};

// Route guard for municipality dashboard
const MunicipalityRoute: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Loading...</p>
      </main>
    );
  }

  if (!user || profile?.role !== 'municipality') {
    return <Navigate to="/" replace />;
  }

  return <DashboardPage profile={profile} />;
};

// Route guard for tourist profile dashboard
const TouristRoute: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If user has a specific role that has its own dashboard, redirect there
  if (profile?.role === 'admin' || profile?.role === 'developer') {
    return <Navigate to="/admin" replace />;
  }
  if (profile?.role === 'municipality') {
    return <Navigate to="/dashboard" replace />;
  }

  return <TouristProfileDashboard />;
};

const AppContent: React.FC = () => {
  const [active, setActive] = useState<'login' | 'signup'>('login');
  const { user, profile, loading, signOut } = useAuth();
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
  const scrollAttemptRef = useRef(0);

  // Initialize analytics tracking for real-time visitor analytics
  useAnalytics({ uid: user?.id });

  // Check for recovery token in URL and show password change modal
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hash = window.location.hash;
    if (hash.includes('type=recovery') && hash.includes('access_token')) {
      // Recovery link detected, show password change modal
      setShowPasswordChangeModal(true);
    }
  }, []);

  // Get the dashboard route based on user role
  const getDashboardRoute = useCallback((role: string | null | undefined): string => {
    if (role === 'admin' || role === 'developer') {
      return '/admin';
    }
    if (role === 'municipality') {
      return '/dashboard';
    }
    // Default to tourist profile dashboard
    return '/tourist-dashboard';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loading || !user || !profile) return;

    // Don't redirect if user is on password reset page
    if (location.pathname === '/reset-password') return;

    const shouldRedirect = window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) === '1';
    if (!shouldRedirect) return;

    const targetRoute = getDashboardRoute(profile.role);
    window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);

    if (location.pathname !== targetRoute) {
      navigate(targetRoute, { replace: true });
    }
  }, [loading, user, profile, location.pathname, getDashboardRoute, navigate]);

  // Handle user button click in nav - navigate based on role
  const handleUserDashboardClick = useCallback(() => {
    const targetRoute = getDashboardRoute(profile?.role);
    navigate(targetRoute);
  }, [profile?.role, getDashboardRoute, navigate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (location.pathname !== '/' || !pendingScrollId) return;

    const tryScroll = () => {
      const target = document.getElementById(pendingScrollId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setPendingScrollId(null);
        scrollAttemptRef.current = 0;
        return;
      }

      if (scrollAttemptRef.current < 10) {
        scrollAttemptRef.current += 1;
        window.setTimeout(tryScroll, 120);
      } else {
        setPendingScrollId(null);
        scrollAttemptRef.current = 0;
      }
    };

    window.setTimeout(tryScroll, 0);
  }, [location.pathname, pendingScrollId]);

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;
    const id = location.hash.replace('#', '');
    if (!id) return;
    setPendingScrollId(id);
  }, [location.pathname, location.hash]);

  const handleJumpToSection = (sectionId: string) => {
    const cleanId = sectionId.replace(/^#/, '');
    navigate({ pathname: '/', hash: `#${cleanId}` });
    setPendingScrollId(cleanId);
  };

  const handleViewProfile = (profileId: string) => {
    navigate(`/profile/${profileId}`);
  };

  return (
    <ModalProvider>
      <div className="min-h-screen flex flex-col">
        {location.pathname !== '/reset-password' && (
          <NavBar
            active={active}
            onActiveChange={setActive}
            isAuthenticated={Boolean(user)}
            profile={profile}
            onDashboard={handleUserDashboardClick}
            onLogout={signOut}
            onHome={() => navigate('/')}
            onJumpToSection={handleJumpToSection}
            onNavigateEvents={() => navigate('/events')}
          />
        )}
        <div className="relative">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onViewDestinations={() => navigate('/destinations')}
                  onViewProducts={() => navigate('/products')}
                  onViewProfile={handleViewProfile}
                />
              }
            />
            <Route
              path="/destinations"
              element={
                <DestinationsPage
                  onBackHome={() => navigate('/')}
                  onViewProfile={handleViewProfile}
                />
              }
            />
            <Route
              path="/products"
              element={
                <ProductsPage
                  onBackHome={() => navigate('/')}
                  onViewProfile={handleViewProfile}
                />
              }
            />
            <Route
              path="/events"
              element={
                <EventsPage
                  onBackHome={() => navigate('/')}
                />
              }
            />
            <Route
              path="/wildlife"
              element={
                <WildlifePage
                  onBackHome={() => navigate('/')}
                  onViewProfile={handleViewProfile}
                />
              }
            />
            <Route
              path="/search"
              element={
                <SearchResultsPage
                  onBackHome={() => navigate('/')}
                  onViewProfile={handleViewProfile}
                />
              }
            />
            <Route
              path="/terms-and-privacy"
              element={<TermsAndPrivacyPage />}
            />
            <Route
              path="/reset-password"
              element={<ResetPasswordPage />}
            />
            <Route
              path="/profile/:profileId"
              element={<ProfileRoute onBackHome={() => navigate('/')} />}
            />
            <Route
              path="/dashboard"
              element={<MunicipalityRoute />}
            />
            <Route
              path="/tourist-dashboard"
              element={<TouristRoute />}
            />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/analytics" element={<AnalyticsRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        {location.pathname !== '/dashboard' && location.pathname !== '/admin' && location.pathname !== '/tourist-dashboard' && location.pathname !== '/analytics' && location.pathname !== '/reset-password' && <Footer onOpenComingSoon={() => setIsComingSoonOpen(true)} />}
        <GlobalModal onModeChange={setActive} />
      </div>
      <SonnerGlobal />
      <ScrollToTopButton />
      {isComingSoonOpen && (
        <ComingSoonModal isOpen={isComingSoonOpen} onClose={() => setIsComingSoonOpen(false)} />
      )}
      {showPasswordChangeModal && (
        <ChangePasswordModal isOpen={showPasswordChangeModal} onClose={() => setShowPasswordChangeModal(false)} />
      )}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <video
            src={loadingVideo}
            autoPlay
            loop
            muted
            playsInline
            className="h-40 w-40 sm:h-52 sm:w-52"
          />
        </div>
      )}
    </ModalProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
