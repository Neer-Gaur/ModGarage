import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Wrench, ShoppingCart, Users, User, Gauge, CaretDown, SignOut, GearSix, List } from '@phosphor-icons/react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/';
  const [mobileOpen, setMobileOpen] = useState(false);

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/garage', label: 'My Garage' },
    { href: '/community', label: 'Community' },
  ];

  return (
    <nav
      className="fixed top-0 w-full z-50 glass flex justify-between items-center px-8 h-20"
      data-testid="navbar"
    >
      <Link
        to={user ? '/dashboard' : '/'}
        className="text-2xl font-black text-mg-red tracking-tighter uppercase font-headline"
        data-testid="nav-logo"
      >
        ModGarage
      </Link>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center space-x-12 font-headline uppercase tracking-wider text-sm">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            to={href}
            className={`transition-colors duration-300 ${
              location.pathname === href
                ? 'text-mg-orange border-b-2 border-mg-red pb-1'
                : 'text-neutral-400 hover:text-mg-orange'
            }`}
            data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="active:scale-95 transition-transform" data-testid="user-menu-trigger">
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                ) : (
                  <User size={24} weight="bold" className="text-mg-orange" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-mg-surface-card border-neutral-800">
              <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer font-headline uppercase text-xs tracking-wider" data-testid="nav-dashboard">
                <Gauge size={16} className="mr-2" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer font-headline uppercase text-xs tracking-wider" data-testid="nav-profile">
                <User size={16} className="mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/garage')} className="cursor-pointer md:hidden font-headline uppercase text-xs tracking-wider">
                <ShoppingCart size={16} className="mr-2" /> My Garage
              </DropdownMenuItem>
              {user.role === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer font-headline uppercase text-xs tracking-wider" data-testid="nav-admin">
                  <GearSix size={16} className="mr-2" /> Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-mg-red font-headline uppercase text-xs tracking-wider" data-testid="nav-logout">
                <SignOut size={16} className="mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={handleLogin}
            className="text-mg-orange hover:text-mg-red transition-colors active:scale-95"
            data-testid="login-btn"
          >
            <User size={24} weight="bold" />
          </button>
        )}

        {/* Mobile menu */}
        <button className="md:hidden active:scale-95 transition-transform" onClick={() => setMobileOpen(!mobileOpen)}>
          <List size={24} weight="bold" className="text-mg-orange" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="absolute top-20 left-0 right-0 bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-800 md:hidden">
          <div className="flex flex-col py-4 px-8 gap-4">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setMobileOpen(false)}
                className={`font-headline uppercase tracking-wider text-sm py-2 transition-colors ${
                  location.pathname === href ? 'text-mg-orange' : 'text-neutral-400 hover:text-mg-orange'
                }`}
              >
                {label}
              </Link>
            ))}
            {!user && (
              <button
                onClick={() => { setMobileOpen(false); handleLogin(); }}
                className="bg-mg-red text-white font-headline font-bold text-sm uppercase tracking-wider px-6 py-3 mt-2"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
