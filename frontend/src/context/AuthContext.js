import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import api, { withRetry } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const fetchingRef = useRef(false);

  // Fetch our app profile (with role + has_cars) using the JWT.
  // Retries on transient errors (Render cold start).
  const fetchProfile = useCallback(async () => {
    if (fetchingRef.current) return null;
    fetchingRef.current = true;
    try {
      const resp = await withRetry(() => api.get('/auth/me'), { tries: 4, delayMs: 2000 });
      // eslint-disable-next-line no-console
      console.log('[Auth] Profile loaded:', resp.data?.email);
      setUser(resp.data);
      setAuthError(null);
      return resp.data;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Auth] Failed to fetch profile:', err?.response?.status, err?.message);
      setUser(null);
      setAuthError(err?.response?.data?.detail || err?.message || 'Failed to load profile');
      return null;
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Initial session check + auth state listener
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!mounted) return;
      // eslint-disable-next-line no-console
      console.log('[Auth] Initial session:', s ? `signed in as ${s.user?.email}` : 'no session');
      setSession(s);
      if (s) {
        await fetchProfile();
      }
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return;
      // eslint-disable-next-line no-console
      console.log('[Auth] State change:', event, s ? s.user?.email : '(no session)');
      setSession(s);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (s) await fetchProfile();
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setAuthError(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const loginWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    // eslint-disable-next-line no-console
    console.log('[Auth] Starting Google OAuth, redirectTo:', redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Auth] OAuth init failed:', error);
      setAuthError(error.message);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, session, loading, authError,
        setUser, loginWithGoogle, logout,
        refresh: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
