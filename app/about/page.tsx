"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Cart } from "@/lib/commerce/types";
import { checkoutAdapter } from "@/lib/commerce/checkoutAdapter";
import CheckoutDrawer from "@/components/CheckoutDrawer";

export default function AboutPage() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  // Note: Cart state is local here, so it resets on page load. 
  // In a real app, this would be lifted to a Context.
  const [cart, setCart] = useState<Cart>(checkoutAdapter.createCart());
  const cartCount = cart.lines.reduce((acc, line) => acc + line.quantity, 0);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* Navbar */}
      <div className="absolute top-0 inset-x-0 z-20">
        <Navbar
          isNavOpen={isNavOpen}
          setIsNavOpen={setIsNavOpen}
          cartCount={cartCount}
          setIsCheckoutOpen={setIsCheckoutOpen}
          isDarkBg={true}
        />
      </div>

      <img
        src="/affinity-hero-apparel.png"
        alt="Affinity Apparel Lifestyle"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      
      {/* Premium Overlays */}
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-20 md:px-14 md:pb-24 lg:px-20 lg:pb-32">
        <div
          className={`max-w-2xl transition-all duration-700 ease-out ${hasMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {/* 
             Updated opacity: bg-white/[0.02] for "almost clear" glass look. 
             Kept border-white/10 for definition.
          */}
          <div className="backdrop-blur-xl border border-white/10 bg-white/[0.02] p-8 md:p-10 rounded-2xl">
            <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight leading-[1.1] mb-6">
              Built for the Sales Community.
            </h2>
            <p className="text-white/90 text-lg md:text-xl font-light leading-relaxed mb-8 max-w-xl">
              Affinity Apparel is made for reps who live in motion — long days,
              late calls, and standards that don&apos;t slip.
            </p>
            <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-lg mb-8">
              Premium fleece, clean silhouettes, and understated branding —
              designed to fit in the room and on the road.
            </p>

            <a
              href="/"
              className="inline-block w-full md:w-auto px-8 py-3.5 rounded-full bg-white text-black font-semibold text-sm tracking-wide hover:bg-white/90 transition text-center"
            >
              Buy the Hoodie
            </a>
          </div>
        </div>
      </div>

      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onUpdateCart={setCart}
        isDarkBg={true}
      />
    </main>
  );
}
