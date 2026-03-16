"use client";

import { useRef } from "react";
import Script from "next/script";
import type { PayhereParams } from "@/lib/types";

declare global {
  interface Window {
    payhere: {
      startPayment: (payment: Record<string, unknown>) => void;
      onCompleted: ((orderId: string) => void) | null;
      onDismissed: (() => void) | null;
      onError: ((error: string) => void) | null;
    };
  }
}

interface PayhereCheckoutProps {
  params: PayhereParams;
  onCompleted: (orderId: string) => void;
  onDismissed: () => void;
  onError: (error: string) => void;
  loading?: boolean;
}

export default function PayhereCheckout({
  params,
  onCompleted,
  onDismissed,
  onError,
  loading = false,
}: PayhereCheckoutProps) {
  const scriptReady = useRef(false);

  function startPayment() {
    if (!window.payhere) {
      onError("PayHere SDK is still loading. Please try again in a moment.");
      return;
    }

    // Register event handlers before each startPayment call
    window.payhere.onCompleted = onCompleted;
    window.payhere.onDismissed = onDismissed;
    window.payhere.onError = onError;

    // Build the payment object — all fields must match PayHere Checkout API spec.
    // Hash is pre-computed server-side; merchant secret is never sent to the browser.
    const payment: Record<string, unknown> = {
      sandbox: params.sandbox,
      merchant_id: params.merchant_id,
      return_url: undefined, // Not needed with JS SDK popup
      cancel_url: undefined, // Not needed with JS SDK popup
      notify_url: params.notify_url,
      order_id: params.order_id,
      items: params.items,
      amount: params.amount,
      currency: params.currency,
      hash: params.hash,
      // Customer
      first_name: params.first_name,
      last_name: params.last_name,
      email: params.email,
      phone: params.phone,
      address: params.address,
      city: params.city,
      country: params.country,
    };

    window.payhere.startPayment(payment);
  }

  return (
    <>
      <Script
        src="https://www.payhere.lk/lib/payhere.js"
        strategy="lazyOnload"
        onLoad={() => {
          scriptReady.current = true;
        }}
      />
      <button
        onClick={startPayment}
        disabled={loading}
        className="w-full px-6 py-3.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-light transition-all text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Preparing payment…" : "Pay Now →"}
      </button>
    </>
  );
}
