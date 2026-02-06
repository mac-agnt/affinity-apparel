/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  COLOR_SEQUENCE,
  SIZES,
  SIZE_AVAILABILITY,
  type Size,
} from "@/lib/hoodieConfig";

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

  /* ── Gradient crossfade ── */
  const [gradients, setGradients] = useState<[string, string]>([
    makeGradient(0),
    makeGradient(0),
  ]);
  const [activeLayer, setActiveLayer] = useState(0);
  const activeLayerRef = useRef(0);
  const activeIndexRef = useRef(0);

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
    // eslint-disable-next-line no-console
    console.log(
      `[Add to Cart] ${c.label} Hoodie · Size ${selectedSize} · Qty ${quantity} · $${(60 * quantity).toFixed(2)}`,
    );
  }, [activeIndex, selectedSize, quantity]);

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

  const navLinks = ["Menu", "About", "Shop", "Contact"];

  /* ══════════════════════════ RENDER ══════════════════════════ */

  return (
    <section
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
      {/* Oversized Nike-style emblem.
          Mask-tinted to the active theme color (faint).
          Always mounted — transitions colour smoothly. */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          className="w-[820px] max-w-[120vw] lg:w-[1400px] lg:max-w-[110vw] aspect-square"
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
            opacity: 0.045,
            transform: "translateY(-5vh)",
            transition: "background-color 300ms ease",
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
        <nav className="flex-shrink-0 flex justify-center pt-4 md:pt-5 px-4">
          <div
            className="inline-flex flex-col items-center rounded-3xl md:rounded-full border transition-all duration-300 overflow-hidden"
            style={liquidGlass}
          >
            {/* Top row: logo + desktop links */}
            <div className="flex items-center gap-4 md:gap-7 px-4 md:px-7 py-2 md:py-2.5 w-full justify-center">
              <button
                className="md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20 rounded-full"
                onClick={() => setIsNavOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={isNavOpen}
              >
                <img
                  src="/affinity-sales-emblem.png"
                  alt="Affinity"
                  className="h-5 transition-[filter,transform] duration-300"
                  style={{
                    filter: isDarkBg ? "none" : "brightness(0)",
                    transform: isNavOpen
                      ? "rotate(45deg)"
                      : "rotate(0deg)",
                  }}
                  draggable={false}
                />
              </button>
              <img
                src="/affinity-sales-emblem.png"
                alt="Affinity"
                className="hidden md:block h-7 transition-[filter] duration-300"
                style={{ filter: isDarkBg ? "none" : "brightness(0)" }}
                draggable={false}
              />
              <div className="hidden md:flex items-center gap-7">
                {navLinks.map((item) => (
                  <span
                    key={item}
                    className="text-[11px] tracking-[0.18em] uppercase opacity-50 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Mobile expandable links */}
            <div
              className="md:hidden w-full overflow-hidden transition-all duration-300 ease-out"
              style={{
                maxHeight: isNavOpen ? "200px" : "0px",
                opacity: isNavOpen ? 1 : 0,
              }}
            >
              <div className="flex flex-col items-center gap-3 pb-3 px-6">
                {navLinks.map((item) => (
                  <button
                    key={item}
                    onClick={() => setIsNavOpen(false)}
                    className="text-[11px] tracking-[0.18em] uppercase opacity-55 hover:opacity-90 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20 rounded px-2 py-0.5"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>

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
              Founded on the belief that what you wear should match how
              you move, Affinity began as a small workshop producing
              quality fleece for those who refused to compromise on
              comfort or craft.
            </p>
            <p className="mt-2 text-[11px] lg:text-xs opacity-25 leading-[1.75] font-light">
              Every stitch carries that original intent — garments that
              last, fabrics that soften with time, and silhouettes that
              stay relevant season after season.
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
            <button
              onClick={handleAddToCart}
              className="inline-flex items-center px-6 py-2 rounded-full font-semibold text-[13px] tracking-wide border active:scale-[0.97] active:brightness-95 hover:brightness-[1.04] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30"
              style={liquidCta}
            >
              Add to Cart
            </button>
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
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-5 pt-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent"
        style={textStyle}
      >
        <button
          onClick={handleAddToCart}
          className="w-full py-3 rounded-full font-semibold text-sm tracking-wide border border-white/30 text-gray-900 active:scale-[0.98] active:brightness-95 hover:brightness-[1.02] transition-all duration-150"
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
    </section>
  );
}
