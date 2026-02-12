/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  COLOR_SEQUENCE,
  SIZES,
  SIZE_AVAILABILITY,
  type Size,
} from "@/lib/hoodieConfig";
import { checkoutAdapter } from "@/lib/commerce/checkoutAdapter";
import { Cart } from "@/lib/commerce/types";
import CheckoutDrawer from "./CheckoutDrawer";
import Navbar from "./Navbar";

/* ─── Constants & Timings ─── */

const TIMINGS = {
  LOAD_STAGGER: 180,
  LOAD_EASE_MS: 900,        // Slower for premium feel
  LOAD_INITIAL_DELAY: 100,
  NAV_DELAY: 1300,          // Extra delay after Navbar before other items
  SLIDE_EXIT_MS: 550,       // Exit duration
  SLIDE_ENTER_MS: 700,      // Enter duration
  LOGO_DURATION_MS: 1100,   // Slower logo entrance
  LOGO_DELAY_MS: 150,
};

const TOTAL_LOAD_PHASES = 14;
const HOODIE_LOAD_PHASE = 14;

/*  LOAD PHASE MAP
    ──────────────
     1  Navbar (Expand)
     2  Emblem (Background)
     3  H1 Headline + Subheader
     4  History Heading
     5  History P1
     6  History P2
     7  Size S
     8  Size M
     9  Size L
    10  Size XL
    11  Quantity Control (Slide in)
    12  Add to Cart (Slide in)
    13  (Spacing)
    14  Hoodie Image (Last!)
*/

const HEADLINE_BY_COLOR: Record<string, string> = {
  black: "Oversized Fleece Hoodie",
  darkblue: "Comfy And Snug",
  blue: "Relaxed And Thick",
  gray: "Premium And Casual",
  green: "Calm And Clean",
  pink: "Warm And Soft",
};

const SIZE_SCALES: Record<Size, number> = {
  S: 0.94,
  M: 1,
  L: 1.06,
  XL: 1.12,
};

/* ─── Easing Curves ─── */
const EASE_PREMIUM = "cubic-bezier(0.16, 1, 0.3, 1)"; // easeOutExpo-ish
const EASE_SLIDE = "cubic-bezier(0.22, 1, 0.36, 1)";

/* ═══════════════════════════════════════════════════════════════════ */

export default function HoodieHero() {
  /* ── State ── */
  const [activeIndex, setActiveIndex] = useState(0);
  // Slideshow state
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  
  const [selectedSize, setSelectedSize] = useState<Size>("M");
  const [quantity, setQuantity] = useState(1);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [highlightCta, setHighlightCta] = useState(false);

  /* ── First-load entrance ── */
  const [loadPhase, setLoadPhase] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [isSlideshowReady, setIsSlideshowReady] = useState(false);
  
  const reducedMotionRef = useRef(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Cart State ── */
  const [cart, setCart] = useState<Cart>(checkoutAdapter.createCart());
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const cartCount = cart.lines.reduce((acc, line) => acc + line.quantity, 0);

  /* ── Gradient crossfade ── */
  const [gradients, setGradients] = useState<[string, string]>([
    "radial-gradient(ellipse at 45% 40%, #141414 0%, #141414 28%, #000000 72%, #000000 100%)",
    "radial-gradient(ellipse at 45% 40%, #141414 0%, #141414 28%, #000000 72%, #000000 100%)",
  ]);
  const [activeLayer, setActiveLayer] = useState(0);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    COLOR_SEQUENCE.forEach(({ image }) => {
      const img = new window.Image();
      img.src = image;
    });
  }, []);

  /* ── First-load entrance sequence ── */
  useEffect(() => {
    reducedMotionRef.current =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setHasMounted(true);

    if (reducedMotionRef.current) {
      setLoadPhase(TOTAL_LOAD_PHASES);
      setIsSlideshowReady(true);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    
    // Navbar Phase 1
    timers.push(setTimeout(() => { if (mountedRef.current) setLoadPhase(1); }, TIMINGS.LOAD_INITIAL_DELAY));

    // Remaining Phases (2..TOTAL)
    for (let i = 2; i <= TOTAL_LOAD_PHASES; i++) {
      timers.push(
        setTimeout(() => {
          if (mountedRef.current) setLoadPhase(i);
        }, TIMINGS.LOAD_INITIAL_DELAY + TIMINGS.NAV_DELAY + (i - 1) * TIMINGS.LOAD_STAGGER),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  /* ── Detect when final entrance animation is done to enable slideshow ── */
  useEffect(() => {
    if (loadPhase >= HOODIE_LOAD_PHASE && !reducedMotionRef.current) {
      // Wait for the Hoodie entrance transition to finish before swapping to slideshow mode
      // This prevents the "double load" or "snap" effect.
      const timer = setTimeout(() => {
        if (mountedRef.current) setIsSlideshowReady(true);
      }, TIMINGS.LOAD_EASE_MS);
      return () => clearTimeout(timer);
    }
  }, [loadPhase]);

  /* ── Slideshow Logic (Exit then Enter) ── */
  useEffect(() => {
    if (activeIndex === displayedIndex) return;

    // Start Exit
    setIsExiting(true);

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // Wait for Exit duration, then swap
    transitionTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setDisplayedIndex(activeIndex);
      setIsExiting(false);
    }, TIMINGS.SLIDE_EXIT_MS);

    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, [activeIndex, displayedIndex]);

  /* ── CTA Highlight Effect ── */
  useEffect(() => {
    if (highlightCta) {
      const timer = setTimeout(() => setHighlightCta(false), 800);
      return () => clearTimeout(timer);
    }
  }, [highlightCta]);

  /* ────────── Handlers ────────── */

  const makeGradient = (idx: number): string => {
    const c = COLOR_SEQUENCE[idx];
    if (c.gradientOverride) return c.gradientOverride;
    return `radial-gradient(ellipse at 45% 40%, ${c.gradientCenter} 0%, ${c.gradientCenter} 28%, ${c.gradientEdge} 72%, ${c.gradientEdge} 100%)`;
  };

  const handleColorClick = useCallback(
    (targetIndex: number) => {
      if (targetIndex === activeIndex) return;

      // Update Target (Transitions handled in useEffect)
      setActiveIndex(targetIndex);

      // Update Gradients immediately
      const nextGradient = makeGradient(targetIndex);
      const inactive = activeLayer === 0 ? 1 : 0;
      
      setGradients((prev) => {
        const copy: [string, string] = [...prev];
        copy[inactive] = nextGradient;
        return copy;
      });
      setActiveLayer(inactive);
    },
    [activeIndex, activeLayer],
  );

  const handleAddToCart = useCallback(() => {
    const c = COLOR_SEQUENCE[activeIndex];
    const newItem = {
      variantId: `${c.key}-${selectedSize}`,
      title: "Oversized Fleece Hoodie",
      colorKey: c.label,
      size: selectedSize,
      unitPriceCents: 6000,
      compareAtCents: 7500,
      quantity: quantity,
      imageSrc: c.image,
    };
    const updatedCart = checkoutAdapter.addLineItem(cart, newItem);
    setCart(updatedCart);
    setIsCheckoutOpen(true);
  }, [activeIndex, selectedSize, quantity, cart]);

  /* ────────── Derived ────────── */

  const color = COLOR_SEQUENCE[activeIndex];
  const isDarkBg = color.textColor === "#ffffff";

  // Split headline for 3-line effect
  const headlineWords = HEADLINE_BY_COLOR[color.key].split(" ");

  /* ━━━━━━━━━━ STYLES ━━━━━━━━━━ */

  const liquidGlass: React.CSSProperties = {
    backgroundColor: isDarkBg ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.04)",
    borderColor: isDarkBg ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.08)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  };

  const liquidCta: React.CSSProperties = {
    backgroundColor: isDarkBg ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.85)",
    color: isDarkBg ? "#111827" : "#ffffff",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  };

  /* ─── Entrance Helpers ─── */

  const entrance = (
    step: number,
    type: "fadeUp" | "fadeRight" = "fadeUp",
  ): React.CSSProperties | undefined => {
    if (!hasMounted || isSlideshowReady) return undefined;
    const visible = loadPhase >= step;
    
    const transform = type === "fadeUp" 
        ? (visible ? "translateY(0)" : "translateY(14px)")
        : (visible ? "translateX(0)" : "translateX(24px)");

    return {
      opacity: visible ? 1 : 0,
      transform,
      transition: `opacity ${TIMINGS.LOAD_EASE_MS}ms ${EASE_PREMIUM}, transform ${TIMINGS.LOAD_EASE_MS}ms ${EASE_PREMIUM}`,
    };
  };

  /* ── Shared renderers ── */

  const sizeBtn = (size: Size, variant: "desktop" | "mobile", idx: number) => {
    const avail = SIZE_AVAILABILITY[size];
    const sel = selectedSize === size;
    const dim = variant === "desktop" ? "w-[52px] h-11 rounded-xl text-sm" : "w-12 h-10 rounded-lg text-sm";
    
    // Updated Phases: Sizes are 6,7,8,9
    const sizePhase = 6 + idx;

    return (
      <button
        key={size}
        onClick={() => avail && setSelectedSize(size)}
        disabled={!avail}
        className={[
          dim,
          "font-medium border backdrop-blur-sm transition-all duration-150",
          !avail ? "opacity-25 cursor-not-allowed line-through" : 
          sel 
            ? (isDarkBg ? "bg-white/10 border-white/30" : "bg-black/5 border-black/15") 
            : (isDarkBg ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-black/0 border-black/5 hover:bg-black/5"),
        ].join(" ")}
        style={{
          ...entrance(sizePhase, "fadeUp"),
        }}
      >
        {size}
      </button>
    );
  };

  const colorDot = (i: number) => {
    const c = COLOR_SEQUENCE[i];
    const isActive = i === activeIndex;
    return (
      <button
        key={c.key}
        onClick={() => handleColorClick(i)}
        className="relative w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
      >
        <span
          className="block w-4 h-4 md:w-[18px] md:h-[18px] rounded-full border-[2.5px] transition-all duration-200"
          style={{
            backgroundColor: c.dotColor,
            borderColor: isActive ? color.textColor : "transparent",
            boxShadow: isActive ? `0 0 12px 2px ${c.dotColor}80` : "none",
          }}
        />
      </button>
    );
  };

  /* ══════════════════════════ RENDER ══════════════════════════ */

  return (
    <>
    <style jsx>{`
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(32px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .animate-slide-in {
        animation: slideInRight ${TIMINGS.SLIDE_ENTER_MS}ms ${EASE_SLIDE} forwards;
      }
    `}</style>

    <section
      id="home"
      ref={heroRef}
      className="relative h-screen overflow-hidden select-none"
      aria-label="Oversized Fleece Hoodie product"
    >
      {/* ─────────── BACKGROUND ─────────── */}
      {gradients.map((bg, idx) => (
        <div
          key={idx}
          className="absolute inset-0"
          style={{
            background: bg,
            opacity: activeLayer === idx ? 1 : 0,
            transition: `opacity 600ms ease`,
          }}
        />
      ))}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* ─────────── WATERMARK — Phase 2 ─────────── */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[44%] md:top-[42%] -translate-y-1/2 z-[2] flex items-center justify-center"
        aria-hidden="true"
        style={
          hasMounted && !isSlideshowReady
            ? {
                opacity: loadPhase >= 2 ? 1 : 0,
                transform: loadPhase >= 2 ? "scale(1)" : "scale(0.985)",
                transition: `opacity ${TIMINGS.LOGO_DURATION_MS}ms ${EASE_PREMIUM} ${TIMINGS.LOGO_DELAY_MS}ms, transform ${TIMINGS.LOGO_DURATION_MS}ms ${EASE_PREMIUM} ${TIMINGS.LOGO_DELAY_MS}ms`,
              }
            : undefined
        } 
      >
        <div
          className="w-[1400px] max-w-[220vw] lg:w-[1650px] lg:max-w-[150vw] xl:w-[1875px] aspect-square"
          style={{
            maskImage: 'url("/affinity-sales-emblem.png")',
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
            WebkitMaskImage: 'url("/affinity-sales-emblem.png")',
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
            backgroundColor: color.watermarkTint,
            opacity: color.watermarkOpacity,
            transition: `background-color ${TIMINGS.SLIDE_ENTER_MS}ms ease, opacity ${TIMINGS.SLIDE_ENTER_MS}ms ease`,
          }}
        />
      </div>

      {/* ─────────── MAIN HOODIE — Phase 14 (Last) + Slideshow ─────────── */}
      <div
        className="absolute z-[5] left-1/2 -translate-x-1/2 pointer-events-none top-[42%] sm:top-[42%] md:top-[43%] -translate-y-1/2"
      >
        <div 
          className="relative w-[420px] h-[420px] sm:w-[460px] sm:h-[460px] md:w-[440px] md:h-[440px] lg:w-[520px] lg:h-[520px] xl:w-[560px] xl:h-[560px] transition-transform duration-500 ease-out"
          style={{ transform: `scale(${SIZE_SCALES[selectedSize]})` }}
        >
          {/* First Load Image (Separate to avoid slideshow conflicts on mount) */}
          {!isSlideshowReady && (
             <img
               src={COLOR_SEQUENCE[activeIndex].image}
               alt="Hoodie"
               className="absolute inset-0 w-full h-full object-contain"
               style={{
                 opacity: loadPhase >= HOODIE_LOAD_PHASE ? 1 : 0,
                 transform: loadPhase >= HOODIE_LOAD_PHASE ? "scale(1)" : "scale(0.985)",
                 transition: `opacity ${TIMINGS.LOAD_EASE_MS}ms ${EASE_PREMIUM}, transform ${TIMINGS.LOAD_EASE_MS}ms ${EASE_PREMIUM}`,
               }}
               draggable={false}
             />
          )}

          {/* Slideshow Image (Active after load) */}
          {isSlideshowReady && (
            <img
              key={displayedIndex}
              src={COLOR_SEQUENCE[displayedIndex].image}
              alt="Hoodie"
              className={!isExiting && (activeIndex !== displayedIndex || displayedIndex !== 0) ? "absolute inset-0 w-full h-full object-contain animate-slide-in" : "absolute inset-0 w-full h-full object-contain"}
              style={
                isExiting
                  ? {
                      opacity: 0,
                      transform: "translateX(-32px)",
                      transition: `opacity ${TIMINGS.SLIDE_EXIT_MS}ms ${EASE_SLIDE}, transform ${TIMINGS.SLIDE_EXIT_MS}ms ${EASE_SLIDE}`,
                    }
                  : undefined
              }
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* ─────────── UI LAYER ─────────── */}
      <div
        className="relative z-10 flex flex-col h-full"
        style={{ color: color.textColor, transition: "color 300ms ease" }}
      >
        <Navbar
          isNavOpen={isNavOpen}
          setIsNavOpen={setIsNavOpen}
          cartCount={cartCount}
          setIsCheckoutOpen={setIsCheckoutOpen}
          isDarkBg={isDarkBg}
          shouldExpand={loadPhase >= 1}
        />

        {/* ══════════ DESKTOP UI ══════════ */}

        <div className="hidden md:flex absolute z-10 inset-x-0 top-[40%] -translate-y-1/2 items-start justify-between px-10 lg:px-14 xl:px-16 pointer-events-none">
          {/* Left copy block */}
          <div className="max-w-[190px] lg:max-w-[240px] xl:max-w-[280px] pointer-events-auto">
            {/* Phase 2 — Headline + Subheader */}
            <div style={entrance(2)}>
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-[1.08] min-h-[3em]">
                {/* Render the dynamic headline with line breaks */}
                <span className="block" key={color.key}>
                  {headlineWords.map((word, i) => (
                    <span key={i} className="block">{word}</span>
                  ))}
                </span>
              </h1>
              <p className="mt-3 text-[11px] lg:text-xs opacity-55 leading-relaxed">
                Heavyweight. Soft-touch fleece.
                <br />
                Everyday comfort.
              </p>
            </div>
          </div>

          {/* Right — size buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 pointer-events-auto lg:ml-auto">
            {SIZES.map((s, i) => sizeBtn(s, "desktop", i))}
          </div>
        </div>

        {/* ── Bottom desktop bar ── */}
        <div className="hidden md:flex absolute z-10 bottom-6 lg:bottom-8 inset-x-0 items-end justify-between px-10 lg:px-14 xl:px-16">
          {/* Left — History of Affinity */}
          <div className="max-w-[260px] lg:max-w-[310px] xl:max-w-[340px]">
            <div style={entrance(3)}>
              <h2 className="text-[10px] lg:text-[11px] uppercase tracking-[0.22em] opacity-40 font-medium mb-2.5">
                History of Affinity
              </h2>
            </div>
            <div style={entrance(4)}>
              <p className="text-[11px] lg:text-xs opacity-30 leading-[1.75] font-light">
                Affinity started inside the sales world, built around people who
                show up daily and take pride in the craft. What began as a
                tight circle of reps chasing higher standards turned into a
                community with its own identity.
              </p>
            </div>
            <div style={entrance(5)}>
              <p className="mt-2 text-[11px] lg:text-xs opacity-25 leading-[1.75] font-light">
                This apparel line is for that community. Clean, durable pieces
                you can wear on a call day, a flight, or a meetup. Quiet
                branding, premium fleece, and a fit that stays sharp even after
                the grind.
              </p>
            </div>
          </div>

          {/* Centre — Price + colour dots (PERSISTENT, no entrance) */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex flex-col items-center gap-2.5">
            <div className="flex flex-col items-center">
              <span className="text-[11px] line-through opacity-35 tracking-wider">$75</span>
              <span className="text-4xl lg:text-5xl font-bold tracking-tighter tabular-nums leading-none">$60</span>
            </div>
            <div className="flex items-center gap-1" role="radiogroup">
              {COLOR_SEQUENCE.map((_, i) => colorDot(i))}
            </div>
          </div>

          {/* Right — Quantity + Add to Cart */}
          <div className="flex flex-col items-end gap-3">
            {cartCount > 0 && (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="mb-1 text-[11px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity underline underline-offset-4"
              >
                Checkout ({cartCount})
              </button>
            )}

            {/* Phase 10 — Quantity (Slide in) */}
            <div style={entrance(10, "fadeRight")}>
              <div className="inline-flex items-center gap-3 h-10 px-4 rounded-full border transition-all duration-300" style={liquidGlass}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm active:scale-95 hover:bg-black/5 disabled:opacity-25"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-medium tabular-nums">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm active:scale-95 hover:bg-black/5"
                >
                  +
                </button>
              </div>
            </div>

            {/* Phase 11 — Add to Cart (Slide in) */}
            <div style={entrance(11, "fadeRight")}>
              <div className="relative">
                {highlightCta && (
                  <span className="absolute -inset-1 rounded-full bg-white/30 animate-ping" />
                )}
                <button
                  onClick={handleAddToCart}
                  className="relative inline-flex items-center px-6 py-2 rounded-full font-semibold text-[13px] tracking-wide border active:scale-[0.97] active:brightness-95 hover:brightness-[1.04] transition-all duration-150"
                  style={liquidCta}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ MOBILE UI ══════════ */}

        <div className="md:hidden text-center px-6 pt-2">
          {/* Phase 2 - Headline + Subheader */}
          <div style={entrance(2)}>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {/* Single line preferred on mobile unless very long */}
              {HEADLINE_BY_COLOR[color.key]}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm opacity-60 font-light">
              Heavyweight. Soft-touch fleece. Everyday comfort.
            </p>
          </div>
        </div>

        <div className="md:hidden flex-1 min-h-[100px]" />

        <div className="md:hidden space-y-3 px-5 text-center pb-6">
          <div className="flex items-center justify-center gap-2">
            {SIZES.map((s, i) => sizeBtn(s, "mobile", i))}
          </div>
          <div style={entrance(11, "fadeUp")} className="relative px-2">
            {highlightCta && (
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ping pointer-events-none" />
            )}
            <button
              onClick={handleAddToCart}
              className="relative w-full py-3 rounded-full font-semibold text-sm tracking-wide border border-white/30 text-gray-900 active:scale-[0.98] active:brightness-95 hover:brightness-[1.02] transition-all duration-150"
              style={{
                backgroundColor: "rgba(255,255,255,0.92)",
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)",
                boxShadow:
                  "inset 0 0.5px 0 0 rgba(255,255,255,0.60), 0 4px 12px -4px rgba(0,0,0,0.15)",
              }}
            >
              Add to Cart
            </button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs line-through opacity-35">$75</span>
              <span className="text-xl font-bold tracking-tight tabular-nums">$60</span>
            </div>
            <div className="flex items-center gap-0.5" role="radiogroup">
              {COLOR_SEQUENCE.map((_, i) => colorDot(i))}
            </div>
          </div>
        </div>

        <div className="md:hidden h-4 flex-shrink-0" />
      </div>

      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onUpdateCart={setCart}
        isDarkBg={isDarkBg}
      />
    </section>
    </>
  );
}
