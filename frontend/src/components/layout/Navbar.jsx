import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { gsap } from "gsap";

const NAV_ITEMS = [
    { label: "Device", to: "/marketplace" },
    { label: "Real Stories", to: "/community" },
    { label: "Science", to: "#science" },
    { label: "Plans", to: "#plans" },
    { label: "Reach Us", to: "#contact" },
];

const LogoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white transition-transform duration-300">
        <polygon points="12 2 22 7 22 17 12 22 2 17 2 7 12 2" />
        <polyline points="12 22 12 12 22 7" />
        <polyline points="12 12 2 7" />
    </svg>
);

export const Navbar = () => {
    const { user, openAuth, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navbarRef = useRef(null);
    const overlayRef = useRef(null);
    const menuItemsRef = useRef([]);
    const logoRef = useRef(null);

    // Mobile Toggle Refs
    const dot1Ref = useRef(null);
    const dot2Ref = useRef(null);
    const dot3Ref = useRef(null);
    const dot4Ref = useRef(null);
    const line1Ref = useRef(null);
    const line2Ref = useRef(null);

    const isActive = (item) => {
        if (item.to === "/marketplace" && location.pathname.startsWith("/marketplace")) return true;
        if (item.to === "/community" && location.pathname === "/community") return true;
        return location.pathname === item.to;
    };

    // Navbar entrance animation
    useEffect(() => {
        gsap.fromTo(navbarRef.current,
            { y: -100, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, delay: 0.1, ease: "power3.out" }
        );
    }, []);

    // Rotation hover animation on logo
    useEffect(() => {
        const logo = logoRef.current;
        if (!logo) return;

        const onEnter = () => gsap.to(logo, { rotate: 180, scale: 1.1, duration: 0.6, ease: "power2.out" });
        const onLeave = () => gsap.to(logo, { rotate: 0, scale: 1, duration: 0.6, ease: "power2.out" });

        logo.addEventListener("mouseenter", onEnter);
        logo.addEventListener("mouseleave", onLeave);
        return () => {
            logo.removeEventListener("mouseenter", onEnter);
            logo.removeEventListener("mouseleave", onLeave);
        };
    }, []);

    // Dot grid morph to X timeline
    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.inOut", duration: 0.4 } });
        if (open) {
            // Morph dots to X
            tl.to([dot1Ref.current, dot4Ref.current], { x: 0, y: 0, scale: 0, opacity: 0 }, 0)
              .to([dot2Ref.current, dot3Ref.current], { x: 0, y: 0, scale: 0, opacity: 0 }, 0)
              .to(line1Ref.current, { scaleX: 1, scaleY: 1, opacity: 1, rotate: 45 }, 0.1)
              .to(line2Ref.current, { scaleX: 1, scaleY: 1, opacity: 1, rotate: -45 }, 0.1);
        } else {
            // Morph X back to dots
            tl.to([line1Ref.current, line2Ref.current], { scaleX: 0, scaleY: 0, opacity: 0, rotate: 0 }, 0)
              .to(dot1Ref.current, { x: -4, y: -4, scale: 1, opacity: 1 }, 0.1)
              .to(dot2Ref.current, { x: 4, y: -4, scale: 1, opacity: 1 }, 0.1)
              .to(dot3Ref.current, { x: -4, y: 4, scale: 1, opacity: 1 }, 0.1)
              .to(dot4Ref.current, { x: 4, y: 4, scale: 1, opacity: 1 }, 0.1);
        }
    }, [open]);

    // Fullscreen Overlay reveal/dismiss
    useEffect(() => {
        if (open) {
            gsap.killTweensOf([overlayRef.current, menuItemsRef.current]);
            gsap.set(overlayRef.current, { pointerEvents: "auto" });
            gsap.timeline({ defaults: { ease: "power3.out" } })
                .to(overlayRef.current, { opacity: 1, duration: 0.6 })
                .fromTo(menuItemsRef.current,
                    { y: 60, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" },
                    "-=0.3"
                );
        } else {
            gsap.killTweensOf([overlayRef.current, menuItemsRef.current]);
            gsap.set(overlayRef.current, { pointerEvents: "none" });
            gsap.timeline({ defaults: { ease: "power3.inOut" } })
                .to(menuItemsRef.current, { y: -40, opacity: 0, duration: 0.3, stagger: 0.03 })
                .to(overlayRef.current, { opacity: 0, duration: 0.4 }, "-=0.2");
        }
    }, [open]);

    const handleNavClick = (to) => {
        setOpen(false);
        if (to.startsWith("#")) {
            const el = document.querySelector(to);
            if (el) el.scrollIntoView({ behavior: "smooth" });
        } else {
            navigate(to);
        }
    };

    return (
        <>
            <div className="fixed top-0 inset-x-0 z-50 p-4" ref={navbarRef}>
                <div className="max-w-7xl mx-auto rounded-full border border-white/10 bg-black/40 backdrop-blur-md px-6 py-2.5 flex items-center justify-between shadow-2xl">
                    
                    {/* Left: Logo + Brand */}
                    <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3 group">
                        <span ref={logoRef} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 transition-colors duration-300 group-hover:border-red-500/50">
                            <LogoIcon />
                        </span>
                        <span className="text-xs font-semibold tracking-[0.25em] text-white uppercase transition-opacity duration-300 group-hover:opacity-80">
                            MOD SYNDICATE
                        </span>
                    </Link>

                    {/* Center Navigation (Desktop) */}
                    <nav className="hidden md:flex items-center gap-1.5 bg-white/5 border border-white/5 px-2 py-1 rounded-full">
                        {NAV_ITEMS.map((item) => {
                            const active = isActive(item);
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => handleNavClick(item.to)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 ${
                                        active
                                            ? "bg-white/15 text-white shadow-inner"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Right: CTA Button */}
                    <div className="hidden md:flex items-center gap-2">
                        {user ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/dashboard"
                                    className="relative px-5 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white tracking-wide hover:scale-105 hover:bg-white/10 transition-all duration-300"
                                >
                                    DASHBOARD
                                    <span className="absolute top-1 right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                </Link>
                                <button
                                    onClick={() => { logout(); navigate("/"); }}
                                    className="px-4 py-2 rounded-full text-xs font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    LOG OUT
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => openAuth("login")}
                                    className="px-4 py-2 rounded-full text-xs font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    LOG IN
                                </button>
                                <button
                                    onClick={() => openAuth("signup")}
                                    className="relative px-5 py-2 rounded-full bg-white text-black font-semibold text-xs tracking-wide hover:scale-105 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg"
                                >
                                    ENTER GARAGE
                                    <span className="absolute top-1 right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Toggle Button */}
                    <button
                        onClick={() => setOpen((s) => !s)}
                        className="md:hidden flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold tracking-widest text-white uppercase hover:bg-white/10 transition-all"
                    >
                        <span>{open ? "CLOSE" : "MENU"}</span>
                        
                        {/* 2x2 morphing grid / X icon container */}
                        <div className="relative h-3 w-3 flex items-center justify-center">
                            {/* Dots */}
                            <span ref={dot1Ref} className="absolute h-1 w-1 bg-white rounded-full transition-transform" style={{ transform: "translate(-4px, -4px)" }} />
                            <span ref={dot2Ref} className="absolute h-1 w-1 bg-white rounded-full transition-transform" style={{ transform: "translate(4px, -4px)" }} />
                            <span ref={dot3Ref} className="absolute h-1 w-1 bg-white rounded-full transition-transform" style={{ transform: "translate(-4px, 4px)" }} />
                            <span ref={dot4Ref} className="absolute h-1 w-1 bg-white rounded-full transition-transform" style={{ transform: "translate(4px, 4px)" }} />
                            
                            {/* Lines for X morph */}
                            <span ref={line1Ref} className="absolute w-3.5 h-[1.5px] bg-white opacity-0" style={{ transform: "scale(0) rotate(0deg)" }} />
                            <span ref={line2Ref} className="absolute w-3.5 h-[1.5px] bg-white opacity-0" style={{ transform: "scale(0) rotate(0deg)" }} />
                        </div>
                    </button>

                </div>
            </div>

            {/* Fullscreen Mobile Overlay Menu */}
            <div
                ref={overlayRef}
                className="fixed inset-0 z-40 bg-black/90 backdrop-blur-2xl flex flex-col justify-center items-center opacity-0 pointer-events-none transition-opacity duration-300"
                style={{ backgroundImage: "linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.4))" }}
            >
                <nav className="flex flex-col items-center gap-8">
                    {NAV_ITEMS.map((item, idx) => {
                        const active = isActive(item);
                        return (
                            <button
                                key={item.label}
                                ref={(el) => (menuItemsRef.current[idx] = el)}
                                onClick={() => handleNavClick(item.to)}
                                className={`text-3xl font-extrabold tracking-wide uppercase transition-all duration-300 hover:scale-105 hover:tracking-[0.15em] ${
                                    active ? "text-white" : "text-white/50 hover:text-white"
                                }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}

                    {/* Mobile Login/CTA links inside overlay */}
                    <div
                        ref={(el) => (menuItemsRef.current[NAV_ITEMS.length] = el)}
                        className="flex flex-col items-center gap-4 mt-8 w-full px-8"
                    >
                        {user ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    onClick={() => setOpen(false)}
                                    className="w-full text-center py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    DASHBOARD
                                </Link>
                                <button
                                    onClick={() => { logout(); setOpen(false); navigate("/"); }}
                                    className="w-full text-center py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
                                >
                                    LOG OUT
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => { setOpen(false); openAuth("login"); }}
                                    className="w-full text-center py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
                                >
                                    LOG IN
                                </button>
                                <button
                                    onClick={() => { setOpen(false); openAuth("signup"); }}
                                    className="w-full text-center py-3 rounded-full bg-white text-black font-semibold hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                >
                                    ENTER GARAGE
                                </button>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </>
    );
};
export default Navbar;
