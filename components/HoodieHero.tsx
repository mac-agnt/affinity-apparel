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

/* ─── Constants ─── */

const N = COLOR_SEQUENCE.length;
const EXIT_MS = 160;
const SHIFT_MS = 130;
const ENTER_MS = 300;
const ENTER_FAST_MS = 180;

type Phase = "idle" | "exit" | "shift" | "enter";

function makeGradient(idx: number): string {
  const c = COLOR_SEQUENCE[idx];
  if (c.gradientOverride) return c.gradientOverride;
  return `radial-gradient(ellipse at 45% 40%, ${c.gradientCenter} 0%, ${c.gradientCenter} 28%, ${c.gradientEdge} 72%, ${c.gradientEdge} 100%)`;
}

/* ═══════════════════════════════════════════════════════════════════ */

export default function HoodieHero() {
  /* ── State ── */
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedSize, setSelectedSize] = useState<Size>("M");
  const [quantity, setQuantity] = useState(1);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [highlightCta, setHighlightCta] = useState(false);
  const [aboutInView, setAboutInView] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  /* ── Cart State ── */
  const [cart, setCart] = useState<Cart>(checkoutAdapter.createCart());
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const cartCount = cart.lines.reduce((acc, line) => acc + line.quantity, 0);

  /* ── Gradient crossfade ── */
  const [gradients, setGradients] = useState<[string, string]>([
    makeGradient(0),
    makeGradient(0),
  ]);
  const [activeLayer, setActiveLayer] = useState(0);
  const activeLayerRef = useRef(0);
  const activeIndexRef = useRef(0);
  const aboutRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  /* ── Animation refs ── */
  const animatingRef = useRef(false);
  const queueRef = useRef<number[]>([]);
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

  /* ── Intersection Observer for About Animation ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAboutInView(true);
          observer.disconnect(); // Animate once
        }
      },
      { threshold: 0.3 }
    );

    if (aboutRef.current) {
      observer.observe(aboutRef.current);
    }

    return () => observer.disconnect();
  }, []);

  /* ── Intersection Observer for Hero Visibility (Toggle Sticky CTA) ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  /* ── CTA Highlight Effect ── */
  useEffect(() => {
    if (highlightCta) {
      const timer = setTimeout(() => setHighlightCta(false), 800);
      return () => clearTimeout(timer);
    }
  }, [highlightCta]);

  /* ────────── Tick engine ────────── */

  const tick = useCallback(() => {
    if (!mountedRef.current || queueRef.current.length === 0) {
      animatingRef.current = false;
      return;
    }

    const nextIdx = queueRef.current.shift()!;
    const isLast = queueRef.current.length === 0;

    setPhase("exit");

    setTimeout(() => {
      if (!mountedRef.current) return;

      activeIndexRef.current = nextIdx;
      setActiveIndex(nextIdx);

      const inactive = activeLayerRef.current === 0 ? 1 : 0;
      setGradients((prev) => {
        const copy: [string, string] = [prev[0], prev[1]];
        copy[inactive] = makeGradient(nextIdx);
        return copy;
      });
      setActiveLayer(inactive);
      activeLayerRef.current = inactive;

      setPhase("shift");

      setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase("enter");

        setTimeout(
          () => {
            if (!mountedRef.current) return;
            setPhase("idle");
            tick();
          },
          isLast ? ENTER_MS : ENTER_FAST_MS,
        );
      }, SHIFT_MS);
    }, EXIT_MS);
  }, []);

  /* ────────── Handlers ────────── */

  const handleColorClick = useCallback(
    (targetIndex: number) => {
      if (animatingRef.current || targetIndex === activeIndex) return;

      const steps: number[] = [];
      let cur = activeIndex;
      while (cur !== targetIndex) {
        cur = (cur + 1) % N;
        steps.push(cur);
      }

      queueRef.current = steps;
      animatingRef.current = true;
      tick();
    },
    [activeIndex, tick],
  );

  const handleAddToCart = useCallback(() => {
    const c = COLOR_SEQUENCE[activeIndex];
    
    // Create new line item
    const newItem = {
      variantId: `${c.key}-${selectedSize}`,
      title: "Oversized Fleece Hoodie",
      colorKey: c.label,
      size: selectedSize,
      unitPriceCents: 6000, // $60.00
      compareAtCents: 7500, // $75.00
      quantity: quantity,
      imageSrc: c.image,
    };

    const updatedCart = checkoutAdapter.addLineItem(cart, newItem);
    setCart(updatedCart);
    setIsCheckoutOpen(true); // Auto-open checkout on add
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
  const hoodieVisible = phase === "idle" || phase === "enter";
  const isLastTick = queueRef.current.length === 0;
  const isDarkBg = color.textColor === "#ffffff";

  /* ━━━━━━━━━━ LIQUID GLASS SYSTEM (Apple-style) ━━━━━━━━━━ */

  const liquidGlass: React.CSSProperties = {
    backgroundColor: isDarkBg
      ? "rgba(255,255,255,0.10)"
      : "rgba(0,0,0,0.04)",
    backgroundImage: isDarkBg
      ? "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.10) 100%)",
    borderColor: isDarkBg
      ? "rgba(255,255,255,0.20)"
      : "rgba(0,0,0,0.08)",
    boxShadow: isDarkBg
      ? "inset 0 0.5px 0 0 rgba(255,255,255,0.35), 0 2px 8px -3px rgba(0,0,0,0.15)"
      : "inset 0 0.5px 0 0 rgba(255,255,255,0.55), 0 2px 8px -3px rgba(0,0,0,0.05)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  };

  const liquidCta: React.CSSProperties = {
    backgroundColor: isDarkBg
      ? "rgba(255,255,255,0.88)"
      : "rgba(0,0,0,0.85)",
    backgroundImage: isDarkBg
      ? "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)",
    borderColor: isDarkBg
      ? "rgba(255,255,255,0.40)"
      : "rgba(0,0,0,0.12)",
    boxShadow: isDarkBg
      ? "inset 0 0.5px 0 0 rgba(255,255,255,0.60), 0 4px 12px -4px rgba(0,0,0,0.10)"
      : "inset 0 0.5px 0 0 rgba(255,255,255,0.15), 0 4px 12px -4px rgba(0,0,0,0.10)",
    color: isDarkBg ? "#111827" : "#ffffff",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  };

  /* Text style — fades during cycle, returns on last tick */
  const textStyle: React.CSSProperties = (() => {
    switch (phase) {
      case "idle":
        return {
          opacity: 1,
          transform: "translateY(0)",
          transition: "opacity 200ms ease-out, transform 200ms ease-out",
        };
      case "exit":
        return {
          opacity: 0,
          transform: "translateY(0)",
          transition: `opacity ${EXIT_MS}ms ease-in`,
        };
      case "shift":
        return {
          opacity: 0,
          transform: "translateY(6px)",
          transition: "none",
        };
      case "enter":
        if (isLastTick) {
          return {
            opacity: 1,
            transform: "translateY(0)",
            transition:
              "opacity 200ms ease-out 80ms, transform 200ms ease-out 80ms",
          };
        }
        return {
          opacity: 0,
          transform: "translateY(6px)",
          transition: "none",
        };
    }
  })();

  /* ── Shared renderers ── */

  const stepperBtnCls = [
    "w-8 h-8 rounded-full flex items-center justify-center text-sm leading-none",
    "active:scale-95 transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20",
    isDarkBg ? "hover:bg-white/10" : "hover:bg-black/5",
  ].join(" ");

  const sizeBtn = (size: Size, variant: "desktop" | "mobile") => {
    const avail = SIZE_AVAILABILITY[size];
    const sel = selectedSize === size;
    const dim =
      variant === "desktop"
        ? "w-[52px] h-11 rounded-xl text-sm"
        : "w-12 h-10 rounded-lg text-sm";

    const glassClass = !avail
      ? "opacity-25 cursor-not-allowed line-through border-current/10"
      : sel
        ? isDarkBg
          ? "bg-white/[0.12] border-white/[0.28] hover:bg-white/[0.16]"
          : "bg-black/[0.08] border-black/[0.16] hover:bg-black/[0.12]"
        : isDarkBg
          ? "bg-white/[0.05] border-white/[0.12] hover:bg-white/[0.08] hover:border-white/[0.18]"
          : "bg-black/[0.03] border-black/[0.07] hover:bg-black/[0.05] hover:border-black/[0.12]";

    return (
      <button
        key={size}
        onClick={() => {
          if (!avail) return;
          setSelectedSize(size);
        }}
        disabled={!avail}
        aria-pressed={sel}
        className={[
          dim,
          "font-medium border backdrop-blur-sm transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20",
          glassClass,
        ].join(" ")}
        style={
          avail
            ? {
                boxShadow: isDarkBg
                  ? sel
                    ? "inset 0 0.5px 0 0 rgba(255,255,255,0.22)"
                    : "inset 0 0.5px 0 0 rgba(255,255,255,0.10)"
                  : sel
                    ? "inset 0 0.5px 0 0 rgba(255,255,255,0.40)"
                    : "inset 0 0.5px 0 0 rgba(255,255,255,0.25)",
              }
            : undefined
        }
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
        aria-label={`Select ${c.label}`}
        aria-checked={isActive}
        role="radio"
        className="relative w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
      >
        <span
          className="block w-4 h-4 md:w-[18px] md:h-[18px] rounded-full border-[2.5px] transition-all duration-200"
          style={{
            backgroundColor: c.dotColor,
            borderColor: isActive ? color.textColor : "transparent",
            boxShadow: isActive
              ? `0 0 12px 2px ${c.dotColor}80`
              : "none",
          }}
        />
      </button>
    );
  };

  /* ══════════════════════════ RENDER ══════════════════════════ */

  return (
    <>
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
            transition: `opacity ${SHIFT_MS}ms ease`,
          }}
        />
      ))}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* ─────────── WATERMARK ─────────── */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[44%] md:top-[42%] -translate-y-1/2 z-[2] flex items-center justify-center"
        aria-hidden="true"
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
            transition: "background-color 300ms ease, opacity 300ms ease",
          }}
        />
      </div>

      {/* ─────────── MAIN HOODIE ─────────── */}
      <div
        className="absolute z-[5] left-1/2 -translate-x-1/2 pointer-events-none
          top-[42%] sm:top-[42%] md:top-[43%] -translate-y-1/2"
      >
        <div className="relative w-[420px] h-[420px] sm:w-[460px] sm:h-[460px] md:w-[440px] md:h-[440px] lg:w-[520px] lg:h-[520px] xl:w-[560px] xl:h-[560px]">
          {COLOR_SEQUENCE.map((c, i) => (
            <img
              key={c.key}
              src={c.image}
              alt={
                i === activeIndex
                  ? `${c.label} Oversized Fleece Hoodie`
                  : ""
              }
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                opacity: i === activeIndex && hoodieVisible ? 1 : 0,
                transform: `scale(${i === activeIndex && hoodieVisible ? 1 : 0.96})`,
                transition:
                  "opacity 200ms ease-out, transform 200ms ease-out",
              }}
              draggable={false}
            />
          ))}
        </div>
      </div>

      {/* ─────────── UI LAYER ─────────── */}
      <div
        className="relative z-10 flex flex-col h-full"
        style={{ color: color.textColor, transition: "color 300ms ease" }}
      >
        {/* ── Liquid Glass Nav ── */}
        <Navbar 
          isNavOpen={isNavOpen} 
          setIsNavOpen={setIsNavOpen} 
          cartCount={cartCount} 
          setIsCheckoutOpen={setIsCheckoutOpen} 
          isDarkBg={isDarkBg}
          onAboutOpen={handleOpenAbout}
        />

        {/* ══════════ DESKTOP UI ══════════ */}

        <div
          className="hidden md:flex absolute z-10 inset-x-0 top-[40%] -translate-y-1/2 items-start justify-between px-10 lg:px-14 xl:px-16 pointer-events-none"
          style={textStyle}
        >
          <div className="max-w-[190px] lg:max-w-[240px] xl:max-w-[280px] pointer-events-auto">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-[1.08]">
              Oversized
              <br />
              Fleece
              <br />
              Hoodie
            </h1>
            <p className="mt-3 text-[11px] lg:text-xs opacity-55 leading-relaxed">
              Heavyweight. Soft-touch fleece.
              <br />
              Everyday comfort.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 pointer-events-auto lg:ml-auto">
            {SIZES.map((s) => sizeBtn(s, "desktop"))}
          </div>
        </div>

        {/* ── Bottom desktop bar ── */}
        <div className="hidden md:flex absolute z-10 bottom-6 lg:bottom-8 inset-x-0 items-end justify-between px-10 lg:px-14 xl:px-16">
          {/* Left — History of Affinity (ANIMATED) */}
          <div
            className="max-w-[260px] lg:max-w-[310px] xl:max-w-[340px]"
            style={textStyle}
          >
            <h2 className="text-[10px] lg:text-[11px] uppercase tracking-[0.22em] opacity-40 font-medium mb-2.5">
              History of Affinity
            </h2>
            <p className="text-[11px] lg:text-xs opacity-30 leading-[1.75] font-light">
              Affinity started inside the sales world, built around people who
              show up daily and take pride in the craft. What began as a
              tight circle of reps chasing higher standards turned into a
              community with its own identity.
            </p>
            <p className="mt-2 text-[11px] lg:text-xs opacity-25 leading-[1.75] font-light">
              This apparel line is for that community. Clean, durable pieces
              you can wear on a call day, a flight, or a meetup. Quiet
              branding, premium fleece, and a fit that stays sharp even after
              the grind.
            </p>
          </div>

          {/* Centre — Price + colour dots (PERSISTENT) */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex flex-col items-center gap-2.5">
            <div className="flex flex-col items-center">
              <span className="text-[11px] line-through opacity-35 tracking-wider">
                $75
              </span>
              <span className="text-4xl lg:text-5xl font-bold tracking-tighter tabular-nums leading-none">
                $60
              </span>
            </div>
            <div
              className="flex items-center gap-1"
              role="radiogroup"
              aria-label="Select colour"
            >
              {COLOR_SEQUENCE.map((_, i) => colorDot(i))}
            </div>
          </div>

          {/* Right — Liquid glass stepper above CTA (ANIMATED) */}
          <div
            className="flex flex-col items-end gap-3"
            style={textStyle}
          >
            {cartCount > 0 && (
               <button
                 onClick={() => setIsCheckoutOpen(true)}
                 className="mb-1 text-[11px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity underline underline-offset-4"
               >
                 Checkout ({cartCount})
               </button>
            )}

            <div
              className="inline-flex items-center gap-3 h-10 px-4 rounded-full border transition-all duration-300"
              style={liquidGlass}
            >
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className={`${stepperBtnCls} disabled:opacity-25 disabled:cursor-not-allowed`}
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-medium tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className={stepperBtnCls}
              >
                +
              </button>
            </div>
            <div className="relative">
              {highlightCta && (
                <span className="absolute -inset-1 rounded-full bg-white/30 animate-ping" />
              )}
              <button
                onClick={handleAddToCart}
                className="relative inline-flex items-center px-6 py-2 rounded-full font-semibold text-[13px] tracking-wide border active:scale-[0.97] active:brightness-95 hover:brightness-[1.04] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30"
                style={liquidCta}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* ══════════ MOBILE UI ══════════ */}

        <div className="md:hidden text-center px-6 pt-2" style={textStyle}>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Oversized Fleece Hoodie
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm opacity-60 font-light">
            Heavyweight. Soft-touch fleece. Everyday comfort.
          </p>
        </div>

        <div className="md:hidden flex-1 min-h-[140px]" />

        {/* Mobile controls (ANIMATED) */}
        <div
          className="md:hidden space-y-3 px-5 text-center pb-2"
          style={textStyle}
        >
          <div className="flex items-center justify-center gap-2">
            {SIZES.map((s) => sizeBtn(s, "mobile"))}
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs line-through opacity-35">$75</span>
              <span className="text-xl font-bold tracking-tight tabular-nums">
                $60
              </span>
            </div>
            <div
              className="flex items-center gap-0.5"
              role="radiogroup"
              aria-label="Select colour"
            >
              {COLOR_SEQUENCE.map((_, i) => colorDot(i))}
            </div>
          </div>
        </div>

        <div className="md:hidden h-[80px] flex-shrink-0" />
      </div>

      {/* ─────────── MOBILE STICKY CTA (ANIMATED) ─────────── */}
      {!aboutOpen && (
        <div
          className={`md:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-5 pt-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent transition-opacity duration-300 ${isHeroVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={textStyle}
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
              className={`${cartCount > 0 ? 'flex-1' : 'w-full'} py-3 rounded-full font-semibold text-sm tracking-wide border border-white/30 text-gray-900 active:scale-[0.98] active:brightness-95 hover:brightness-[1.02] transition-all duration-150`}
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

    {/* ─────────── ABOUT SECTION ─────────── */}
    <section id="about" ref={aboutRef} className="hidden md:block relative w-full h-[85vh] lg:h-screen overflow-hidden bg-black z-20">
      {/* Navbar for About Section */}
      <div className="absolute top-0 inset-x-0 z-20">
        <Navbar 
          isNavOpen={isNavOpen} 
          setIsNavOpen={setIsNavOpen} 
          cartCount={cartCount} 
          setIsCheckoutOpen={setIsCheckoutOpen} 
          isDarkBg={true} // Always dark in About section
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
      <div className="absolute inset-0 bg-black/25" /> {/* Global dim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" /> {/* Bottom gradient */}
      
      <div className="absolute inset-0 flex flex-col justify-start pt-28 px-6 md:justify-end md:pt-0 md:px-14 md:pb-24 lg:px-20 lg:pb-32">
        <div className={`max-w-2xl transition-all duration-700 ease-out ${aboutInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="backdrop-blur-xl border border-white/10 bg-white/5 p-8 md:p-10 rounded-2xl">
            <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight leading-[1.1] mb-6">
              Built for the Sales Community.
            </h2>
            <p 
              className={`text-white/90 text-lg md:text-xl font-light leading-relaxed mb-8 max-w-xl transition-all duration-700 delay-100 ease-out ${aboutInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Affinity Apparel is made for reps who live in motion — long days, late calls, and standards that don’t slip.
            </p>
            <p 
              className={`text-white/60 text-sm md:text-base leading-relaxed max-w-lg mb-8 transition-all duration-700 delay-200 ease-out ${aboutInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Premium fleece, clean silhouettes, and understated branding — designed to fit in the room and on the road.
            </p>
            
            <button
              onClick={handleBuyNow}
              className={`w-full md:w-auto px-8 py-3.5 rounded-full bg-white text-black font-semibold text-sm tracking-wide hover:bg-white/90 transition-all duration-700 delay-300 ease-out ${aboutInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Buy the Hoodie
            </button>
          </div>
        </div>
      </div>
    </section>
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
