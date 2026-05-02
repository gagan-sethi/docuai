"use client";

import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useState } from "react";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function CheckoutForm({ amount, interval }: { amount: number, interval:string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setLoading(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      alert(submitError.message);
      setLoading(false);
      return;
    }

    sessionStorage.setItem("checkoutAmount", String(amount));

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: "if_required",
    });

    if (error) {
      console.error("Stripe error:", error);
      sessionStorage.setItem("checkoutError", error.message ?? "Payment failed");
      router.replace("/checkout/failed");
      setLoading(false);
      return;
    }

    if (paymentIntent) {
      switch (paymentIntent.status) {
        case "succeeded":
          router.replace("/checkout/success");
          break;
        case "processing":
          alert("Payment processing... we'll update you shortly.");
          break;
        case "requires_payment_method":
          sessionStorage.setItem("checkoutError", "Payment failed. Please try another method.");
          router.replace("/checkout/failed");
          break;
        default:
          alert("Something went wrong.");
      }
    }

    setLoading(false);
  };

  const billingLabel =
  interval === "year"
    ? "billed yearly"
    : interval === "month"
    ? "billed monthly"
    : "";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex w-[480px] flex-shrink-0 flex-col justify-between p-10 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a1a4e 0%, #2d1b69 40%, #1e3a5f 100%)",
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight">DocuAI</span>
          </div>

          <h2 className="text-3xl font-bold mb-2 leading-tight">
            Complete your <span className="text-[#60d9fa]">upgrade</span>
          </h2>
          <p className="text-white/60 text-sm mb-10">
            Unlock the full power of AI document processing
          </p>

          {/* Plan card */}
          <div
            className="rounded-2xl p-5 border border-white/10"
            style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Plan</p>
                <p className="font-bold text-lg">Professional</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Total</p>
                <p className="font-bold text-2xl text-[#60d9fa]">
                  {usdFormatter.format(amount / 100)}
                </p>
                <p className="text-xs text-white/40">{billingLabel}</p>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 space-y-2">
              {[
                "Unlimited document processing",
                "AI-powered OCR (90–95% accuracy)",
                "Priority support",
                "Advanced analytics",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                  <div className="w-4 h-4 rounded-full bg-[#60d9fa]/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-[#60d9fa]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10">
          <p className="text-sm text-white/50 italic mb-3">
            &ldquo;DocuAI reduced our invoice processing time by 80%. The AI accuracy is remarkable.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold">
              SA
            </div>
            <div>
              <p className="text-sm font-semibold">Sarah Al-Mansoori</p>
              <p className="text-xs text-white/40">Finance Director, Gulf Trading</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-indigo-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">DocuAI</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Checkout</h1>
          <p className="text-sm text-gray-500 mb-8">Complete your payment securely</p>

          {/* Mobile order summary */}
          <div className="lg:hidden mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Professional Plan</p>
              <p className="text-sm text-gray-500">{billingLabel}</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{usdFormatter.format(amount / 100)}</p>
          </div>

          {/* Stripe PaymentElement */}
          <div className="mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <PaymentElement
              options={{
                layout: "tabs",
              }}
            />
          </div>

          {/* Pay button */}
          <button
            onClick={handleSubmit}
            disabled={!stripe || loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-sm tracking-wide transition-all duration-200 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              boxShadow: "0 4px 24px rgba(79,70,229,0.35)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Processing…
              </span>
            ) : (
              `Pay ${usdFormatter.format(amount / 100)}`
            )}
          </button>

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Secured by Stripe · 256-bit SSL encryption
          </div>
        </div>
      </div>
    </div>
  );
}
