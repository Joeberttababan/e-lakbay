import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  full_name: string | null;
  role: string | null;
  created_at: string | null;
  email: string | null;
  img_url: string | null;
  battle_cry: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect';

const fetchProfile = async (userId: string) => {
  const { data, error, status } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    const isNotFound = status === 406 || error.code === 'PGRST116';
    if (isNotFound) return null;
    throw error;
  }
  return data as Profile;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchProfileWithRetry = async (userId: string, attempts = 4) => {
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const data = await fetchProfile(userId);
      if (data) return data;
      await sleep(250 * (i + 1));
    } catch (error) {
      lastError = error;
      await sleep(250 * (i + 1));
    }
  }
  if (lastError) throw lastError;
  return null;
};

const buildProfilePayload = (user: User) => {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    full_name: (metadata.full_name as string | undefined) ?? (metadata.name as string | undefined) ?? null,
    email: user.email ?? null,
    img_url:
      (metadata.avatar_url as string | undefined) ??
      (metadata.picture as string | undefined) ??
      null,
  };
};

const ensureProfile = async (user: User) => {
  const existing = await fetchProfileWithRetry(user.id);
  if (existing) return existing;

  const payload = buildProfilePayload(user);
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) throw error;

  return fetchProfileWithRetry(user.id);
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateSession = useCallback(async () => {
    setLoading(true);
    try {
      const hasSupabaseConfig = Boolean(
        import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      if (!hasSupabaseConfig) {
        setUser(null);
        setProfile(null);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        try {
          const profileData = await ensureProfile(sessionUser);
          setProfile(profileData ?? null);
        } catch (error) {
          console.error('Failed to load profile:', error);
          toast.error('Failed to load your profile.');
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to hydrate session:', error);
      toast.error('Failed to restore your session.');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await hydrateSession();
    };

    initialize();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        try {
          const sessionUser = session?.user ?? null;
          setUser(sessionUser);

          if (sessionUser) {
            try {
              const profileData = await ensureProfile(sessionUser);
              setProfile(profileData ?? null);
            } catch (error) {
              console.error('Failed to load profile:', error);
              toast.error('Failed to load your profile.');
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Failed to handle auth change:', error);
          toast.error('Failed to refresh your session.');
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [hydrateSession]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const profileData = await fetchProfileWithRetry(user.id);
      setProfile(profileData ?? null);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      toast.error('Failed to refresh your profile.');
    }
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      toast.error(error.message);
      return error.message;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, '1');
    }

    toast.success('Welcome back!');
    return null;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, '1');
    }

    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
      }
      toast.error(error.message);
      return error.message;
    }

    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      toast.error(error.message);
      return error.message;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, '1');
    }

    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName.trim() || null,
          email: data.user?.email ?? null,
        });

      if (profileError) {
        toast.error(profileError.message);
        return profileError.message;
      }

      try {
        const profileData = await fetchProfileWithRetry(userId);
        setProfile(profileData ?? null);
      } catch (profileLoadError) {
        console.error('Failed to hydrate profile after signup:', profileLoadError);
        toast.error('Account created, but profile failed to load.');
      }
    }
    toast.success('Account created successfully.');
    return null;
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    }
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully.');
    } catch (error) {
      console.error('Failed to sign out:', error);
      toast.error('Failed to sign out.');
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshProfile,
    }),
    [user, profile, loading, signIn, signInWithGoogle, signUp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
