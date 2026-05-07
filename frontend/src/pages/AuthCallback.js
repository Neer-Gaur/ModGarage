import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Handles /auth/callback after Google OAuth.
 * Lets AuthContext do the heavy lifting (session detection + profile fetch).
 * We just wait for `user` to populate, then navigate.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading, authError, session } = useAuth();
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  const navigatedRef = useRef(false);

  // Hard timeout — show retry UI if it takes too long
  useEffect(() => {
    const t = setTimeout(() => setWaitedTooLong(true), 25000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (navigatedRef.current) return;
    if (loading) return;

    if (user) {
      navigatedRef.current = true;
      // eslint-disable-next-line no-console
      console.log('[AuthCallback] User loaded, redirecting...', user.has_cars ? '/dashboard' : '/onboarding');
      if (user.has_cars) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } else if (!session && !loading) {
      // No session arrived — auth failed silently. Send back to home.
      navigatedRef.current = true;
      // eslint-disable-next-line no-console
      console.warn('[AuthCallback] No session detected, returning to home');
      navigate('/', { replace: true });
    }
    // If session exists but user is null → /api/auth/me failed; show retry UI
  }, [user, session, loading, navigate]);

  const sessionExistsButProfileMissing = session && !user && !loading;

  if (sessionExistsButProfileMissing || waitedTooLong) {
    return (
      <div className="min-h-screen bg-mg-dark flex items-center justify-center px-6">
        <div className="max-w-md text-center" data-testid="auth-callback-error">
          <div className="text-mg-red text-4xl mb-4">⚠</div>
          <h2 className="font-unbounded text-2xl font-bold text-white mb-3 uppercase tracking-tight">
            Connection Issue
          </h2>
          <p className="text-white/60 font-manrope mb-2">
            {authError || "We couldn't reach our backend after sign-in."}
          </p>
          <p className="text-white/40 font-manrope text-sm mb-6">
            This often happens on the first request after a quiet period (the backend
            is starting up). Please wait 30 seconds, then click retry.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-mg-red hover:bg-red-700 text-white px-6 py-3 font-headline uppercase text-xs tracking-widest transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="border border-white/20 hover:border-white/40 text-white/70 px-6 py-3 font-headline uppercase text-xs tracking-widest transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mg-dark flex items-center justify-center" data-testid="auth-callback">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-mg-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 font-mono text-sm tracking-widest uppercase">
          {session ? 'Loading profile…' : 'Authenticating…'}
        </p>
      </div>
    </div>
  );
}
