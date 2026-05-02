"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FailedPage() {
  const router = useRouter();

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("Your payment could not be processed.");

  useEffect(() => {
    window.history.replaceState(null, "", "/checkout/failed");

    const t = setTimeout(() => {
      const storedMessage = sessionStorage.getItem("checkoutError");
      if (storedMessage) {
        setMessage(storedMessage);
      }

      setVisible(true);
    }, 100);
    return () => clearTimeout(t);
  }, []);

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
      {/* Red glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #f87171, transparent)" }}
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

        {/* Animated X circle */}
        <div className="flex justify-center mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700"
            style={{
              background: visible
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "rgba(239,68,68,0.1)",
              boxShadow: visible ? "0 0 60px rgba(239,68,68,0.45)" : "none",
              transform: visible ? "scale(1)" : "scale(0.7)",
            }}
          >
            <svg
              className="w-11 h-11 text-white transition-all duration-500"
              style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.5)" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Payment Failed</h1>
        <p className="text-white/60 text-sm mb-6 leading-relaxed">{message}</p>

        {/* Error detail card */}
        <div
          className="rounded-2xl p-5 border border-red-500/20 mb-8 text-left"
          style={{ background: "rgba(239,68,68,0.08)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-red-300 text-sm font-semibold mb-1">What might have gone wrong?</p>
              <ul className="text-white/50 text-xs space-y-1">
                <li>• Insufficient funds or card limit reached</li>
                <li>• Incorrect card details entered</li>
                <li>• Card blocked for online transactions</li>
                <li>• Network error during payment</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-sm tracking-wide transition-all duration-200 hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              boxShadow: "0 4px 24px rgba(79,70,229,0.4)",
            }}
          >
            Try Again
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 border border-white/20 text-white/70 hover:text-white hover:border-white/40"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            Back to Dashboard
          </button>
        </div>

        <p className="text-white/30 text-xs mt-6">
          Need help?{" "}
          <a href="mailto:support@docuai.com" className="text-[#60d9fa] hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
