import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stateUser = location.state?.user;
  const activeUser = stateUser || user;

  useEffect(() => {
    if (loading) return;
    if (!activeUser) {
      navigate('/', { replace: true });
    }
    if (requireAdmin && activeUser && activeUser.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, activeUser, requireAdmin, navigate]);

  if (loading && !activeUser) {
    return (
      <div className="min-h-screen bg-mg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-mg-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeUser) return null;

  return children;
}
