import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      navigate('/', { replace: true });
      return;
    }

    const exchange = async () => {
      try {
        const resp = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );
        const userData = resp.data;
        setUser(userData);

        if (userData.has_cars) {
          navigate('/dashboard', { replace: true, state: { user: userData } });
        } else {
          navigate('/onboarding', { replace: true, state: { user: userData } });
        }
      } catch (err) {
        console.error('Auth exchange failed:', err);
        navigate('/', { replace: true });
      }
    };

    exchange();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-mg-dark flex items-center justify-center" data-testid="auth-callback">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-mg-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 font-mono text-sm tracking-widest uppercase">Authenticating</p>
      </div>
    </div>
  );
}
