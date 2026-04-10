import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Plus, Cube, CalendarBlank, Lightning, CaretRight } from '@phosphor-icons/react';

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
    <div className="min-h-screen bg-mg-surface pt-24 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-mg-red border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-mg-surface" data-testid="garage-page">
      <main className="pt-32 pb-24 px-8 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-end justify-between border-b border-white/10 pb-8">
            <div>
              <span className="text-mg-orange text-xs font-bold tracking-[0.3em] uppercase mb-4 block">Current Configuration</span>
              <h1 className="text-5xl md:text-7xl font-headline font-black uppercase tracking-tighter leading-none text-mg-text">My Garage</h1>
            </div>
            {primaryCar && (
              <div className="hidden md:block text-right">
                <p className="text-neutral-500 text-xs uppercase tracking-widest">Active Project</p>
                <p className="text-xl font-headline font-bold uppercase text-mg-text">{primaryCar.make} {primaryCar.model} {primaryCar.year}</p>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between text-xs font-bold tracking-widest text-neutral-500 uppercase px-4">
              <span>Part Specifications</span>
              <span>Subtotal</span>
            </div>

            {items.length === 0 ? (
              <div className="bg-mg-surface-dim p-16 text-center">
                <p className="text-neutral-500 font-body mb-6">Your garage is empty. Start building your dream machine.</p>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="bg-mg-red text-white font-headline font-bold uppercase tracking-widest px-8 py-4 hover:brightness-110 transition-all"
                  data-testid="browse-marketplace-btn"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <>
                {items.map(item => (
                  <div
                    key={item.item_id}
                    className="group bg-mg-surface-dim hover:bg-mg-surface-card transition-colors p-4 flex flex-col md:flex-row items-center gap-6 border-l-4 border-transparent hover:border-mg-orange"
                    data-testid={`garage-item-${item.product?.slug || item.product_id}`}
                  >
                    <div className="w-full md:w-32 aspect-square overflow-hidden bg-mg-surface-bright">
                      <img src={item.product?.images?.[0] || ''} alt={item.product?.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow space-y-1">
                      <span className="text-[10px] text-mg-cyan font-bold tracking-[0.2em] uppercase">{item.product?.category}</span>
                      <h3 className="text-lg font-headline font-bold uppercase tracking-tight text-mg-text">{item.product?.name}</h3>
                      <p className="text-xs text-neutral-400 max-w-md font-body">{item.product?.description?.substring(0, 80)}</p>
                    </div>
                    <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
                      <span className="text-xl font-headline font-bold text-mg-text">{formatINR(item.product?.price || 0)}</span>
                      <button
                        onClick={() => handleRemove(item.item_id)}
                        className="text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1 uppercase text-[10px] font-bold tracking-widest"
                        data-testid={`remove-${item.item_id}`}
                      >
                        <X size={12} weight="bold" /> Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add More */}
                <div className="pt-8 flex justify-center">
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="flex items-center gap-2 text-mg-orange font-bold uppercase text-xs tracking-widest group"
                    data-testid="add-more-parts-btn"
                  >
                    <Plus size={16} weight="bold" />
                    <span>Add more parts from Marketplace</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <div className="bg-mg-surface-dim p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-20">
                  <span className="text-[8px] font-mono block text-mg-text-dim">SYS_REV: 04.2A</span>
                  <span className="text-[8px] font-mono block text-mg-text-dim">CHASSIS_AUTH: OK</span>
                </div>
                <h2 className="text-2xl font-headline font-black uppercase tracking-tighter mb-8 border-b border-white/10 pb-4 text-mg-text">Build Summary</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500 uppercase tracking-widest font-bold">Parts Total</span>
                    <span className="font-headline font-bold text-mg-text">{formatINR(total.total_parts)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500 uppercase tracking-widest font-bold">Estimated Labor</span>
                    <span className="font-headline font-bold text-mg-cyan">{formatINR(total.total_labour)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-4 border-t border-white/5">
                    <span className="text-mg-orange uppercase tracking-[0.2em] font-black text-lg">Grand Total</span>
                    <span className="font-headline font-black text-2xl text-mg-text">{formatINR(total.total)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/configurator')}
                    className="w-full bg-mg-red text-white font-headline font-bold uppercase tracking-widest py-4 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform hover:shadow-[0_0_15px_rgba(250,93,0,0.4)]"
                    data-testid="open-configurator-btn"
                  >
                    <Cube size={18} /> Open 3D Configurator
                  </button>
                  <button
                    onClick={() => navigate('/booking')}
                    className="w-full border border-white/20 hover:bg-mg-surface-high text-mg-text font-headline font-bold uppercase tracking-widest py-4 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                    data-testid="book-modification-btn"
                  >
                    <CalendarBlank size={18} /> Proceed to Booking
                  </button>
                </div>

                <div className="mt-8 p-4 bg-mg-surface-bright/20 text-[10px] text-neutral-500 uppercase tracking-widest leading-relaxed">
                  <span className="text-mg-cyan font-bold">Note:</span> Labor estimates are based on standard installation times. Final quote provided after physical inspection.
                </div>
              </div>

              {/* Upsell */}
              <div className="bg-gradient-to-br from-mg-surface-dim to-mg-surface-bright p-6 flex items-center gap-4 border border-mg-cyan/10">
                <Lightning size={28} weight="fill" className="text-mg-cyan" />
                <div>
                  <p className="text-[10px] font-bold text-mg-cyan tracking-[0.2em] uppercase">Power Unlock</p>
                  <p className="text-xs uppercase font-headline font-bold text-mg-text">Add ECU Remapping</p>
                </div>
                <button className="ml-auto text-neutral-500 hover:text-white transition-colors">
                  <CaretRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
