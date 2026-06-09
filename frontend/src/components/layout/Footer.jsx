import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/errors";
import api from "@/lib/api";
import { BRAND_LOGO_URL } from "@/lib/brand";

export const Footer = () => {
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) {
            toast.error("Please fill name, email and message.");
            return;
        }
        setSubmitting(true);
        try {
            await api.post("/contact", form);
            toast.success("Message received. We'll be in touch.");
            setDone(true);
            setForm({ name: "", email: "", phone: "", message: "" });
        } catch (err) {
            toast.error(apiError(err, "Could not submit. Try again."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <footer id="contact" data-testid="site-footer" className="relative border-t border-[var(--ms-border-color)] bg-[var(--ms-bg-1)]">
            <div className="ms-container py-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-5">
                    <img src={BRAND_LOGO_URL} alt="Mod Syndicate" className="h-24 w-auto mb-5 select-none" draggable={false} />
                    <h3 className="ms-display text-3xl sm:text-4xl tracking-wide text-[var(--ms-text)]">
                        TUNE THE <span className="text-[var(--ms-red)]">RIDE</span>.
                        <br /> SHIFT THE <span className="text-[var(--ms-blue)]">EXPERIENCE</span>.
                    </h3>
                    <p className="mt-4 text-[var(--ms-text-muted)] max-w-md">
                        Mod Syndicate is a premium modification studio building bespoke wraps,
                        wheels, performance and detailing programs for India's most iconic builds.
                    </p>
                    <div className="mt-8 space-y-3 text-sm text-[var(--ms-text-muted)]">
                        <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-[var(--ms-red)]" /> hello@modsyndicate.in</div>
                        <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-[var(--ms-blue)]" /> +91 98000 12345</div>
                        <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[var(--ms-chrome-dim)]" /> Bay 07, Industrial Lane, Mumbai</div>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <form onSubmit={submit} noValidate data-testid="contact-form" className="ms-surface rounded-2xl p-6 sm:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)]">Name</label>
                                <input
                                    data-testid="contact-name"
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="mt-1 w-full bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--ms-text)] focus:border-[var(--ms-red)] focus:shadow-[var(--ms-glow-red)] outline-none"
                                    placeholder="Your name"
                                    autoComplete="name"
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)]">Email</label>
                                <input
                                    data-testid="contact-email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                    className="mt-1 w-full bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--ms-text)] focus:border-[var(--ms-blue)] focus:shadow-[var(--ms-glow-blue)] outline-none"
                                    placeholder="you@email.com"
                                    autoComplete="email"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)]">Phone (optional)</label>
                                <input
                                    data-testid="contact-phone"
                                    value={form.phone}
                                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    className="mt-1 w-full bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--ms-text)] focus:border-[var(--ms-blue)] focus:shadow-[var(--ms-glow-blue)] outline-none"
                                    placeholder="+91 ..."
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)]">Message</label>
                                <textarea
                                    data-testid="contact-message"
                                    value={form.message}
                                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                                    rows={4}
                                    className="mt-1 w-full bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--ms-text)] focus:border-[var(--ms-red)] focus:shadow-[var(--ms-glow-red)] outline-none resize-none"
                                    placeholder="Tell us about your car and the build you want."
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between gap-3">
                            <div className="text-xs text-[var(--ms-text-muted)]">
                                {done ? (
                                    <span className="inline-flex items-center gap-1 text-[var(--ms-success)]"><CheckCircle2 className="h-3.5 w-3.5" /> We'll reply within 24 hours.</span>
                                ) : (
                                    <span>By submitting you agree to our terms.</span>
                                )}
                            </div>
                            <button
                                data-testid="contact-submit"
                                type="submit"
                                disabled={submitting}
                                className="ms-button-primary ms-sheen"
                            >
                                <Send className="h-4 w-4" /> {submitting ? "Sending…" : "Send message"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="border-t border-[var(--ms-border-color)]">
                <div className="ms-container py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--ms-text-faint)]">
                    <div>© {new Date().getFullYear()} Mod Syndicate — Built in Mumbai, India.</div>
                    <div className="flex items-center gap-4">
                        <a className="hover:text-[var(--ms-text)]" href="#">Privacy</a>
                        <a className="hover:text-[var(--ms-text)]" href="#">Terms</a>
                        <a className="hover:text-[var(--ms-text)]" href="#">Press</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
