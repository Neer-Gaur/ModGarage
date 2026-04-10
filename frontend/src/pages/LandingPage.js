import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, Lightning, Wrench, CalendarCheck } from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 40;
const frameSrc = (i) => `/scroll-images/ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;

const SCROLL_WORDS = ['WRAPS', 'RIMS', 'TYRES', 'HOODS', 'LAMPS'];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const canvasRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const handleGetStarted = () => {
    if (user) { navigate('/dashboard'); return; }
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

    // Main GSAP timeline
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

    // Frame animation — full scroll range
    tl.to(frameObj, {
      value: FRAME_COUNT - 1,
      snap: 'value',
      ease: 'none',
      onUpdate: () => drawFrame(frameObj.value)
    }, 0);

    // Red vignette pulses in during word animations
    tl.fromTo('.red-pulse-overlay',
      { opacity: 0 },
      { opacity: 1, duration: 0.5 },
      0.1
    );
    tl.to('.red-pulse-overlay', { opacity: 0, duration: 0.1 }, 0.85);

    // Title: fade out quickly
    tl.to('.scroll-title', { opacity: 0, scale: 0.85, duration: 0.08, ease: 'power2.in' }, 0.06);
    tl.to('.scroll-arrow', { opacity: 0, duration: 0.05 }, 0.04);

    // Bounce each word in sequence
    const wordStart = 0.12;
    const wordDur = 0.10;
    const wordGap = 0.04;

    SCROLL_WORDS.forEach((word, i) => {
      const pos = wordStart + i * (wordDur + wordGap);
      const sel = `.scroll-word-${word.toLowerCase()}`;

      // Bounce IN: scale from big, opacity 0 → 1
      tl.fromTo(sel,
        { opacity: 0, scale: 2, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: wordDur * 0.45, ease: 'back.out(2.5)' },
        pos
      );
      // Red flash on bounce
      tl.fromTo('.word-flash',
        { opacity: 0 },
        { opacity: 0.2, duration: wordDur * 0.15, ease: 'power2.out' },
        pos
      );
      tl.to('.word-flash',
        { opacity: 0, duration: wordDur * 0.3 },
        pos + wordDur * 0.15
      );
      // Bounce OUT: scale down, fade
      tl.to(sel,
        { opacity: 0, scale: 0.5, y: -30, duration: wordDur * 0.45, ease: 'power3.in' },
        pos + wordDur * 0.55
      );
    });

    // "WE GOT EVERYTHING" — final statement
    const finalPos = wordStart + SCROLL_WORDS.length * (wordDur + wordGap) + 0.02;
    tl.fromTo('.scroll-final',
      { opacity: 0, scale: 1.4 },
      { opacity: 1, scale: 1, duration: 0.12, ease: 'back.out(2)' },
      finalPos
    );
    // CTA button slides up
    tl.fromTo('.scroll-final-cta',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.1, ease: 'power2.out' },
      finalPos + 0.08
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

  const steps = [
    { num: '01', title: 'SELECT YOUR RIDE', desc: 'Choose your car make, model, and year to get started', icon: Lightning },
    { num: '02', title: 'CUSTOMIZE PARTS', desc: 'Browse and add modifications to your virtual garage', icon: Wrench },
    { num: '03', title: 'BOOK & TRANSFORM', desc: 'Schedule a pickup and our experts handle the rest', icon: CalendarCheck },
  ];

  return (
    <div className="bg-black" data-testid="landing-page">
      {/* ======= SCROLLYTELLING HERO ======= */}
      <section ref={heroRef} className="relative h-screen w-full overflow-hidden bg-black">
        {/* Canvas */}
        <canvas ref={canvasRef} className="scroll-canvas" />

        {/* Dark overlays for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-black/30 z-[1]" />

        {/* Red vignette — pulses during word animations */}
        <div className="red-pulse-overlay absolute inset-0 z-[2] opacity-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(255, 42, 0, 0.1) 70%, rgba(255, 42, 0, 0.2) 100%)'
        }} />

        {/* Red flash on word bounce */}
        <div className="word-flash absolute inset-0 z-[2] opacity-0 bg-mg-red/10 pointer-events-none" />

        {/* Grain texture overlay */}
        <div className="grain-overlay z-[3]" />

        {/* Title overlay — visible at start */}
        <div className="scroll-title absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center px-4">
            <p className="font-mono text-xs tracking-[0.4em] text-mg-red uppercase mb-6 font-semibold">Premium Car Modifications</p>
            <h1 className="font-display text-7xl md:text-[9rem] lg:text-[11rem] leading-[0.85] uppercase text-white tracking-wide">
              MOD<span className="text-mg-red">GARAGE</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/40 font-unbounded font-light max-w-md mx-auto tracking-wide">
              Build your dream ride. One modification at a time.
            </p>
          </div>
        </div>

        {/* Scroll arrow */}
        <div className="scroll-arrow absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.4em] text-white/20 uppercase">Scroll</span>
          <ArrowDown size={18} weight="bold" className="text-mg-red/60 animate-bounce" />
        </div>

        {/* ======= BOUNCING WORD OVERLAYS ======= */}
        {SCROLL_WORDS.map((word) => (
          <div
            key={word}
            className={`scroll-word-${word.toLowerCase()} absolute inset-0 flex items-center justify-center z-10 opacity-0 pointer-events-none`}
          >
            <span className="font-display text-[8rem] md:text-[12rem] lg:text-[16rem] leading-none text-white uppercase tracking-wider drop-shadow-[0_0_60px_rgba(255,42,0,0.3)]">
              {word}
            </span>
          </div>
        ))}

        {/* ======= FINAL STATEMENT ======= */}
        <div className="scroll-final absolute inset-0 flex items-center justify-center z-10 opacity-0">
          <div className="text-center">
            <span className="font-display text-5xl md:text-[5rem] lg:text-[7rem] leading-[0.9] text-white/60 uppercase tracking-wider block">
              We Got
            </span>
            <span className="font-display text-6xl md:text-[7rem] lg:text-[10rem] leading-[0.85] text-mg-red uppercase tracking-wider block glow-red-text">
              Everything
            </span>
            <div className="scroll-final-cta opacity-0 mt-10">
              <button
                onClick={handleGetStarted}
                className="bg-mg-red text-white font-unbounded text-sm font-bold tracking-[0.2em] uppercase px-12 py-5 hover:bg-[#E62600] transition-all glow-red"
                data-testid="hero-get-started-btn"
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======= RED DIVIDER ======= */}
      <div className="red-divider" />

      {/* ======= HOW IT WORKS ======= */}
      <section className="py-24 md:py-32 px-6 bg-black" data-testid="how-it-works">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="font-mono text-xs tracking-[0.4em] text-mg-red uppercase mb-3 font-semibold">The Process</p>
            <h2 className="font-unbounded text-3xl md:text-4xl font-extrabold tracking-tight uppercase text-white">
              How It <span className="text-mg-red">Works</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 bento-grid">
            {steps.map(({ num, title, desc, icon: Icon }) => (
              <div key={num} className="p-8 md:p-12 group relative overflow-hidden">
                <span className="font-display text-[6rem] md:text-[8rem] leading-none text-mg-red/10 absolute -top-4 -left-2">{num}</span>
                <div className="relative z-10">
                  <div className="mb-6 w-12 h-12 border border-mg-red/20 flex items-center justify-center group-hover:border-mg-red/60 group-hover:bg-mg-red/5 transition-all">
                    <Icon size={22} weight="bold" className="text-mg-red/60 group-hover:text-mg-red transition-colors" />
                  </div>
                  <h3 className="font-unbounded text-sm font-bold tracking-[0.1em] uppercase text-white mb-3">{title}</h3>
                  <p className="text-white/30 font-unbounded text-sm leading-relaxed font-light">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= RED DIVIDER ======= */}
      <div className="red-divider" />

      {/* ======= COMMUNITY PREVIEW ======= */}
      <section className="py-24 px-6 bg-black" data-testid="community-preview">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-mono text-xs tracking-[0.4em] text-mg-red uppercase mb-3 font-semibold">Community</p>
              <h2 className="font-unbounded text-3xl md:text-4xl font-extrabold tracking-tight uppercase text-white">
                Featured <span className="text-mg-red">Builds</span>
              </h2>
            </div>
            <button
              onClick={() => user ? navigate('/community') : handleGetStarted()}
              className="text-white/30 hover:text-mg-red font-mono text-xs tracking-wider uppercase transition-colors"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-mg-red/10">
            {[
              { img: 'https://images.unsplash.com/photo-1774576320208-9914d1fc5be5?w=600&h=400&fit=crop', caption: 'Carbon aero kit build' },
              { img: 'https://images.unsplash.com/photo-1628273148878-b9ebaec15818?w=600&h=400&fit=crop', caption: 'Track-ready suspension setup' },
              { img: 'https://images.unsplash.com/photo-1774088249014-b0d7d907ad16?w=600&h=400&fit=crop', caption: 'Full engine bay rebuild' },
            ].map((post, i) => (
              <div key={i} className="relative aspect-[4/3] overflow-hidden group bg-black cursor-pointer">
                <img src={post.img} alt={post.caption} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute inset-0 bg-mg-red/0 group-hover:bg-mg-red/5 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white text-sm font-unbounded font-semibold">{post.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= RED DIVIDER ======= */}
      <div className="red-divider" />

      {/* ======= FINAL CTA ======= */}
      <section className="py-32 px-6 bg-black relative overflow-hidden" data-testid="final-cta">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,42,0,0.06),transparent_70%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display text-6xl md:text-[8rem] lg:text-[10rem] leading-[0.85] uppercase text-white mb-4">
            Start<br /><span className="text-mg-red glow-red-text">Modifying</span>
          </h2>
          <p className="text-white/30 font-unbounded text-base md:text-lg mb-12 max-w-lg mx-auto font-light">
            Join thousands of car enthusiasts who trust ModGarage for premium modifications.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-mg-red text-white font-unbounded text-sm font-bold tracking-[0.2em] uppercase px-14 py-5 hover:bg-[#E62600] transition-all glow-red"
            data-testid="final-get-started-btn"
          >
            {user ? 'Go to Dashboard' : 'Get Started Now'}
          </button>
        </div>
      </section>

      {/* ======= FOOTER ======= */}
      <footer className="border-t border-mg-red/10 py-8 px-6 bg-black">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-display text-2xl tracking-wider text-white/20 uppercase">ModGarage</span>
          <span className="font-mono text-[10px] tracking-wider text-white/10 uppercase">2026 All Rights Reserved</span>
        </div>
      </footer>
    </div>
  );
}
