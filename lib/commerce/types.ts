/* ─── Commerce Types ─── */

export interface CartItem {
  id: string; // Unique line item ID (e.g. timestamp-based)
  variantId: string; // "black-M"
  title: string;
  colorKey: string; // "black"
  size: string; // "M"
  unitPriceCents: number;
  compareAtCents?: number;
  quantity: number;
  imageSrc: string;
}

export interface Cart {
  id: string;
  lines: CartItem[];
  subtotalCents: number;
  estimatedTaxCents: number;
  shippingCents: number;
  totalCents: number;
}

export interface CustomerInfo {
  email: string;
  phone?: string;
  marketingConsent: boolean;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province: string; // State/County
  postalCode: string;
  country: string;
}

export interface ShippingMethod {
  id: string;
  label: string;
  priceCents: number;
  description?: string;
}
