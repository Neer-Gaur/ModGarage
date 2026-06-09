import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, ChevronRight, User as UserIcon, LogOut, Wrench, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { BRAND_LOGO_URL } from "@/lib/brand";

const LINKS = [
    { to: "/marketplace", label: "Marketplace", testid: "nav-marketplace-link" },
    { to: "/community", label: "Community", testid: "nav-community-link" },
];

export const TopNav = () => {
    const { user, openAuth, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => { setOpen(false); }, [location.pathname]);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            data-testid="top-nav"
            className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
                scrolled ? "bg-white/95 border-b border-[var(--ms-border-color)] shadow-sm" : "bg-white/80 border-b border-transparent"
            }`}
        >
            <div className="ms-container flex items-center justify-between h-16">
                <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5 group">
                    <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-md overflow-hidden bg-white ring-1 ring-black/5 transition-shadow duration-300 group-hover:ring-[var(--ms-red)] group-hover:shadow-sm">
                        <img src={BRAND_LOGO_URL} alt="Mod Syndicate" className="h-full w-full object-contain" />
                    </span>
                    <span className="hidden sm:inline ms-display text-xl tracking-wider leading-none">
                        MOD <span className="text-[var(--ms-red)]">SYNDICATE</span>
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {LINKS.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            data-testid={l.testid}
                            className={({ isActive }) =>
                                `relative px-4 py-2 text-sm font-medium tracking-wide transition-colors ${
                                    isActive ? "text-[var(--ms-text)] font-semibold" : "text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <span className="relative">
                                    {l.label.toUpperCase()}
                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-underline"
                                            className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[var(--ms-red)]"
                                            style={{ boxShadow: "0 0 12px var(--ms-red)" }}
                                        />
                                    )}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-2">
                    <button
                        data-testid="nav-search-button"
                        onClick={() => navigate("/marketplace")}
                        className="h-10 w-10 grid place-items-center rounded-lg border border-[var(--ms-border-color)] text-[var(--ms-text-muted)] hover:text-[var(--ms-text)] hover:border-[var(--ms-text-muted)] transition-colors"
                        aria-label="Search marketplace"
                    >
                        <Search className="h-4 w-4" />
                    </button>
                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link to="/garage" data-testid="nav-my-garage-link" className="ms-button-secondary ms-sheen">
                                <Wrench className="h-4 w-4" /> My Garage
                            </Link>
                            <Link to="/dashboard" data-testid="nav-dashboard-link" className="ms-button-primary ms-sheen">
                                <UserIcon className="h-4 w-4" /> Dashboard
                            </Link>
                            <button
                                data-testid="nav-logout-button"
                                onClick={() => { logout(); navigate("/"); }}
                                className="h-10 w-10 grid place-items-center rounded-lg border border-[var(--ms-border-color)] text-[var(--ms-text-muted)] hover:text-[var(--ms-text)] hover:border-[var(--ms-text-muted)] transition-colors"
                                aria-label="Logout"
                                title="Logout"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                data-testid="nav-login-button"
                                onClick={() => openAuth("login")}
                                className="ms-button-secondary ms-sheen"
                            >
                                Log in
                            </button>
                            <button
                                data-testid="nav-signup-button"
                                onClick={() => openAuth("signup")}
                                className="ms-button-primary ms-sheen"
                            >
                                Enter Your Garage <ChevronRight className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>

                <button
                    data-testid="nav-mobile-toggle"
                    className="md:hidden h-10 w-10 grid place-items-center rounded-lg border border-[var(--ms-border-color)] text-[var(--ms-text)]"
                    onClick={() => setOpen((s) => !s)}
                    aria-label="Toggle menu"
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {open && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="md:hidden border-t border-[var(--ms-border-color)] bg-white"
                >
                    <div className="ms-container py-4 flex flex-col gap-2">
                        {LINKS.map((l) => (
                            <NavLink
                                key={l.to}
                                  to={l.to}
                                data-testid={`mobile-${l.testid}`}
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? "text-[var(--ms-text)] bg-black/5" : "text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]"}`
                                }
                            >
                                {l.label.toUpperCase()}
                            </NavLink>
                        ))}
                        <div className="h-px bg-[var(--ms-border-color)] my-2" />
                        {user ? (
                            <>
                                <Link to="/dashboard" className="ms-button-primary ms-sheen w-full justify-center">
                                    Dashboard
                                </Link>
                                <Link to="/garage" className="ms-button-secondary ms-sheen w-full justify-center">
                                    My Garage
                                </Link>
                                <button
                                    onClick={() => { logout(); navigate("/"); }}
                                    className="ms-button-secondary w-full justify-center"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => openAuth("login")} className="ms-button-secondary ms-sheen w-full justify-center">
                                    Log in
                                </button>
                                <button onClick={() => openAuth("signup")} className="ms-button-primary ms-sheen w-full justify-center">
                                    Enter Your Garage
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </header>
    );
};
