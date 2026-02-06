"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Cart,
  CartItem,
  CustomerInfo,
  ShippingAddress,
  ShippingMethod,
} from "@/lib/commerce/types";
import { checkoutAdapter } from "@/lib/commerce/checkoutAdapter";

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart;
  onUpdateCart: (newCart: Cart) => void;
  isDarkBg: boolean; // For styling context
}

type CheckoutStep = "cart" | "info" | "shipping" | "review" | "success";

export default function CheckoutDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateCart,
  isDarkBg,
}: CheckoutDrawerProps) {
  /* ── State ── */
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Data State
  const [customer, setCustomer] = useState<CustomerInfo>({
    email: "",
    phone: "",
    marketingConsent: true,
  });

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Ireland",
  });

  const [shippingMethodId, setShippingMethodId] = useState("standard");
  const [availableMethods, setAvailableMethods] = useState<ShippingMethod[]>([]);

  // Derived
  const isEmpty = cart.lines.length === 0;

  /* ── Effects ── */
  useEffect(() => {
    if (isOpen && step === "cart" && !isEmpty) {
      // Preload shipping methods when checkout opens/becomes active
      checkoutAdapter.getShippingMethods().then(setAvailableMethods);
    }
  }, [isOpen, step, isEmpty]);

  // Reset step if closed
  useEffect(() => {
    if (!isOpen) {
      // optional: reset step to cart after delay? 
      // keeping state is actually nice for UX
    }
  }, [isOpen]);

  /* ── Handlers ── */

  const handleUpdateQty = (lineId: string, newQty: number) => {
    const updated = checkoutAdapter.updateLineItemQty(cart, lineId, newQty);
    onUpdateCart(updated);
  };

  const handleMethodChange = (id: string) => {
    setShippingMethodId(id);
    const updated = checkoutAdapter.setShippingMethod(cart, id);
    onUpdateCart(updated);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const res = await checkoutAdapter.placeOrder(cart, customer, shippingAddress);
      if (res.success) {
        setOrderId(res.orderId);
        setStep("success");
        // Clear cart in parent context (create new empty cart)
        onUpdateCart(checkoutAdapter.createCart());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Styling Tokens (Glass) ── */
  // Using the same design language as HoodieHero
  const glassPanel = {
    backgroundColor: isDarkBg ? "rgba(20,20,20,0.60)" : "rgba(255,255,255,0.65)",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    borderColor: isDarkBg ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)",
  };

  const glassInput = isDarkBg
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30"
    : "bg-black/5 border-black/10 text-black placeholder:text-black/30 focus:border-black/30";

  const textColor = isDarkBg ? "text-white" : "text-black";
  const mutedColor = isDarkBg ? "text-white/50" : "text-black/50";
  const borderColor = isDarkBg ? "border-white/10" : "border-black/10";

  const btnPrimary = isDarkBg
    ? "bg-white text-black hover:bg-white/90"
    : "bg-black text-white hover:bg-black/90";
  
  const btnSecondary = isDarkBg
  ? "bg-white/10 text-white hover:bg-white/15"
  : "bg-black/5 text-black hover:bg-black/10";

  /* ── Renderers ── */

  const renderCartLines = () => (
    <div className="space-y-4">
      {cart.lines.map((line) => (
        <div key={line.id} className="flex gap-4 items-start">
          <div className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100/5 ${borderColor} border`}>
            <img src={line.imageSrc} alt={line.title} className="w-full h-full object-contain p-2" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h4 className={`font-medium text-sm ${textColor} truncate`}>{line.title}</h4>
            <p className={`text-xs ${mutedColor} mt-0.5`}>
              {line.size} / {line.colorKey}
            </p>
            <div className="flex items-center gap-3 mt-3">
               <div className={`flex items-center rounded-full border ${borderColor} px-2 py-0.5`}>
                  <button 
                    onClick={() => handleUpdateQty(line.id, line.quantity - 1)}
                    className={`w-5 h-5 flex items-center justify-center text-xs ${textColor} opacity-60 hover:opacity-100`}
                  >−</button>
                  <span className={`text-xs w-4 text-center ${textColor}`}>{line.quantity}</span>
                  <button 
                    onClick={() => handleUpdateQty(line.id, line.quantity + 1)}
                    className={`w-5 h-5 flex items-center justify-center text-xs ${textColor} opacity-60 hover:opacity-100`}
                  >+</button>
               </div>
               <button 
                 onClick={() => handleUpdateQty(line.id, 0)}
                 className={`text-[10px] underline decoration-current/30 ${mutedColor} hover:opacity-100`}
               >Remove</button>
            </div>
          </div>
          <div className="text-right pt-1">
            <div className={`text-sm font-medium ${textColor}`}>
              ${(line.unitPriceCents * line.quantity / 100).toFixed(2)}
            </div>
            {line.quantity > 1 && (
               <div className={`text-[10px] ${mutedColor}`}>
                 ${(line.unitPriceCents / 100).toFixed(2)} ea
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderOrderSummary = (showExpanded = true) => (
    <div className={`space-y-3 pt-4 ${showExpanded ? `border-t ${borderColor}` : ''}`}>
      <div className="flex justify-between text-sm">
        <span className={mutedColor}>Subtotal</span>
        <span className={textColor}>${(cart.subtotalCents / 100).toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className={mutedColor}>Shipping</span>
        <span className={textColor}>
            {cart.shippingCents === 0 ? "Free" : `$${(cart.shippingCents / 100).toFixed(2)}`}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className={mutedColor}>Estimated Tax</span>
        <span className={textColor}>${(cart.estimatedTaxCents / 100).toFixed(2)}</span>
      </div>
      <div className={`flex justify-between text-base font-bold pt-3 border-t ${borderColor}`}>
        <span className={textColor}>Total</span>
        <span className={textColor}>${(cart.totalCents / 100).toFixed(2)}</span>
      </div>
    </div>
  );

  /* ── Steps ── */

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300" 
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[440px] shadow-2xl flex flex-col transition-transform duration-300 ease-out transform translate-x-0 border-l"
        style={glassPanel}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${borderColor}`}>
          <h2 className={`text-lg font-semibold tracking-tight ${textColor}`}>
            {step === "success" ? "Order Confirmed" : step === "cart" ? "Your Cart" : "Checkout"}
          </h2>
          <button 
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${btnSecondary} transition-colors`}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            
            {/* 1. Empty State */}
            {isEmpty && step !== "success" && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <p className={`${textColor} text-sm`}>Your cart is empty.</p>
                    <button 
                        onClick={onClose}
                        className={`mt-4 text-xs font-medium underline underline-offset-4 ${textColor}`}
                    >Continue Shopping</button>
                </div>
            )}

            {/* 2. Success State */}
            {step === "success" && (
                <div className="flex flex-col items-center text-center pt-10">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className={`text-xl font-bold ${textColor}`}>Thank you!</h3>
                    <p className={`text-sm ${mutedColor} mt-2 max-w-[240px]`}>
                        Your order <span className="font-mono text-current">{orderId}</span> has been confirmed.
                    </p>
                    <button 
                        onClick={() => { onClose(); setStep('cart'); }}
                        className={`mt-8 w-full py-3 rounded-full font-medium text-sm ${btnPrimary}`}
                    >
                        Continue Shopping
                    </button>
                </div>
            )}

            {/* 3. Main Flow */}
            {!isEmpty && step !== "success" && (
                <div className="space-y-8 pb-10">
                    
                    {/* CART VIEW */}
                    {step === "cart" && (
                        <>
                            {renderCartLines()}
                            {renderOrderSummary()}
                            <button
                                onClick={() => setStep("info")}
                                className={`w-full py-3.5 rounded-full font-semibold text-sm tracking-wide ${btnPrimary} mt-4`}
                            >
                                Checkout
                            </button>
                        </>
                    )}

                    {/* CHECKOUT FLOW */}
                    {step !== "cart" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            
                            {/* Breadcrumbs (Visual only for now) */}
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-medium opacity-50 mb-6">
                                <span className={step === 'info' ? 'opacity-100 text-current' : ''}>Info</span>
                                <span>/</span>
                                <span className={step === 'shipping' ? 'opacity-100 text-current' : ''}>Shipping</span>
                                <span>/</span>
                                <span className={step === 'review' ? 'opacity-100 text-current' : ''}>Payment</span>
                            </div>

                            {/* Section: Customer Info */}
                            {(step === "info" || step === "shipping" || step === "review") && (
                                <section>
                                    <div className="flex justify-between items-baseline mb-3">
                                        <h3 className={`text-sm font-medium ${textColor}`}>Contact Information</h3>
                                        {step !== "info" && (
                                            <button onClick={() => setStep("info")} className={`text-[10px] underline ${mutedColor}`}>Edit</button>
                                        )}
                                    </div>
                                    {step === "info" ? (
                                        <div className="space-y-3">
                                            <input 
                                                type="email" placeholder="Email" required
                                                value={customer.email}
                                                onChange={e => setCustomer({...customer, email: e.target.value})}
                                                className={`w-full px-4 py-2.5 rounded-lg text-sm outline-none border transition-colors ${glassInput}`}
                                            />
                                            <input 
                                                type="tel" placeholder="Phone (optional)"
                                                value={customer.phone}
                                                onChange={e => setCustomer({...customer, phone: e.target.value})}
                                                className={`w-full px-4 py-2.5 rounded-lg text-sm outline-none border transition-colors ${glassInput}`}
                                            />
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={customer.marketingConsent}
                                                    onChange={e => setCustomer({...customer, marketingConsent: e.target.checked})}
                                                    className="w-4 h-4 rounded border-gray-300 text-current focus:ring-0"
                                                />
                                                <span className={`text-xs ${mutedColor}`}>Email me with news and offers</span>
                                            </label>
                                            <button 
                                                onClick={() => {
                                                    if (customer.email.includes('@')) setStep("shipping");
                                                    else alert('Please enter a valid email');
                                                }}
                                                className={`w-full py-3 rounded-full font-medium text-sm ${btnPrimary} mt-2`}
                                            >
                                                Continue to Shipping
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`text-sm ${mutedColor} bg-current/5 p-3 rounded-lg`}>
                                            {customer.email}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Section: Shipping Address */}
                            {(step === "shipping" || step === "review") && (
                                <section className="pt-2">
                                    <div className="flex justify-between items-baseline mb-3">
                                        <h3 className={`text-sm font-medium ${textColor}`}>Shipping Address</h3>
                                        {step === "review" && (
                                            <button onClick={() => setStep("shipping")} className={`text-[10px] underline ${mutedColor}`}>Edit</button>
                                        )}
                                    </div>
                                    {step === "shipping" ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input placeholder="First Name" value={shippingAddress.firstName} onChange={e => setShippingAddress({...shippingAddress, firstName: e.target.value})} className={`w-full px-4 py-2.5 rounded-lg text-sm outline-none border ${glassInput}`} />
                                                <input placeholder="Last Name" value={shippingAddress.lastName} onChange={e => setShippingAddress({...shippingAddress, lastName: e.target.value})} className={`w-full px-4 py-2.5 rounded-lg text-sm outline-none border ${glassInput}`} />
                                            </div>
                                            <input placeholder="Address Line 1" value={shippingAddress.address1} onChange={e => setShippingAddress({...shippingAddress, address1: e.target.value})} className={`w-full px-4 py-2.5 rounded-lg text-sm outline-none border ${glassInput}`} />
                                            <input placeholder="Address Line 2 (optional)" value={shippingAddress.address2} onChange={e => setShippingAddress({...shippingAddress, address2: e.target.value})} className={`w-full px-4 py-2.5 rounded-lg text-sm outline-none border ${glassInput}`} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <input placeholder="City" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} className={`w-full px-4 py-2.5 rounded-lg text-sm outline-none border ${glassInput}`} />
                                                <input placeholder="County / State" value={shippingAddress.province} onChange={e => setShippingAddress({...shippingAddress, province: e.target.value})} className={`w-full px-4 py-2.5 rounded-lg text-sm outline-none border ${glassInput}`} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input placeholder="Postcode" value={shippingAddress.postalCode} onChange={e => setShippingAddress({...shippingAddress, postalCode: e.target.value})} className={`w-full px-4 py-2.5 rounded-lg text-sm outline-none border ${glassInput}`} />
                                                <input placeholder="Country" value={shippingAddress.country} onChange={e => setShippingAddress({...shippingAddress, country: e.target.value})} className={`w-full px-4 py-2.5 rounded-lg text-sm outline-none border ${glassInput}`} />
                                            </div>

                                            <div className="pt-4">
                                                <h4 className={`text-xs font-medium ${textColor} mb-2`}>Shipping Method</h4>
                                                <div className="space-y-2">
                                                    {availableMethods.map(method => (
                                                        <label key={method.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${shippingMethodId === method.id ? `border-current bg-current/5` : `${borderColor} hover:bg-current/5`}`}>
                                                            <div className="flex items-center gap-3">
                                                                <input 
                                                                    type="radio" 
                                                                    name="shippingMethod"
                                                                    checked={shippingMethodId === method.id}
                                                                    onChange={() => handleMethodChange(method.id)}
                                                                    className="text-current focus:ring-0"
                                                                />
                                                                <div className="text-sm">
                                                                    <div className={textColor}>{method.label}</div>
                                                                    {method.description && <div className={`text-[10px] ${mutedColor}`}>{method.description}</div>}
                                                                </div>
                                                            </div>
                                                            <div className={`text-sm font-medium ${textColor}`}>
                                                                {method.priceCents === 0 ? "Free" : `$${(method.priceCents/100).toFixed(2)}`}
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    if (shippingAddress.address1 && shippingAddress.city && shippingAddress.postalCode) setStep("review");
                                                    else alert('Please fill in required address fields');
                                                }}
                                                className={`w-full py-3 rounded-full font-medium text-sm ${btnPrimary} mt-4`}
                                            >
                                                Continue to Payment
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`text-sm ${mutedColor} bg-current/5 p-3 rounded-lg`}>
                                            <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                                            <p>{shippingAddress.address1}</p>
                                            <p>{shippingAddress.city}, {shippingAddress.postalCode}</p>
                                            <p>{shippingAddress.country}</p>
                                            <div className="mt-2 pt-2 border-t border-current/10 flex justify-between items-center">
                                                <span className="text-xs opacity-70">Method: Standard</span>
                                                <span className="text-xs font-medium">Free</span>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Section: Payment + Review */}
                            {step === "review" && (
                                <section className="pt-2">
                                    <h3 className={`text-sm font-medium ${textColor} mb-3`}>Payment</h3>
                                    
                                    {/* Placeholder Payment UI */}
                                    <div className={`p-4 rounded-lg border border-dashed ${borderColor} bg-current/5 mb-6`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/></svg>
                                            <span className={`text-xs font-medium ${textColor}`}>Payment integration pending</span>
                                        </div>
                                        <p className={`text-xs ${mutedColor}`}>
                                            Secure payment processing will be handled by Shopify Checkout integration.
                                        </p>
                                    </div>

                                    {/* Final Summary */}
                                    <div className={`bg-current/5 p-4 rounded-xl mb-6`}>
                                        <h4 className={`text-xs font-medium ${textColor} mb-3 uppercase tracking-wider opacity-50`}>Order Summary</h4>
                                        <div className="space-y-3">
                                            {cart.lines.map(line => (
                                                <div key={line.id} className="flex justify-between text-sm">
                                                    <span className={mutedColor}>{line.quantity}x {line.title} ({line.size})</span>
                                                    <span className={textColor}>${(line.unitPriceCents * line.quantity / 100).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className={`h-px w-full ${borderColor} my-2`}></div>
                                            <div className="flex justify-between text-sm">
                                                <span className={mutedColor}>Subtotal</span>
                                                <span className={textColor}>${(cart.subtotalCents / 100).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className={mutedColor}>Shipping</span>
                                                <span className={textColor}>
                                                    {cart.shippingCents === 0 ? "Free" : `$${(cart.shippingCents / 100).toFixed(2)}`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className={mutedColor}>Tax</span>
                                                <span className={textColor}>${(cart.estimatedTaxCents / 100).toFixed(2)}</span>
                                            </div>
                                            <div className={`flex justify-between text-base font-bold pt-2 border-t ${borderColor} mt-1`}>
                                                <span className={textColor}>Total</span>
                                                <span className={textColor}>${(cart.totalCents / 100).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handlePlaceOrder}
                                        disabled={loading}
                                        className={`w-full py-3.5 rounded-full font-bold text-sm tracking-wide ${btnPrimary} disabled:opacity-50`}
                                    >
                                        {loading ? "Processing..." : `Place Order • $${(cart.totalCents / 100).toFixed(2)}`}
                                    </button>
                                </section>
                            )}

                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </>
  );
}
