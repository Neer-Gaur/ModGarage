import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import Lenis from "lenis";

import { AuthProvider, useAuth } from "@/lib/auth";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { AuthModal } from "@/components/ms/AuthModal";
import { GearShiftTransition } from "@/components/ms/GearShiftTransition";

import Home from "@/pages/Home";
import Marketplace from "@/pages/Marketplace";
import ProductDetail from "@/pages/ProductDetail";
import Community from "@/pages/Community";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Garage from "@/pages/Garage";

import { useState } from "react";
import IntroLoader from "@/components/ms/IntroLoader";

// Lenis smooth scrolling (respects prefers-reduced-motion)
const useLenis = () => {
    useEffect(() => {
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const lenis = new Lenis({ duration: 1.0, smoothWheel: true });
        let rafId = 0;
        const raf = (time) => {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
        return () => { cancelAnimationFrame(rafId); lenis.destroy(); };
    }, []);
};

const ScrollToTop = () => {
    const location = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    }, [location.pathname]);
    return null;
};

const ProtectedRoute = ({ children }) => {
    const { user, loading, openAuth } = useAuth();
    const location = useLocation();
    useEffect(() => {
        if (!loading && !user) openAuth("login");
    }, [user, loading, openAuth]);
    if (loading) return null;
    if (!user) return <Navigate to="/" replace state={{ from: location }} />;
    return children;
};

const AnimatedRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait" initial={false}>
            <GearShiftTransition routeKey={location.pathname}>
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Home />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/marketplace/:id" element={<ProductDetail />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/garage" element={<ProtectedRoute><Garage /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </GearShiftTransition>
        </AnimatePresence>
    );
};

const Shell = () => {
    useLenis();
    return (
        <>
            <TopNav />
            <ScrollToTop />
            <AnimatedRoutes />
            <Footer />
            <AuthModal />
            <Toaster
                position="top-center"
                theme="dark"
                toastOptions={{
                    style: {
                        background: "var(--ms-surface-1)",
                        color: "var(--ms-text)",
                        border: "1px solid rgba(255,255,255,0.10)",
                    },
                }}
            />
        </>
    );
};

function App() {
    const [showIntro, setShowIntro] = useState(() => {
        return sessionStorage.getItem("ms_intro_shown") !== "true";
    });

    useEffect(() => {
        if (showIntro) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            sessionStorage.setItem("ms_intro_shown", "true");
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showIntro]);

    return (
        <div className="App min-h-screen">
            <AnimatePresence mode="wait">
                {showIntro ? (
                    <motion.div
                        key="intro-loader"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.55, ease: "easeInOut" }}
                        className="fixed inset-0 z-[9999]"
                    >
                        <IntroLoader onComplete={() => setShowIntro(false)} />
                    </motion.div>
                ) : (
                    <BrowserRouter key="app-content">
                        <AuthProvider>
                            <Shell />
                        </AuthProvider>
                    </BrowserRouter>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
