import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle, ShieldCheck, CaretLeft, CaretRight } from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 40;
const frameSrc = (i) => `/scroll-images/ezgif-frame-${String(i + 1).padStart(3, '0')}-Picsart-AiImageEnhancer.jpg`;

const IMAGES = {
  parts: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADWkNeIc0eFDevRSynE2PxfNTpS6ZFsriyT8TCjPkSIvrI1n-nLwCB5EYPaHsFq26h1LoLY24eC5Uke66b46WvoGtc8mk1DwFTocWUuvpgssv7HS9_6mewYLrVgnwGfoY1CzBJfZfHHbSAn8h4WmQZDQsGspgajQI61UNreDFFeT867NBtOctMMYXkAmYDz_dya-ATP1hhqVwE-ZgQSW80pHKyWtV0G9GM48EmLrlUVLE7c4R8brAUvwUorbBe5Z9ulwpbkxgsPCw',
  garage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsKuGMWfKXiOZL5wTp8raqUquCJG-NKkeSsIHc7GHycX34vt-nc5o0LdhyLHdXeZv5TZ2hXjNchpH8MhWjPFVnQPV_12qC-rp5PJYCSS_AHuQpzv8FpbnNMlCZ5xV5koDS-SlOSDnpjMP9YiTl0Z4zMlZ9es8Rz5tt-G8H9iEw8QrUhcslPeoT3L-CJORmOsNiqZr7Y-YcetwBfUYM8fez80OJLkIRvlTbA05mYKsXDS-upAe-kfv8FUULou6A6Yq7qpBHsSYcA2s',
  cta: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDftTtHKCJgrEExqnD0DI40wUTj4puq0letryYV5DWjMQmiiDUK6FNmoASrHTblT0NdqElnGJW-hwFEH8qK-BRA7SAl59zQDCreSXtI5jQKuT3HPb0cfoWxBiG0y2KN-mEWgydPSgpu2NlkhlRaERXVo6beeGgpILgO7OIGYjzH1vjpgC2ffZXK641VzPtnKAj3MyTjMDRMoUoZ5la7NZLaVQnSfu6vjSk5rd2rTiWJM4b7gF8D_jwANox5mwRlrbGPSt6BNLdKxJU',
};

const BUILDS = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhp4dBF7dft_nUvWAs8eXq0jvL3MC2gjrp6UTZV5b9SYolPw5z5FgatOKf311hC3OTlgUq0VTRH4s2-80qWClT_mOI7kZi7pUNcQ7NRQMw3xqOaLAJYXbRBcMARvuQxRQl7g83ICRiXdvd07nWhBZEa8FhTyWCEDIAhu21yvSyYGnJJnYu4lkl5elBw6Z0J4VjpsxopzxZYLj1nacFIjMXRxuSdJBNxPzjK12KK4766-Nug6KjvQ0zb6s8HS3c797eTBUapqC2Zvs',
    user: '@CARBON_REBEL', title: 'Midnight 911 GT3', desc: 'Full Aero Kit + Stage 2 Tune',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBq4YDg5NtZs-Zdd3Rh3g5cNDketza8d03Gymk2mxch2-KfWBlKGPhkHQf9j1Y7KohLI2GcyEMRW_Us0FvV1sEkzvIb6nMryopCr4VGxSep3vKr3h0BqRzX3rDdgyv9EoUTmyJ3FJFPcGv662l0q6PdEPehZXNsoE-R17c0kcUX4jetQSMpYT44hR7PQAE6_M1d8B61rsPOlZbKlHPuecYFyxug4147umUWKK-D26JsK_9mDy7BxUUeyKj_Chp9CfP_iv4g0QheVwA',
    user: '@APEX_HUNTER', title: 'Stealth Supra A90', desc: 'Widebody Conversion',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApqUEk8ZoZFhf-avL7-R9yOQRLLOFv8X6QxM6jeIje3eH2Inf-nQgs2hMFWOEoSVzH3BkciE1cEX7LIu3WWbyz-ssI2RUMqea_UGuQVP3RWzgxtuSMalLulI8NkImY3-pWLbkr0mtYay_dBfl39AbeWdz4qMOI_xreecF4FkPzQecvL9BWN-970zqXYWfFdgJElBmMG939TAOTRgXKAPUrCuEItakpBS8SGBBGVnelq307RrzYJhSLZSQB4fezMybqnyB-nejM6pc',
    user: '@TRACK_MONSTER', title: 'Challenger Hellcat Redeye', desc: 'Suspension & Drag Setup',
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const canvasRef = useRef(null);
  const communityRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const handleGetStarted = () => {
    if (user) { navigate('/dashboard'); return; }
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const scrollBuilds = (dir) => {
    if (!communityRef.current) return;
    communityRef.current.scrollBy({ left: dir === 'left' ? -420 : 420, behavior: 'smooth' });
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
      const img = images[Math.min(Math.max(Math.round(idx), 0), FRAME_COUNT - 1)];
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
        if (loaded === FRAME_COUNT) setImagesLoaded(true);
      };
      images.push(img);
    }

    const frameObj = { value: 0 };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: '+=4000',
        pin: true,
        scrub: 0.3,
        anticipatePin: 1,
      }
    });

    tl.to(frameObj, {
      value: FRAME_COUNT - 1,
      snap: 'value',
      ease: 'none',
      onUpdate: () => drawFrame(frameObj.value)
    }, 0);

    tl.fromTo('.red-pulse-overlay',
      { opacity: 0 },
      { opacity: 1, duration: 0.5 },
      0.1
    );
    tl.to('.red-pulse-overlay', { opacity: 0, duration: 0.1 }, 0.85);

    tl.to('.scroll-title', { opacity: 0, scale: 0.85, duration: 0.15, ease: 'power2.in' }, 0.05);
    tl.to('.scroll-arrow', { opacity: 0, duration: 0.08 }, 0.03);

    // Single headline appears at mid-scroll
    tl.fromTo('.scroll-headline',
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 0.2, ease: 'power3.out' },
      0.4
    );
    tl.fromTo('.scroll-headline-cta',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' },
      0.55
    );

    const handleResize = () => {
      setSize();
      drawFrame(frameObj.value);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="bg-mg-surface" data-testid="landing-page">

      {/* ======================= SCROLLYTELLING HERO ======================= */}
      <section ref={heroRef} className="relative h-screen w-full overflow-hidden bg-mg-surface">
        <canvas ref={canvasRef} className="scroll-canvas" />

        <div className="absolute inset-0 bg-gradient-to-b from-mg-surface/60 via-transparent to-mg-surface/70 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-mg-surface/30 to-mg-surface/30 z-[1]" />

        <div className="red-pulse-overlay absolute inset-0 z-[2] opacity-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(220, 0, 0, 0.1) 70%, rgba(220, 0, 0, 0.2) 100%)'
        }} />
        <div className="word-flash absolute inset-0 z-[2] opacity-0 bg-mg-red/10 pointer-events-none" />
        <div className="grain-overlay z-[3]" />

        {/* Title overlay */}
        <div className="scroll-title absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center px-4">
            <img src="/logo.png" alt="Mod Syndicate" className="h-28 md:h-40 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(220,0,0,0.3)]" />
            <h1 className="font-headline text-5xl md:text-[7rem] lg:text-[9rem] leading-[0.85] uppercase text-white tracking-tighter font-black">
              MOD <span className="text-mg-red text-glow">SYNDICATE</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/40 font-body font-light max-w-md mx-auto tracking-wide">
              For The Builders.
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-arrow absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-label">Scroll to Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-mg-red to-transparent" />
        </div>

        {/* Single headline — appears mid-scroll */}
        <div className="scroll-headline absolute inset-0 flex items-center justify-center z-10 opacity-0 pointer-events-none">
          <div className="text-center">
            <h2 className="font-headline text-5xl md:text-[5rem] lg:text-[7rem] leading-[0.9] text-white uppercase tracking-tighter font-black">
              From Vision to <span className="text-mg-red text-glow">Precision.</span>
            </h2>
            <div className="scroll-headline-cta opacity-0 mt-10 pointer-events-auto">
              <button
                onClick={handleGetStarted}
                className="btn-glass text-white font-headline text-lg font-bold tracking-[0.1em] uppercase px-14 py-5 hover:shadow-[0_0_40px_rgba(220,0,0,0.4)] active:scale-95 transition-all"
                data-testid="hero-get-started-btn"
              >
                {user ? 'Go to Dashboard' : 'Build Now'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= MAIN CONTENT ======================= */}
      <main className="relative bg-mg-surface">

        {/* ---------- PRECISION PARTS ---------- */}
        <section className="relative min-h-screen flex items-center py-24" data-testid="precision-parts">
          <div className="container mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-block px-4 py-1 bg-mg-surface-bright text-mg-cyan font-label text-xs tracking-widest uppercase mb-6">
                Engineered Specs
              </div>
              <h2 className="text-5xl md:text-7xl font-headline font-black mb-8 leading-tight text-mg-text">
                PRECISION <br /><span className="text-mg-red">PARTS</span>
              </h2>
              <p className="text-neutral-400 text-lg leading-relaxed mb-10 max-w-lg font-body">
                Every component in our marketplace is vetted for structural integrity and thermal efficiency.
                From forged wheels to titanium exhaust systems, we only stock the elite.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-mg-surface-high flex items-center justify-center group-hover:bg-mg-teal/20 transition-colors">
                    <CheckCircle size={24} weight="bold" className="text-mg-cyan" />
                  </div>
                  <span className="font-headline font-bold text-xl uppercase tracking-wider text-mg-text">Tuned for Speed</span>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-mg-surface-high flex items-center justify-center group-hover:bg-mg-teal/20 transition-colors">
                    <ShieldCheck size={24} weight="bold" className="text-mg-cyan" />
                  </div>
                  <span className="font-headline font-bold text-xl uppercase tracking-wider text-mg-text">Race Certified</span>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative aspect-square bg-mg-surface-card overflow-hidden">
              <img src={IMAGES.parts} alt="Precision engineered turbocharger" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </section>

        {/* ---------- PROFESSIONAL INSTALLATION ---------- */}
        <section className="relative min-h-screen flex items-center bg-mg-dark py-24" data-testid="professional-installation">
          <div className="container mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/5] bg-mg-surface-card overflow-hidden">
              <img src={IMAGES.garage} alt="Professional mechanic" className="w-full h-full object-cover grayscale" loading="lazy" />
              <div className="absolute inset-0 bg-mg-red/10 mix-blend-overlay" />
            </div>
            <div>
              <div className="inline-block px-4 py-1 bg-mg-surface-bright text-mg-red font-label text-xs tracking-widest uppercase mb-6">
                Certified Garages
              </div>
              <h2 className="text-5xl md:text-7xl font-headline font-black mb-8 leading-tight text-mg-text">
                MASTERFUL <br /><span className="text-mg-red">EXECUTION</span>
              </h2>
              <p className="text-neutral-400 text-lg leading-relaxed mb-10 max-w-lg font-body">
                Don't leave performance to chance. Connect with master technicians who treat
                your build with the same reverence as a factory team.
              </p>
              <button
                onClick={() => user ? navigate('/marketplace') : handleGetStarted()}
                className="border-2 border-mg-red text-mg-red font-headline font-bold px-10 py-4 hover:bg-mg-red hover:text-white transition-all uppercase tracking-wider active:scale-95"
                data-testid="find-shop-btn"
              >
                Find a Shop
              </button>
            </div>
          </div>
        </section>

        {/* ---------- THE ASSEMBLY LINE ---------- */}
        <section className="py-32 bg-mg-surface" data-testid="assembly-line">
          <div className="container mx-auto px-8">
            <div className="mb-20">
              <h3 className="text-sm font-label uppercase tracking-[0.4em] text-neutral-500 mb-4">The Process</h3>
              <h2 className="text-5xl font-headline font-black uppercase text-mg-text">The Assembly Line</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-neutral-800">
              {[
                { num: '01', title: 'CHOOSE PARTS', desc: 'Browse our curated selection of aero, performance, and interior upgrades tailored to your VIN.' },
                { num: '02', title: 'BOOK SERVICE', desc: 'Schedule your installation with a top-tier local garage from our certified partner network.' },
                { num: '03', title: 'TRACK BUILD', desc: 'Monitor your transformation with live status updates, photos, and dyno results directly in the app.' },
              ].map(({ num, title, desc }) => (
                <div key={num} className="p-12 border-r border-b md:border-b-0 border-neutral-800 group hover:bg-mg-surface-dim transition-colors">
                  <span className="text-6xl font-headline font-black text-neutral-800 group-hover:text-mg-red transition-colors">{num}</span>
                  <h4 className="text-2xl font-headline font-bold uppercase mt-8 mb-4 text-mg-text">{title}</h4>
                  <p className="text-neutral-500 font-body">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- COMMUNITY BUILDS ---------- */}
        <section className="py-32 bg-mg-dark overflow-hidden" data-testid="community-builds">
          <div className="container mx-auto px-8 mb-16 flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-headline font-black uppercase tracking-tight text-mg-text">Community Builds</h2>
              <p className="text-neutral-500 mt-2 uppercase tracking-widest text-xs font-label">Featured Machines</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => scrollBuilds('left')}
                className="w-12 h-12 flex items-center justify-center bg-mg-surface-bright text-white hover:bg-mg-red transition-colors"
                data-testid="community-scroll-left"
              >
                <CaretLeft size={20} weight="bold" />
              </button>
              <button
                onClick={() => scrollBuilds('right')}
                className="w-12 h-12 flex items-center justify-center bg-mg-surface-bright text-white hover:bg-mg-red transition-colors"
                data-testid="community-scroll-right"
              >
                <CaretRight size={20} weight="bold" />
              </button>
            </div>
          </div>
          <div ref={communityRef} className="flex gap-8 px-8 overflow-x-auto no-scrollbar pb-12">
            {BUILDS.map((build, i) => (
              <div key={i} className="min-w-[400px] group relative flex-shrink-0">
                <div className="aspect-square bg-mg-surface-card overflow-hidden">
                  <img
                    src={build.img}
                    alt={build.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-mg-surface to-transparent">
                  <span className="text-mg-cyan text-xs font-label tracking-widest">{build.user}</span>
                  <h5 className="text-xl font-headline font-bold uppercase mt-2 text-mg-text">{build.title}</h5>
                  <p className="text-neutral-400 text-sm mt-1 font-body">{build.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- NEXT LEVEL CTA ---------- */}
        <section className="relative py-48 bg-mg-surface" data-testid="next-level-cta">
          <div className="absolute inset-0 z-0">
            <img src={IMAGES.cta} alt="" className="w-full h-full object-cover opacity-20 grayscale" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-b from-mg-surface via-transparent to-mg-surface" />
          </div>
          <div className="container mx-auto px-8 relative z-10 text-center">
            <h2 className="text-6xl md:text-8xl font-headline font-black mb-12 uppercase leading-none text-mg-text">
              Ready for the<br /><span className="text-mg-red text-glow">Next Level?</span>
            </h2>
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <button
                onClick={() => user ? navigate('/configurator') : handleGetStarted()}
                className="btn-glass text-white font-headline font-black text-lg px-16 py-6 uppercase active:scale-95"
                data-testid="build-config-btn"
              >
                Build Your Config
              </button>
              <button
                onClick={() => user ? navigate('/marketplace') : handleGetStarted()}
                className="btn-glass-outline text-white font-headline font-black text-lg px-16 py-6 uppercase active:scale-95"
                data-testid="view-parts-btn"
              >
                View Parts
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ======================= FOOTER ======================= */}
      <footer className="bg-mg-dark w-full border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8 px-12 py-16" data-testid="footer">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Mod Syndicate" className="h-10 w-auto" />
            <span className="text-lg font-bold text-mg-red font-headline uppercase tracking-tighter">Mod Syndicate</span>
          </div>
          <p className="text-neutral-500 font-body text-sm max-w-xs leading-relaxed">
            Dedicated to the pursuit of mechanical perfection. Engineered for those who demand more from their machines.
          </p>
          <div className="text-mg-red text-sm font-body uppercase tracking-widest mt-4">
            2026 Mod Syndicate. For The Builders.
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h6 className="text-white font-headline font-bold uppercase tracking-widest text-sm mb-2">Network</h6>
          <div className="flex flex-col gap-3">
            <Link to="/marketplace" className="text-neutral-500 hover:text-mg-red transition-all font-body text-sm uppercase tracking-widest opacity-80 hover:opacity-100">Marketplace</Link>
            <Link to="/booking" className="text-neutral-500 hover:text-mg-red transition-all font-body text-sm uppercase tracking-widest opacity-80 hover:opacity-100">Certified Shops</Link>
            <Link to="/community" className="text-neutral-500 hover:text-mg-red transition-all font-body text-sm uppercase tracking-widest opacity-80 hover:opacity-100">Community Gallery</Link>
            <Link to="/garage" className="text-neutral-500 hover:text-mg-red transition-all font-body text-sm uppercase tracking-widest opacity-80 hover:opacity-100">Build Tracker</Link>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h6 className="text-white font-headline font-bold uppercase tracking-widest text-sm mb-2">Connect</h6>
          <div className="flex flex-col gap-3">
            <a href="#" className="text-neutral-500 hover:text-mg-red transition-all font-body text-sm uppercase tracking-widest opacity-80 hover:opacity-100">Instagram</a>
            <a href="#" className="text-neutral-500 hover:text-mg-red transition-all font-body text-sm uppercase tracking-widest opacity-80 hover:opacity-100">YouTube</a>
            <a href="#" className="text-neutral-500 hover:text-mg-red transition-all font-body text-sm uppercase tracking-widest opacity-80 hover:opacity-100">Terms of Service</a>
            <a href="#" className="text-neutral-500 hover:text-mg-red transition-all font-body text-sm uppercase tracking-widest opacity-80 hover:opacity-100">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
