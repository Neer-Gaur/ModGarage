import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Wrench, ChevronRight, Car as CarIcon, Receipt, Sparkles } from "lucide-react";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/ms/Reveal";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { formatINR, formatDateLong } from "@/lib/format";

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [garage, setGarage] = useState([]);
    const [recommended, setRecommended] = useState([]);

    useEffect(() => {
        if (!user) return;
        if (!user.onboarded) {
            navigate("/onboarding");
            return;
        }
        Promise.all([api.get("/bookings"), api.get("/garage"), api.get("/products", { params: { sort: "rating", limit: 6 } })])
            .then(([b, g, r]) => {
                setBookings(b.data);
                setGarage(g.data);
                setRecommended(r.data);
            })
            .catch(() => {});
    }, [user, navigate]);

    if (!user) return null;

    const activeBooking = bookings.find((b) => ["pending", "confirmed", "in_progress"].includes(b.status));

    return (
        <main data-testid="dashboard-page" className="ms-container py-10">
            <Reveal>
                <div className="text-[11px] uppercase tracking-widest text-[var(--ms-red)]">// Dashboard</div>
                <h1 className="ms-display ms-h2 mt-2">WELCOME BACK, {(user.name || user.email || "DRIVER").toUpperCase()}.</h1>
                <p className="mt-2 text-[var(--ms-text-muted)]">Your car, your bookings, your next move.</p>
            </Reveal>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Car summary */}
                <Reveal className="lg:col-span-7">
                    <div className="ms-surface rounded-2xl overflow-hidden">
                        <div className="relative aspect-[16/9] bg-black/30">
                            {user.car_photo_url ? (
                                <img src={user.car_photo_url} alt="Your car" className="absolute inset-0 h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full grid place-items-center text-[var(--ms-text-faint)]"><CarIcon className="h-10 w-10" /></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                                <div className="text-[10px] uppercase tracking-wider text-white/70">{user.city || "City unset"}</div>
                                <div className="ms-display text-3xl tracking-wider">{(user.car_model || "Your car").toUpperCase()}</div>
                                <div className="text-xs text-white/80">{[user.car_color, user.car_year].filter(Boolean).join(" · ") || "—"}</div>
                            </div>
                        </div>
                        <div className="p-5 grid grid-cols-3 gap-3">
                            <Stat label="Garage" value={garage.length} />
                            <Stat label="Bookings" value={bookings.length} />
                            <Stat label="Spent" value={formatINR(bookings.reduce((a, b) => a + (b.total || 0), 0))} />
                        </div>
                    </div>
                </Reveal>

                {/* Active booking */}
                <Reveal className="lg:col-span-5">
                    <div className="ms-surface rounded-2xl p-6 h-full">
                        <div className="text-[11px] uppercase tracking-widest text-[var(--ms-blue)] inline-flex items-center gap-2">
                            <CalendarIcon className="h-3 w-3" /> Active booking
                        </div>
                        {activeBooking ? (
                            <>
                                <div className="ms-display text-2xl tracking-wider mt-2">{activeBooking.booking_code}</div>
                                <div className="text-sm text-[var(--ms-text-muted)] mt-1">{formatDateLong(activeBooking.scheduled_date)} · {activeBooking.scheduled_slot}</div>
                                <div className="mt-3 space-y-1 text-sm">
                                    {activeBooking.products_snapshot?.slice(0, 3).map((p) => (
                                        <div key={p.id} className="flex justify-between">
                                            <span className="truncate">{p.name}</span>
                                            <span className="ms-mono text-[var(--ms-text-muted)]">{formatINR(p.sale_price ?? p.price)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="ms-spec-row mt-4"><span className="ms-spec-key">Total paid</span><span className="ms-spec-val ms-mono text-[var(--ms-red)]">{formatINR(activeBooking.total)}</span></div>
                                <div className="ms-spec-row"><span className="ms-spec-key">Status</span><span className="ms-spec-val capitalize">{activeBooking.status}</span></div>
                                <div className="ms-spec-row"><span className="ms-spec-key">ETA</span><span className="ms-spec-val">{activeBooking.delivery_eta || "—"}</span></div>
                            </>
                        ) : (
                            <div className="mt-3">
                                <p className="text-sm text-[var(--ms-text-muted)]">No active bookings. Save mods from the marketplace and book an install slot from your garage.</p>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <Link to="/marketplace" className="ms-button-secondary ms-sheen w-full justify-center">Browse marketplace</Link>
                                    <Link to="/garage" className="ms-button-primary ms-sheen w-full justify-center">Open my garage</Link>
                                </div>
                            </div>
                        )}
                    </div>
                </Reveal>
            </div>

            {/* Booking history */}
            <Reveal className="mt-8">
                <div className="ms-surface rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-[11px] uppercase tracking-widest text-[var(--ms-red)] inline-flex items-center gap-2"><Receipt className="h-3 w-3" /> Booking history</div>
                        <Link to="/garage" className="text-xs text-[var(--ms-text-muted)] hover:text-[var(--ms-text)] inline-flex items-center gap-1">Open garage <ChevronRight className="h-3 w-3" /></Link>
                    </div>
                    {bookings.length === 0 ? (
                        <div className="mt-6 text-sm text-[var(--ms-text-muted)]">No bookings yet.</div>
                    ) : (
                        <div className="mt-4 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[var(--ms-text-faint)] uppercase tracking-wider text-[10px]">
                                        <th className="py-2">Booking</th>
                                        <th className="py-2">Date</th>
                                        <th className="py-2">Total</th>
                                        <th className="py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b.id} className="border-t border-[var(--ms-border-color)]">
                                            <td className="py-3 ms-mono text-[var(--ms-text)]">{b.booking_code}</td>
                                            <td className="py-3 text-[var(--ms-text-muted)]">{formatDateLong(b.scheduled_date)}</td>
                                            <td className="py-3 text-[var(--ms-text)]">{formatINR(b.total)}</td>
                                            <td className="py-3 capitalize text-[var(--ms-text-muted)]">{b.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Reveal>

            {/* Recommended */}
            <Reveal className="mt-8">
                <div className="flex items-center justify-between">
                    <div className="text-[11px] uppercase tracking-widest text-[var(--ms-blue)] inline-flex items-center gap-2"><Sparkles className="h-3 w-3" /> Recommended for you</div>
                    <Link to="/marketplace" className="text-xs text-[var(--ms-text-muted)] hover:text-[var(--ms-text)] inline-flex items-center gap-1">See all <ChevronRight className="h-3 w-3" /></Link>
                </div>
                <StaggerContainer className="mt-4 flex gap-4 overflow-x-auto ms-hide-scroll pb-2">
                    {recommended.map((p) => (
                        <StaggerItem key={p.id} className="min-w-[260px]">
                            <Link to={`/marketplace/${p.id}`} className="block ms-surface rounded-xl overflow-hidden h-full">
                                <div className="aspect-[4/3] bg-black/30"><img src={p.images?.[0]} alt={p.name} className="ms-card-img h-full w-full object-cover" /></div>
                                <div className="p-3">
                                    <div className="text-[10px] uppercase tracking-wider text-[var(--ms-text-faint)]">{p.brand}</div>
                                    <div className="text-sm font-semibold mt-0.5 truncate">{p.name}</div>
                                    <div className="text-sm text-[var(--ms-text)] mt-1">{formatINR(p.sale_price ?? p.price)}</div>
                                </div>
                            </Link>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </Reveal>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link to="/garage" className="ms-button-primary ms-sheen"><Wrench className="h-4 w-4" /> Open My Garage</Link>
                <Link to="/marketplace" className="ms-button-secondary ms-sheen">Explore marketplace</Link>
            </div>
        </main>
    );
}

const Stat = ({ label, value }) => (
    <div className="ms-surface-1 rounded-lg p-3">
        <div className="text-[10px] uppercase tracking-wider text-[var(--ms-text-faint)]">{label}</div>
        <div className="text-base font-semibold mt-0.5 text-[var(--ms-text)]">{value}</div>
    </div>
);
