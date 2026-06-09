import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroLoader({ onComplete }) {
    const [phase, setPhase] = useState("spin"); // spin -> burnout -> launch -> reveal
    const [shake, setShake] = useState(false);
    const [flash, setFlash] = useState(false);
    const canvasRef = useRef(null);

    // Timeline control
    useEffect(() => {
        // 1.5s: Start burnout (accelerate spin & start shaking)
        const t1 = setTimeout(() => {
            setPhase("burnout");
            setShake(true);
        }, 1500);

        // 2.8s: Launch/drift off-screen
        const t2 = setTimeout(() => {
            setPhase("launch");
            setShake(false);
        }, 2800);

        // 3.1s: Trigger neon flash & swap to logo reveal
        const t3 = setTimeout(() => {
            setPhase("reveal");
            setFlash(true);
        }, 3100);

        // 3.4s: Fade out flash overlay
        const t4 = setTimeout(() => {
            setFlash(false);
        }, 3400);

        // 4.8s: Complete and fade out loading screen
        const t5 = setTimeout(() => {
            onComplete();
        }, 4800);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            clearTimeout(t5);
        };
    }, [onComplete]);

    // Canvas smoke particle loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animationId;
        let particles = [];
        let launchProgress = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        class SmokeParticle {
            constructor(x, y, vx, vy, sizeMultiplier = 1) {
                this.x = x;
                this.y = y;
                this.vx = vx;
                this.vy = vy;
                this.size = (Math.random() * 20 + 15) * sizeMultiplier;
                this.alpha = Math.random() * 0.4 + 0.35;
                this.maxLife = Math.random() * 50 + 35;
                this.life = this.maxLife;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy -= 0.08; // drift upwards
                this.vx += (Math.random() - 0.5) * 0.15;
                this.size += 0.6; // expand smoke size
                this.life--;
                this.alpha = (this.life / this.maxLife) * 0.45;
            }
            draw(c) {
                c.save();
                c.beginPath();
                const grad = c.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                grad.addColorStop(0, `rgba(230, 230, 230, ${this.alpha})`);
                grad.addColorStop(0.4, `rgba(200, 200, 200, ${this.alpha * 0.4})`);
                grad.addColorStop(1, "rgba(180, 180, 180, 0)");
                c.fillStyle = grad;
                c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                c.fill();
                c.restore();
            }
        }

        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update & draw particles
            particles = particles.filter((p) => {
                p.update();
                p.draw(ctx);
                return p.life > 0;
            });

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            let spawnX = centerX;
            const spawnY = centerY + 80; // base of the tire

            // Emit particles based on phase
            if (phase === "spin") {
                // moderate smoke
                if (Math.random() < 0.4) {
                    particles.push(new SmokeParticle(spawnX, spawnY, (Math.random() - 0.5) * 1.5, (Math.random() - 0.2) * 1));
                }
            } else if (phase === "burnout") {
                // massive dense smoke
                const spawnCount = 4;
                for (let i = 0; i < spawnCount; i++) {
                    particles.push(
                        new SmokeParticle(
                            spawnX + (Math.random() - 0.5) * 20,
                            spawnY + (Math.random() - 0.5) * 5,
                            (Math.random() - 0.7) * 4, // push backwards slightly
                            (Math.random() - 0.3) * 1.5,
                            1.5
                        )
                    );
                }
            } else if (phase === "launch") {
                // trailing smoke behind launch
                launchProgress += 0.09;
                spawnX = centerX + launchProgress * (canvas.width / 2);
                const spawnCount = 6;
                if (spawnX < canvas.width + 100) {
                    for (let i = 0; i < spawnCount; i++) {
                        particles.push(
                            new SmokeParticle(
                                spawnX + (Math.random() - 0.5) * 30,
                                spawnY + (Math.random() - 0.5) * 8,
                                (Math.random() - 0.9) * 5,
                                (Math.random() - 0.3) * 1.5,
                                1.8
                            )
                        );
                    }
                }
            }

            animationId = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resize);
        };
    }, [phase]);

    // Custom CSS for carbon background and sweep animations
    const customStyles = `
        .loader-container {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background-color: #07080B;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            font-family: 'Chakra Petch', sans-serif;
        }
        .carbon-bg::before {
            content: '';
            position: absolute; inset: 0;
            background-image: url('https://images.pexels.com/photos/596815/pexels-photo-596815.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940');
            background-size: cover; background-position: center;
            opacity: 0.04;
            mix-blend-mode: overlay;
            pointer-events: none;
            z-index: 0;
        }
        .carbon-bg::after {
            content: ''; position: absolute; inset: 0;
            background-image: radial-gradient(800px circle at 50% 50%, rgba(30,107,255,0.12), transparent 60%),
                               radial-gradient(600px circle at 50% 50%, rgba(227,24,55,0.12), transparent 60%);
            pointer-events: none;
            z-index: 0;
        }
        .logo-glow-back {
            position: absolute;
            width: 320px;
            height: 320px;
            background: radial-gradient(circle, rgba(227,24,55,0.3) 0%, rgba(30,107,255,0.15) 50%, transparent 70%);
            filter: blur(20px);
            z-index: -1;
            pointer-events: none;
        }
        .logo-sheen-wrapper {
            position: relative;
            overflow: hidden;
            border-radius: 12px;
        }
        .logo-sheen-wrapper::after {
            content: '';
            position: absolute;
            top: 0; left: -150%;
            width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
            transform: skewX(-25deg);
            animation: logo-sweep 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s infinite;
        }
        @keyframes logo-sweep {
            0% { left: -150%; }
            100% { left: 150%; }
        }
    `;

    return (
        <div className="loader-container carbon-bg">
            <style>{customStyles}</style>

            {/* Background Smoke Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

            {/* Shaking container during burnout */}
            <motion.div
                className="relative z-20 flex flex-col items-center justify-center"
                animate={shake ? {
                    x: [0, -3, 3, -1.5, 1.5, -3, 2, -2, 0],
                    y: [0, 2, -2, 1, -1.5, 3, -1, 1, 0]
                } : {}}
                transition={{ repeat: Infinity, duration: 0.15 }}
            >
                <AnimatePresence>
                    {phase !== "reveal" && (
                        /* Wheel graphics */
                        <motion.div
                            key="wheel"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={
                                phase === "launch"
                                    ? { x: "150vw", rotate: 1800, scale: 0.9, opacity: 0.3 }
                                    : { scale: 1, opacity: 1 }
                            }
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={
                                phase === "launch"
                                    ? { duration: 0.4, ease: "easeIn" }
                                    : { duration: 0.5, ease: "easeOut" }
                            }
                            className="flex flex-col items-center"
                        >
                            <div className="relative">
                                {/* SVG Alloy Wheel Assembly */}
                                <svg
                                    viewBox="0 0 100 100"
                                    className={`w-44 h-44 sm:w-52 sm:h-52 drop-shadow-[0_0_25px_rgba(227,24,55,0.35)] ${
                                        phase === "burnout" ? "filter blur-[0.6px]" : ""
                                    }`}
                                >
                                    <defs>
                                        <linearGradient id="metal-grad-loader" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#ECEFF1" />
                                            <stop offset="50%" stopColor="#78909C" />
                                            <stop offset="100%" stopColor="#263238" />
                                        </linearGradient>
                                    </defs>

                                    {/* Brake Rotor (Stationary background) */}
                                    <circle cx="50" cy="50" r="28" fill="#1C1F22" stroke="#2D3135" strokeWidth="0.8" />
                                    <circle cx="50" cy="50" r="21" fill="none" stroke="#121416" strokeWidth="1" strokeDasharray="1.5,3" />

                                    {/* Brake Caliper (Stationary painted Crimson Caliper) */}
                                    <path
                                        d="M 27 36 A 25 25 0 0 1 45 22.5 L 42.5 26.5 A 21 21 0 0 0 30 38 Z"
                                        fill="#E31837"
                                        filter="drop-shadow(0 0 3px rgba(227,24,55,0.8))"
                                    />

                                    {/* Rotating Wheel spokes & Outer Rim */}
                                    <motion.g
                                        style={{ originX: "50px", originY: "50px" }}
                                        animate={{ rotate: 360 * 12 }}
                                        transition={{
                                            duration: phase === "burnout" ? 0.35 : 1.5,
                                            repeat: Infinity,
                                            ease: phase === "burnout" ? "linear" : "easeIn",
                                        }}
                                    >
                                        {/* Alloy Outer Lip */}
                                        <circle cx="50" cy="50" r="39" fill="none" stroke="#78909C" strokeWidth="1.5" />
                                        <circle cx="50" cy="50" r="37.5" fill="none" stroke="#37474F" strokeWidth="1" />
                                        <circle cx="50" cy="50" r="35.5" fill="none" stroke="#212121" strokeWidth="1.2" />

                                        {/* Multi-spoke Custom Wheel */}
                                        <path d="M 50 14.5 L 52.5 50 L 47.5 50 Z" fill="url(#metal-grad-loader)" />
                                        <path d="M 83.8 39 L 50 50 L 48 46.5 Z" fill="url(#metal-grad-loader)" />
                                        <path d="M 70.9 78.5 L 50 50 L 52.5 46.5 Z" fill="url(#metal-grad-loader)" />
                                        <path d="M 29.1 78.5 L 50 50 L 47.5 53.5 Z" fill="url(#metal-grad-loader)" />
                                        <path d="M 16.2 39 L 50 50 L 52 53.5 Z" fill="url(#metal-grad-loader)" />

                                        {/* Center Cap & Bolts */}
                                        <circle cx="50" cy="50" r="10.5" fill="#1C1F22" stroke="#37474F" strokeWidth="1" />
                                        <circle cx="50" cy="50" r="4.2" fill="#111" />

                                        <circle cx="50" cy="44.5" r="0.8" fill="#888" />
                                        <circle cx="55.2" cy="48.3" r="0.8" fill="#888" />
                                        <circle cx="53.2" cy="54.2" r="0.8" fill="#888" />
                                        <circle cx="46.8" cy="54.2" r="0.8" fill="#888" />
                                        <circle cx="44.8" cy="48.3" r="0.8" fill="#888" />
                                    </motion.g>
                                </svg>
                            </div>

                            {/* Telemetry/Build Status overlay */}
                            <div className="mt-6 flex flex-col items-center ms-mono">
                                <div className="text-[10px] tracking-[0.25em] text-[var(--ms-red)] uppercase font-semibold animate-pulse">
                                    {phase === "burnout" ? "TELEMETRY BURNOUT ACTIVE" : "INITIALIZING SYSTEMS"}
                                </div>
                                <div className="text-gray-400 text-xs mt-1">
                                    {phase === "burnout" ? "SPEED: 260 km/h · RPM: 7800" : "LOADING MOD_SYNDICATE.DB"}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {phase === "reveal" && (
                        /* Logo reveal layout */
                        <motion.div
                            key="logo-reveal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1.05, opacity: 1 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className="flex flex-col items-center"
                        >
                            {/* Radial Glow light behind logo */}
                            <div className="logo-glow-back" />

                            {/* Sheen-wrapped extracted logo */}
                            <div className="logo-sheen-wrapper max-w-[280px] sm:max-w-[340px] px-6 py-4">
                                <img
                                    src="/logo.png"
                                    alt="Mod Syndicate"
                                    className="w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(30,107,255,0.25)]"
                                />
                            </div>

                            {/* Neon Accented tagline */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="mt-5 text-center flex flex-col items-center"
                            >
                                <span className="text-xs uppercase tracking-[0.35em] text-white">FOR THE BUILDERS</span>
                                <div className="mt-2.5 h-[2px] w-24 bg-gradient-to-r from-transparent via-[var(--ms-red)] to-transparent" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Neon White/Crimson Flash Overlay */}
            <AnimatePresence>
                {flash && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0.8, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45 }}
                        className="absolute inset-0 bg-gradient-to-br from-white via-red-500/10 to-blue-500/10 z-30 pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
