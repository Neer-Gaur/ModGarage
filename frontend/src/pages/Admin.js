import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const STATUSES = ['pending', 'confirmed', 'picked_up', 'in_workshop', 'ready', 'delivered', 'cancelled'];
const statusColors = {
  pending: 'bg-white/10 text-white/60', confirmed: 'bg-blue-500/20 text-blue-400',
  picked_up: 'bg-yellow-500/20 text-yellow-400', in_workshop: 'bg-orange-500/20 text-orange-400',
  ready: 'bg-green-500/20 text-mg-green', delivered: 'bg-white/5 text-white/30',
  cancelled: 'bg-red-500/20 text-mg-red'
};

export default function Admin() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/bookings`)
      .then(r => setBookings(r.data))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (bookingId, status) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, { status });
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status } : b));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-mg-dark pt-8 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-mg-red border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-mg-dark pt-8 pb-12 px-6" data-testid="admin-page">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="font-mono text-xs tracking-[0.3em] text-mg-red uppercase mb-3">Control Room</p>
          <h1 className="font-unbounded text-3xl md:text-4xl font-bold tracking-tight uppercase text-white">Admin Panel</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/5 mb-8">
          {[
            { label: 'Total Bookings', value: bookings.length },
            { label: 'Active', value: bookings.filter(b => !['delivered', 'cancelled'].includes(b.status)).length },
            { label: 'Delivered', value: bookings.filter(b => b.status === 'delivered').length },
            { label: 'Revenue', value: formatINR(bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.total_amount || 0), 0)) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-mg-dark p-6">
              <p className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase mb-2">{label}</p>
              <p className="font-mono text-xl text-white font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="border border-white/10 bg-mg-surface/20 overflow-x-auto">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="font-unbounded text-sm font-bold uppercase tracking-wider text-white">Booking Queue</h2>
          </div>
          <table className="w-full text-left" data-testid="admin-bookings-table">
            <thead>
              <tr className="border-b border-white/10">
                {['Code', 'User', 'Items', 'Amount', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map(b => (
                <tr key={b.booking_id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-mg-red">{b.booking_code}</td>
                  <td className="px-4 py-3 font-manrope text-xs text-white/70">{b.user_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/50">{b.items?.length || 0}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white">{formatINR(b.total_amount)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/40">{b.slot_date}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[10px] tracking-wider uppercase px-2 py-1 ${statusColors[b.status]}`}>
                      {b.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={b.status} onValueChange={(v) => updateStatus(b.booking_id, v)}>
                      <SelectTrigger className="w-[140px] h-8 bg-[#0A0A0A] border-white/10 text-xs font-mono" data-testid={`status-select-${b.booking_id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-mg-surface border-white/10">
                        {STATUSES.map(s => (
                          <SelectItem key={s} value={s} className="text-xs font-mono capitalize">
                            {s.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-white/30 font-manrope text-sm">No bookings yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
