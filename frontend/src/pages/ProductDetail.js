import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ShoppingCart, ArrowLeft, Check } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/products/${slug}`),
      axios.get(`${API}/cars`, { withCredentials: true }).catch(() => ({ data: [] }))
    ]).then(([pR, cR]) => {
      setProduct(pR.data);
      setCars(cR.data);
    }).catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAdd = async () => {
    const car = cars.find(c => c.is_primary) || cars[0];
    if (!car) { toast.error('Set up your car first'); navigate('/onboarding'); return; }
    try {
      await axios.post(`${API}/garage`, { car_id: car.car_id, product_id: product.product_id }, { withCredentials: true });
      toast.success('Added to Garage!');
    } catch { toast.error('Failed to add'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-mg-dark pt-24 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-mg-red border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!product) return null;

  return (
    <div className="min-h-screen bg-mg-dark pt-24 pb-12 px-6" data-testid="product-detail-page">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white font-mono text-xs tracking-wider uppercase mb-8 transition-colors" data-testid="back-btn">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/5">
          {/* Image */}
          <div className="bg-mg-dark">
            <div className="aspect-square overflow-hidden">
              <img src={product.images?.[0] || ''} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="bg-mg-dark p-8 md:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="tag-mono">{product.category}</span>
                {product.in_stock && <span className="tag-mono text-mg-green border-mg-green/30">In Stock</span>}
              </div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase mb-2">{product.brand}</p>
              <h1 className="font-unbounded text-2xl md:text-3xl font-bold tracking-tight uppercase text-white mb-6">
                {product.name}
              </h1>
              <p className="text-white/50 font-manrope text-sm leading-relaxed mb-8">{product.description}</p>

              {/* Compatible makes */}
              {product.compatible_makes?.length > 0 && (
                <div className="mb-8">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase mb-3">Compatible With</p>
                  <div className="flex flex-wrap gap-2">
                    {product.compatible_makes.map(m => (
                      <span key={m} className="tag-mono flex items-center gap-1">
                        <Check size={10} className="text-mg-green" /> {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="border border-white/10 p-6 bg-mg-surface/30 mb-8">
                <div className="flex items-end justify-between mb-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase">Part Price</span>
                  <span className="font-mono text-2xl text-mg-red font-bold">{formatINR(product.price)}</span>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase">Installation</span>
                  <span className="font-mono text-sm text-white/60">{formatINR(product.installation_cost)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex items-end justify-between">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">Total</span>
                  <span className="font-mono text-lg text-white font-bold">{formatINR(product.price + product.installation_cost)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-mg-red text-white font-unbounded text-sm tracking-widest uppercase py-4 hover:bg-[#E62600] transition-colors flex items-center justify-center gap-3 glow-red"
              data-testid="add-to-garage-btn"
            >
              <ShoppingCart size={20} weight="bold" /> Add to Garage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
