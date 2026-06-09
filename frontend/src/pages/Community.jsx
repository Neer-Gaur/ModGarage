import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Heart, MapPin, Calendar as CalIcon, Plus, Star, Quote, Camera } from "lucide-react";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/ms/Reveal";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { apiError } from "@/lib/errors";
import { formatDateLong } from "@/lib/format";
import api from "@/lib/api";

export default function Community() {
    const { user, openAuth } = useAuth();
    const [posts, setPosts] = useState([]);
    const [events, setEvents] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState({ title: "", body: "", image_url: "", car_model: "", tags: "" });
    const [submitting, setSubmitting] = useState(false);

    const load = async () => {
        const [p, e, r] = await Promise.all([
            api.get("/community/posts"),
            api.get("/community/events"),
            api.get("/community/reviews"),
        ]);
        setPosts(p.data);
        setEvents(e.data);
        setReviews(r.data);
    };
    useEffect(() => { load().catch(() => {}); }, []);

    const onCreate = async (e) => {
        e.preventDefault();
        if (!form.title) return toast.error("Add a title for your build.");
        setSubmitting(true);
        try {
            await api.post("/community/posts", {
                title: form.title,
                body: form.body,
                image_url: form.image_url || null,
                car_model: form.car_model || null,
                tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
            });
            toast.success("Build posted to community.");
            setForm({ title: "", body: "", image_url: "", car_model: "", tags: "" });
            setCreateOpen(false);
            await load();
        } catch (err) {
            toast.error(apiError(err, "Could not post."));
        } finally {
            setSubmitting(false);
        }
    };

    const likePost = async (id) => {
        try {
            await api.post(`/community/posts/${id}/like`);
            setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p)));
        } catch {}
    };

    return (
        <main data-testid="community-page" className="ms-container py-10">
            <Reveal>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <div className="text-[11px] uppercase tracking-widest text-[var(--ms-red)]">// Community</div>
                        <h1 className="ms-display ms-h2 mt-2">THE SYNDICATE FLOOR</h1>
                        <p className="mt-2 text-[var(--ms-text-muted)] max-w-xl">Builds, events and field reports from the crew.</p>
                    </div>
                    <button
                        data-testid="community-create-post"
                        onClick={() => { user ? setCreateOpen(true) : openAuth("login", () => setCreateOpen(true)); }}
                        className="ms-button-primary ms-sheen"
                    >
                        <Plus className="h-4 w-4" /> Post your build
                    </button>
                </div>
            </Reveal>

            <Tabs defaultValue="builds" className="mt-8">
                <TabsList className="bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)]">
                    <TabsTrigger data-testid="community-tab-builds" value="builds">Builds</TabsTrigger>
                    <TabsTrigger data-testid="community-tab-events" value="events">Events</TabsTrigger>
                    <TabsTrigger data-testid="community-tab-reviews" value="reviews">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="builds" className="mt-6">
                    {posts.length === 0 ? (
                        <div className="ms-skeleton h-72 rounded-xl" />
                    ) : (
                        <div className="ms-masonry">
                            {posts.map((p) => (
                                <article key={p.id} className="ms-surface rounded-xl overflow-hidden">
                                    {p.image_url && (
                                        <img src={p.image_url} alt={p.title} className="w-full h-auto block ms-card-img" />
                                    )}
                                    <div className="p-4">
                                        <div className="text-[10px] uppercase tracking-wider text-[var(--ms-text-faint)]">@{p.author_name}{p.car_model ? ` · ${p.car_model}` : ""}</div>
                                        <div className="ms-display text-lg tracking-wider mt-1">{p.title}</div>
                                        {p.body && <p className="text-sm text-[var(--ms-text-muted)] mt-2">{p.body}</p>}
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex gap-1 flex-wrap">
                                                {p.tags?.slice(0, 3).map((t) => (
                                                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--ms-border-color)] text-[var(--ms-text-muted)]">#{t}</span>
                                                ))}
                                            </div>
                                            <button onClick={() => likePost(p.id)} className="inline-flex items-center gap-1 text-xs text-[var(--ms-text-muted)] hover:text-[var(--ms-red)] transition-colors">
                                                <Heart className="h-3.5 w-3.5" /> {p.likes || 0}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map((ev) => (
                            <StaggerItem key={ev.id}>
                                <article className="ms-surface rounded-xl overflow-hidden group hover:border-[rgba(0,163,255,0.45)] hover:shadow-[var(--ms-glow-blue)] transition-all">
                                    <div className="aspect-[16/10] overflow-hidden bg-black/30">
                                        <img src={ev.image_url} alt={ev.title} className="ms-card-img w-full h-full object-cover" />
                                    </div>
                                    <div className="p-4">
                                        <div className="text-[10px] uppercase tracking-wider text-[var(--ms-blue)] inline-flex items-center gap-1"><CalIcon className="h-3 w-3" /> {formatDateLong(ev.date)} · {ev.time}</div>
                                        <div className="ms-display text-lg tracking-wider mt-1">{ev.title}</div>
                                        <div className="text-xs text-[var(--ms-text-muted)] mt-1 inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.venue}, {ev.city}</div>
                                        <p className="text-sm text-[var(--ms-text-muted)] mt-2">{ev.description}</p>
                                    </div>
                                </article>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {reviews.slice(0, 1).map((r) => (
                            <article key={r.id} className="ms-surface rounded-2xl overflow-hidden lg:col-span-7">
                                {r.image_url && <img src={r.image_url} alt="" className="w-full aspect-[16/9] object-cover" />}
                                <div className="p-6">
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: r.rating }).map((_, i) => (
                                            <Star key={i} className="h-3.5 w-3.5 text-[var(--ms-warning)] fill-[var(--ms-warning)]" />
                                        ))}
                                    </div>
                                    <div className="ms-display text-2xl tracking-wider mt-3">{r.title}</div>
                                    <p className="text-sm text-[var(--ms-text-muted)] mt-3 leading-relaxed">
                                        <Quote className="inline h-3.5 w-3.5 mr-1 text-[var(--ms-red)]" /> {r.body}
                                    </p>
                                    <div className="text-xs text-[var(--ms-text-faint)] uppercase tracking-wider mt-4">{r.author_name} · {r.target}</div>
                                </div>
                            </article>
                        ))}
                        <div className="lg:col-span-5 grid gap-4">
                            {reviews.slice(1, 5).map((r) => (
                                <article key={r.id} className="ms-surface rounded-xl p-4">
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: r.rating }).map((_, i) => (
                                            <Star key={i} className="h-3.5 w-3.5 text-[var(--ms-warning)] fill-[var(--ms-warning)]" />
                                        ))}
                                    </div>
                                    <div className="font-semibold text-sm mt-2">{r.title}</div>
                                    <p className="text-xs text-[var(--ms-text-muted)] mt-1 leading-relaxed line-clamp-3">{r.body}</p>
                                    <div className="text-[10px] text-[var(--ms-text-faint)] uppercase tracking-wider mt-2">{r.author_name} · {r.target}</div>
                                </article>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Create post modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg bg-[var(--ms-surface-0)] border border-[var(--ms-border-color)]">
                    <DialogTitle className="ms-display text-2xl tracking-wider">POST YOUR BUILD</DialogTitle>
                    <form onSubmit={onCreate} className="mt-3 space-y-3">
                        <Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="My Custom Build" testid="post-title" />
                        <Field label="Car model" value={form.car_model} onChange={(v) => setForm((f) => ({ ...f, car_model: v }))} placeholder="e.g. Hatchback / SUV" testid="post-car-model" />
                        <Field label="Image URL" value={form.image_url} onChange={(v) => setForm((f) => ({ ...f, image_url: v }))} placeholder="https://..." testid="post-image-url" />
                        <FieldArea label="Caption" value={form.body} onChange={(v) => setForm((f) => ({ ...f, body: v }))} placeholder="Drop the details of your build…" testid="post-body" />
                        <Field label="Tags (comma-separated)" value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} placeholder="wrap, wheels, custom" testid="post-tags" />
                        <button data-testid="post-submit" disabled={submitting} className="ms-button-primary ms-sheen w-full justify-center">
                            <Camera className="h-4 w-4" /> {submitting ? "Posting…" : "Post to community"}
                        </button>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}

const Field = ({ label, value, onChange, placeholder, testid }) => (
    <label className="block">
        <span className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)]">{label}</span>
        <input data-testid={testid} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)] rounded-lg px-3 py-2.5 text-sm focus:border-[rgba(255,42,42,0.6)] focus:shadow-[var(--ms-glow-red)] outline-none" />
    </label>
);
const FieldArea = ({ label, value, onChange, placeholder, testid }) => (
    <label className="block">
        <span className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)]">{label}</span>
        <textarea data-testid={testid} rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)] rounded-lg px-3 py-2.5 text-sm focus:border-[rgba(255,42,42,0.6)] focus:shadow-[var(--ms-glow-red)] outline-none resize-none" />
    </label>
);
