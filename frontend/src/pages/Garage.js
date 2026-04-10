import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash, Cube, ArrowRight } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function Garage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState({ total_parts: 0, total_labour: 0, total: 0 });
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGarage = async () => {
    try {
      const carsR = await axios.get(`${API}/cars`, { withCredentials: true });
      setCars(carsR.data);
      const car = carsR.data.find(c => c.is_primary) || carsR.data[0];
      if (!car) { setLoading(false); return; }
      const [itemsR, totalR] = await Promise.all([
        axios.get(`${API}/garage/${car.car_id}`, { withCredentials: true }),
        axios.get(`${API}/garage/${car.car_id}/total`, { withCredentials: true }),
      ]);
      setItems(itemsR.data);
      setTotal(totalR.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadGarage(); }, []);

  const handleRemove = async (itemId) => {
    try {
      await axios.delete(`${API}/garage/${itemId}`, { withCredentials: true });
      toast.success('Removed from garage');
      loadGarage();
    } catch { toast.error('Failed to remove'); }
  };

  const primaryCar = cars.find(c => c.is_primary) || cars[0];

  if (loading) return (
    <div className="min-h-screen bg-mg-dark pt-24 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-mg-red border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-mg-dark pt-24 pb-32 px-6" data-testid="garage-page">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="font-mono text-xs tracking-[0.3em] text-mg-red uppercase mb-3">Virtual Bag</p>
          <h1 className="font-unbounded text-3xl md:text-4xl font-bold tracking-tight uppercase text-white">My Garage</h1>
          {primaryCar && (
            <p className="font-mono text-xs text-white/30 tracking-wider mt-2 uppercase">
              {primaryCar.make} {primaryCar.model} {primaryCar.year}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-[1px] bg-white/5">
          {/* Items List */}
          <div className="lg:col-span-3 bg-mg-dark">
            {items.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-white/30 font-manrope mb-4">Your garage is empty</p>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="text-mg-red font-mono text-xs tracking-wider uppercase hover:text-white transition-colors"
                  data-testid="browse-marketplace-btn"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {items.map(item => (
                  <div key={item.item_id} className="p-4 flex items-center gap-4" data-testid={`garage-item-${item.product?.slug || item.product_id}`}>
                    <div className="w-20 h-20 overflow-hidden flex-shrink-0 bg-mg-surface">
                      <img src={item.product?.images?.[0] || ''} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase">{item.product?.brand}</p>
                      <h3 className="font-manrope text-sm font-semibold text-white truncate">{item.product?.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="font-mono text-xs text-mg-red">{formatINR(item.product?.price || 0)}</span>
                        <span className="font-mono text-[10px] text-white/20">qty: {item.quantity}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(item.item_id)}
                      className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-mg-red transition-colors"
                      data-testid={`remove-${item.item_id}`}
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3D Configurator Placeholder */}
          <div className="lg:col-span-2 bg-mg-dark relative">
            <div
              className="aspect-square md:aspect-auto md:h-full min-h-[300px] bg-cover bg-center relative"
              style={{ backgroundImage: `url(https://images.pexels.com/photos/27703394/pexels-photo-27703394.jpeg?w=800&h=600&fit=crop)` }}
            >
              <div className="absolute inset-0 bg-mg-dark/80 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 border border-white/10 flex items-center justify-center mb-6">
                  <Cube size={32} weight="thin" className="text-white/30" />
                </div>
                <h3 className="font-unbounded text-sm font-bold uppercase tracking-wider text-white mb-2 text-center">3D Configurator</h3>
                <p className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase mb-6">Coming Soon</p>
                <button
                  onClick={() => navigate('/configurator')}
                  className="border border-white/20 text-white font-mono text-xs tracking-wider uppercase px-6 py-3 hover:bg-white hover:text-mg-dark transition-all"
                  data-testid="open-configurator-btn"
                >
                  Open 3D Configurator
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-mg-surface/95 backdrop-blur-xl border-t border-white/10 z-40" data-testid="garage-total-bar">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase">Live Total Cost</p>
              <div className="flex items-baseline gap-4 mt-1">
                <span className="font-mono text-2xl text-mg-red font-bold glow-red-text">{formatINR(total.total)}</span>
                <span className="font-mono text-[10px] text-white/20 tracking-wider">
                  Parts {formatINR(total.total_parts)} + Labour {formatINR(total.total_labour)}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/booking')}
              className="bg-mg-red text-white font-unbounded text-xs tracking-widest uppercase px-8 py-3 hover:bg-[#E62600] transition-colors flex items-center gap-2 glow-red"
              data-testid="book-modification-btn"
            >
              Book Modification <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
