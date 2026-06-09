import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import AOS from "aos";
import "aos/dist/aos.css";

export const PremiumHero = ({ onGarageCta }) => {
    const containerRef = useRef(null);
    const topImageRef = useRef(null);
    const glow1Ref = useRef(null);
    const glow2Ref = useRef(null);
    const contentRef = useRef(null);
    const navigate = useNavigate();

    const maskState = useRef({ x: 0, y: 0, radius: 0 });

    useEffect(() => {
        // Initialize AOS
        AOS.init({
            duration: 1000,
            once: true,
            easing: "ease-out-cubic",
        });

        const container = containerRef.current;
        if (!container) return;

        // Set initial mask coordinates to center of container
        const rect = container.getBoundingClientRect();
        maskState.current.x = rect.width / 2;
        maskState.current.y = rect.height / 2;
        maskState.current.radius = 0;

        const xTo = gsap.quickTo(maskState.current, "x", { duration: 0.5, ease: "power3.out" });
        const yTo = gsap.quickTo(maskState.current, "y", { duration: 0.5, ease: "power3.out" });
        const radiusTo = gsap.quickTo(maskState.current, "radius", { duration: 0.6, ease: "power2.out" });

        const updateMask = () => {
            if (topImageRef.current) {
                const { x, y, radius } = maskState.current;
                // Radial gradient with a transparent hole (reveal the bottom layer)
                const maskVal = `radial-gradient(circle ${radius}px at ${x}px ${y}px, transparent 0%, rgba(0,0,0,0.2) 65%, black 100%)`;
                topImageRef.current.style.maskImage = maskVal;
                topImageRef.current.style.webkitMaskImage = maskVal;
            }
        };

        gsap.ticker.add(updateMask);

        const onMouseMove = (e) => {
            const bounds = container.getBoundingClientRect();
            const relX = e.clientX - bounds.left;
            const relY = e.clientY - bounds.top;
            xTo(relX);
            yTo(relY);
        };

        const onMouseEnter = () => {
            radiusTo(180); // Hover expands the reveal area
        };

        const onMouseLeave = () => {
            radiusTo(0); // Mouse leave animates back with cinematic dissolve
        };

        container.addEventListener("mousemove", onMouseMove);
        container.addEventListener("mouseenter", onMouseEnter);
        container.addEventListener("mouseleave", onMouseLeave);

        // Subtle pulse animation on glows
        gsap.to(glow1Ref.current, {
            scale: 1.15,
            opacity: 0.8,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
        });
        gsap.to(glow2Ref.current, {
            scale: 0.85,
            opacity: 0.6,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
        });

        // Entrance animation timeline for text and layout
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(
            contentRef.current.children,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, delay: 0.3 }
        );

        return () => {
            gsap.ticker.remove(updateMask);
            container.removeEventListener("mousemove", onMouseMove);
            container.removeEventListener("mouseenter", onMouseEnter);
            container.removeEventListener("mouseleave", onMouseLeave);
        };
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative h-screen w-full overflow-hidden bg-black flex flex-col justify-end p-8 md:p-16 lg:p-24 select-none"
            data-testid="premium-hero"
        >
            {/* Cyan/blue blurred glow backgrounds */}
            <div
                ref={glow1Ref}
                className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[500px] md:h-[500px] rounded-full bg-cyan-500/20 blur-[100px] md:blur-[140px] pointer-events-none mix-blend-screen z-0"
            />
            <div
                ref={glow2Ref}
                className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-blue-500/20 blur-[100px] md:blur-[140px] pointer-events-none mix-blend-screen z-0"
            />

            {/* Background Image Layers */}
            {/* image2: Bottom layer (black offroad SUV) */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <img
                    src="/hero_reveal_new_2.png"
                    alt="Modified Build"
                    className="w-full h-full object-cover pointer-events-none"
                    data-aos="fade-up"
                    data-aos-duration="1200"
                />
            </div>

            {/* image1: Top masked layer (white offroad SUV) */}
            <div
                ref={topImageRef}
                className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-500"
                style={{
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                }}
            >
                <img
                    src="/hero_reveal_new_1.png"
                    alt="Stock Base"
                    className="w-full h-full object-cover pointer-events-none"
                    data-aos="fade-up"
                    data-aos-duration="1200"
                />
            </div>

            {/* Soft dark gradient overlays for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none z-25" />

            {/* Elegant bottom-left text content */}
            <div ref={contentRef} className="relative z-30 max-w-2xl text-left text-white mt-auto">
                <span className="text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-3 py-1 rounded-full inline-block mb-4 backdrop-blur-sm">
                    Mod Syndicate · Premium Est. 2026
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none mb-6 font-display">
                    BUILT IN THE DARK.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-cyan-400">
                        TUNED FOR THE STREETS.
                    </span>
                </h1>
                <p className="text-sm md:text-base text-gray-400 mb-8 max-w-lg leading-relaxed font-sans">
                    Experience India's premier bespoke modification house. Drag the cursor across the chassis to reveal the performance transformation in real-time.
                </p>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onGarageCta}
                        className="px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-red-500 hover:text-white transition-all duration-300 transform hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                    >
                        Enter Your Garage
                    </button>
                    <button
                        onClick={() => navigate("/marketplace")}
                        className="group flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors py-3"
                    >
                        Browse Marketplace
                        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </section>
    );
};
export default PremiumHero;
