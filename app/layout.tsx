import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Affinity Apparel — Oversized Fleeced Hoodie",
  description: "Heavyweight. Soft-touch fleece. Everyday comfort.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-black text-white">
        {children}
      </body>
    </html>
  );
}
