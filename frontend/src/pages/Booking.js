import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Check, MapPin, CalendarBlank, Receipt, CheckCircle } from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

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
      setStep(4);
      toast.success('Booking confirmed!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Booking failed');
    }
    setSubmitting(false);
  };

  const stepLabels = [
    { num: 1, label: 'Address', icon: MapPin },
    { num: 2, label: 'Schedule', icon: CalendarBlank },
    { num: 3, label: 'Review', icon: Receipt },
    { num: 4, label: 'Confirmed', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-mg-dark pt-24 pb-12 px-6" data-testid="booking-page">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="font-mono text-xs tracking-[0.3em] text-mg-red uppercase mb-3">Checkout</p>
          <h1 className="font-unbounded text-3xl md:text-4xl font-bold tracking-tight uppercase text-white">Book Modification</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-12">
          {stepLabels.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 flex items-center justify-center text-xs font-mono ${
                step > s.num ? 'bg-mg-red text-white' : step === s.num ? 'border border-mg-red text-mg-red' : 'border border-white/20 text-white/30'
              }`}>
                {step > s.num ? <Check size={14} weight="bold" /> : s.num}
              </div>
              <span className={`font-mono text-[10px] tracking-wider uppercase hidden md:block ${step >= s.num ? 'text-white/60' : 'text-white/20'}`}>
                {s.label}
              </span>
              {i < 3 && <div className={`w-8 h-[1px] ${step > s.num ? 'bg-mg-red' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Address */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6" data-testid="step-address">
            <h2 className="font-unbounded text-lg font-bold uppercase text-white">Pickup Address</h2>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Enter your full pickup address..."
              rows={4}
              className="w-full bg-[#0A0A0A] border border-white/10 px-4 py-3 text-white font-manrope text-sm focus:border-mg-red focus:outline-none transition-colors resize-none"
              data-testid="address-input"
            />
            <button
              onClick={() => { if (address.trim()) setStep(2); else toast.error('Enter an address'); }}
              className="w-full bg-mg-red text-white font-unbounded text-sm tracking-widest uppercase py-4 hover:bg-[#E62600] transition-colors disabled:opacity-30"
              disabled={!address.trim()}
              data-testid="next-to-schedule-btn"
            >
              Continue to Schedule
            </button>
          </div>
        )}

        {/* Step 2: Slot Selection */}
        {step === 2 && (
          <div className="animate-fade-in" data-testid="step-schedule">
            <h2 className="font-unbounded text-lg font-bold uppercase text-white mb-6">Select Date & Slot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/5">
              <div className="bg-mg-dark p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                  disabled={(date) => {
                    const ds = date.toISOString().split('T')[0];
                    return !availableDates.includes(ds);
                  }}
                  className="bg-mg-dark text-white [&_.rdp-day_selected]:bg-mg-red [&_.rdp-day_selected]:text-white"
                  data-testid="booking-calendar"
                />
              </div>
              <div className="bg-mg-dark p-4">
                <p className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase mb-4">
                  {dateStr ? `Slots for ${dateStr}` : 'Select a date'}
                </p>
                {daySlots.length === 0 && dateStr && (
                  <p className="text-white/20 font-manrope text-sm">No slots available</p>
                )}
                <div className="space-y-2">
                  {daySlots.map(slot => (
                    <button
                      key={slot.slot_id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full p-4 border text-left transition-all ${
                        selectedSlot?.slot_id === slot.slot_id
                          ? 'border-mg-red bg-mg-red/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      data-testid={`slot-${slot.slot_id}`}
                    >
                      <span className="font-mono text-sm text-white">{slot.start_time} - {slot.end_time}</span>
                      <span className="font-mono text-[10px] text-white/30 ml-4">
                        {slot.capacity - (slot.booked_count || 0)} spots left
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => { if (selectedSlot) setStep(3); else toast.error('Select a time slot'); }}
              className="w-full bg-mg-red text-white font-unbounded text-sm tracking-widest uppercase py-4 hover:bg-[#E62600] transition-colors mt-6 disabled:opacity-30"
              disabled={!selectedSlot}
              data-testid="next-to-review-btn"
            >
              Review Booking
            </button>
          </div>
        )}

        {/* Step 3: Price Breakdown */}
        {step === 3 && (
          <div className="animate-fade-in" data-testid="step-review">
            <h2 className="font-unbounded text-lg font-bold uppercase text-white mb-6">Price Breakdown</h2>
            <div className="border border-white/10 bg-mg-surface/20 font-mono text-sm">
              <div className="px-6 py-3 border-b border-white/10">
                <span className="text-[10px] tracking-[0.2em] text-white/30 uppercase">Order Summary</span>
              </div>
              {garageItems.map(item => (
                <div key={item.item_id} className="px-6 py-3 border-b border-white/5 flex justify-between">
                  <span className="text-white/70">{item.product?.name} x{item.quantity}</span>
                  <span className="text-white">{formatINR((item.product?.price || 0) * item.quantity)}</span>
                </div>
              ))}
              <div className="px-6 py-3 border-b border-white/5 flex justify-between">
                <span className="text-white/40">Parts Subtotal</span>
                <span className="text-white">{formatINR(total.total_parts)}</span>
              </div>
              <div className="px-6 py-3 border-b border-white/5 flex justify-between">
                <span className="text-white/40">Labour & Installation</span>
                <span className="text-white">{formatINR(total.total_labour)}</span>
              </div>
              <div className="px-6 py-4 flex justify-between bg-mg-surface/30">
                <span className="text-white font-bold uppercase tracking-wider text-xs">Total</span>
                <span className="text-mg-red text-lg font-bold">{formatINR(total.total)}</span>
              </div>
            </div>

            <div className="mt-6 border border-white/10 p-4 font-mono text-xs">
              <div className="flex justify-between mb-2">
                <span className="text-white/30">Pickup</span>
                <span className="text-white/60">{address}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-white/30">Date</span>
                <span className="text-white/60">{dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">Slot</span>
                <span className="text-white/60">{selectedSlot?.start_time} - {selectedSlot?.end_time}</span>
              </div>
            </div>

            <button
              onClick={handleBook}
              disabled={submitting}
              className="w-full bg-mg-red text-white font-unbounded text-sm tracking-widest uppercase py-4 hover:bg-[#E62600] transition-colors mt-6 glow-red disabled:opacity-50"
              data-testid="confirm-booking-btn"
            >
              {submitting ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && booking && (
          <div className="animate-fade-in text-center py-12" data-testid="step-confirmation">
            <div className="w-16 h-16 border-2 border-mg-green flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} weight="bold" className="text-mg-green" />
            </div>
            <h2 className="font-unbounded text-2xl font-bold uppercase text-white mb-2">Booking Confirmed</h2>
            <p className="font-mono text-lg text-mg-red tracking-wider mb-8">{booking.booking_code}</p>

            <div className="border border-white/10 p-6 text-left font-mono text-xs max-w-sm mx-auto mb-8">
              <div className="flex justify-between mb-3">
                <span className="text-white/30">Status</span>
                <span className="text-mg-green uppercase">{booking.status}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-white/30">Items</span>
                <span className="text-white/60">{booking.items?.length} parts</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-white/30">Total</span>
                <span className="text-mg-red font-bold">{formatINR(booking.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">Pickup</span>
                <span className="text-white/60 text-right max-w-[200px]">{booking.pickup_address}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="bg-mg-red text-white font-unbounded text-xs tracking-widest uppercase px-8 py-3 hover:bg-[#E62600] transition-colors"
              data-testid="go-to-dashboard-btn"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
