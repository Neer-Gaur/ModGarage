import React, { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/ms/ProductCard";
import { Reveal } from "@/components/ms/Reveal";
import api from "@/lib/api";

const CATEGORY_LABELS = {
    all: "All Products",
    wheels: "Alloy Wheels",
    spoilers: "Spoilers",
    splitters: "Splitters",
    wraps: "Wraps",
    ppf: "PPF Coating",
    ceramic: "Ceramic Coating",
    music: "Music Systems",
    lighting: "Ambient Light",
    seats: "Seat Covers",
    mats: "Seat Mats",
    covers: "Car Covers",
    exhausts: "Exhausts",
    accessories: "Accessories",
};

const FITMENTS = ["all", "Universal (All Cars)"];
const SORTS = [
    { id: "new", label: "Newest" },
    { id: "price_asc", label: "Price ↑" },
    { id: "price_desc", label: "Price ↓" },
    { id: "rating", label: "Top Rated" },
];

export default function Marketplace() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cats, setCats] = useState([]);
    const [filters, setFilters] = useState({ category: "all", fitment: "all", search: "", sort: "new" });
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    useEffect(() => {
        api.get("/products/categories").then(({ data }) => setCats(data)).catch(() => {});
    }, []);

    useEffect(() => {
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const params = {};
                if (filters.category !== "all") params.category = filters.category;
                if (filters.fitment !== "all") params.fitment = filters.fitment;
                if (filters.search) params.search = filters.search;
                if (filters.sort) params.sort = filters.sort;
                const { data } = await api.get("/products", { params });
                setProducts(data);
            } finally {
                setLoading(false);
            }
        }, 200);
        return () => clearTimeout(t);
    }, [filters]);

    const categoryOptions = useMemo(() => ["all", ...cats], [cats]);

    return (
        <main data-testid="marketplace-page" className="relative">
            <section className="ms-container pt-10 pb-6">
                <Reveal>
                    <div className="text-[11px] uppercase tracking-widest text-[var(--ms-blue)]">// Marketplace</div>
                    <h1 className="ms-display ms-h2 mt-2">SHOP THE BUILD CATALOGUE</h1>
                    <p className="mt-2 text-[var(--ms-text-muted)] max-w-2xl">Curated parts, wraps and programs — every SKU vetted by our build engineers.</p>
                </Reveal>

                <div className="mt-6 flex flex-col lg:flex-row gap-3 lg:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ms-text-faint)]" />
                        <input
                            data-testid="marketplace-search"
                            value={filters.search}
                            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                            placeholder="Search wraps, wheels, ECU…"
                            className="w-full bg-[var(--ms-surface-0)] border border-[var(--ms-border-color)] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[var(--ms-text)] focus:border-[var(--ms-blue)] focus:shadow-[var(--ms-glow-blue)] outline-none"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto ms-hide-scroll">
                        <button onClick={() => setMobileFilterOpen(true)} className="lg:hidden ms-button-secondary ms-sheen">
                            <SlidersHorizontal className="h-4 w-4" /> Filters
                        </button>
                        <div className="hidden lg:flex gap-2">
                            {SORTS.map((s) => (
                                <button
                                    key={s.id}
                                    data-testid={`sort-${s.id}`}
                                    onClick={() => setFilters((f) => ({ ...f, sort: s.id }))}
                                    className={`px-3 py-2 rounded-lg text-xs uppercase tracking-wider border transition-all ${
                                        filters.sort === s.id
                                            ? "border-[var(--ms-blue)] bg-[var(--ms-blue)] text-white shadow-[var(--ms-glow-blue)] font-semibold"
                                            : "border-[var(--ms-border-color)] text-[var(--ms-text-muted)] hover:text-[var(--ms-text)] hover:border-[var(--ms-text-muted)]"
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Category chips */}
                <div className="mt-4 flex gap-2 overflow-x-auto ms-hide-scroll">
                    {categoryOptions.map((c) => (
                        <button
                            key={c}
                            data-testid={`category-${c}`}
                            onClick={() => setFilters((f) => ({ ...f, category: c }))}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border transition-all ${
                                filters.category === c
                                    ? "border-[var(--ms-red)] bg-[var(--ms-red)] text-white shadow-[var(--ms-glow-red)] font-semibold"
                                    : "border-[var(--ms-border-color)] text-[var(--ms-text-muted)] hover:text-[var(--ms-text)] hover:border-[var(--ms-text-muted)]"
                            }`}
                        >
                            {CATEGORY_LABELS[c] || c}
                        </button>
                    ))}
                </div>
            </section>

            <section className="ms-container pb-20 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Filter rail desktop */}
                <aside className="hidden lg:block lg:col-span-3">
                    <FilterRail filters={filters} setFilters={setFilters} categories={categoryOptions} />
                </aside>

                {/* Grid */}
                <div className="lg:col-span-9">
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="ms-skeleton aspect-[4/5] rounded-xl" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="ms-surface rounded-xl p-10 text-center">
                            <div className="ms-display text-2xl tracking-wider">NOTHING IN THE BAY</div>
                            <p className="text-sm text-[var(--ms-text-muted)] mt-2">Try clearing filters or searching for something else.</p>
                            <button onClick={() => setFilters({ category: "all", fitment: "all", search: "", sort: "new" })} className="mt-4 ms-button-secondary ms-sheen">
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                            {products.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Mobile filter drawer */}
            {mobileFilterOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setMobileFilterOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm bg-[var(--ms-surface-0)] border-l border-[var(--ms-border-color)] p-5 overflow-y-auto text-[var(--ms-text)] shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="ms-display text-xl">FILTERS</div>
                            <button onClick={() => setMobileFilterOpen(false)} className="h-9 w-9 grid place-items-center rounded-lg border border-[var(--ms-border-color)] text-[var(--ms-text)]">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="mt-4">
                            <FilterRail filters={filters} setFilters={setFilters} categories={categoryOptions} />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

const FilterRail = ({ filters, setFilters, categories }) => (
    <div className="ms-surface rounded-xl p-4 text-[var(--ms-text)]">
        <div className="text-[11px] uppercase tracking-widest text-[var(--ms-text-muted)] font-semibold">// Category</div>
        <div className="mt-2 space-y-1.5">
            {categories.map((c) => (
                <button
                    key={c}
                    onClick={() => setFilters((f) => ({ ...f, category: c }))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                        filters.category === c ? "border-[var(--ms-red)] bg-[var(--ms-red)] text-white font-semibold" : "border-transparent text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]"
                    }`}
                >
                    {CATEGORY_LABELS[c] || c}
                </button>
            ))}
        </div>
        <div className="mt-5 text-[11px] uppercase tracking-widest text-[var(--ms-text-muted)] font-semibold">// Fitment</div>
        <div className="mt-2 space-y-1.5">
            {FITMENTS.map((f) => (
                <button
                    key={f}
                    onClick={() => setFilters((s) => ({ ...s, fitment: f }))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                        filters.fitment === f ? "border-[var(--ms-blue)] bg-[var(--ms-blue)] text-white font-semibold" : "border-transparent text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]"
                    }`}
                >
                    {f === "all" ? "All cars" : f}
                </button>
            ))}
        </div>
        <div className="mt-5 text-[11px] uppercase tracking-widest text-[var(--ms-text-muted)] font-semibold">// Sort by</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
            {SORTS.map((s) => (
                <button
                    key={s.id}
                    onClick={() => setFilters((f) => ({ ...f, sort: s.id }))}
                    className={`px-3 py-2 rounded-lg text-xs uppercase tracking-wider border transition-colors ${
                        filters.sort === s.id ? "border-[var(--ms-text)] bg-[var(--ms-text)] text-white font-semibold" : "border-[var(--ms-border-color)] text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]"
                    }`}
                >
                    {s.label}
                </button>
            ))}
        </div>
    </div>
);
