/* ─── Colour configuration ─── */

export interface ColorConfig {
  key: string;
  label: string;
  image: string;
  gradientCenter: string;
  gradientEdge: string;
  /** Full radial-gradient() string — overrides the default 2-stop formula when present. */
  gradientOverride?: string;
  dotColor: string;
  glowColor: string;
  textColor: string;
  /** Hex color for the background watermark emblem (used via CSS mask). */
  watermarkTint: string;
}

/**
 * Ordered sequence — cycling always advances forward through this array.
 */
export const COLOR_SEQUENCE: ColorConfig[] = [
  {
    key: "black",
    label: "Black",
    image: "/affinity-black.png",
    gradientCenter: "#141414",
    gradientEdge: "#000000",
    dotColor: "#1a1a1a",
    glowColor: "rgba(60,60,60,0.25)",
    textColor: "#ffffff",
    watermarkTint: "#404040",
  },
  {
    key: "darkblue",
    label: "Dark Blue",
    image: "/affinity-darkblue.png",
    gradientCenter: "#1C2644",
    gradientEdge: "#060B1A",
    dotColor: "#1C2644",
    glowColor: "rgba(40,60,100,0.30)",
    textColor: "#ffffff",
    watermarkTint: "#3E4C75",
  },
  {
    key: "blue",
    label: "Blue",
    image: "/affinity-blue.png",
    gradientCenter: "#6F8FB8",
    gradientEdge: "#2C3F5C",
    dotColor: "#6F8FB8",
    glowColor: "rgba(111,143,184,0.30)",
    textColor: "#ffffff",
    watermarkTint: "#9DB6D9",
  },
  {
    key: "gray",
    label: "Gray",
    image: "/affinity-gray.png",
    gradientCenter: "#F2F2F2",
    gradientEdge: "#AFAFAF",
    gradientOverride:
      "radial-gradient(ellipse at 45% 40%, #F2F2F2 0%, #E9E9E9 22%, #DADADA 45%, #B8B8B8 78%, #AFAFAF 100%)",
    dotColor: "#B0B0B0",
    glowColor: "rgba(180,180,180,0.20)",
    textColor: "#1a1a1a",
    watermarkTint: "#C0C0C0",
  },
  {
    key: "green",
    label: "Green",
    image: "/affinity-green.png",
    gradientCenter: "#2F5F4E",
    gradientEdge: "#0E231B",
    dotColor: "#2F5F4E",
    glowColor: "rgba(47,95,78,0.30)",
    textColor: "#ffffff",
    watermarkTint: "#4E8C76",
  },
  {
    key: "pink",
    label: "Pink",
    image: "/affinity-pink.png",
    gradientCenter: "#D7CFFF",
    gradientEdge: "#2B1F49",
    gradientOverride:
      "radial-gradient(ellipse at 45% 40%, #D7CFFF 0%, #C5BCFF 18%, #A99CFF 40%, #4A3672 72%, #2B1F49 100%)",
    dotColor: "#C4A8C8",
    glowColor: "rgba(215,207,255,0.30)",
    textColor: "#ffffff",
    watermarkTint: "#E6E0FF",
  },
];

/* ─── Sizes ─── */

export const SIZES = ["S", "M", "L", "XL"] as const;
export type Size = (typeof SIZES)[number];

/**
 * Toggle availability per size — all enabled by default.
 * Set a size to `false` to grey it out in the UI.
 */
export const SIZE_AVAILABILITY: Record<Size, boolean> = {
  S: true,
  M: true,
  L: true,
  XL: true,
};
