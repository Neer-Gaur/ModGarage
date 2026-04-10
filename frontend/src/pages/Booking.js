import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Check, MapPin, Shield, CheckCircle } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const VEHICLE_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAYikZvb3BeRCSNLaffn2P3sBCLulQJSvwLLY-09Y_6faS3aMPGYh1a9Tt-Q1L2vT5HDmtg0ModUuq5Rstyr_M4tLDoTeoGCL4sI3Qqv0kDJmNp-NDOORGPp0ZZ3ZTcwElEdDVyzASsW-NM6DO6ejheIRr5keWaApOdCvCB77foPk2OEpprVQhzwWb9lW2TaFNNuks-GurqVdVUEdv7Rp6nQGROXBW9VxgXDnOH-Y_gN_nif0yF38ylSdY2bc802lzVkYPfrZE1z8';
const SIDEBAR_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWvMOWLfnaQnGpLTpgEIqNH4L2BRPuk-kGBEk-UYHS2ItGXXhWArYGHBU_oYIk7B955utxc3XzDVGDHK_Wiv-VGuXh-KQUVe7YIdgmO4vROLqTi9qcFyHF72vSXFhFC2N0oD72pehJYHgbj8_Ns-nCxXbZ-6o4sKxH8I-jV8Sxrjh9MG3BtbLTSjSBRaueJXdBB82d2xaQ3QFRJT7FiUzyB6D7-ADNiCkHsg_PLlTdvQlxM_-Uy9SnbVGqzo99SUX60BiN-cH25qA';

export default function Booking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cars, setCars] = useState([]);
  const [garageItems, setGarageItems] = useState([]);
  const [total, setTotal] = useState({ total_parts: 0, total_labour: 0, total: 0 });
  const [slots, setSlots] = useState([]);
  const [address, setAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const carsR = await axios.get(`${API}/cars`, { withCredentials: true });
        setCars(carsR.data);
        const car = carsR.data.find(c => c.is_primary) || carsR.data[0];
        if (!car) return;
        const [itemsR, totalR, slotsR] = await Promise.all([
          axios.get(`${API}/garage/${car.car_id}`, { withCredentials: true }),
          axios.get(`${API}/garage/${car.car_id}/total`, { withCredentials: true }),
          axios.get(`${API}/slots`),
        ]);
        setGarageItems(itemsR.data);
        setTotal(totalR.data);
        setSlots(slotsR.data);
        if (itemsR.data.length === 0) {
          toast.error('Your garage is empty. Add parts first!');
          navigate('/marketplace');
        }
      } catch {}
    };
    load();
  }, [navigate]);

  const primaryCar = cars.find(c => c.is_primary) || cars[0];
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
  const daySlots = slots.filter(s => s.date === dateStr);
  const availableDates = [...new Set(slots.map(s => s.date))];

  const handleBook = async () => {
    if (!primaryCar || !selectedSlot || !address) return;
    setSubmitting(true);
    try {
      const resp = await axios.post(`${API}/bookings`, {
        car_id: primaryCar.car_id,
        slot_id: selectedSlot.slot_id,
        pickup_address: address,
      }, { withCredentials: true });
      setBooking(resp.data);
      setShowConfirmation(true);
      toast.success('Booking confirmed!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Booking failed');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-mg-surface" data-testid="booking-page">
      <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="font-headline text-5xl md:text-7xl font-bold uppercase tracking-tighter text-mg-text">
            Service <span className="text-mg-red">Protocol</span>
          </h1>
          <p className="font-label text-neutral-500 uppercase tracking-widest mt-4">Precision Engineering & Maintenance Request</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Steps */}
          <div className="lg:col-span-8 space-y-12">

            {/* Step 1: Vehicle Profile */}
            <section className={`bg-mg-surface-dim p-8 border-l-4 ${step >= 1 ? 'border-mg-red' : 'border-neutral-800'}`} data-testid="step-vehicle">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-headline text-2xl font-bold uppercase tracking-tight flex items-center gap-3 text-mg-text">
                  <span className="text-mg-red">01</span> Vehicle Profile
                </h2>
                {step > 1 && <CheckCircle size={24} weight="fill" className="text-mg-cyan" />}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative group aspect-video overflow-hidden">
                  <img src={VEHICLE_IMG} alt="Vehicle" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-mg-dark to-transparent opacity-60" />
                </div>
                <div className="space-y-6">
                  {primaryCar ? (
                    <>
                      <div className="border-b border-white/10 pb-4">
                        <label className="block font-label text-xs text-neutral-500 uppercase tracking-widest mb-1">Make / Model</label>
                        <p className="font-headline text-xl font-medium text-mg-text">{primaryCar.make} {primaryCar.model}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-white/10 pb-4">
                          <label className="block font-label text-xs text-neutral-500 uppercase tracking-widest mb-1">Year</label>
                          <p className="font-headline text-xl font-medium text-mg-text">{primaryCar.year}</p>
                        </div>
                        <div className="border-b border-white/10 pb-4">
                          <label className="block font-label text-xs text-neutral-500 uppercase tracking-widest mb-1">Variant</label>
                          <p className="font-headline text-xl font-medium text-mg-text">{primaryCar.variant || 'Standard'}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-neutral-500 font-body">No vehicle configured. <button onClick={() => navigate('/onboarding')} className="text-mg-red underline">Set up now</button></p>
                  )}
                </div>
              </div>
            </section>

            {/* Step 2: Logistics & Schedule */}
            <section className={`bg-mg-surface-card p-8 ${step < 2 ? 'opacity-40' : ''}`} data-testid="step-schedule">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight flex items-center gap-3 mb-8 text-mg-text">
                <span className="text-mg-red">02</span> Logistics & Schedule
              </h2>
              <div className="space-y-10">
                <div>
                  <label className="block font-label text-xs text-neutral-500 uppercase tracking-widest mb-4">Pickup Address</label>
                  <div className="relative">
                    <input
                      value={address}
                      onChange={e => { setAddress(e.target.value); if (step < 2) setStep(2); }}
                      onFocus={() => { if (step < 2) setStep(2); }}
                      className="w-full bg-mg-surface-bright border-none focus:ring-0 text-mg-text px-4 py-4 font-headline placeholder:text-neutral-600"
                      placeholder="Enter your full pickup address"
                      data-testid="address-input"
                    />
                    <div className={`absolute bottom-0 left-0 h-0.5 w-full ${address ? 'bg-mg-red' : 'bg-white/10'} transition-colors`} />
                    <MapPin size={18} className="absolute right-4 top-4 text-neutral-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <label className="block font-label text-xs text-neutral-500 uppercase tracking-widest mb-4">Select Date</label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); setStep(2); }}
                      disabled={(date) => !availableDates.includes(date.toISOString().split('T')[0])}
                      className="bg-mg-surface text-mg-text"
                      data-testid="booking-calendar"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-xs text-neutral-500 uppercase tracking-widest mb-4">Time Grid</label>
                    <div className="grid grid-cols-2 gap-3">
                      {daySlots.length === 0 && dateStr && (
                        <p className="col-span-2 text-neutral-500 font-body text-sm">No slots for this date</p>
                      )}
                      {!dateStr && <p className="col-span-2 text-neutral-500 font-body text-sm">Select a date first</p>}
                      {daySlots.map(slot => (
                        <button
                          key={slot.slot_id}
                          onClick={() => { setSelectedSlot(slot); setStep(3); }}
                          className={`border py-3 px-4 font-headline text-sm text-left transition-colors ${
                            selectedSlot?.slot_id === slot.slot_id
                              ? 'border-mg-red bg-mg-red/10 text-mg-text'
                              : 'border-white/10 hover:bg-mg-surface-high text-mg-text'
                          }`}
                          data-testid={`slot-${slot.slot_id}`}
                        >
                          {slot.start_time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3: Component Audit */}
            <section className={`bg-mg-surface-card p-8 ${step < 3 ? 'opacity-40' : ''}`} data-testid="step-review">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight flex items-center gap-3 mb-8 text-mg-text">
                <span className="text-mg-red">03</span> Component Audit
              </h2>
              <div className="space-y-6">
                {garageItems.map(item => (
                  <div key={item.item_id} className="flex justify-between items-center group">
                    <div>
                      <h4 className="font-headline text-lg text-mg-text">{item.product?.name}</h4>
                      <p className="text-xs font-label text-neutral-500 uppercase">{item.product?.category} x{item.quantity}</p>
                    </div>
                    <span className="font-headline text-xl text-mg-cyan tracking-tighter">{formatINR((item.product?.price || 0) * item.quantity)}</span>
                  </div>
                ))}
                {total.total_labour > 0 && (
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-headline text-lg text-mg-text">Installation & Labor</h4>
                      <p className="text-xs font-label text-neutral-500 uppercase">Professional service fee</p>
                    </div>
                    <span className="font-headline text-xl text-mg-cyan tracking-tighter">{formatINR(total.total_labour)}</span>
                  </div>
                )}
                <div className="pt-8 border-t border-dashed border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-xs font-label text-neutral-500 uppercase tracking-widest mb-1">Total Engineering Cost</p>
                    <h3 className="font-headline text-4xl font-bold text-mg-red tracking-tighter">{formatINR(total.total)}</h3>
                  </div>
                  <button
                    onClick={handleBook}
                    disabled={submitting || !address || !selectedSlot}
                    className="bg-mg-red text-white px-12 py-5 font-headline font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-mg-red/20 disabled:opacity-30"
                    data-testid="confirm-booking-btn"
                  >
                    {submitting ? 'Processing...' : 'Initiate Booking'}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar HUD */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="glass-panel p-6 border-l-2 border-mg-cyan">
                <div className="flex items-center gap-2 text-mg-cyan mb-4">
                  <span className="font-label text-xs uppercase tracking-widest">Performance HUD</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-mg-surface-bright/40 p-4">
                    <span className="block text-xs font-label text-neutral-400 uppercase mb-1">Est. Power Gain</span>
                    <span className="font-headline text-3xl text-mg-cyan font-bold">+{garageItems.length * 15} HP</span>
                  </div>
                  <div className="bg-mg-surface-bright/40 p-4">
                    <span className="block text-xs font-label text-neutral-400 uppercase mb-1">Parts Count</span>
                    <span className="font-headline text-3xl text-mg-text font-bold">{garageItems.length} Items</span>
                  </div>
                </div>
              </div>

              <div className="bg-mg-surface-dim p-6 space-y-4 border border-white/5">
                <h4 className="font-label text-xs text-neutral-500 uppercase tracking-widest">Guarantees</h4>
                <div className="flex items-start gap-3">
                  <Check size={14} className="text-mg-orange mt-0.5" />
                  <p className="text-xs text-neutral-400 leading-relaxed font-body">Certified Master Technicians only.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield size={14} className="text-mg-orange mt-0.5" />
                  <p className="text-xs text-neutral-400 leading-relaxed font-body">24-Month precision craftsmanship warranty.</p>
                </div>
              </div>

              <div className="relative overflow-hidden aspect-square">
                <img src={SIDEBAR_IMG} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-mg-surface via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <p className="font-headline font-bold text-xl uppercase italic tracking-tighter text-mg-text">Engineered for Excellence.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmation && booking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-mg-dark/90 backdrop-blur-md" data-testid="step-confirmation">
          <div className="bg-mg-surface-card max-w-2xl w-full p-12 border-t-8 border-mg-red relative overflow-hidden">
            <div className="absolute -right-20 -top-20 text-[200px] text-mg-red/5 font-black uppercase select-none font-headline">OK</div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-mg-red flex items-center justify-center mb-8">
                <CheckCircle size={36} weight="bold" className="text-white" />
              </div>
              <h2 className="font-headline text-5xl font-bold uppercase tracking-tighter mb-4 text-mg-text">
                Booking <span className="text-mg-red">Confirmed</span>
              </h2>
              <p className="font-body text-neutral-400 mb-10 max-w-md">
                The request has been logged. A Master Technician will review the specs and reach out for final alignment.
              </p>
              <div className="bg-mg-surface-bright p-6 mb-12 flex justify-between items-center border-l-4 border-mg-cyan">
                <div>
                  <span className="block font-label text-[10px] text-neutral-500 uppercase tracking-widest">Protocol ID</span>
                  <span className="font-headline text-xl font-bold text-mg-cyan">{booking.booking_code}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/garage')}
                  className="bg-mg-red text-white px-8 py-4 font-headline font-bold uppercase tracking-widest hover:brightness-110 transition-all"
                  data-testid="go-to-garage-btn"
                >
                  Return to Garage
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="border border-white/10 text-mg-text px-8 py-4 font-headline font-bold uppercase tracking-widest hover:bg-mg-surface-high transition-all"
                  data-testid="go-to-dashboard-btn"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
