import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  initializeVisitorSession,
  trackVisitorPageView,
  endVisitorSession,
} from './analytics';

/**
 * Hook for tracking visitor analytics
 * Should be used in your App.tsx or root component
 *
 * Usage:
 * ```tsx
 * function App() {
 *   useAnalytics({ uid: currentUser?.id });
 *   return (...)
 * }
 * ```
 */
export function useAnalytics({ uid }: { uid?: string | null } = {}) {
  const location = useLocation();
  const hasInitialized = useRef(false);
  const unloadListenerAdded = useRef(false);

  // Initialize session on mount (only once)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    initializeVisitorSession(uid);

    // End session on page unload
    const handleBeforeUnload = () => {
      endVisitorSession(uid);
    };

    if (!unloadListenerAdded.current) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      unloadListenerAdded.current = true;
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Empty dependency array - only run once on mount

  // Track page views when location changes
  useEffect(() => {
    trackVisitorPageView(uid);
  }, [location, uid]);
}

/**
 * Hook to get session and visitor information
 * Useful for debugging or displaying user session info
 */
export function useSessionInfo() {
  return {
    getSessionInfo: () => {
      if (typeof window === 'undefined') return null;

      const sessionDataStr = window.sessionStorage.getItem('elakbay-session-tracking');
      const visitorId = window.localStorage.getItem('elakbay-visitor-id');

      if (!sessionDataStr) return null;

      const sessionData = JSON.parse(sessionDataStr);

      return {
        visitorId,
        sessionId: sessionData.sessionId,
        pageViewCount: sessionData.pageViewCount,
        duration: Date.now() - new Date(sessionData.startedAt).getTime(),
        startedAt: sessionData.startedAt,
      };
    },
  };
}
