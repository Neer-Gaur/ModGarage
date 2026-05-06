import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, Star, Truck, ShieldCheck, CaretRight } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [withInstall, setWithInstall] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/products/${slug}`),
      axios.get(`${API}/cars`, { withCredentials: true }).catch(() => ({ data: [] })),
      axios.get(`${API}/products?limit=3`).catch(() => ({ data: [] })),
    ]).then(([pR, cR, rR]) => {
      setProduct(pR.data);
      setCars(cR.data);
      setRelatedProducts(rR.data.filter(p => p.slug !== slug).slice(0, 3));
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

  const handleQuickAdd = async (productId) => {
    const car = cars.find(c => c.is_primary) || cars[0];
    if (!car) { toast.error('Set up your car first'); return; }
    try {
      await axios.post(`${API}/garage`, { car_id: car.car_id, product_id: productId }, { withCredentials: true });
      toast.success('Added to Garage!');
    } catch { toast.error('Failed to add'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-mg-surface pt-8 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-mg-red border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!product) return null;

  const images = product.images?.length > 0 ? product.images : [''];

  return (
    <div className="min-h-screen bg-mg-surface" data-testid="product-detail-page">
      <main className="pt-8 pb-20 max-w-7xl mx-auto px-6">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-xs font-label uppercase tracking-widest text-neutral-500" data-testid="breadcrumbs">
          <Link to="/marketplace" className="hover:text-mg-orange transition-colors">Marketplace</Link>
          <CaretRight size={10} />
          <span className="text-mg-orange">{product.category}</span>
          <CaretRight size={10} />
          <span className="text-mg-red">{product.brand}</span>
        </nav>

        {/* Product Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Gallery */}
          <div className="lg:col-span-7 flex gap-4 h-[600px]">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex flex-col gap-4 w-24 overflow-y-auto shrink-0">
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square bg-mg-surface-card p-2 cursor-pointer transition-opacity ${activeImg === i ? 'border-2 border-mg-red opacity-100' : 'opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            {/* Main Image */}
            <div className="flex-grow bg-mg-surface-card relative overflow-hidden">
              <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 bg-mg-surface/80 backdrop-blur-md px-4 py-2 border-l-2 border-mg-red">
                <span className="text-[10px] font-label uppercase tracking-widest text-neutral-500">SKU: {product.product_id?.slice(-10)?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-headline font-bold leading-tight tracking-tight uppercase text-mg-text" data-testid="product-title">{product.name}</h1>
                <div className="flex items-center gap-4">
                  <div className="flex text-mg-red">
                    {[1,2,3,4,5].map(i => <Star key={i} size={18} weight="fill" />)}
                  </div>
                  <span className="text-xs font-label text-neutral-500">48 Reviews</span>
                </div>
              </div>

              <p className="text-4xl font-headline font-light text-mg-orange">{formatINR(product.price)}</p>

              <p className="text-neutral-400 leading-relaxed border-l-2 border-mg-surface-bright pl-6 italic font-body">
                {product.description || 'Premium performance part engineered for precision and durability.'}
              </p>

              {/* Action Box */}
              <div className="bg-mg-surface-dim p-8 space-y-8 mt-8 border border-white/5">
                <label className="flex items-center justify-between p-4 bg-mg-surface-card hover:bg-mg-surface-high cursor-pointer transition-colors group">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={withInstall}
                      onChange={() => setWithInstall(!withInstall)}
                      className="bg-mg-surface border-neutral-600 text-mg-red focus:ring-mg-red"
                    />
                    <span className="text-sm font-headline uppercase tracking-wider text-mg-text">Installation Service</span>
                  </div>
                  <span className="text-mg-red font-headline font-bold">+{formatINR(product.installation_cost)}</span>
                </label>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleAdd}
                    className="w-full bg-mg-red text-white font-headline font-bold py-5 uppercase tracking-widest active:scale-95 transition-all hover:brightness-110"
                    data-testid="add-to-garage-btn"
                  >
                    Add to Garage
                  </button>
                  <button className="w-full border border-white/20 text-white font-headline font-medium py-4 uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                    <Heart size={16} /> Add to Wishlist
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] font-label uppercase tracking-widest text-neutral-500">
                  <div className="flex items-center gap-2">
                    <Truck size={14} /> Free Express Shipping
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} /> Lifetime Warranty
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="mb-20">
          <div className="flex border-b border-white/10 mb-12 overflow-x-auto">
            <button className="px-8 py-4 text-mg-orange font-headline uppercase tracking-widest border-b-2 border-mg-red whitespace-nowrap">Specifications</button>
            <button className="px-8 py-4 text-white/50 hover:text-white font-headline uppercase tracking-widest whitespace-nowrap transition-colors">Vehicle Fitment</button>
            <button className="px-8 py-4 text-white/50 hover:text-white font-headline uppercase tracking-widest whitespace-nowrap transition-colors">Installation</button>
            <button className="px-8 py-4 text-white/50 hover:text-white font-headline uppercase tracking-widest whitespace-nowrap transition-colors">Reviews (48)</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-mg-surface-card p-10 border-t-2 border-mg-cyan">
              <span className="text-mg-cyan text-xs font-label uppercase tracking-[0.2em] mb-4 block">Category</span>
              <div className="text-3xl font-headline font-bold uppercase text-mg-text">{product.category}</div>
              <p className="text-[10px] font-label text-neutral-500 mt-2 uppercase">{product.brand}</p>
            </div>
            <div className="bg-mg-surface-card p-10 border-t-2 border-mg-red">
              <span className="text-mg-red text-xs font-label uppercase tracking-[0.2em] mb-4 block">Price Breakdown</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-headline font-bold text-mg-text">{formatINR(product.price)}</span>
              </div>
              <p className="text-[10px] font-label text-neutral-500 mt-2 uppercase">+{formatINR(product.installation_cost)} Installation</p>
            </div>
            <div className="bg-mg-surface-card p-10 border-t-2 border-white/20">
              <span className="text-white text-xs font-label uppercase tracking-[0.2em] mb-4 block">Compatibility</span>
              <div className="text-xl font-headline font-bold uppercase text-mg-text">
                {product.compatible_makes?.length > 0 ? product.compatible_makes.join(', ') : 'Universal Fit'}
              </div>
              <p className="text-[10px] font-label text-neutral-500 mt-2 uppercase">Verified fitment data</p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mb-24" data-testid="related-products">
            <h3 className="text-2xl font-headline font-bold uppercase tracking-wider mb-8 flex items-center gap-4 text-mg-text">
              You may also need
              <div className="h-px flex-grow bg-white/10" />
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map(rp => (
                <div
                  key={rp.product_id}
                  onClick={() => navigate(`/product/${rp.slug}`)}
                  className="bg-mg-surface-dim group cursor-pointer border border-transparent hover:border-mg-red/30 transition-all"
                >
                  <div className="aspect-video overflow-hidden">
                    <img src={rp.images?.[0] || ''} alt={rp.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" loading="lazy" />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-label uppercase text-neutral-500 tracking-widest">{rp.category}</p>
                        <h4 className="font-headline font-bold uppercase text-mg-text">{rp.name}</h4>
                      </div>
                      <span className="text-mg-red font-headline">{formatINR(rp.price)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickAdd(rp.product_id); }}
                      className="w-full py-2 border border-white/10 text-[10px] font-label uppercase tracking-widest hover:bg-white/5 transition-colors text-mg-text"
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
