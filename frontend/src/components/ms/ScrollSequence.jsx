import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * ScrollSequence — Apple-style scroll-driven canvas frame sequence.
 *
 * As the user scrolls through the wrapper section, the canvas redraws the
 * pre-loaded frame matching the scroll progress, creating a "video on scroll"
 * effect. The canvas stays pinned via a sticky child.
 *
 * Props:
 *  - frameCount: number of frames
 *  - framePath: function (index 1..N) -> URL
 *  - heightVh: total scroll distance of the wrapper, in vh units (default 320 → 3.2x viewport)
 *  - children: overlay node(s) absolutely positioned over the canvas
 *  - aspectRatio: { w, h } of the source frames (used to compute canvas size)
 */
export const ScrollSequence = ({
    frameCount,
    framePath,
    heightVh = 320,
    aspectRatio = { w: 16, h: 9 },
    children,
    "data-testid": testId,
}) => {
    const wrapperRef = useRef(null);
    const canvasRef = useRef(null);
    const imagesRef = useRef([]);
    const [loaded, setLoaded] = useState(0);

    const { scrollYProgress } = useScroll({
        target: wrapperRef,
        offset: ["start start", "end end"],
    });

    // Map scroll 0..1 -> frame index 0..(N-1)
    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, frameCount - 1]);

    // Preload all frames
    useEffect(() => {
        let cancelled = false;
        const images = new Array(frameCount);
        let done = 0;
        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            img.src = framePath(i + 1);
            img.onload = () => {
                if (cancelled) return;
                done += 1;
                if (i < 3 || done % 4 === 0 || done === frameCount) setLoaded(done);
            };
            img.onerror = () => { done += 1; if (done === frameCount) setLoaded(done); };
            images[i] = img;
        }
        imagesRef.current = images;
        return () => { cancelled = true; };
    }, [frameCount, framePath]);

    const draw = (idx) => {
        const canvas = canvasRef.current;
        const img = imagesRef.current[idx];
        if (!canvas || !img || !img.complete) return;
        const ctx = canvas.getContext("2d");
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        const cw = Math.floor(rect.width * dpr);
        const ch = Math.floor(rect.height * dpr);
        if (canvas.width !== cw || canvas.height !== ch) {
            canvas.width = cw;
            canvas.height = ch;
        }
        // cover-fit (like background-size: cover) on desktop, contain-fit on mobile
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        const isMobile = window.innerWidth < 768;
        const scale = isMobile ? Math.min(cw / iw, ch / ih) : Math.max(cw / iw, ch / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, dx, dy, dw, dh);
    };

    // Redraw whenever the scroll progress emits a new value
    useEffect(() => {
        const unsubscribe = frameIndex.on("change", (v) => {
            const i = Math.max(0, Math.min(frameCount - 1, Math.round(v)));
            draw(i);
        });
        // Initial draw after at least the first frame is loaded
        const firstLoad = setInterval(() => {
            if (imagesRef.current[0] && imagesRef.current[0].complete) {
                draw(0);
                clearInterval(firstLoad);
            }
        }, 80);
        // Redraw on resize
        const onResize = () => draw(Math.round(frameIndex.get()));
        window.addEventListener("resize", onResize);
        return () => {
            unsubscribe();
            window.removeEventListener("resize", onResize);
            clearInterval(firstLoad);
        };
    }, [frameIndex, frameCount]);

    const progressPct = useMemo(() => Math.round((loaded / Math.max(frameCount, 1)) * 100), [loaded, frameCount]);

    return (
        <section
            ref={wrapperRef}
            data-testid={testId}
            className="relative"
            style={{ height: `${heightVh}vh` }}
        >
            <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
                <canvas
                    ref={canvasRef}
                    aria-hidden
                    className="absolute inset-0 h-full w-full"
                    style={{ aspectRatio: `${aspectRatio.w}/${aspectRatio.h}` }}
                />
                {/* Soft dark gradient framing */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
                {/* Loading shimmer until first frame paints */}
                {loaded < Math.min(6, frameCount) && (
                    <div className="absolute inset-x-0 bottom-6 mx-auto w-fit text-[10px] uppercase tracking-widest text-[var(--ms-text-muted)] bg-black/60 px-3 py-1.5 rounded-full border border-white/10">
                        Preloading frames {progressPct}%
                    </div>
                )}
                {/* Overlay content (text, CTAs) */}
                <motion.div className="relative z-10 h-full w-full">
                    {children}
                </motion.div>
            </div>
        </section>
    );
};

/**
 * Helper: render overlay text that fades in/out as scroll progress crosses a window.
 * `range` is [enterStart, enterEnd, exitStart, exitEnd] all in 0..1 relative to the parent ScrollSequence.
 *
 * Usage requires the parent's scroll progress; for simplicity we expose a wrapper that uses
 * the *page* scroll relative to a ref. Consumers can also just use plain JSX children.
 */
export const ScrollOverlay = ({ targetRef, range = [0, 0.05, 0.25, 0.32], children, className = "" }) => {
    const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end end"] });
    const opacity = useTransform(scrollYProgress, range, [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [range[0], range[1]], [40, 0]);
    return (
        <motion.div style={{ opacity, y }} className={`absolute inset-0 flex items-end md:items-center justify-center pb-12 sm:pb-20 md:pb-0 ${className}`}>
            {children}
        </motion.div>
    );
};
