import { Cart, CartItem, CustomerInfo, ShippingAddress, ShippingMethod } from "./types";
import { COLOR_SEQUENCE } from "@/lib/hoodieConfig";

/* ─── Mock Data ─── */

const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "standard", label: "Standard Shipping", priceCents: 0, description: "3-5 business days" },
  { id: "express", label: "Express Shipping", priceCents: 1500, description: "1-2 business days" },
];

/* ─── Adapter Interface ─── */

export const checkoutAdapter = {
  createCart: (): Cart => ({
    id: `cart_${Date.now()}`,
    lines: [],
    subtotalCents: 0,
    estimatedTaxCents: 0,
    shippingCents: 0,
    totalCents: 0,
  }),

  addLineItem: (cart: Cart, item: Omit<CartItem, "id">): Cart => {
    const existingLine = cart.lines.find(
      (l) => l.variantId === item.variantId
    );

    let newLines;
    if (existingLine) {
      newLines = cart.lines.map((l) =>
        l.variantId === item.variantId
          ? { ...l, quantity: l.quantity + item.quantity }
          : l
      );
    } else {
      newLines = [...cart.lines, { ...item, id: `line_${Date.now()}` }];
    }

    return recalculateTotals(newLines, cart.shippingCents);
  },

  updateLineItemQty: (cart: Cart, lineId: string, quantity: number): Cart => {
    if (quantity <= 0) {
      const newLines = cart.lines.filter((l) => l.id !== lineId);
      return recalculateTotals(newLines, cart.shippingCents);
    }

    const newLines = cart.lines.map((l) =>
      l.id === lineId ? { ...l, quantity } : l
    );
    return recalculateTotals(newLines, cart.shippingCents);
  },

  setShippingMethod: (cart: Cart, methodId: string): Cart => {
    const method = SHIPPING_METHODS.find((m) => m.id === methodId);
    const shippingCents = method ? method.priceCents : 0;
    return recalculateTotals(cart.lines, shippingCents);
  },

  getShippingMethods: async (): Promise<ShippingMethod[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return SHIPPING_METHODS;
  },

  placeOrder: async (cart: Cart, customer: CustomerInfo, address: ShippingAddress): Promise<{ orderId: string; success: boolean }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      orderId: `ORD-${Math.floor(Math.random() * 10000) + 1000}`,
      success: true,
    };
  },
};

/* ─── Helpers ─── */

function recalculateTotals(lines: CartItem[], shippingCents: number): Cart {
  const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  
  // Simple Mock Tax Logic: 10% tax
  const estimatedTaxCents = Math.round(subtotalCents * 0.1); 

  const totalCents = subtotalCents + estimatedTaxCents + shippingCents;

  return {
    id: `cart_updated`, // In real app, ID usually stays same or rotates
    lines,
    subtotalCents,
    estimatedTaxCents,
    shippingCents,
    totalCents,
  };
}
