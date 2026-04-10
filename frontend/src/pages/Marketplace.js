import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { MagnifyingGlass, Plus, ShoppingCart } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'rims', label: 'Rims' },
  { value: 'exhaust', label: 'Exhaust' },
  { value: 'spoiler', label: 'Spoiler' },
  { value: 'headlights', label: 'Headlights' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'interior', label: 'Interior' },
  { value: 'hood', label: 'Hood' },
  { value: 'vinyl', label: 'Vinyl' },
];

const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function Marketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
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
      .then(r => setProducts(r.data))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [category, search]);

  const handleAddToGarage = async (e, productId) => {
    e.stopPropagation();
    const primaryCar = cars.find(c => c.is_primary) || cars[0];
    if (!primaryCar) {
      toast.error('Please set up your car profile first');
      navigate('/onboarding');
      return;
    }
    try {
      await axios.post(`${API}/garage`, { car_id: primaryCar.car_id, product_id: productId }, { withCredentials: true });
      toast.success('Added to Garage!');
    } catch (err) {
      toast.error('Failed to add to garage');
    }
  };

  return (
    <div className="min-h-screen bg-mg-dark pt-24 pb-12 px-6" data-testid="marketplace-page">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="font-mono text-xs tracking-[0.3em] text-mg-red uppercase mb-3">Catalog</p>
          <h1 className="font-unbounded text-3xl md:text-4xl font-bold tracking-tight uppercase text-white">Marketplace</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search parts, brands..."
            className="w-full bg-[#0A0A0A] border border-white/10 pl-12 pr-4 py-3 text-white font-manrope text-sm focus:border-mg-red focus:outline-none transition-colors"
            data-testid="marketplace-search"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-[1px] bg-white/5 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors ${
                category === cat.value
                  ? 'bg-mg-red text-white'
                  : 'bg-mg-dark text-white/40 hover:text-white hover:bg-mg-surface'
              }`}
              data-testid={`cat-${cat.value || 'all'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-mg-dark p-4">
                <div className="aspect-[4/3] bg-mg-surface animate-pulse mb-4" />
                <div className="h-4 bg-mg-surface animate-pulse w-3/4 mb-2" />
                <div className="h-3 bg-mg-surface animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 font-manrope">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/5">
            {products.map(product => (
              <div
                key={product.product_id}
                onClick={() => navigate(`/product/${product.slug}`)}
                className="bg-mg-dark group cursor-pointer card-hover"
                data-testid={`product-${product.slug}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={product.images?.[0] || ''}
                    alt={product.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  <span className="tag-mono absolute top-3 left-3">{product.category}</span>
                  <button
                    onClick={(e) => handleAddToGarage(e, product.product_id)}
                    className="absolute bottom-3 right-3 w-10 h-10 bg-mg-red flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[#E62600]"
                    data-testid={`add-garage-${product.slug}`}
                  >
                    <Plus size={18} weight="bold" className="text-white" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase mb-1">{product.brand}</p>
                  <h3 className="font-manrope text-sm font-semibold text-white mb-2 group-hover:text-mg-red transition-colors">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-mg-red font-semibold">{formatINR(product.price)}</span>
                    <span className="font-mono text-[10px] text-white/20 tracking-wider">+{formatINR(product.installation_cost)} install</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
