import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wrench, PaintBucket, Cog, Lightbulb, Sofa, Sparkles, Star, Quote } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { NeonDivider } from "@/components/ms/NeonDivider";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/ms/Reveal";
import { ScrollSequence, ScrollOverlay } from "@/components/ms/ScrollSequence";
import api from "@/lib/api";
import { PremiumHero } from "@/components/ms/PremiumHero";

const HERO_IMG_2 = "https://images.pexels.com/photos/9692671/pexels-photo-9692671.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=1920";

const SERVICES = [
    { icon: PaintBucket, name: "Custom Wraps", text: "Satin, gloss, matte and color-shift wraps with bonded warranty.", tone: "red" },
    { icon: Cog, name: "Performance", text: "Stage 1–3 tunes, intakes and full exhaust systems.", tone: "blue" },
    { icon: Wrench, name: "Alloys & Wheels", text: "Forged, flow-formed and beadlock setups for every chassis.", tone: "red" },
    { icon: Lightbulb, name: "Lighting", text: "Bi-LED projectors, sequential DRLs and offroad light bars.", tone: "blue" },
    { icon: Sofa, name: "Interiors", text: "Alcantara, custom stitching and motorsport-grade buckets.", tone: "red" },
    { icon: Sparkles, name: "Detailing", text: "9H ceramic, PPF and paint correction.", tone: "blue" },
];

const PROCESS = [
    { step: "01", name: "Consult", text: "Tell us about your car, goals and budget." },
    { step: "02", name: "Design", text: "Visualize your build with our 3D mock-up team." },
    { step: "03", name: "Build", text: "Certified bays. Live build updates in your dashboard." },
    { step: "04", name: "Drive", text: "Warranty, after-care and a Community pass." },
];

export default function Home() {
    const { openAuth, user } = useAuth();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const seqRef = useRef(null);

    useEffect(() => {
        api.get("/community/reviews").then(({ data }) => setReviews(data.slice(0, 5))).catch(() => {});
    }, []);

    const onGarageCta = () => {
        if (user) navigate("/dashboard");
        else openAuth("signup");
    };

    return (
        <main data-testid="home-page" className="relative">
            {/* HERO */}
            <PremiumHero onGarageCta={onGarageCta} />

            {/* SCROLL-DRIVEN SEQUENCE — Build reveal (stock → fully modified) */}
            <div ref={seqRef}>
                <ScrollSequence
                    data-testid="scroll-sequence-section"
                    frameCount={40}
                    framePath={(i) => `/scroll-frames/frame-${String(i).padStart(2, "0")}.jpg`}
                    heightVh={360}
                    aspectRatio={{ w: 2816, h: 1536 }}
                >
                    {/* Section eyebrow — always visible while pinned */}
                    <div className="ms-container h-full flex flex-col">
                        <div className="pt-10 sm:pt-14" />

                        {/* Overlay text panels — synced to scroll progress */}
                        <ScrollOverlay targetRef={seqRef} range={[0.0, 0.08, 0.22, 0.32]}>
                            <div className="ms-container">
                                <div className="max-w-xl bg-black/50 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl">
                                    <h4 className="ms-display text-[10px] sm:text-sm tracking-wider text-[var(--ms-red)] uppercase mb-1">STAGE 01 · THE STARTING LINE</h4>
                                    <h2 className="ms-display text-lg sm:text-2xl md:text-3xl lg:text-4xl text-white font-bold leading-tight">
                                        STARTS STOCK.<br />
                                        <span className="text-[var(--ms-red)]">ENDS LEGEND.</span>
                                    </h2>
                                    <p className="mt-2 sm:mt-3 text-gray-200 text-xs sm:text-sm md:text-base ms-auto-font">
                                        Every Mod Syndicate build begins with a clean canvas.
                                        Scroll to watch a stock vehicle transform into a trail-ready monster.
                                    </p>
                                </div>
                            </div>
                        </ScrollOverlay>

                        <ScrollOverlay targetRef={seqRef} range={[0.30, 0.40, 0.55, 0.65]} className="justify-center md:justify-end">
                            <div className="ms-container w-full">
                                <div className="max-w-md mx-auto md:ml-auto text-center md:text-right bg-black/50 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl flex flex-col items-center md:items-end">
                                    <h4 className="ms-display text-[10px] sm:text-sm tracking-wider text-[var(--ms-blue)] uppercase mb-1">STAGE 02 · STANCE & WRAPS</h4>
                                    <h3 className="ms-display text-lg sm:text-2xl md:text-3xl text-white font-bold leading-tight">
                                        WRAPS · WHEELS · STANCE
                                    </h3>
                                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-200 ms-auto-font">
                                        Crimson satin wrap, forged off-road wheels, lifted suspension.
                                    </p>
                                </div>
                            </div>
                        </ScrollOverlay>

                        <ScrollOverlay targetRef={seqRef} range={[0.60, 0.72, 0.92, 1.0]}>
                            <div className="ms-container">
                                <div className="max-w-lg bg-black/50 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl">
                                    <h4 className="ms-display text-[10px] sm:text-sm tracking-wider text-[var(--ms-red)] uppercase mb-1">STAGE 03 · BUILT FOR THE TRAILS</h4>
                                    <h3 className="ms-display text-lg sm:text-2xl md:text-3xl text-white font-bold leading-tight">
                                        BULL BAR. SNORKEL. LIGHT BAR. READY.
                                    </h3>
                                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-200 ms-auto-font">
                                        Overlanding-grade hardware engineered for the trails.
                                        Your build, finished by the syndicate.
                                    </p>
                                    <button onClick={() => navigate("/marketplace")} className="ms-button-primary ms-sheen mt-4 sm:mt-5 text-xs sm:text-sm py-2 px-4 h-auto">
                                        Start your build <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </ScrollOverlay>
                    </div>
                </ScrollSequence>
            </div>

            <NeonDivider />

            {/* SERVICES */}
            <section className="ms-section ms-container">
                <Reveal>
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div>
                            <div className="text-[11px] uppercase tracking-widest text-[var(--ms-red)]">// Services</div>
                            <h2 className="ms-display ms-h2 mt-2">EVERYTHING YOUR BUILD NEEDS.</h2>
                        </div>
                        <p className="text-[var(--ms-text-muted)] max-w-md">From street-stealth wraps to track-day performance, our programs are engineered, never compromised.</p>
                    </div>
                </Reveal>
                <StaggerContainer className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {SERVICES.map((s) => (
                        <StaggerItem key={s.name}>
                            <div className="group ms-surface rounded-xl p-6 h-full hover:border-[var(--ms-text-muted)]/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${s.tone === "red" ? "border-[rgba(255,85,85,0.45)] text-[var(--ms-red)] bg-[rgba(255,85,85,0.08)]" : "border-[rgba(0,163,255,0.45)] text-[var(--ms-blue)] bg-[rgba(0,163,255,0.08)]"}`}>
                                        <s.icon className="h-5 w-5" />
                                    </span>
                                    <div className="ms-display text-xl tracking-wider text-[var(--ms-text)]">{s.name.toUpperCase()}</div>
                                </div>
                                <p className="mt-3 text-sm text-[var(--ms-text-muted)]">{s.text}</p>
                                <div className="mt-5 h-px bg-[var(--ms-border-color)] group-hover:bg-black/10 transition-colors" />
                                <button onClick={() => navigate("/marketplace")} className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--ms-text)] hover:text-[var(--ms-red)] transition-colors">
                                    Explore <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </section>

            {/* PROCESS */}
            <section className="relative ms-section" data-carbon="true">
                <div className="ms-container relative">
                    <Reveal>
                        <div className="text-[11px] uppercase tracking-widest text-[var(--ms-blue)]">// Process</div>
                        <h2 className="ms-display ms-h2 mt-2">FOUR GEARS TO A FINISHED BUILD.</h2>
                    </Reveal>
                    <StaggerContainer className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {PROCESS.map((p, i) => (
                            <StaggerItem key={p.step}>
                                <div className="ms-surface rounded-xl p-6 h-full relative overflow-hidden">
                                    <div className="ms-display text-6xl tracking-wider text-[var(--ms-text)]/5 absolute -top-3 -right-2">{p.step}</div>
                                    <div className="ms-display text-lg tracking-wider text-[var(--ms-text)]">{p.name.toUpperCase()}</div>
                                    <p className="text-sm text-[var(--ms-text-muted)] mt-2">{p.text}</p>
                                    {i < PROCESS.length - 1 && (
                                        <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-px w-8 bg-gradient-to-r from-black/15 to-transparent" />
                                    )}
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* FEATURED REVIEWS */}
            <section className="ms-section ms-container">
                <Reveal>
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div>
                            <div className="text-[11px] uppercase tracking-widest text-[var(--ms-red)]">// Field Reports</div>
                            <h2 className="ms-display ms-h2 mt-2">FROM THE DRIVERS, NOT THE COPY-WRITERS.</h2>
                        </div>
                    </div>
                </Reveal>
                <div className="mt-10 flex overflow-x-auto snap-x snap-mandatory gap-4 ms-hide-scroll pb-2">
                    {(reviews.length ? reviews : Array.from({ length: 3 })).map((r, i) => (
                        <div key={r?.id || i} className="snap-start min-w-[300px] sm:min-w-[360px] lg:min-w-[420px] ms-surface rounded-2xl overflow-hidden">
                            <div className="aspect-[16/10] bg-black/30 overflow-hidden">
                                <img src={r?.image_url || HERO_IMG_2} alt="" className="h-full w-full object-cover" />
                            </div>
                            <div className="p-5">
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: r?.rating || 5 }).map((_, k) => (
                                        <Star key={k} className="h-3.5 w-3.5 text-[var(--ms-warning)] fill-[var(--ms-warning)]" />
                                    ))}
                                </div>
                                <div className="ms-display text-lg mt-3">{r?.title || "Loading review…"}</div>
                                <p className="text-sm text-[var(--ms-text-muted)] mt-2 leading-relaxed">
                                    <Quote className="h-3.5 w-3.5 inline mr-1 text-[var(--ms-red)]" />
                                    {r?.body || ""}
                                </p>
                                <div className="mt-4 text-xs text-[var(--ms-text-faint)] uppercase tracking-wider">{r?.author_name || "—"}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ENTER GARAGE CTA */}
            <section className="ms-section ms-container">
                <Reveal>
                    <div 
                        className="relative overflow-hidden rounded-2xl ms-surface p-8 sm:p-12 lg:p-16 min-h-[380px] flex items-center bg-cover bg-center" 
                        style={{ backgroundImage: "linear-gradient(to right, var(--ms-surface-0) 25%, rgba(255,255,255,0.7) 65%, transparent 100%), url('/garage_bg.png')" }}
                        data-carbon="true"
                    >
                        <div className="max-w-xl relative z-10">
                            <div className="text-[11px] uppercase tracking-widest text-[var(--ms-red)]">// The next move</div>
                            <h2 className="ms-display ms-h2 mt-2">PARK YOUR BUILD IN THE SYNDICATE.</h2>
                            <p className="mt-3 text-[var(--ms-text-muted)] max-w-md">
                                Save mods to your Garage, get tailored quotes, and lock in install slots at our certified bays.
                            </p>
                            <button data-testid="cta-enter-garage" onClick={onGarageCta} className="ms-button-primary ms-sheen text-base h-12 px-6 mt-6">
                                {user ? "Open dashboard" : "Enter your Garage"} <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Telemetry Stats Panel */}
                        <div className="absolute right-6 bottom-6 lg:right-12 lg:top-1/2 lg:-translate-y-1/2 z-10 hidden md:flex flex-col gap-3 max-w-[260px] w-full bg-[rgba(15,18,24,0.75)] backdrop-blur-md border border-[rgba(255,255,255,0.08)] p-4 rounded-xl text-white shadow-lg">
                            <div className="text-[9px] uppercase tracking-widest text-[var(--ms-red)] font-semibold">// Telemetry Active</div>
                            <div className="ms-display text-sm tracking-wider border-b border-white/10 pb-1.5">CHASSIS STAGE 03</div>
                            <div className="space-y-1.5 text-[11px] ms-mono mt-1">
                                <div className="flex justify-between"><span>HORSEPOWER:</span><span className="text-[var(--ms-success)] font-semibold">680 HP (+180)</span></div>
                                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden"><div className="bg-[var(--ms-success)] h-full w-[85%]" /></div>
                                
                                <div className="flex justify-between"><span>TORQUE:</span><span>740 Nm</span></div>
                                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden"><div className="bg-[var(--ms-blue)] h-full w-[75%]" /></div>
                                
                                <div className="flex justify-between"><span>0-100 KM/H:</span><span className="text-[var(--ms-red)] font-semibold">3.4 SEC</span></div>
                                <div className="flex justify-between"><span>BOOST:</span><span>1.8 BAR</span></div>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </section>
        </main>
    );
}
