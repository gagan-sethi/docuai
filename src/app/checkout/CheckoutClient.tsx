"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StripeWrapper from "./StripeWrapper";
import CheckoutForm from "./CheckoutForm";
import { apiUrl } from "@/lib/api";
import BrandLogo from "@/components/BrandLogo";

type PaymentInit = {
  clientSecret: string;
  amount: number;
  interval?: string;
};

type CachedPaymentInit = {
  createdAt: number;
  request: Promise<PaymentInit>;
};

const paymentInitCache = new Map<string, CachedPaymentInit>();
const PAYMENT_INIT_CACHE_MS = 2 * 60 * 1000;

function parsePaymentError(errorBody: string): string {
  try {
    const parsed = JSON.parse(errorBody) as { error?: string; message?: string };
    return parsed.error || parsed.message || "Unable to initialize payment.";
  } catch {
    return errorBody || "Unable to initialize payment.";
  }
}

function getPaymentInit(planId: string, inviteToken: string | null) {
  const cacheKey = `${planId}_${inviteToken || "no-invite"}`;
  const cached = paymentInitCache.get(cacheKey);

  if (cached && Date.now() - cached.createdAt < PAYMENT_INIT_CACHE_MS) {
    return cached.request;
  }

  const request = fetch(apiUrl("/api/plan/payment"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planId,
      inviteToken: inviteToken || undefined,
    }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorBody = await res.text();
        console.error("Backend error response:", errorBody);
        throw new Error(parsePaymentError(errorBody));
      }

      const data = await res.json();

      if (!data.clientSecret) {
        throw new Error("No clientSecret returned");
      }

      return {
        clientSecret: data.clientSecret,
        amount: data.amount || 0,
        interval: data.interval,
      };
    })
    .catch((error) => {
      paymentInitCache.delete(cacheKey);
      throw error;
    });

  paymentInitCache.set(cacheKey, {
    createdAt: Date.now(),
    request,
  });

  return request;
}

export default function CheckoutClient() {
  const params = useSearchParams();
  const router = useRouter();
  const planId = params.get("planId");
  const inviteToken = params.get("invite");

  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [loadingInit, setLoadingInit] = useState(true);
  const [interval, setInterval] = useState<string>("month");

  useEffect(() => {
    let cancelled = false;

    if (!planId) {
      router.replace("/dashboard");
      return;
    }

    getPaymentInit(planId, inviteToken)
      .then((data) => {
        if (cancelled) return;

        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setInterval(data.interval || "month");
      })
      .catch((err: Error) => {
        if (cancelled) return;

        console.error("Payment init error:", err.message);
        sessionStorage.setItem("checkoutError", err.message);
        router.replace("/checkout/failed");
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingInit(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [planId, inviteToken, router]);

  // if (loadingInit) {
  //   return <p className="text-center mt-10">Initializing payment...</p>;
  // }
  if (loadingInit) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-primary-dark to-slate-900">

        {/* Background glow effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl" />

        {/* Main Card */}
        <div className="relative z-10 w-[340px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">

          {/* Animated logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-primary/30 blur-xl animate-pulse" />
              <BrandLogo
                compact
                className="relative h-14 w-14 rounded-xl bg-white p-2 shadow-xl shadow-black/20"
                imageClassName="h-full w-full"
              />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-center text-white font-semibold text-sm mb-1">
            Preparing Checkout
          </h2>

          <p className="text-center text-xs text-white/50 mb-6">
            Setting up your secure payment session...
          </p>

          {/* Skeleton block */}
          <div className="space-y-3">
            <div className="h-3 rounded bg-white/10 animate-pulse w-3/4 mx-auto" />
            <div className="h-3 rounded bg-white/10 animate-pulse w-full" />
            <div className="h-3 rounded bg-white/10 animate-pulse w-2/3 mx-auto" />
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-primary-light to-secondary animate-[loading_1.5s_infinite]" />
          </div>

          {/* Spinner fallback */}
          <div className="flex justify-center mt-5">
            <div className="w-5 h-5 border-2 border-white/20 border-t-secondary rounded-full animate-spin" />
          </div>
        </div>

        {/* Custom animation keyframe */}
        <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      </div>
    );
  }


  if (!clientSecret) {
    return <p className="text-center mt-10">Unable to load payment</p>;
  }

  return (
    <StripeWrapper clientSecret={clientSecret}>
      <CheckoutForm amount={amount} interval={interval} />
    </StripeWrapper>
  );
}
