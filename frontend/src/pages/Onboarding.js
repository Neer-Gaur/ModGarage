import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { CaretRight, Check } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [makes, setMakes] = useState({});
  const [form, setForm] = useState({ make: '', model: '', year: '', variant: '', color: '' });

  useEffect(() => {
    axios.get(`${API}/cars/makes`).then(r => setMakes(r.data.makes)).catch(() => {});
  }, []);

  const models = form.make ? makes[form.make] || [] : [];
  const years = Array.from({ length: 27 }, (_, i) => 2026 - i);

  const handleSubmit = async () => {
    try {
      await axios.post(`${API}/cars`, {
        make: form.make, model: form.model,
        year: parseInt(form.year), variant: form.variant, color: form.color
      }, { withCredentials: true });
      toast.success('Car profile created!');
      if (user) setUser({ ...user, has_cars: true });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error('Failed to create car profile');
    }
  };

  return (
    <div className="min-h-screen bg-mg-dark pt-8 pb-12 px-6" data-testid="onboarding-page">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <p className="font-mono text-xs tracking-[0.3em] text-mg-red uppercase mb-3">Setup</p>
          <h1 className="font-unbounded text-3xl md:text-4xl font-bold tracking-tight uppercase text-white">
            Your Ride
          </h1>
          <p className="text-white/40 mt-3 font-manrope">Tell us about your car to get personalized recommendations</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-12">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 flex items-center justify-center text-xs font-mono ${
                step > s ? 'bg-mg-red text-white' : step === s ? 'border border-mg-red text-mg-red' : 'border border-white/20 text-white/30'
              }`}>
                {step > s ? <Check size={14} weight="bold" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-[1px] ${step > s ? 'bg-mg-red' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Make */}
        {step === 1 && (
          <div className="animate-fade-in" data-testid="step-make">
            <h2 className="font-unbounded text-lg font-bold uppercase text-white mb-6">Select Make</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-[1px] bg-white/5">
              {Object.keys(makes).map(make => (
                <button
                  key={make}
                  onClick={() => { setForm(f => ({ ...f, make, model: '' })); setStep(2); }}
                  className={`p-4 md:p-6 text-left bg-mg-dark hover:bg-mg-surface transition-colors group ${
                    form.make === make ? 'bg-mg-surface border-l-2 border-mg-red' : ''
                  }`}
                  data-testid={`make-${make.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <span className="font-manrope text-sm font-semibold text-white group-hover:text-mg-red transition-colors">{make}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Model */}
        {step === 2 && (
          <div className="animate-fade-in" data-testid="step-model">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(1)} className="text-white/40 hover:text-white font-mono text-xs uppercase tracking-wider">
                {form.make}
              </button>
              <CaretRight size={12} className="text-white/20" />
              <span className="font-unbounded text-lg font-bold uppercase text-white">Select Model</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-[1px] bg-white/5">
              {models.map(model => (
                <button
                  key={model}
                  onClick={() => { setForm(f => ({ ...f, model })); setStep(3); }}
                  className="p-4 md:p-6 text-left bg-mg-dark hover:bg-mg-surface transition-colors group"
                  data-testid={`model-${model.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <span className="font-manrope text-sm font-semibold text-white group-hover:text-mg-red transition-colors">{model}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6" data-testid="step-details">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(1)} className="text-white/40 hover:text-white font-mono text-xs uppercase tracking-wider">{form.make}</button>
              <CaretRight size={12} className="text-white/20" />
              <button onClick={() => setStep(2)} className="text-white/40 hover:text-white font-mono text-xs uppercase tracking-wider">{form.model}</button>
              <CaretRight size={12} className="text-white/20" />
              <span className="font-unbounded text-lg font-bold uppercase text-white">Details</span>
            </div>

            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase mb-2 block">Year</label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-[1px] bg-white/5 max-h-48 overflow-y-auto">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => setForm(f => ({ ...f, year: String(y) }))}
                    className={`p-3 text-center text-sm font-mono bg-mg-dark hover:bg-mg-surface transition-colors ${
                      form.year === String(y) ? 'bg-mg-surface text-mg-red' : 'text-white/60'
                    }`}
                    data-testid={`year-${y}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase mb-2 block">Variant</label>
              <input
                value={form.variant}
                onChange={e => setForm(f => ({ ...f, variant: e.target.value }))}
                placeholder="e.g. ZXi, VXi, Sport"
                className="w-full bg-[#0A0A0A] border border-white/10 px-4 py-3 text-white font-manrope text-sm focus:border-mg-red focus:outline-none transition-colors"
                data-testid="variant-input"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase mb-2 block">Color</label>
              <input
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                placeholder="e.g. Pearl White, Midnight Black"
                className="w-full bg-[#0A0A0A] border border-white/10 px-4 py-3 text-white font-manrope text-sm focus:border-mg-red focus:outline-none transition-colors"
                data-testid="color-input"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!form.year}
              className="w-full bg-mg-red text-white font-unbounded text-sm tracking-widest uppercase py-4 hover:bg-[#E62600] transition-colors disabled:opacity-30 disabled:cursor-not-allowed glow-red mt-8"
              data-testid="create-car-btn"
            >
              Create Car Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
