import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, Lightning, Wrench, CalendarCheck } from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 40;
const frameSrc = (i) => `/scroll-images/ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const canvasRef = useRef(null);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
      return;
    }
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    const images = [];
    let loaded = 0;

    function drawFrame(idx) {
      const img = images[Math.min(Math.max(idx, 0), FRAME_COUNT - 1)];
      if (!img || !img.complete) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const x = (canvas.width - img.naturalWidth * scale) / 2;
      const y = (canvas.height - img.naturalHeight * scale) / 2;
      ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
    }

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = frameSrc(i);
      img.onload = () => {
        loaded++;
        if (i === 0) drawFrame(0);
      };
      images.push(img);
    }

    const frameObj = { value: 0 };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: '+=3000',
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
      }
    });

    tl.to(frameObj, {
      value: FRAME_COUNT - 1,
      snap: 'value',
      ease: 'none',
      onUpdate: () => drawFrame(Math.round(frameObj.value))
    }, 0);

    tl.to('.scroll-title', { opacity: 0, y: -80, duration: 0.2 }, 0.15);
    tl.to('.scroll-arrow', { opacity: 0, duration: 0.1 }, 0.1);
    tl.fromTo('.scroll-mid', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.15 }, 0.3);
    tl.to('.scroll-mid', { opacity: 0, y: -60, duration: 0.15 }, 0.55);
    tl.fromTo('.scroll-cta', { opacity: 0, y: 60, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.2 }, 0.7);

    const handleResize = () => {
      setSize();
      drawFrame(Math.round(frameObj.value));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const steps = [
    { num: '01', title: 'SELECT YOUR RIDE', desc: 'Choose your car make, model, and year to get started', icon: Lightning },
    { num: '02', title: 'CUSTOMIZE PARTS', desc: 'Browse our marketplace and add modifications to your virtual garage', icon: Wrench },
    { num: '03', title: 'BOOK & TRANSFORM', desc: 'Schedule a pickup and our experts handle the rest', icon: CalendarCheck },
  ];

  return (
    <div className="bg-mg-dark" data-testid="landing-page">
      {/* Scrollytelling Hero */}
      <section ref={heroRef} className="relative h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="scroll-canvas" />
        <div className="absolute inset-0 bg-gradient-to-b from-mg-dark/50 via-transparent to-mg-dark/80 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-mg-dark/40 to-transparent z-[1]" />

        {/* Title overlay */}
        <div className="scroll-title absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center px-4">
            <p className="font-mono text-xs tracking-[0.3em] text-mg-red uppercase mb-6">Premium Car Modifications</p>
            <h1 className="font-unbounded text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white leading-none">
              MOD<span className="text-mg-red">GARAGE</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/50 font-manrope max-w-md mx-auto">
              Build your dream ride. One modification at a time.
            </p>
          </div>
        </div>

        {/* Scroll arrow */}
        <div className="scroll-arrow absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.3em] text-white/30 uppercase">Scroll to explore</span>
          <ArrowDown size={20} weight="bold" className="text-white/30 animate-bounce" />
        </div>

        {/* Mid overlay */}
        <div className="scroll-mid absolute inset-0 flex items-center justify-center z-10 opacity-0">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-8 md:gap-16">
              {['PERFORMANCE', 'AESTHETICS', 'PRECISION'].map((word) => (
                <span key={word} className="font-unbounded text-lg md:text-2xl font-light tracking-[0.15em] text-white/80 uppercase">
                  {word}
                </span>
              ))}
            </div>
            <div className="w-24 h-[1px] bg-mg-red mx-auto" />
          </div>
        </div>

        {/* CTA overlay */}
        <div className="scroll-cta absolute inset-0 flex items-center justify-center z-10 opacity-0">
          <div className="text-center">
            <h2 className="font-unbounded text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-8">
              Build Your<br /><span className="text-mg-red">Dream Ride</span>
            </h2>
            <button
              onClick={handleGetStarted}
              className="bg-mg-red text-white font-unbounded text-sm tracking-widest uppercase px-10 py-4 hover:bg-[#E62600] transition-all glow-red"
              data-testid="hero-get-started-btn"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 md:py-32 px-6" data-testid="how-it-works">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="font-mono text-xs tracking-[0.3em] text-mg-red uppercase mb-3">The Process</p>
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold tracking-tight uppercase text-white">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 bento-grid">
            {steps.map(({ num, title, desc, icon: Icon }) => (
              <div key={num} className="p-8 md:p-12 group">
                <span className="text-stroke font-unbounded text-6xl md:text-7xl font-black">{num}</span>
                <div className="mt-6 mb-4 w-10 h-10 border border-white/10 flex items-center justify-center group-hover:border-mg-red/50 transition-colors">
                  <Icon size={20} weight="bold" className="text-white/60 group-hover:text-mg-red transition-colors" />
                </div>
                <h3 className="font-unbounded text-sm font-bold tracking-wider uppercase text-white mb-3">{title}</h3>
                <p className="text-white/40 font-manrope text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Preview */}
      <section className="py-24 px-6 border-t border-white/5" data-testid="community-preview">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-mono text-xs tracking-[0.3em] text-mg-red uppercase mb-3">Community</p>
              <h2 className="font-unbounded text-3xl md:text-4xl font-bold tracking-tight uppercase text-white">
                Featured Builds
              </h2>
            </div>
            <button
              onClick={() => user ? navigate('/community') : handleGetStarted()}
              className="text-white/40 hover:text-white font-mono text-xs tracking-wider uppercase transition-colors"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/5">
            {[
              { img: 'https://images.unsplash.com/photo-1774576320208-9914d1fc5be5?w=600&h=400&fit=crop', caption: 'Carbon aero kit build' },
              { img: 'https://images.unsplash.com/photo-1628273148878-b9ebaec15818?w=600&h=400&fit=crop', caption: 'Track-ready suspension setup' },
              { img: 'https://images.unsplash.com/photo-1774088249014-b0d7d907ad16?w=600&h=400&fit=crop', caption: 'Full engine bay rebuild' },
            ].map((post, i) => (
              <div key={i} className="relative aspect-[4/3] overflow-hidden group bg-mg-dark cursor-pointer">
                <img src={post.img} alt={post.caption} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-mg-dark via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-sm font-manrope font-medium">{post.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 border-t border-white/5" data-testid="final-cta">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-unbounded text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white mb-6">
            Start Modifying<br /><span className="text-stroke">Today</span>
          </h2>
          <p className="text-white/40 font-manrope text-base md:text-lg mb-10 max-w-lg mx-auto">
            Join thousands of car enthusiasts who trust ModGarage for premium modifications.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-mg-red text-white font-unbounded text-sm tracking-widest uppercase px-12 py-4 hover:bg-[#E62600] transition-all glow-red"
            data-testid="final-get-started-btn"
          >
            {user ? 'Go to Dashboard' : 'Get Started Now'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-unbounded text-xs font-bold tracking-wider text-white/30 uppercase">ModGarage</span>
          <span className="font-mono text-[10px] tracking-wider text-white/20 uppercase">2026 All Rights Reserved</span>
        </div>
      </footer>
    </div>
  );
}
