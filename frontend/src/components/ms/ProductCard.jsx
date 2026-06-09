import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Star, ShieldCheck, Zap, Check } from "lucide-react";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { apiError } from "@/lib/errors";

export const ProductCard = ({ product, onAdded }) => {
    const { user, openAuth, isInGarage, addProductToGarage } = useAuth();
    const navigate = useNavigate();
    const [adding, setAdding] = React.useState(false);
    const inGarage = !!user && isInGarage(product.id);

    const doAdd = async () => {
        try {
            await addProductToGarage(product.id);
            toast.success(`${product.name} parked in your garage.`);
            onAdded?.();
        } catch (err) {
            toast.error(apiError(err, "Could not add to garage."));
        }
    };

    const handleClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (inGarage) {
            navigate("/garage");
            return;
        }
        if (!user) {
            openAuth("login", async () => {
                try {
                    await addProductToGarage(product.id);
                    toast.success(`${product.name} parked in your garage.`);
                    onAdded?.();
                } catch (err) {
                    toast.error(apiError(err, "Could not add to garage."));
                }
            });
            toast("Login required to add to garage.");
            return;
        }
        setAdding(true);
        try {
            await doAdd();
        } finally {
            setAdding(false);
        }
    };

    const price = product.sale_price ?? product.price;
    const hasSale = !!product.sale_price && product.sale_price < product.price;

    return (
        <Link
            to={`/marketplace/${product.id}`}
            data-testid="product-card"
            className="group relative block rounded-xl ms-surface overflow-hidden transition-colors hover:border-[rgba(255,42,42,0.35)] hover:shadow-[var(--ms-glow-red)]"
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-[var(--ms-bg-1)]">
                <img
                    src={product.images?.[0]}
                    alt={product.name}
                    loading="lazy"
                    className="ms-card-img absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                    {hasSale && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-[rgba(255,42,42,0.16)] text-[var(--ms-red)] border border-[rgba(255,42,42,0.35)] font-semibold">
                            Sale
                        </span>
                    )}
                    {product.tags?.includes("new") && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-[rgba(0,163,255,0.10)] text-[var(--ms-blue)] border border-[rgba(0,163,255,0.45)] font-semibold">
                            New
                        </span>
                    )}
                    {product.tags?.includes("hot") && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-black/50 text-white border border-white/15 font-semibold inline-flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Hot
                        </span>
                    )}
                </div>
                {inGarage && (
                    <span data-testid="product-card-in-garage-badge" className="absolute top-2 right-2 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-[rgba(46,229,157,0.10)] text-[var(--ms-success)] border border-[rgba(46,229,157,0.45)] font-semibold inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> In Garage
                    </span>
                )}
                <motion.button
                    data-testid={inGarage ? "product-card-in-garage" : "product-card-add-to-garage"}
                    onClick={handleClick}
                    disabled={adding}
                    initial={false}
                    className={`absolute bottom-3 right-3 left-3 ms-sheen opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ${
                        inGarage ? "ms-button-secondary" : "ms-button-primary"
                    }`}
                    aria-label={inGarage ? "View in garage" : "Add to Garage"}
                >
                    {inGarage ? (
                        <>
                            <Check className="h-4 w-4 text-[var(--ms-success)]" /> {"Added · View garage"}
                        </>
                    ) : (
                        <>
                            <Plus className="h-4 w-4" /> {adding ? "Adding…" : "Add to Garage"}
                        </>
                    )}
                </motion.button>
            </div>
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="text-[11px] tracking-wider uppercase text-[var(--ms-text-faint)]">{product.brand}</div>
                        <div className="font-semibold text-sm sm:text-[15px] text-[var(--ms-text)] truncate">{product.name}</div>
                    </div>
                    <div className="shrink-0 inline-flex items-center gap-1 text-xs text-[var(--ms-text-muted)]">
                        <Star className="h-3.5 w-3.5 text-[var(--ms-warning)]" /> {product.rating}
                    </div>
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {product.fitment?.slice(0, 2).map((f) => (
                        <span key={f} className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border border-[rgba(0,163,255,0.35)] text-[var(--ms-blue)] bg-[rgba(0,163,255,0.06)]">
                            <ShieldCheck className="h-3 w-3" /> {f}
                        </span>
                    ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2 min-w-0">
                        <span data-testid="product-card-price" className="text-base font-semibold text-[var(--ms-text)]">{formatINR(price)}</span>
                        {hasSale && (
                            <span className="text-xs text-[var(--ms-text-faint)] line-through">{formatINR(product.price)}</span>
                        )}
                    </div>
                    {inGarage && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--ms-success)]">
                            <Check className="h-3 w-3" /> Added
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};
