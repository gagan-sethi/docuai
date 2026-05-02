"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function SuccessPage() {
  const router = useRouter();

  const [tick, setTick] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectStatus = params.get("redirect_status");

    window.history.replaceState(null, "", "/checkout/success");

    if (redirectStatus === "failed") {
      sessionStorage.setItem("checkoutError", "Payment failed. Please try another method.");
      router.replace("/checkout/failed");
      return;
    }

    // Trigger check animation after mount
    const t = setTimeout(() => {
      const storedAmount = sessionStorage.getItem("checkoutAmount");
      if (storedAmount) {
        setAmount(parseInt(storedAmount, 10));
      }

      setTick(true);
    }, 100);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "linear-gradient(135deg, #1a1a4e 0%, #2d1b69 40%, #1e3a5f 100%)",
      }}
    >
      {/* Grid pattern */}
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
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }}
      />

      <div className="relative z-10 text-center max-w-md w-full">
        {/* DocuAI logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">DocuAI</span>
        </div>

        {/* Animated check circle */}
        <div className="flex justify-center mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700"
            style={{
              background: tick
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "rgba(16,185,129,0.1)",
              boxShadow: tick ? "0 0 60px rgba(16,185,129,0.5)" : "none",
              transform: tick ? "scale(1)" : "scale(0.7)",
            }}
          >
            <svg
              className="w-12 h-12 text-white transition-all duration-500"
              style={{ opacity: tick ? 1 : 0, transform: tick ? "scale(1)" : "scale(0.5)" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-white/60 text-sm mb-6">
          Your Professional plan is now active. Welcome to the full DocuAI experience.
        </p>

        {/* Amount card */}
        {amount && (
          <div
            className="rounded-2xl p-5 border border-white/10 mb-8 text-left"
            style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/50 text-sm">Plan</span>
              <span className="text-white font-semibold">Professional</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/50 text-sm">Billing</span>
              <span className="text-white font-semibold">Yearly</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="text-white/50 text-sm">Amount paid</span>
              <span className="text-[#60d9fa] font-bold text-xl">
                {usdFormatter.format(amount / 100)}
              </span>
            </div>
          </div>
        )}

        {/* Features unlocked */}
        <div className="space-y-2.5 mb-8 text-left">
          {[
            "Unlimited document processing",
            "AI-powered OCR (90–95% accuracy)",
            "Priority support",
            "Advanced analytics dashboard",
          ].map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-sm text-white/70"
              style={{
                opacity: tick ? 1 : 0,
                transform: tick ? "translateX(0)" : "translateX(-12px)",
                transition: `opacity 0.4s ease ${0.3 + i * 0.08}s, transform 0.4s ease ${0.3 + i * 0.08}s`,
              }}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              {f}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full py-3.5 rounded-xl font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            boxShadow: "0 4px 24px rgba(79,70,229,0.4)",
          }}
        >
          Go to Dashboard →
        </button>

        <p className="text-white/30 text-xs mt-4">
          A confirmation email has been sent to your registered address.
        </p>
      </div>
    </div>
  );
}
