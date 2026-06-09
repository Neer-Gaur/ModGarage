import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reveal } from "@/components/ms/Reveal";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { apiError } from "@/lib/errors";
import { ChevronRight, Car as CarIcon } from "lucide-react";

const SAMPLE_PHOTOS = [
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1532009877282-3340270e0529?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1626668893632-6f3a4466d109?auto=format&fit=crop&w=1200&q=80",
];

export default function Onboarding() {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        city: user?.city || "",
        car_model: user?.car_model || "",
        car_year: user?.car_year || "",
        car_color: user?.car_color || "",
        car_photo_url: user?.car_photo_url || SAMPLE_PHOTOS[0],
        specs: user?.specs || "",
    });
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.phone || !form.car_model) {
            return toast.error("Name, phone and car model are required.");
        }
        setSaving(true);
        try {
            await updateProfile({
                ...form,
                car_year: form.car_year ? Number(form.car_year) : null,
                onboarded: true,
            });
            toast.success("Profile saved. Welcome to the syndicate.");
            navigate("/dashboard");
        } catch (err) {
            toast.error(apiError(err, "Could not save profile."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <main data-testid="onboarding-page" className="ms-container py-12">
            <Reveal>
                <div className="text-[11px] uppercase tracking-widest text-[var(--ms-red)]">// Step 01</div>
                <h1 className="ms-display ms-h2 mt-2">SET UP YOUR GARAGE</h1>
                <p className="mt-2 text-[var(--ms-text-muted)] max-w-xl">Tell us about your car so we can tailor quotes, fitment and recommended mods.</p>
            </Reveal>

            <form onSubmit={submit} className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 ms-surface rounded-2xl p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Full name" testid="onboarding-name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                        <Field label="Phone" testid="onboarding-phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+91 ..." />
                        <Field label="City" testid="onboarding-city" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
                        <Field label="Car model" testid="onboarding-car-model" value={form.car_model} onChange={(v) => setForm((f) => ({ ...f, car_model: v }))} placeholder="e.g. Hatchback / SUV" />
                        <Field label="Year" testid="onboarding-car-year" value={form.car_year} onChange={(v) => setForm((f) => ({ ...f, car_year: v }))} placeholder="2023" />
                        <Field label="Color" testid="onboarding-car-color" value={form.car_color} onChange={(v) => setForm((f) => ({ ...f, car_color: v }))} placeholder="Starry Night Blue" />
                        <div className="sm:col-span-2">
                            <Field label="Car photo URL" testid="onboarding-car-photo" value={form.car_photo_url} onChange={(v) => setForm((f) => ({ ...f, car_photo_url: v }))} placeholder="https://..." />
                            <div className="mt-2 flex gap-2 overflow-x-auto ms-hide-scroll">
                                {SAMPLE_PHOTOS.map((u) => (
                                    <button key={u} type="button" onClick={() => setForm((f) => ({ ...f, car_photo_url: u }))} className={`h-12 w-20 rounded-md overflow-hidden border ${form.car_photo_url === u ? "border-[var(--ms-red)]" : "border-[var(--ms-border-color)]"}`}>
                                        <img src={u} alt="" className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <FieldArea label="Existing mods / specs" testid="onboarding-specs" value={form.specs} onChange={(v) => setForm((f) => ({ ...f, specs: v }))} placeholder={'Stage 1 remap, cat-back exhaust, 17" alloys…'} />
                        </div>
                    </div>
                    <button data-testid="onboarding-submit" disabled={saving} className="ms-button-primary ms-sheen mt-6">
                        {saving ? "Saving…" : "Save and continue"} <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="lg:col-span-5">
                    <div className="ms-surface rounded-2xl overflow-hidden sticky top-24">
                        <div className="aspect-[4/3] bg-black/30">
                            {form.car_photo_url ? <img src={form.car_photo_url} alt="Your car" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-[var(--ms-text-faint)]"><CarIcon className="h-10 w-10" /></div>}
                        </div>
                        <div className="p-5">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--ms-text-faint)]">{form.city || "City"}</div>
                            <div className="ms-display text-2xl mt-1">{(form.car_model || "YOUR CAR").toUpperCase()}</div>
                            <div className="text-sm text-[var(--ms-text-muted)] mt-1">{form.car_color || "Color"}{form.car_year ? ` · ${form.car_year}` : ""}</div>
                            {form.specs && (
                                <div className="mt-3 text-xs text-[var(--ms-text-muted)] leading-relaxed">{form.specs}</div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </main>
    );
}

const Field = ({ label, value, onChange, placeholder, testid }) => (
    <label className="block">
        <span className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)]">{label}</span>
        <input data-testid={testid} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)] rounded-lg px-3 py-2.5 text-sm focus:border-[rgba(255,42,42,0.6)] focus:shadow-[var(--ms-glow-red)] outline-none" />
    </label>
);
const FieldArea = ({ label, value, onChange, placeholder, testid }) => (
    <label className="block">
        <span className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)]">{label}</span>
        <textarea data-testid={testid} rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)] rounded-lg px-3 py-2.5 text-sm focus:border-[rgba(255,42,42,0.6)] focus:shadow-[var(--ms-glow-red)] outline-none resize-none" />
    </label>
);
