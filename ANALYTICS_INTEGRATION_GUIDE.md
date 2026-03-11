// Example App.tsx integration for real-time analytics

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useAnalytics } from './lib/useAnalytics';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

const queryClient = new QueryClient();

// Wrapper component to use the analytics hook
function AppWithAnalytics() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Initialize analytics tracking for the current user
  useAnalytics({ uid: user?.id });

  return (
    <Router>
      <Routes>
        {/* Your routes here */}
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithAnalytics />
    </QueryClientProvider>
  );
}
