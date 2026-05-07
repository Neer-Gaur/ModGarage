import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // eslint-disable-next-line no-console
      console.log('[ProtectedRoute] No user, redirecting to /');
      navigate('/', { replace: true });
      return;
    }
    if (requireAdmin && user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, requireAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-mg-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/40 font-mono text-xs tracking-widest uppercase">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && user.role !== 'admin') return null;

  return children;
}
