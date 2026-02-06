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
import AboutOverlay from "./AboutOverlay";

/* ─── Constants & Timings ─── */

const TIMINGS = {
  LOAD_STAGGER: 180,
  LOAD_EASE_MS: 900,        // Slower for premium feel
  LOAD_INITIAL_DELAY: 100,
  SLIDE_EXIT_MS: 550,       // Exit duration
  SLIDE_ENTER_MS: 700,      // Enter duration
  LOGO_DURATION_MS: 1100,   // Slower logo entrance
  LOGO_DELAY_MS: 150,
};

const TOTAL_LOAD_PHASES = 12;

/*  LOAD PHASE MAP
    ──────────────
     1  Emblem (Background)
     2  Hoodie Image (Early!)
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
*/

const HEADLINE_BY_COLOR: Record<string, string> = {
  black: "Oversized Fleece Hoodie",
  darkblue: "Comfy And Snug",
  blue: "Relaxed And Thick",
  gray: "Premium And Casual",
  green: "Calm And Clean",
  pink: "Warm And Soft",
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
  const [aboutInView, setAboutInView] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  /* ── First-load entrance ── */
  const [loadPhase, setLoadPhase] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
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
  
  const aboutRef = useRef<HTMLDivElement>(null);
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
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= TOTAL_LOAD_PHASES; i++) {
      timers.push(
        setTimeout(() => {
          if (mountedRef.current) setLoadPhase(i);
        }, TIMINGS.LOAD_INITIAL_DELAY + i * TIMINGS.LOAD_STAGGER),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, []);

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

  /* ── Observers ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAboutInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (aboutRef.current) observer.observe(aboutRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

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

  const handleBuyNow = () => {
    document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => setHighlightCta(true), 600);
  };

  const handleOpenAbout = () => {
    setIsNavOpen(false);
    setAboutOpen(true);
  };

  /* ────────── Derived ────────── */

  const color = COLOR_SEQUENCE[activeIndex];
  const isDarkBg = color.textColor === "#ffffff";
  const isFullyLoaded = loadPhase >= TOTAL_LOAD_PHASES;

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
    if (!hasMounted || isFullyLoaded) return undefined;
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
    
    const sizePhase = 7 + idx;

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

    {/* Scroll-snap wrapper */}
    <div className="h-screen overflow-y-auto md:snap-y md:snap-mandatory scroll-smooth">

    <section
      id="home"
      ref={heroRef}
      className="relative h-screen overflow-hidden select-none md:snap-start"
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

      {/* ─────────── WATERMARK — Phase 1 ─────────── */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[44%] md:top-[42%] -translate-y-1/2 z-[2] flex items-center justify-center"
        aria-hidden="true"
        style={
          hasMounted && !isFullyLoaded
            ? {
                opacity: loadPhase >= 1 ? 1 : 0,
                transform: loadPhase >= 1 ? "scale(1)" : "scale(0.985)",
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

      {/* ─────────── MAIN HOODIE — Phase 2 (Early) + Slideshow ─────────── */}
      <div
        className="absolute z-[5] left-1/2 -translate-x-1/2 pointer-events-none top-[42%] sm:top-[42%] md:top-[43%] -translate-y-1/2"
      >
        <div className="relative w-[420px] h-[420px] sm:w-[460px] sm:h-[460px] md:w-[440px] md:h-[440px] lg:w-[520px] lg:h-[520px] xl:w-[560px] xl:h-[560px]">
          {/* First Load Image (Separate to avoid slideshow conflicts on mount) */}
          {!isFullyLoaded && (
             <img
               src={COLOR_SEQUENCE[activeIndex].image}
               alt="Hoodie"
               className="absolute inset-0 w-full h-full object-contain"
               style={{
                 opacity: loadPhase >= 2 ? 1 : 0,
                 transform: loadPhase >= 2 ? "scale(1)" : "scale(0.985)",
                 transition: `opacity ${TIMINGS.LOAD_EASE_MS}ms ${EASE_PREMIUM}, transform ${TIMINGS.LOAD_EASE_MS}ms ${EASE_PREMIUM}`,
               }}
               draggable={false}
             />
          )}

          {/* Slideshow Image (Active after load) */}
          {isFullyLoaded && (
            <img
              key={displayedIndex} // Remounts on swap -> triggers enter animation if !isExiting
              src={COLOR_SEQUENCE[displayedIndex].image}
              alt="Hoodie"
              className={!isExiting ? "absolute inset-0 w-full h-full object-contain animate-slide-in" : "absolute inset-0 w-full h-full object-contain"}
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
          onAboutOpen={handleOpenAbout}
        />

        {/* ══════════ DESKTOP UI ══════════ */}

        <div className="hidden md:flex absolute z-10 inset-x-0 top-[40%] -translate-y-1/2 items-start justify-between px-10 lg:px-14 xl:px-16 pointer-events-none">
          {/* Left copy block */}
          <div className="max-w-[190px] lg:max-w-[240px] xl:max-w-[280px] pointer-events-auto">
            {/* Phase 3 — Headline + Subheader */}
            <div style={entrance(3)}>
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
            <h2 
              className="text-[10px] lg:text-[11px] uppercase tracking-[0.22em] opacity-40 font-medium mb-2.5"
              style={entrance(4)}
            >
              History of Affinity
            </h2>
            <p 
              className="text-[11px] lg:text-xs opacity-30 leading-[1.75] font-light"
              style={entrance(5)}
            >
              Affinity started inside the sales world, built around people who
              show up daily and take pride in the craft. What began as a
              tight circle of reps chasing higher standards turned into a
              community with its own identity.
            </p>
            <p
              className="mt-2 text-[11px] lg:text-xs opacity-25 leading-[1.75] font-light"
              style={entrance(6)}
            >
              This apparel line is for that community. Clean, durable pieces
              you can wear on a call day, a flight, or a meetup. Quiet
              branding, premium fleece, and a fit that stays sharp even after
              the grind.
            </p>
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

            {/* Phase 11 — Quantity (Slide in) */}
            <div style={entrance(11, "fadeRight")}>
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

            {/* Phase 12 — Add to Cart (Slide in) */}
            <div style={entrance(12, "fadeRight")}>
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
          {/* Phase 3 - Headline + Subheader */}
          <div style={entrance(3)}>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {/* Single line preferred on mobile unless very long */}
              {HEADLINE_BY_COLOR[color.key]}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm opacity-60 font-light">
              Heavyweight. Soft-touch fleece. Everyday comfort.
            </p>
          </div>
        </div>

        <div className="md:hidden flex-1 min-h-[140px]" />

        <div className="md:hidden space-y-3 px-5 text-center pb-2">
          <div className="flex items-center justify-center gap-2">
            {SIZES.map((s, i) => sizeBtn(s, "mobile", i))}
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

        <div className="md:hidden h-[80px] flex-shrink-0" />
      </div>

      {/* ─────────── MOBILE STICKY CTA — Phase 11/12 ─────────── */}
      {!aboutOpen && (
        <div
          className={`md:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-5 pt-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent transition-opacity duration-300 ${isHeroVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          style={entrance(11, "fadeUp")} // Slide up on mobile
        >
          <div className="flex gap-3 relative">
            {highlightCta && (
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ping pointer-events-none" />
            )}
            {cartCount > 0 && (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="flex-1 py-3 rounded-full font-semibold text-sm tracking-wide border border-white/30 text-white bg-black/80 backdrop-blur-md active:scale-[0.98] transition-all"
              >
                Checkout ({cartCount})
              </button>
            )}
            <button
              onClick={handleAddToCart}
              className={`${cartCount > 0 ? "flex-1" : "w-full"} py-3 rounded-full font-semibold text-sm tracking-wide border border-white/30 text-gray-900 active:scale-[0.98] active:brightness-95 hover:brightness-[1.02] transition-all duration-150`}
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
        </div>
      )}

      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onUpdateCart={setCart}
        isDarkBg={isDarkBg}
      />
    </section>

    {/* ─────────── ABOUT SECTION (desktop — slideshow snap target) ─────────── */}
    <section
      id="about"
      ref={aboutRef}
      className="hidden md:block relative w-full h-[85vh] lg:h-screen overflow-hidden bg-black z-20 md:snap-start"
    >
      {/* Navbar for About Section */}
      <div className="absolute top-0 inset-x-0 z-20">
        <Navbar
          isNavOpen={isNavOpen}
          setIsNavOpen={setIsNavOpen}
          cartCount={cartCount}
          setIsCheckoutOpen={setIsCheckoutOpen}
          isDarkBg={true}
          onAboutOpen={handleOpenAbout}
        />
      </div>

      <img
        src="/affinity-hero-apparel.png"
        alt="Affinity Apparel Lifestyle"
        className="absolute bottom-0 w-full h-[55vh] md:h-full md:inset-0 object-cover"
        draggable={false}
      />
      {/* Premium Overlays */}
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-start pt-28 px-6 md:justify-end md:pt-0 md:px-14 md:pb-24 lg:px-20 lg:pb-32">
        <div
          className={`max-w-2xl transition-all duration-700 ease-out ${aboutInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="backdrop-blur-xl border border-white/10 bg-white/5 p-8 md:p-10 rounded-2xl">
            <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight leading-[1.1] mb-6">
              Built for the Sales Community.
            </h2>
            <p
              className={`text-white/90 text-lg md:text-xl font-light leading-relaxed mb-8 max-w-xl transition-all duration-700 delay-100 ease-out ${aboutInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              Affinity Apparel is made for reps who live in motion — long days,
              late calls, and standards that don&apos;t slip.
            </p>
            <p
              className={`text-white/60 text-sm md:text-base leading-relaxed max-w-lg mb-8 transition-all duration-700 delay-200 ease-out ${aboutInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              Premium fleece, clean silhouettes, and understated branding —
              designed to fit in the room and on the road.
            </p>

            <button
              onClick={handleBuyNow}
              className={`w-full md:w-auto px-8 py-3.5 rounded-full bg-white text-black font-semibold text-sm tracking-wide hover:bg-white/90 transition-all duration-700 delay-300 ease-out ${aboutInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              Buy the Hoodie
            </button>
          </div>
        </div>
      </div>
    </section>

    </div>{/* end scroll-snap wrapper */}

    <AboutOverlay
      open={aboutOpen}
      onClose={() => setAboutOpen(false)}
      onBuyNow={handleBuyNow}
      isNavOpen={isNavOpen}
      setIsNavOpen={setIsNavOpen}
      cartCount={cartCount}
      setIsCheckoutOpen={setIsCheckoutOpen}
    />
    </>
  );
}
