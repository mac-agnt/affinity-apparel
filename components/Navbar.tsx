"use client";

import React from "react";

interface NavbarProps {
  isNavOpen: boolean;
  setIsNavOpen: (isOpen: boolean) => void;
  cartCount: number;
  setIsCheckoutOpen: (isOpen: boolean) => void;
  isDarkBg: boolean;
  onAboutOpen?: () => void;
}

export default function Navbar({
  isNavOpen,
  setIsNavOpen,
  cartCount,
  setIsCheckoutOpen,
  isDarkBg,
  onAboutOpen,
}: NavbarProps) {
  const handleAboutClick = () => {
    if (
      onAboutOpen &&
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
    ) {
      onAboutOpen();
      return;
    }

    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  };

  const navLinks = [
    { label: "Home", href: "https://affinitysalestraining.com" },
    { label: "Shop", href: "/" },
    { 
      label: "About", 
      action: handleAboutClick,
    },
  ];

  /* ─── Styling Tokens (Glass) ─── */
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

  const navLinkClass = "text-[11px] tracking-[0.18em] uppercase opacity-50 cursor-pointer hover:opacity-80 transition-opacity duration-200";
  const mobileNavLinkClass = "text-[11px] tracking-[0.18em] uppercase opacity-55 hover:opacity-90 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20 rounded px-2 py-0.5";

  return (
    <nav className="flex-shrink-0 flex justify-center pt-4 md:pt-5 px-4 z-50 relative">
      <div
        className="inline-flex flex-col items-center rounded-3xl md:rounded-full border transition-all duration-300 overflow-hidden"
        style={liquidGlass}
      >
        {/* Top row: logo + desktop links */}
        <div className="flex items-center gap-4 md:gap-7 px-4 md:px-7 py-2 md:py-2.5 w-full justify-center">
          <button
            className="md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20 rounded-full"
            onClick={() => setIsNavOpen(!isNavOpen)}
            aria-label="Toggle menu"
            aria-expanded={isNavOpen}
          >
            <img
              src="/affinity-sales-emblem.png"
              alt="Affinity"
              className="h-8 transition-[filter,transform] duration-300 ease-out"
              style={{
                filter: isDarkBg ? "none" : "brightness(0)",
                transform: isNavOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
              draggable={false}
            />
          </button>
          <img
            src="/affinity-sales-emblem.png"
            alt="Affinity"
            className="hidden md:block h-9 transition-[filter] duration-300"
            style={{ filter: isDarkBg ? "none" : "brightness(0)" }}
            draggable={false}
          />
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((item) => (
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  className={navLinkClass}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={navLinkClass}
                >
                  {item.label}
                </button>
              )
            ))}
            {/* Cart Indicator (Desktop) */}
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center gap-2 uppercase tracking-[0.18em] text-[11px] font-medium opacity-80 hover:opacity-100 transition-opacity"
            >
              Cart
              {cartCount > 0 && (
                <span className="bg-current text-[9px] w-4 h-4 rounded-full flex items-center justify-center text-white/90 font-bold bg-opacity-100 invert dark:invert-0">
                  <span className="invert dark:invert-0 text-black dark:text-white">
                    {cartCount}
                  </span>
                </span>
              )}
            </button>
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
          <div className="flex flex-col items-center gap-3 pb-4 px-3">
            {navLinks.map((item) => (
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsNavOpen(false)}
                  className={mobileNavLinkClass}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action?.();
                    setIsNavOpen(false);
                  }}
                  className={mobileNavLinkClass}
                >
                  {item.label}
                </button>
              )
            ))}

            {/* Mobile Cart Link inside Menu */}
            <button
              onClick={() => {
                setIsCheckoutOpen(true);
                setIsNavOpen(false);
              }}
              className={`${mobileNavLinkClass} flex items-center gap-2`}
            >
              Cart ({cartCount})
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
