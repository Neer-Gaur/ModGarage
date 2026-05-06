import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Wrench, ShoppingCart, CalendarCheck, Users, ArrowRight, Car } from '@phosphor-icons/react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [garageCount, setGarageCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [carsR, bookingsR] = await Promise.all([
          api.get(`/cars`),
          api.get(`/bookings`),
        ]);
        setCars(carsR.data);
        setBookings(bookingsR.data);
        if (carsR.data.length > 0) {
          const primary = carsR.data.find(c => c.is_primary) || carsR.data[0];
          const garageR = await api.get(`/garage/${primary.car_id}`);
          setGarageCount(garageR.data.length);
        }
      } catch {}
    };
    load();
  }, []);

  const primaryCar = cars.find(c => c.is_primary) || cars[0];
  const activeBookings = bookings.filter(b => !['delivered', 'cancelled'].includes(b.status));

  const quickLinks = [
    { label: 'Marketplace', desc: 'Browse parts & mods', icon: Wrench, href: '/marketplace', color: 'text-mg-red' },
    { label: 'My Garage', desc: `${garageCount} items`, icon: ShoppingCart, href: '/garage', color: 'text-mg-cyan' },
    { label: 'Bookings', desc: `${activeBookings.length} active`, icon: CalendarCheck, href: '/profile', color: 'text-mg-green' },
    { label: 'Community', desc: 'Share builds', icon: Users, href: '/community', color: 'text-yellow-400' },
  ];

  const statusColors = {
    confirmed: 'text-blue-400', picked_up: 'text-yellow-400', in_workshop: 'text-orange-400',
    ready: 'text-mg-green', delivered: 'text-white/40', cancelled: 'text-mg-red', pending: 'text-white/40'
  };

  return (
    <div className="min-h-screen bg-mg-dark pt-8 pb-12 px-6" data-testid="dashboard-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p className="font-mono text-xs tracking-[0.3em] text-mg-red uppercase mb-3">Dashboard</p>
          <h1 className="font-unbounded text-3xl md:text-4xl font-bold tracking-tight uppercase text-white">
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
        </div>

        {/* Car Profile */}
        {primaryCar && (
          <div className="border border-white/10 p-6 mb-8 flex items-center justify-between bg-mg-surface/30" data-testid="car-profile-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-white/10 flex items-center justify-center">
                <Car size={24} weight="bold" className="text-mg-red" />
              </div>
              <div>
                <h3 className="font-manrope font-bold text-white">{primaryCar.make} {primaryCar.model}</h3>
                <p className="font-mono text-xs text-white/40 tracking-wider">{primaryCar.year} {primaryCar.variant && `/ ${primaryCar.variant}`}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/garage')}
              className="font-mono text-xs text-mg-red tracking-wider uppercase hover:text-white transition-colors flex items-center gap-2"
            >
              View Garage <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/5 mb-8">
          {quickLinks.map(({ label, desc, icon: Icon, href, color }) => (
            <button
              key={label}
              onClick={() => navigate(href)}
              className="p-6 bg-mg-dark hover:bg-mg-surface transition-colors text-left group"
              data-testid={`quick-${label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <Icon size={24} weight="bold" className={`${color} mb-4`} />
              <h3 className="font-unbounded text-xs font-bold uppercase tracking-wider text-white mb-1">{label}</h3>
              <p className="font-mono text-[10px] text-white/30 tracking-wider uppercase">{desc}</p>
            </button>
          ))}
        </div>

        {/* Recent Bookings */}
        <div className="border border-white/10 bg-mg-surface/20" data-testid="recent-bookings">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-unbounded text-sm font-bold uppercase tracking-wider text-white">Recent Bookings</h2>
            <span className="font-mono text-[10px] text-white/30 tracking-wider uppercase">{bookings.length} total</span>
          </div>
          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/30 font-manrope text-sm">No bookings yet</p>
              <button onClick={() => navigate('/marketplace')} className="mt-4 text-mg-red font-mono text-xs tracking-wider uppercase hover:text-white transition-colors">
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {bookings.slice(0, 5).map(b => (
                <div key={b.booking_id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-white/60">{b.booking_code}</span>
                    <p className="font-manrope text-sm text-white mt-1">{b.items?.length || 0} items</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-xs tracking-wider uppercase ${statusColors[b.status] || 'text-white/40'}`}>
                      {b.status?.replace('_', ' ')}
                    </span>
                    <p className="font-mono text-xs text-white/30 mt-1">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(b.total_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
