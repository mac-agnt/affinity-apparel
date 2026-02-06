"use client";

import React, { useEffect } from "react";
import Navbar from "./Navbar";

interface AboutOverlayProps {
  open: boolean;
  onClose: () => void;
  onBuyNow: () => void;
  isNavOpen: boolean;
  setIsNavOpen: (isOpen: boolean) => void;
  cartCount: number;
  setIsCheckoutOpen: (isOpen: boolean) => void;
}

export default function AboutOverlay({
  open,
  onClose,
  onBuyNow,
  isNavOpen,
  setIsNavOpen,
  cartCount,
  setIsCheckoutOpen,
}: AboutOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 h-full w-full backdrop-blur-xl bg-black/80 border border-white/10">
        <div className="relative">
          <Navbar
            isNavOpen={isNavOpen}
            setIsNavOpen={setIsNavOpen}
            cartCount={cartCount}
            setIsCheckoutOpen={setIsCheckoutOpen}
            isDarkBg={true}
            onAboutOpen={onClose}
          />
          <button
            onClick={onClose}
            aria-label="Close About"
            className="absolute top-4 right-5 h-9 w-9 rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col h-full px-6 pt-6 pb-6">
          <div className="text-white">
            <h2 className="text-3xl font-serif tracking-tight leading-[1.1] mb-4">
              Built for the Sales Community.
            </h2>
            <p className="text-white/85 text-base font-light leading-relaxed mb-4 max-w-md">
              Affinity Apparel is made for reps who live in motion — long days,
              late calls, and standards that don’t slip.
            </p>
            <p className="text-white/60 text-sm leading-relaxed max-w-md mb-5">
              Premium fleece, clean silhouettes, and understated branding —
              designed to fit in the room and on the road.
            </p>
            <button
              onClick={() => {
                onClose();
                onBuyNow();
              }}
              className="w-full px-6 py-3 rounded-full bg-white text-black font-semibold text-sm tracking-wide hover:bg-white/90 transition"
            >
              Buy the Hoodie
            </button>
          </div>

          <div className="mt-6 flex-1 flex items-end">
            <div className="relative w-full h-[52vh] rounded-2xl overflow-hidden">
              <img
                src="/affinity-hero-apparel.png"
                alt="Affinity Apparel Lifestyle"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
