import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Wrench, ShoppingCart, Users, User, Gauge, CaretDown, SignOut, GearSix } from '@phosphor-icons/react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/';

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace', icon: Wrench },
    { href: '/garage', label: 'My Garage', icon: ShoppingCart },
    { href: '/community', label: 'Community', icon: Users },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 group" data-testid="nav-logo">
          <div className="w-8 h-8 bg-mg-red flex items-center justify-center">
            <Wrench size={18} weight="bold" className="text-white" />
          </div>
          <span className="font-unbounded text-sm font-bold tracking-wider text-white uppercase">
            ModGarage
          </span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-2 text-sm font-manrope uppercase tracking-wider transition-colors ${
                  location.pathname === href ? 'text-white' : 'text-white/40 hover:text-white'
                }`}
                data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <Icon size={16} weight="bold" />
                {label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-white/70 hover:text-white transition-colors" data-testid="user-menu-trigger">
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 bg-mg-surface border border-white/10 flex items-center justify-center">
                      <User size={16} weight="bold" />
                    </div>
                  )}
                  <CaretDown size={14} weight="bold" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-mg-surface border-white/10">
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer" data-testid="nav-dashboard">
                  <Gauge size={16} className="mr-2" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer" data-testid="nav-profile">
                  <User size={16} className="mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/garage')} className="cursor-pointer md:hidden">
                  <ShoppingCart size={16} className="mr-2" /> My Garage
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer" data-testid="nav-admin">
                    <GearSix size={16} className="mr-2" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-mg-red" data-testid="nav-logout">
                  <SignOut size={16} className="mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-mg-red text-white font-unbounded text-xs tracking-widest uppercase px-5 py-2.5 hover:bg-[#E62600] transition-colors"
              data-testid="login-btn"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
