import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Car, CalendarCheck, User } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const statusColors = {
  confirmed: 'text-blue-400', picked_up: 'text-yellow-400', in_workshop: 'text-orange-400',
  ready: 'text-mg-green', delivered: 'text-white/40', cancelled: 'text-mg-red', pending: 'text-white/40'
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/cars`, { withCredentials: true }),
      axios.get(`${API}/bookings`, { withCredentials: true }),
    ]).then(([c, b]) => {
      setCars(c.data);
      setBookings(b.data);
    }).catch(() => {});
  }, []);

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/cancel`, {}, { withCredentials: true });
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-mg-dark pt-8 pb-12 px-6" data-testid="profile-page">
      <div className="max-w-4xl mx-auto">
        {/* User Info */}
        <div className="flex items-center gap-6 mb-12">
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-white/10" />
          ) : (
            <div className="w-20 h-20 bg-mg-surface border-2 border-white/10 flex items-center justify-center rounded-full">
              <User size={32} weight="bold" className="text-white/30" />
            </div>
          )}
          <div>
            <h1 className="font-unbounded text-2xl font-bold uppercase tracking-tight text-white">{user?.name}</h1>
            <p className="font-mono text-xs text-white/30 tracking-wider">{user?.email}</p>
            {user?.role === 'admin' && <span className="tag-mono text-mg-red border-mg-red/30 mt-2 inline-block">Admin</span>}
          </div>
        </div>

        {/* Cars */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-unbounded text-sm font-bold uppercase tracking-wider text-white">My Cars</h2>
            <button
              onClick={() => navigate('/onboarding')}
              className="font-mono text-xs text-mg-red tracking-wider uppercase hover:text-white transition-colors"
              data-testid="add-car-btn"
            >
              + Add Car
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/5">
            {cars.map(car => (
              <div key={car.car_id} className="bg-mg-dark p-4 flex items-center gap-4" data-testid={`car-${car.car_id}`}>
                <div className="w-12 h-12 border border-white/10 flex items-center justify-center">
                  <Car size={24} weight="bold" className="text-white/30" />
                </div>
                <div>
                  <h3 className="font-manrope text-sm font-semibold text-white">{car.make} {car.model}</h3>
                  <p className="font-mono text-[10px] text-white/30 tracking-wider">{car.year} {car.variant && `/ ${car.variant}`} {car.is_primary && '/ PRIMARY'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings */}
        <div>
          <h2 className="font-unbounded text-sm font-bold uppercase tracking-wider text-white mb-4">Booking History</h2>
          <div className="border border-white/10 bg-mg-surface/20">
            {bookings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-white/30 font-manrope text-sm">No bookings yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {bookings.map(b => (
                  <div key={b.booking_id} className="p-4 flex items-center justify-between" data-testid={`booking-${b.booking_id}`}>
                    <div>
                      <div className="flex items-center gap-3">
                        <CalendarCheck size={16} className="text-white/30" />
                        <span className="font-mono text-xs text-white/60">{b.booking_code}</span>
                        <span className={`font-mono text-[10px] tracking-wider uppercase ${statusColors[b.status]}`}>{b.status?.replace('_', ' ')}</span>
                      </div>
                      <p className="font-manrope text-sm text-white mt-1">{b.items?.length} items - {formatINR(b.total_amount)}</p>
                      <p className="font-mono text-[10px] text-white/20 mt-1">{b.slot_date} {b.slot_time}</p>
                    </div>
                    {['pending', 'confirmed'].includes(b.status) && (
                      <button
                        onClick={() => handleCancelBooking(b.booking_id)}
                        className="font-mono text-xs text-mg-red tracking-wider uppercase hover:text-white transition-colors"
                        data-testid={`cancel-booking-${b.booking_id}`}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
