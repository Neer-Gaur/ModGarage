import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { CheckCircle2, CreditCard, ChevronRight, ShieldCheck, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { apiError } from "@/lib/errors";
import api from "@/lib/api";
import { formatINR, formatDateLong } from "@/lib/format";

const SLOTS = ["09:00 - 11:00", "11:30 - 13:30", "14:00 - 16:00", "16:30 - 18:30"];

export const BookingDrawer = ({ open, onOpenChange, items = [], onBooked, directBuy }) => {
    const [step, setStep] = useState(0); // 0 calendar, 1 review, 2 payment, 3 receipt
    const [date, setDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
    const [slot, setSlot] = useState(SLOTS[1]);
    const [quote, setQuote] = useState(null);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [card, setCard] = useState({ number: "4242 4242 4242 4242", name: "DEMO USER", expiry: "12/29", cvc: "123" });

    const productIds = items.map((it) => it.product_id || it.id);

    useEffect(() => {
        if (!open) return;
        setStep(directBuy ? 2 : 0);
        setBooking(null);
    }, [open, directBuy]);

    useEffect(() => {
        const fetchQuote = async () => {
            if (!open || productIds.length === 0) return;
            try {
                const { data } = await api.post("/bookings/quote", {
                    product_ids: productIds,
                    scheduled_date: toDateStr(date),
                    scheduled_slot: slot,
                    exclude_install: directBuy,
                });
                setQuote(data);
            } catch (err) {
                setQuote(null);
            }
        };
        fetchQuote();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, JSON.stringify(productIds), directBuy]);

    const confirmBooking = async () => {
        setLoading(true);
        try {
            const { data } = await api.post("/bookings", {
                product_ids: productIds,
                scheduled_date: toDateStr(date),
                scheduled_slot: slot,
                exclude_install: directBuy,
            });
            setBooking(data);
            setStep(3);
            toast.success(directBuy ? "Purchase complete." : "Booking confirmed.");
            onBooked?.(data);
        } catch (err) {
            toast.error(apiError(err, directBuy ? "Purchase failed." : "Booking failed."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent data-testid="booking-drawer" side="right" className="w-full sm:max-w-xl bg-[var(--ms-surface-0)] border-l border-[var(--ms-border-color)] text-[var(--ms-text)] p-0 overflow-y-auto">
                <SheetHeader className="px-6 pt-6">
                    <SheetTitle className="ms-display text-2xl tracking-wider">
                        {step === 3 ? (directBuy ? "PURCHASE COMPLETE" : "BOOKING CONFIRMED") : (directBuy ? "SECURE CHECKOUT" : "BOOK INSTALLATION")}
                    </SheetTitle>
                    <p className="text-xs text-[var(--ms-text-muted)]">
                        {step === 0 && "Choose your install date and time slot."}
                        {step === 1 && "Review your build and confirm the quote."}
                        {step === 2 && (directBuy ? "Confirm and pay for your order." : "Secure mock checkout. No card is charged.")}
                        {step === 3 && (directBuy ? "Your order is confirmed." : "Save your receipt or add to calendar.")}
                    </p>
                </SheetHeader>

                <Stepper step={step} directBuy={directBuy} />

                <div className="px-6 pb-8">
                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.div key="s0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                                <div data-testid="booking-calendar" className="ms-surface rounded-xl p-3 flex justify-center">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(d) => d && setDate(d)}
                                        disabled={(d) => d < new Date(Date.now() - 24 * 60 * 60 * 1000)}
                                        className="text-[var(--ms-text)]"
                                    />
                                </div>
                                <div className="mt-4">
                                    <div className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)] mb-2">Time slot</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {SLOTS.map((s) => (
                                            <button
                                                key={s}
                                                data-testid={`booking-slot-${s.replace(/[^0-9]/g, "")}`}
                                                onClick={() => setSlot(s)}
                                                className={`px-3 py-2.5 rounded-lg text-sm border transition-all ${
                                                    slot === s
                                                        ? "border-[var(--ms-red)] bg-[rgba(227,24,55,0.08)] text-[var(--ms-red)] shadow-[var(--ms-glow-red)]"
                                                        : "border-[var(--ms-border-color)] bg-[var(--ms-surface-1)] text-[var(--ms-text-muted)] hover:border-[var(--ms-text-muted)]"
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button data-testid="booking-step-continue" onClick={() => setStep(1)} className="ms-button-primary ms-sheen w-full mt-6">
                                    Continue to review <ChevronRight className="h-4 w-4" />
                                </button>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                                <div className="space-y-3">
                                    {(quote?.products || []).map((p) => (
                                        <div key={p.id} className="ms-surface rounded-xl p-3 flex items-center gap-3">
                                            <div className="h-14 w-20 rounded-md overflow-hidden bg-black/30 shrink-0">
                                                <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[11px] uppercase text-[var(--ms-text-faint)] tracking-wider">{p.brand}</div>
                                                <div className="text-sm font-semibold truncate">{p.name}</div>
                                            </div>
                                            <div className="ml-auto text-sm font-semibold">{formatINR(p.sale_price ?? p.price)}</div>
                                        </div>
                                    ))}
                                    {!quote && <div className="ms-skeleton h-16 rounded-xl" />}
                                </div>
                                <div className="ms-surface rounded-xl p-4 mt-4 text-sm">
                                    <div className="flex justify-between py-1"><span className="text-[var(--ms-text-muted)]">Subtotal</span><span>{formatINR(quote?.subtotal)}</span></div>
                                    <div className="flex justify-between py-1"><span className="text-[var(--ms-text-muted)]">Installation (8%)</span><span>{formatINR(quote?.install_fee)}</span></div>
                                    <div className="flex justify-between py-1"><span className="text-[var(--ms-text-muted)]">Taxes (18% GST)</span><span>{formatINR(quote?.taxes)}</span></div>
                                    <div className="flex justify-between py-2 mt-1 border-t border-[var(--ms-border-color)] text-base font-semibold"><span>Total</span><span className="text-[var(--ms-red)]">{formatINR(quote?.total)}</span></div>
                                </div>
                                <div className="ms-surface rounded-xl p-4 mt-4 text-xs text-[var(--ms-text-muted)] flex items-start gap-2">
                                    <ShieldCheck className="h-4 w-4 text-[var(--ms-blue)] mt-0.5 shrink-0" />
                                    <span>Installation is performed at Mod Syndicate certified bays. 1-year workmanship warranty included.</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-6">
                                    <button onClick={() => setStep(0)} className="ms-button-secondary">Back</button>
                                    <button data-testid="booking-review-continue" onClick={() => setStep(2)} className="ms-button-primary ms-sheen">
                                        Proceed to payment <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                                <div className="ms-surface rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold inline-flex items-center gap-2"><CreditCard className="h-4 w-4 text-[var(--ms-blue)]" /> Card details</div>
                                        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-[rgba(0,163,255,0.08)] text-[var(--ms-blue)] border border-[rgba(0,163,255,0.35)]">Mock</span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <CardField label="Card number" value={card.number} onChange={(v) => setCard((c) => ({ ...c, number: v }))} colSpan />
                                        <CardField label="Name on card" value={card.name} onChange={(v) => setCard((c) => ({ ...c, name: v }))} />
                                        <CardField label="Expiry" value={card.expiry} onChange={(v) => setCard((c) => ({ ...c, expiry: v }))} />
                                        <CardField label="CVC" value={card.cvc} onChange={(v) => setCard((c) => ({ ...c, cvc: v }))} type="password" />
                                    </div>
                                </div>
                                <div className="text-[11px] text-[var(--ms-text-faint)] mt-2 inline-flex items-center gap-1"><Lock className="h-3 w-3" /> No real charge — mocked for demo.</div>
                                <div className="ms-surface rounded-xl p-4 mt-4 text-sm space-y-1.5">
                                    <div className="flex justify-between"><span className="text-[var(--ms-text-muted)]">Subtotal</span><span>{formatINR(quote?.subtotal)}</span></div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--ms-text-muted)]">Installation</span>
                                        <span>
                                            {directBuy ? (
                                                <span className="text-[var(--ms-success)] font-medium">₹0.00 (Excluded)</span>
                                            ) : (
                                                formatINR(quote?.install_fee)
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between"><span className="text-[var(--ms-text-muted)]">Taxes (18% GST)</span><span>{formatINR(quote?.taxes)}</span></div>
                                    <div className="flex justify-between pt-2 border-t border-[var(--ms-border-color)] font-semibold text-base"><span>Order total</span><span className="text-[var(--ms-red)]">{formatINR(quote?.total)}</span></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-6">
                                    <button onClick={() => directBuy ? onOpenChange(false) : setStep(1)} className="ms-button-secondary">{directBuy ? "Cancel" : "Back"}</button>
                                    <button data-testid="booking-mock-pay-button" disabled={loading} onClick={confirmBooking} className="ms-button-primary ms-sheen">
                                        {loading ? "Processing…" : `Pay ${formatINR(quote?.total)}`}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && booking && (
                            <motion.div key="s3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} data-testid="booking-receipt">
                                <div className="ms-surface rounded-xl p-5">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(46,229,157,0.10)] border border-[rgba(46,229,157,0.45)]">
                                            <CheckCircle2 className="h-5 w-5 text-[var(--ms-success)]" />
                                        </span>
                                        <div>
                                            <div className="ms-display text-xl tracking-wider">
                                                {directBuy ? "ORDER CONFIRMED" : "YOU'RE BOOKED IN"}
                                            </div>
                                            <div className="text-xs text-[var(--ms-text-muted)] ms-mono">{booking.booking_code}</div>
                                        </div>
                                    </div>
                                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                        {!directBuy && <Info label="Car" value={booking.car_model || "—"} />}
                                        {!directBuy && <Info label="Date" value={formatDateLong(booking.scheduled_date)} />}
                                        {!directBuy && <Info label="Slot" value={booking.scheduled_slot} />}
                                        <Info label="ETA" value={booking.delivery_eta || "—"} />
                                    </div>
                                    <div className="mt-5">
                                        <div className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)] mb-2">
                                            {directBuy ? "Items purchased" : "Mods selected"}
                                        </div>
                                        <div className="space-y-2">
                                            {booking.products_snapshot?.map((p) => (
                                                <div key={p.id} className="flex items-center justify-between text-sm">
                                                    <span className="truncate">{p.name}</span>
                                                    <span className="ms-mono text-[var(--ms-text-muted)]">{formatINR(p.sale_price ?? p.price)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-5 ms-spec-row"><span className="ms-spec-key">Subtotal</span><span className="ms-spec-val ms-mono">{formatINR(booking.subtotal)}</span></div>
                                    {!directBuy ? (
                                        <div className="ms-spec-row"><span className="ms-spec-key">Install + Taxes</span><span className="ms-spec-val ms-mono">{formatINR(booking.install_fee + booking.taxes)}</span></div>
                                    ) : (
                                        <div className="ms-spec-row"><span className="ms-spec-key">Taxes (18% GST)</span><span className="ms-spec-val ms-mono">{formatINR(booking.taxes)}</span></div>
                                    )}
                                    <div className="ms-spec-row"><span className="ms-spec-key">Total paid</span><span className="ms-spec-val ms-mono text-[var(--ms-red)]">{formatINR(booking.total)}</span></div>
                                </div>
                                <button data-testid="booking-close" onClick={() => onOpenChange(false)} className="ms-button-primary ms-sheen w-full mt-6">
                                    Done
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </SheetContent>
        </Sheet>
    );
};

const Stepper = ({ step, directBuy }) => {
    const labels = directBuy ? ["Payment", "Receipt"] : ["Calendar", "Review", "Payment", "Receipt"];
    const activeIndex = directBuy ? (step === 3 ? 1 : 0) : step;
    return (
        <div className="px-6 mt-4 mb-2 flex items-center gap-2">
            {labels.map((l, i) => (
                <div key={l} className="flex items-center gap-2 flex-1">
                    <div className={`h-1 flex-1 rounded-full ${i <= activeIndex ? "bg-[var(--ms-red)]" : "bg-[var(--ms-border-color)]"}`} />
                </div>
            ))}
        </div>
    );
};

const CardField = ({ label, value, onChange, colSpan, type = "text" }) => (
    <label className={`block ${colSpan ? "col-span-2" : ""}`}>
        <span className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)]">{label}</span>
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            type={type}
            className="mt-1 w-full bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)] rounded-lg px-3 py-2.5 text-sm ms-mono focus:border-[rgba(0,163,255,0.6)] focus:shadow-[var(--ms-glow-blue)] outline-none"
        />
    </label>
);

const Info = ({ label, value }) => (
    <div className="ms-surface-1 rounded-lg p-3">
        <div className="text-[10px] uppercase tracking-wider text-[var(--ms-text-faint)]">{label}</div>
        <div className="text-sm font-medium mt-0.5 truncate">{value}</div>
    </div>
);

const toDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};
