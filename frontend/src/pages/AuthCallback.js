import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';

export default function AuthCallback() {
  const ranRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const finishAuth = async () => {
      // Supabase JS auto-handles ?code= or #access_token= via detectSessionInUrl,
      // but we still wait briefly for it to settle.
      let session = null;
      for (let i = 0; i < 20; i++) {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s) { session = s; break; }
        await new Promise(r => setTimeout(r, 100));
      }
      if (!session) {
        navigate('/', { replace: true });
        return;
      }
      try {
        const resp = await api.get('/auth/me');
        const userData = resp.data;
        if (userData.has_cars) {
          navigate('/dashboard', { replace: true, state: { user: userData } });
        } else {
          navigate('/onboarding', { replace: true, state: { user: userData } });
        }
      } catch (err) {
        console.error('Auth /me failed:', err);
        navigate('/', { replace: true });
      }
    };

    finishAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-mg-dark flex items-center justify-center" data-testid="auth-callback">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-mg-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 font-mono text-sm tracking-widest uppercase">Authenticating</p>
      </div>
    </div>
  );
}
