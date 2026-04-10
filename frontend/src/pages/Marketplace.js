import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { MagnifyingGlass, Lightning } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const HERO_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuHmASfV8kIYZaf4gKPBtxH19QLPEJViWcnGe7N-lS_DwaZebDIMmOq5IrxJWUIJ5loQwYrCJLzeMhPJebPNGuItMNcmoHdu0pdv3W6LZr8AgTQbuYP87-d-fcizjDohWHHP0layNwt7hFYF2QCn2TW51Ulh0WSatGDbpT7FzN3Gl3s_syGfqeSKnNGsTJUi4DbcTwYFwVBJTQZsAaIK3SBueYyZ6lPAD2uu-4_Y8HjsDn7mkkDVt0ZnXrGDZasCpTehbEdOaapnM';

const CATEGORIES = [
  { value: '', label: 'All Parts' },
  { value: 'rims', label: 'Wheels' },
  { value: 'exhaust', label: 'Exhaust' },
  { value: 'spoiler', label: 'Body Kits' },
  { value: 'suspension', label: 'Performance' },
  { value: 'interior', label: 'Accessories' },
  { value: 'headlights', label: 'Lighting' },
  { value: 'hood', label: 'Hood' },
  { value: 'vinyl', label: 'Vinyl' },
];

const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/cars`, { withCredentials: true }).then(r => setCars(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    axios.get(`${API}/products?${params}`)
      .then(r => {
        let sorted = r.data;
        if (sort === 'price_low') sorted = [...sorted].sort((a, b) => a.price - b.price);
        else if (sort === 'price_high') sorted = [...sorted].sort((a, b) => b.price - a.price);
        setProducts(sorted);
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [category, search, sort]);

  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/marketplace';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleAddToGarage = async (e, productId) => {
    e.stopPropagation();
    if (!user) { handleLogin(); return; }
    const primaryCar = cars.find(c => c.is_primary) || cars[0];
    if (!primaryCar) {
      toast.error('Please set up your car profile first');
      navigate('/onboarding');
      return;
    }
    try {
      await axios.post(`${API}/garage`, { car_id: primaryCar.car_id, product_id: productId }, { withCredentials: true });
      toast.success('Added to Garage!');
    } catch {
      toast.error('Failed to add to garage');
    }
  };

  return (
    <div className="min-h-screen bg-mg-surface" data-testid="marketplace-page">
      {/* Hero */}
      <header className="relative h-[409px] w-full flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-mg-surface via-mg-surface/40 to-transparent z-10" />
        <img src={HERO_IMG} alt="Modified sports car" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative z-20 px-8 pb-12 w-full max-w-7xl mx-auto">
          <h1 className="font-headline text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4">
            Market<span className="text-mg-orange">place</span>
          </h1>
          <p className="font-label uppercase tracking-widest text-neutral-400 max-w-lg text-sm">
            Precision components for elite builds. Engineered to push boundaries.
          </p>
        </div>
      </header>

      {/* Sticky Catalog Controls */}
      <section className="sticky top-20 z-40 bg-mg-surface/90 backdrop-blur-md border-y border-white/5">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex overflow-x-auto no-scrollbar gap-4 w-full md:w-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-6 py-2 font-label text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                  category === cat.value
                    ? 'bg-mg-red text-white'
                    : 'bg-mg-surface-dim hover:bg-mg-surface-high text-mg-text'
                }`}
                data-testid={`cat-${cat.value || 'all'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <div className="relative hidden sm:block">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="SEARCH PARTS..."
                className="bg-mg-surface-bright border-none text-xs tracking-widest pl-9 pr-4 py-2 w-48 focus:ring-1 focus:ring-mg-red focus:w-64 transition-all duration-500 text-mg-text"
                data-testid="marketplace-search"
              />
            </div>
            <span className="font-label text-[10px] text-neutral-500 uppercase tracking-widest">Sort By:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-transparent border-none font-label text-xs uppercase tracking-widest focus:ring-0 text-mg-orange cursor-pointer"
              data-testid="sort-select"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="flex flex-col">
                <div className="aspect-square bg-mg-surface-dim animate-pulse" />
                <div className="pt-6 space-y-2">
                  <div className="h-5 bg-mg-surface-dim animate-pulse w-3/4" />
                  <div className="h-3 bg-mg-surface-dim animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 font-body">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {products.map(product => (
              <div
                key={product.product_id}
                onClick={() => navigate(`/product/${product.slug}`)}
                className="group flex flex-col cursor-pointer"
                data-testid={`product-${product.slug}`}
              >
                <div className="relative aspect-square overflow-hidden bg-mg-surface-dim">
                  <img
                    src={product.images?.[0] || ''}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  {product.category && (
                    <div className="absolute top-4 right-4 bg-mg-cyan/20 backdrop-blur-md px-3 py-1">
                      <span className="text-mg-cyan font-headline text-[10px] font-bold uppercase tracking-tighter">{product.category}</span>
                    </div>
                  )}
                </div>
                <div className="pt-6 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-headline font-bold text-lg uppercase tracking-tight leading-tight text-mg-text">{product.name}</h3>
                    <span className="text-mg-cyan font-headline font-medium ml-4 whitespace-nowrap">{formatINR(product.price)}</span>
                  </div>
                  <p className="text-neutral-500 text-xs font-label uppercase tracking-widest">
                    {product.brand} {product.description ? `\u2022 ${product.description.substring(0, 40)}` : ''}
                  </p>
                  <button
                    onClick={(e) => handleAddToGarage(e, product.product_id)}
                    className="w-full mt-4 py-4 bg-mg-surface-bright group-hover:bg-mg-red text-mg-text group-hover:text-white transition-all duration-300 font-label text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                    data-testid={`add-garage-${product.slug}`}
                  >
                    Add to Garage <Lightning size={14} weight="fill" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="mt-20 py-24 bg-mg-surface-dim">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-headline text-4xl font-black uppercase tracking-tight mb-4 text-mg-text">
              The Modification <span className="text-mg-orange">Intel</span>
            </h2>
            <p className="text-neutral-400 font-label text-sm uppercase tracking-widest">
              Get early access to limited edition drops and performance data leaks.
            </p>
          </div>
          <div className="flex gap-0">
            <input
              className="flex-grow bg-mg-surface-bright border-none text-xs font-label uppercase tracking-widest p-4 focus:ring-1 focus:ring-mg-red text-mg-text"
              placeholder="ENTER EMAIL"
              type="email"
              data-testid="newsletter-email"
            />
            <button className="bg-mg-red text-white px-8 font-label text-xs font-black uppercase tracking-widest" data-testid="newsletter-join">
              Join
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
