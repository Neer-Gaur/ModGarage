import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { User, Gauge, SignOut, GearSix, List } from '@phosphor-icons/react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, loginWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogin = () => {
    loginWithGoogle();
  };

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace', authRequired: false },
    { href: '/garage', label: 'My Garage', authRequired: true },
    { href: '/community', label: 'Community', authRequired: false },
  ];

  const handleNavClick = (e, link) => {
    if (link.authRequired && !user) {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <nav
      className="relative w-full z-50 bg-mg-dark border-b border-white/5 flex justify-between items-center px-8 h-20"
      data-testid="navbar"
    >
      <Link
        to={user ? '/dashboard' : '/'}
        className="flex items-center gap-3"
        data-testid="nav-logo"
      >
        <img src="/logo.png" alt="Mod Syndicate" className="h-12 w-auto" />
        <span className="text-xl font-black text-mg-red tracking-tighter uppercase font-headline hidden sm:inline">
          Mod Syndicate
        </span>
      </Link>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center space-x-10 font-headline uppercase tracking-wider text-sm">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            onClick={(e) => handleNavClick(e, link)}
            className={`transition-colors duration-300 ${
              location.pathname === link.href
                ? 'text-mg-red border-b-2 border-mg-red pb-1'
                : 'text-neutral-400 hover:text-mg-orange'
            }`}
            data-testid={`nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
          >
            {link.label}
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
            className="btn-glass text-mg-orange hover:text-white px-4 py-2 font-headline font-bold text-xs uppercase tracking-widest"
            data-testid="login-btn"
          >
            Sign In
          </button>
        )}

        {/* Mobile menu */}
        <button className="md:hidden active:scale-95 transition-transform" onClick={() => setMobileOpen(!mobileOpen)}>
          <List size={24} weight="bold" className="text-mg-orange" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="absolute top-20 left-0 right-0 bg-mg-dark/95 backdrop-blur-xl border-b border-white/5 md:hidden z-50">
          <div className="flex flex-col py-4 px-8 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={(e) => { handleNavClick(e, link); setMobileOpen(false); }}
                className={`font-headline uppercase tracking-wider text-sm py-2 transition-colors ${
                  location.pathname === link.href ? 'text-mg-red' : 'text-neutral-400 hover:text-mg-orange'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <button
                onClick={() => { setMobileOpen(false); handleLogin(); }}
                className="btn-glass text-white font-headline font-bold text-sm uppercase tracking-wider px-6 py-3 mt-2"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
