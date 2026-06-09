import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lightbulb, Wrench, Shield, Zap } from "lucide-react";

export function InteractiveCarFront() {
    const [hoveredPart, setHoveredPart] = useState(null);

    // Detailed description of each modifiable part
    const partDetails = {
        leftHeadlight: {
            title: "BI-LED HEADLIGHTS (L)",
            desc: "Custom dual-projector LED with 6500K hyper-white beam and sequential startup DRL.",
            icon: Lightbulb,
            accent: "blue"
        },
        rightHeadlight: {
            title: "BI-LED HEADLIGHTS (R)",
            desc: "Custom dual-projector LED with 6500K hyper-white beam and sequential startup DRL.",
            icon: Lightbulb,
            accent: "blue"
        },
        hood: {
            title: "CARBON BONNET & STAGE 1 INTAKE",
            desc: "Ultra-light dry carbon fiber hood revealing our dyno-tuned carbon-lid cold air intake (+15hp).",
            icon: Zap,
            accent: "red"
        },
        grille: {
            title: "PERFORMANCE INTERCOOLER",
            desc: "High-flow aluminum intercooler core with Syndicate logo print, rated for up to 450bhp.",
            icon: Shield,
            accent: "red"
        },
        splitter: {
            title: "ACTIVE CARBON SPLITTER",
            desc: "Track-proven front splitter that lowers dynamically on speed to maximize front axle downforce.",
            icon: Wrench,
            accent: "blue"
        },
        fenders: {
            title: "WIDEBODY FENDER FLARES",
            desc: "Custom +50mm front fender flares with exposed rivets, giving an ultra-aggressive street stance.",
            icon: Sparkles,
            accent: "red"
        }
    };

    const currentDetails = hoveredPart ? partDetails[hoveredPart] : null;

    // Clip paths in percentage
    const hoodClip = "polygon(28% 34%, 72% 34%, 79% 55%, 21% 55%)";
    const splitterClip = "polygon(16% 70%, 84% 70%, 88% 85%, 12% 85%)";

    return (
        <div className="relative w-full max-w-[580px] mx-auto flex flex-col items-center select-none">
            
            {/* Tech Grid Backdrop */}
            <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden border border-white/5 bg-[#08090c]/40 backdrop-blur-sm">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
            </div>

            {/* Ambient Glow behind the car */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[80%] h-[60%] rounded-full blur-[90px] opacity-25 bg-[radial-gradient(circle,var(--ms-red),var(--ms-blue))]" />

            {/* 3D CAR WORKSPACE */}
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.9)] bg-black/60">
                
                {/* 1. LAYER: Engine Bay (Visible when hood lifts) */}
                <div 
                    className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
                    style={{ 
                        clipPath: hoodClip,
                        opacity: hoveredPart === "hood" ? 1 : 0
                    }}
                >
                    <img 
                        src="/car_engine_bay.png" 
                        alt="Engine Bay"
                        className="w-full h-full object-cover scale-[1.02]"
                    />
                    {/* Glowing Engine Bay Glow Overlay */}
                    <div className="absolute inset-0 bg-red-600/10 mix-blend-color" />
                </div>

                {/* 2. LAYER: Base Car (Bonnet closed, lights off) */}
                <img 
                    src="/car_front_base.png" 
                    alt="Sports Car Front View" 
                    className="w-full h-full object-cover"
                />

                {/* 3. LAYER: Headlight Glow Left */}
                <AnimatePresence>
                    {hoveredPart === "leftHeadlight" && (
                        <>
                            {/* Headlight reflection flare on the lens */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute left-[13%] top-[45%] w-[15%] h-[8%] rounded-full bg-cyan-200/40 blur-md mix-blend-screen pointer-events-none"
                            />
                            {/* Headlight beam throw */}
                            <motion.div
                                initial={{ opacity: 0, scaleX: 0.8 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                exit={{ opacity: 0, scaleX: 0.8 }}
                                className="absolute right-[78%] top-[25%] w-[120%] h-[50%] origin-right blur-xl pointer-events-none"
                                style={{
                                    background: "radial-gradient(circle at right, rgba(0, 163, 255, 0.75) 0%, rgba(0, 163, 255, 0.2) 40%, transparent 80%)",
                                    clipPath: "polygon(0% 20%, 100% 50%, 0% 80%)"
                                }}
                            />
                        </>
                    )}
                </AnimatePresence>

                {/* 4. LAYER: Headlight Glow Right */}
                <AnimatePresence>
                    {hoveredPart === "rightHeadlight" && (
                        <>
                            {/* Headlight reflection flare on the lens */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute right-[13%] top-[45%] w-[15%] h-[8%] rounded-full bg-cyan-200/40 blur-md mix-blend-screen pointer-events-none"
                            />
                            {/* Headlight beam throw */}
                            <motion.div
                                initial={{ opacity: 0, scaleX: 0.8 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                exit={{ opacity: 0, scaleX: 0.8 }}
                                className="absolute left-[78%] top-[25%] w-[120%] h-[50%] origin-left blur-xl pointer-events-none"
                                style={{
                                    background: "radial-gradient(circle at left, rgba(0, 163, 255, 0.75) 0%, rgba(0, 163, 255, 0.2) 40%, transparent 80%)",
                                    clipPath: "polygon(100% 20%, 0% 50%, 100% 80%)"
                                }}
                            />
                        </>
                    )}
                </AnimatePresence>

                {/* 5. LAYER: Performance Intercooler / Grille Core Glow */}
                <div 
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{ opacity: hoveredPart === "grille" ? 1 : 0 }}
                >
                    {/* Glowing Red overlay inside grille area */}
                    <div 
                        className="absolute left-[36%] top-[53%] w-[28%] h-[15%] rounded-md blur-[6px] border border-red-500 bg-red-600/20 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                        style={{ mixBlendMode: "screen" }}
                    />
                </div>

                {/* 6. LAYER: Active Aero Lower Splitter */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ y: hoveredPart === "splitter" ? 6 : 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 15 }}
                >
                    {/* Lower Splitter Highlight Overlay */}
                    {hoveredPart === "splitter" && (
                        <div 
                            className="absolute inset-0 bg-cyan-500/10 border-b border-cyan-400 shadow-[0_2px_15px_rgba(0,163,255,0.3)] pointer-events-none"
                            style={{ clipPath: splitterClip }}
                        />
                    )}
                </motion.div>

                {/* 7. LAYER: Animated Hood Cover (Bonnet) */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ 
                        y: hoveredPart === "hood" ? -45 : 0,
                        opacity: hoveredPart === "hood" ? 0.2 : 1,
                        scale: hoveredPart === "hood" ? 0.98 : 1
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 16 }}
                    style={{ clipPath: hoodClip }}
                >
                    <img 
                        src="/car_front_base.png" 
                        alt="Hood Cover"
                        className="w-full h-full object-cover"
                    />
                    {hoveredPart === "hood" && (
                        <div className="absolute inset-0 bg-red-500/10 border border-red-500/30" />
                    )}
                </motion.div>

                {/* 8. LAYER: Fender Blueprint Overlays */}
                {hoveredPart === "fenders" && (
                    <>
                        <div className="absolute left-[4%] top-[40%] w-[12%] h-[35%] border-2 border-red-500/50 rounded-full blur-[4px] pointer-events-none" />
                        <div className="absolute right-[4%] top-[40%] w-[12%] h-[35%] border-2 border-red-500/50 rounded-full blur-[4px] pointer-events-none" />
                    </>
                )}


                {/* --- MOUSE HOVER TRIGGER HOTSPOTS --- */}
                {/* Left Headlight */}
                <div
                    className="absolute left-[13%] top-[45%] w-[15%] h-[8%] rounded-full cursor-pointer z-20 hover:bg-white/5 transition-colors"
                    onMouseEnter={() => setHoveredPart("leftHeadlight")}
                    onMouseLeave={() => setHoveredPart(null)}
                />
                
                {/* Right Headlight */}
                <div
                    className="absolute right-[13%] top-[45%] w-[15%] h-[8%] rounded-full cursor-pointer z-20 hover:bg-white/5 transition-colors"
                    onMouseEnter={() => setHoveredPart("rightHeadlight")}
                    onMouseLeave={() => setHoveredPart(null)}
                />

                {/* Hood (Bonnet) */}
                <div
                    className="absolute left-[29%] top-[33%] w-[42%] h-[20%] rounded-b-xl cursor-pointer z-20 hover:bg-white/5 transition-colors"
                    onMouseEnter={() => setHoveredPart("hood")}
                    onMouseLeave={() => setHoveredPart(null)}
                />

                {/* Front Grille */}
                <div
                    className="absolute left-[36%] top-[53%] w-[28%] h-[15%] rounded-md cursor-pointer z-20 hover:bg-white/5 transition-colors"
                    onMouseEnter={() => setHoveredPart("grille")}
                    onMouseLeave={() => setHoveredPart(null)}
                />

                {/* Lower Splitter */}
                <div
                    className="absolute left-[15%] top-[70%] w-[70%] h-[12%] rounded-md cursor-pointer z-20 hover:bg-white/5 transition-colors"
                    onMouseEnter={() => setHoveredPart("splitter")}
                    onMouseLeave={() => setHoveredPart(null)}
                />

                {/* Left Fender Flares */}
                <div
                    className="absolute left-[4%] top-[40%] w-[9%] h-[32%] cursor-pointer z-20 hover:bg-white/5 transition-colors"
                    onMouseEnter={() => setHoveredPart("fenders")}
                    onMouseLeave={() => setHoveredPart(null)}
                />

                {/* Right Fender Flares */}
                <div
                    className="absolute right-[4%] top-[40%] w-[9%] h-[32%] cursor-pointer z-20 hover:bg-white/5 transition-colors"
                    onMouseEnter={() => setHoveredPart("fenders")}
                    onMouseLeave={() => setHoveredPart(null)}
                />

                {/* Sci-Fi Scanner line overlay */}
                <div className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none">
                    <div className="absolute left-0 right-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--ms-red)] to-transparent opacity-60 animate-[scan_3s_linear_infinite]" style={{ animation: "scan 4s linear infinite" }} />
                </div>
            </div>

            {/* --- TECH DETAILS HUD BOX --- */}
            <div className="w-full min-h-[110px] mt-4 p-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden relative">
                
                {/* Glowing Side Indicator Line */}
                <div
                    className={`absolute left-0 top-0 bottom-0 w-[4px] transition-colors duration-300 ${
                        currentDetails
                            ? currentDetails.accent === "red"
                                ? "bg-[var(--ms-red)]"
                                : "bg-[var(--ms-blue)]"
                            : "bg-white/15"
                    }`}
                />

                <AnimatePresence mode="wait">
                    {currentDetails ? (
                        <motion.div
                            key={hoveredPart}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="flex gap-4 items-start"
                        >
                            <span className={`inline-flex p-2 rounded-lg border flex-shrink-0 ${
                                currentDetails.accent === "red"
                                    ? "border-[rgba(255,42,42,0.45)] text-[var(--ms-red)] bg-[rgba(255,42,42,0.08)]"
                                    : "border-[rgba(0,163,255,0.45)] text-[var(--ms-blue)] bg-[rgba(0,163,255,0.08)]"
                            }`}>
                                <currentDetails.icon className="h-5 w-5" />
                            </span>
                            <div>
                                <h4 className="ms-display text-sm tracking-widest text-white">{currentDetails.title}</h4>
                                <p className="mt-1 text-xs text-[var(--ms-text-muted)] leading-relaxed">{currentDetails.desc}</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center text-center py-2"
                        >
                            <span className="text-[10px] tracking-widest text-[var(--ms-text-faint)] uppercase animate-pulse">
                                🕹️ Hover any part of the car front to scan modifications
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
