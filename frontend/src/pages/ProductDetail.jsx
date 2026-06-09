import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, ShieldCheck, Star, Wrench, ChevronRight, Zap, Check } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/errors";
import api from "@/lib/api";
import { formatINR } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Reveal } from "@/components/ms/Reveal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, openAuth, isInGarage, addProductToGarage } = useAuth();
    const [product, setProduct] = useState(null);
    const [active, setActive] = useState(0);
    const [adding, setAdding] = useState(false);
    const inGarage = !!user && isInGarage(id);

    useEffect(() => {
        let mounted = true;
        api.get(`/products/${id}`).then(({ data }) => { if (mounted) setProduct(data); }).catch(() => toast.error("Product not found"));
        return () => { mounted = false; };
    }, [id]);

    const addToGarage = async (opts = {}) => {
        if (inGarage) {
            if (opts.thenInstall) navigate("/garage?install=1");
            else navigate("/garage");
            return;
        }
        if (!user) {
            openAuth("login", async () => {
                try {
                    await addProductToGarage(id);
                    toast.success("Saved to your garage.");
                    if (opts.thenInstall) navigate("/garage?install=1");
                } catch (err) {
                    toast.error(apiError(err, "Could not add. Try again."));
                }
            });
            toast("Login required to save to garage.");
            return;
        }
        setAdding(true);
        try {
            await addProductToGarage(id);
            toast.success("Saved to your garage.");
            if (opts.thenInstall) navigate("/garage?install=1");
        } catch (err) {
            toast.error(apiError(err, "Could not add."));
        } finally {
            setAdding(false);
        }
    };

    if (!product) {
        return (
            <div className="ms-container py-20">
                <div className="ms-skeleton h-96 rounded-xl" />
            </div>
        );
    }

    const price = product.sale_price ?? product.price;
    const hasSale = !!product.sale_price && product.sale_price < product.price;

    return (
        <main data-testid="product-detail-page" className="ms-container py-8 sm:py-12">
            <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]">
                <ArrowLeft className="h-4 w-4" /> Back to marketplace
            </Link>

            <Reveal>
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Gallery */}
                    <div className="lg:col-span-7">
                        <div className="ms-surface rounded-2xl overflow-hidden aspect-[4/3] relative" data-carbon="true">
                            <img
                                src={product.images[active] || product.images[0]}
                                alt={product.name}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 flex gap-2">
                                {hasSale && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-[rgba(255,42,42,0.16)] text-[var(--ms-red)] border border-[rgba(255,42,42,0.35)] font-semibold">Sale</span>}
                                {product.tags?.includes("hot") && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-black/50 text-white border border-white/15 font-semibold inline-flex items-center gap-1"><Zap className="h-3 w-3" /> Hot</span>}
                            </div>
                        </div>
                        {product.images.length > 1 && (
                            <div className="mt-3 grid grid-cols-4 gap-2">
                                {product.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActive(i)}
                                        className={`relative aspect-[4/3] rounded-md overflow-hidden ms-surface ${active === i ? "ring-2 ring-[var(--ms-red)]" : ""}`}
                                    >
                                        <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Purchase panel */}
                    <div className="lg:col-span-5">
                        <div className="ms-surface rounded-2xl p-6">
                            <div className="text-[11px] uppercase tracking-widest text-[var(--ms-text-muted)]">{product.brand} · {product.category}</div>
                            <h1 className="ms-display text-3xl sm:text-4xl mt-1">{product.name.toUpperCase()}</h1>
                            <div className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--ms-text-muted)]">
                                <Star className="h-3.5 w-3.5 text-[var(--ms-warning)] fill-[var(--ms-warning)]" /> {product.rating} · {product.reviews_count} reviews
                            </div>
                            <div className="mt-4 flex items-baseline gap-3">
                                <span data-testid="product-price" className="text-3xl ms-display tracking-wider">{formatINR(price)}</span>
                                {hasSale && <span className="text-sm text-[var(--ms-text-faint)] line-through">{formatINR(product.price)}</span>}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {product.fitment?.map((f) => (
                                    <span key={f} className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider px-2 py-1 rounded-md border border-[rgba(0,163,255,0.35)] text-[var(--ms-blue)] bg-[rgba(0,163,255,0.06)]">
                                        <ShieldCheck className="h-3 w-3" /> {f}
                                    </span>
                                ))}
                            </div>
                            <p className="mt-4 text-sm text-[var(--ms-text-muted)] leading-relaxed">{product.description}</p>
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button data-testid="product-add-to-garage" disabled={adding} onClick={() => addToGarage()} className={`w-full justify-center ms-sheen ${inGarage ? "ms-button-secondary" : "ms-button-secondary"}`}>
                                    {inGarage ? (
                                        <>
                                            <Check className="h-4 w-4 text-[var(--ms-success)]" /> {"Added · View garage"}
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4" /> {adding ? "Adding…" : "Add to Garage"}
                                        </>
                                    )}
                                </button>
                                <button data-testid="product-install-with-us" onClick={() => addToGarage({ thenInstall: true })} className="ms-button-primary ms-sheen w-full justify-center">
                                    <Wrench className="h-4 w-4" /> {inGarage ? "Book install" : "Install with us"}
                                </button>
                            </div>
                            <div className="mt-5 ms-surface-1 rounded-lg p-3 text-xs text-[var(--ms-text-muted)] inline-flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-[var(--ms-blue)] mt-0.5 shrink-0" />
                                Verified install partners. 1-year workmanship warranty included.
                            </div>
                        </div>
                    </div>
                </div>
            </Reveal>

            <section className="mt-12">
                <Tabs defaultValue="specs">
                    <TabsList className="bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)]">
                        <TabsTrigger value="specs">Specs</TabsTrigger>
                        <TabsTrigger value="fitment">Fitment</TabsTrigger>
                        <TabsTrigger value="warranty">Warranty</TabsTrigger>
                    </TabsList>
                    <TabsContent value="specs" className="mt-4">
                        <div className="ms-surface rounded-xl p-4 max-w-2xl">
                            {Object.entries(product.specs || {}).map(([k, v]) => (
                                <div key={k} className="ms-spec-row">
                                    <span className="ms-spec-key capitalize">{k.replace(/_/g, " ")}</span>
                                    <span className="ms-spec-val ms-mono">{String(v)}</span>
                                </div>
                            ))}
                            {Object.keys(product.specs || {}).length === 0 && (
                                <div className="text-sm text-[var(--ms-text-muted)]">No specs available for this product.</div>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="fitment" className="mt-4">
                        <div className="ms-surface rounded-xl p-4 max-w-2xl text-sm text-[var(--ms-text-muted)]">
                            Confirmed fitment: {product.fitment?.join(", ") || "Universal"}. Need help confirming? Drop us a message via Contact.
                        </div>
                    </TabsContent>
                    <TabsContent value="warranty" className="mt-4">
                        <div className="ms-surface rounded-xl p-4 max-w-2xl text-sm text-[var(--ms-text-muted)]">
                            1-year workmanship warranty on install. Manufacturer warranty per product spec sheet.
                        </div>
                    </TabsContent>
                </Tabs>
            </section>

            <div className="mt-12 flex items-center justify-between">
                <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Link>
                <Link to="/community" className="inline-flex items-center gap-2 text-sm text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]">
                    Browse community builds <ChevronRight className="h-4 w-4" />
                </Link>
            </div>
        </main>
    );
}
