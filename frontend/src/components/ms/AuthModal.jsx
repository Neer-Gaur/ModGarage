import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ChevronRight, AtSign, KeyRound, User as UserIcon } from "lucide-react";
import { apiError } from "@/lib/errors";
import { BRAND_LOGO_URL } from "@/lib/brand";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const AuthModal = () => {
    const { authModal, closeAuth, setAuthModal, login, register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const email = (form.email || "").trim();
        if (!EMAIL_RE.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        if (!form.password || form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            let userObj;
            if (authModal.mode === "login") {
                userObj = await login(email, form.password);
                toast.success(`Welcome back, ${userObj.name || "driver"}.`);
            } else {
                userObj = await register(email, form.password, form.name);
                toast.success("Account created. Let's set up your garage.");
            }
            // Execute any pending action
            const pending = authModal.pending;
            closeAuth();
            setForm({ name: "", email: "", password: "" });
            if (pending && typeof pending === "function") {
                setTimeout(() => pending(userObj), 200);
            }
        } catch (err) {
            const msg = apiError(err, "Authentication failed. Check your details.");
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (mode) => { setError(""); setAuthModal((s) => ({ ...s, mode })); };

    return (
        <Dialog open={authModal.open} onOpenChange={(o) => (o ? null : closeAuth())}>
            <DialogContent data-testid="auth-modal" className="max-w-md p-0 overflow-hidden bg-[var(--ms-surface-0)] border border-[var(--ms-border-color)]">
                <div className="p-6 border-b border-[var(--ms-border-color)] bg-[var(--ms-bg-1)]">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-md overflow-hidden bg-white ring-1 ring-black/5">
                            <img src={BRAND_LOGO_URL} alt="Mod Syndicate" className="h-full w-full object-contain" />
                        </span>
                        <div>
                            <DialogTitle className="ms-display text-2xl tracking-wider">ENTER YOUR GARAGE</DialogTitle>
                            <p className="text-xs text-[var(--ms-text-muted)]">Your builds, bookings and saved mods.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <Tabs value={authModal.mode} onValueChange={switchMode}>
                        <TabsList className="grid grid-cols-2 w-full bg-[var(--ms-surface-1)]">
                            <TabsTrigger data-testid="auth-tab-login" value="login">Log in</TabsTrigger>
                            <TabsTrigger data-testid="auth-tab-signup" value="signup">Sign up</TabsTrigger>
                        </TabsList>
                        <TabsContent value="login" className="mt-5">
                            <form onSubmit={onSubmit} noValidate className="space-y-3">
                                <Field icon={<AtSign className="h-4 w-4" />} label="Email" testid="auth-email-input" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="you@email.com" />
                                <Field icon={<KeyRound className="h-4 w-4" />} label="Password" testid="auth-password-input" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="••••••••" />
                                <SubmitBtn loading={loading} label="Log in" testid="auth-submit-button" />
                            </form>
                        </TabsContent>
                        <TabsContent value="signup" className="mt-5">
                            <form onSubmit={onSubmit} noValidate className="space-y-3">
                                <Field icon={<UserIcon className="h-4 w-4" />} label="Name" testid="auth-name-input" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Your name" />
                                <Field icon={<AtSign className="h-4 w-4" />} label="Email" testid="auth-email-input" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="you@email.com" />
                                <Field icon={<KeyRound className="h-4 w-4" />} label="Password" testid="auth-password-input" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="min 6 characters" />
                                <SubmitBtn loading={loading} label="Create account" testid="auth-submit-button" />
                            </form>
                        </TabsContent>
                    </Tabs>
                    {error && (
                        <div data-testid="auth-error" className="mt-3 rounded-lg border border-[rgba(255,42,42,0.45)] bg-[rgba(255,42,42,0.08)] px-3 py-2 text-xs text-[var(--ms-red)]">
                            {error}
                        </div>
                    )}
                    <p className="text-[11px] text-[var(--ms-text-faint)] mt-4 text-center">
                        Encrypted email + password. JWT-based session, 14 day expiry.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const Field = ({ icon, label, testid, type = "text", value, onChange, placeholder }) => (
    <label className="block">
        <span className="text-xs uppercase tracking-wider text-[var(--ms-text-muted)]">{label}</span>
        <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ms-text-faint)]">{icon}</span>
            <input
                data-testid={testid}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[var(--ms-surface-1)] border border-[var(--ms-border-color)] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-[rgba(255,42,42,0.6)] focus:shadow-[var(--ms-glow-red)] outline-none"
            />
        </div>
    </label>
);

const SubmitBtn = ({ loading, label, testid }) => (
    <button data-testid={testid} type="submit" disabled={loading} className="ms-button-primary ms-sheen w-full justify-center mt-2">
        {loading ? "Please wait…" : label} <ChevronRight className="h-4 w-4" />
    </button>
);
