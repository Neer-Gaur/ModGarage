import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trash2, Wrench, ShoppingBag, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/ms/Reveal";
import { BookingDrawer } from "@/components/ms/BookingDrawer";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatINR } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Garage() {
    const { user, removeProductFromGarage } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(new Set());
    const [bookingOpen, setBookingOpen] = useState(false);
    const [directBuy, setDirectBuy] = useState(false);
    const [searchParams] = useSearchParams();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/garage");
            setItems(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (user) load(); }, [user, load]);

    useEffect(() => {
        if (searchParams.get("install") === "1" && items.length > 0) {
            setSelected(new Set(items.map((it) => it.product_id)));
            setBookingOpen(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length]);

    const toggle = (pid) => {
        setSelected((s) => {
            const next = new Set(s);
            if (next.has(pid)) next.delete(pid);
            else next.add(pid);
            return next;
        });
    };

    const remove = async (itemId) => {
        try {
            const item = items.find((i) => i.id === itemId);
            await api.delete(`/garage/${itemId}`);
            setItems((it) => it.filter((i) => i.id !== itemId));
            if (item) removeProductFromGarage(item.product_id);
            toast.success("Removed from garage.");
        } catch {
            toast.error("Could not remove.");
        }
    };

    const openBookingWith = (productId) => {
        setDirectBuy(false);
        setSelected(new Set([productId]));
        setBookingOpen(true);
    };

    const openDirectPurchase = (productId) => {
        setDirectBuy(true);
        setSelected(new Set([productId]));
        setBookingOpen(true);
    };

    const openBookingMulti = () => {
        setDirectBuy(false);
        if (selected.size === 0) {
            setSelected(new Set(items.filter((i) => i.status !== "installed").map((i) => i.product_id)));
        }
        setBookingOpen(true);
    };

    if (!user) return null;

    const saved = items.filter((i) => i.status === "saved");
    const installed = items.filter((i) => i.status === "installed");

    const selectedItems = items.filter((i) => selected.has(i.product_id));

    return (
        <main data-testid="garage-page" className="ms-container py-10">
            <Reveal>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <div className="text-[11px] uppercase tracking-widest text-[var(--ms-red)]">// My Garage</div>
                        <h1 className="ms-display ms-h2 mt-2">YOUR BUILD WALL</h1>
                        <p className="mt-2 text-[var(--ms-text-muted)] max-w-xl">Every mod you've saved. Combine multiple parts into one install booking and let our bays handle it.</p>
                    </div>
                    {items.length > 0 && (
                        <button data-testid="garage-install-selected" onClick={openBookingMulti} className="ms-button-primary ms-sheen">
                            <Wrench className="h-4 w-4" /> Install {selected.size || "all"} item{(selected.size || items.length) === 1 ? "" : "s"}
                        </button>
                    )}
                </div>
            </Reveal>

            <Tabs defaultValue="saved" className="mt-6">
                <TabsList className="bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)]">
                    <TabsTrigger data-testid="garage-tab-saved" value="saved">Saved ({saved.length})</TabsTrigger>
                    <TabsTrigger data-testid="garage-tab-installed" value="installed">Installed ({installed.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="saved" className="mt-6">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="ms-skeleton h-44 rounded-xl" />))}
                        </div>
                    ) : saved.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {saved.map((it) => (
                                <StaggerItem key={it.id}>
                                    <GarageTile item={it} selected={selected.has(it.product_id)} onToggle={() => toggle(it.product_id)} onRemove={() => remove(it.id)} onInstall={() => openBookingWith(it.product_id)} onBuyNow={() => openDirectPurchase(it.product_id)} />
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    )}
                </TabsContent>
                <TabsContent value="installed" className="mt-6">
                    {installed.length === 0 ? (
                        <div className="ms-surface rounded-xl p-8 text-center text-sm text-[var(--ms-text-muted)]">Nothing installed yet. Once we install mods on your build they'll show up here.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {installed.map((it) => (
                                <GarageTile key={it.id} item={it} installed onRemove={() => remove(it.id)} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <BookingDrawer
                open={bookingOpen}
                onOpenChange={(o) => {
                    setBookingOpen(o);
                    if (!o) {
                        load();
                        setDirectBuy(false);
                    }
                }}
                items={selectedItems.length ? selectedItems : items.filter((i) => i.status !== "installed")}
                onBooked={() => load()}
                directBuy={directBuy}
            />
        </main>
    );
}

const GarageTile = ({ item, selected, onToggle, onRemove, onInstall, onBuyNow, installed }) => {
    const p = item.product || {};
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`relative ms-surface rounded-2xl overflow-hidden ${selected ? "ring-1 ring-[var(--ms-red)] shadow-[var(--ms-glow-red)]" : ""}`}
            data-testid="garage-tile"
        >
            <div className="flex gap-3 p-3">
                <div className="relative h-24 w-32 rounded-lg overflow-hidden bg-black/30 shrink-0">
                    <img src={p.images?.[0]} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--ms-text-faint)]">{p.brand}</div>
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-sm text-[var(--ms-text)] mt-1">{formatINR(p.sale_price ?? p.price)}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {!installed ? (
                            <>
                                <button data-testid="garage-tile-install" onClick={onInstall} className="ms-button-primary ms-sheen h-9 px-3 text-xs">
                                    <Wrench className="h-3.5 w-3.5" /> Install with us
                                </button>
                                <button data-testid="garage-tile-buy-now" onClick={onBuyNow} className="ms-button-secondary ms-sheen h-9 px-3 text-xs">
                                    <ShoppingBag className="h-3.5 w-3.5" /> Buy now
                                </button>
                                {onToggle && (
                                    <button onClick={onToggle} className={`h-9 px-3 text-xs rounded-lg border ${selected ? "border-[var(--ms-red)] text-[var(--ms-red)] bg-[rgba(255,42,42,0.10)]" : "border-[var(--ms-border-color)] text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]"}`}>
                                        {selected ? "Selected" : "Select"}
                                    </button>
                                )}
                            </>
                        ) : (
                            <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-[rgba(46,229,157,0.10)] text-[var(--ms-success)] border border-[rgba(46,229,157,0.45)]">
                                Installed
                            </span>
                        )}
                        <button data-testid="garage-tile-remove" onClick={onRemove} aria-label="Remove" className="ms-button-secondary h-9 w-9 grid place-items-center">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
            <span className="ms-tile-stroke" />
        </motion.div>
    );
};

const EmptyState = () => (
    <div className="ms-surface rounded-2xl p-10 text-center">
        <div className="ms-display text-2xl tracking-wider">YOUR GARAGE IS EMPTY</div>
        <p className="text-sm text-[var(--ms-text-muted)] mt-2">Add mods from the marketplace to start your build.</p>
        <Link to="/marketplace" className="ms-button-primary ms-sheen mt-5 inline-flex">
            <Plus className="h-4 w-4" /> Browse marketplace
        </Link>
    </div>
);
