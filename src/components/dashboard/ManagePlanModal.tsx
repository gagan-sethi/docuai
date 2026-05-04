"use client";

/**
 * ManagePlanModal — shared "Manage Your Plan" dialog.
 *
 * Originally lived inline inside `src/app/dashboard/page.tsx` and was
 * triggered by the "Manage Plan" button. Extracted so we can also open
 * it from anywhere else in the dashboard (e.g. the upgrade prompt that
 * appears when a free user tries to merge or upload more than their
 * plan allows).
 *
 * The component fetches the list of available plans on its own and
 * handles plan switching (free → free directly, paid → /checkout).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, CheckCircle2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export type PlanOption = {
  _id?: string;
  id?: string;
  name?: string;
  label?: string;
  price?: number;
  interval?: string;
  documentsPerMonth?: number | string;
  features?: string[];
};

export interface ManagePlanModalPlanData {
  plan?: string;
  label?: string;
  documentsPerMonth?: number | string;
  documentsUsed?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Current plan info (for the header). Optional — falls back to "Free". */
  planData?: ManagePlanModalPlanData | null;
}

export default function ManagePlanModal({ open, onClose, planData }: Props) {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [navigatingPlanId, setNavigatingPlanId] = useState<string | null>(null);

  // Fetch plans only after the modal opens for the first time.
  useEffect(() => {
    if (!open || plans.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/plan/list"), {
          credentials: "include",
        });
        const json = await res.json();
        if (!cancelled && json?.success) {
          setPlans(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, plans.length]);

  const handlePlanSelect = async (plan: PlanOption) => {
    const planId = plan._id || plan.id;
    if (!planId) {
      alert("Invalid plan");
      return;
    }
    const price = plan.price ?? 0;

    try {
      setNavigatingPlanId(String(planId));

      // Free plan: activate immediately and refresh.
      if (price === 0) {
        const res = await fetch(apiUrl("/api/plan/free"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to activate free plan");
        }
        window.location.reload();
        return;
      }

      // Paid plan: jump into the checkout flow.
      router.push(`/checkout?planId=${encodeURIComponent(String(planId))}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to switch plan");
    } finally {
      setNavigatingPlanId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="manage-plan-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary via-primary-dark to-slate-900 px-6 py-5 text-white">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-40 h-40 bg-secondary rounded-full blur-3xl" />
              </div>
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <h2 className="text-lg font-bold">Manage Your Plan</h2>
                  </div>
                  <p className="text-sm text-slate-300">
                    You&apos;re currently on the{" "}
                    <strong className="text-white">
                      {planData?.label || "Free"}
                    </strong>{" "}
                    plan.
                    {planData?.documentsUsed !== undefined && (
                      <>
                        {" "}You&apos;ve used{" "}
                        <strong className="text-amber-300">
                          {planData.documentsUsed}
                        </strong>{" "}
                        of{" "}
                        <strong className="text-white">
                          {typeof planData?.documentsPerMonth === "number"
                            ? planData.documentsPerMonth
                            : planData?.documentsPerMonth || 5}
                        </strong>{" "}
                        documents this month.
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {loadingPlans ? (
                <div className="col-span-full text-center text-sm text-muted py-10">
                  Loading plans...
                </div>
              ) : plans.length === 0 ? (
                <div className="col-span-full text-center text-sm text-muted py-10">
                  No plans available
                </div>
              ) : (
                plans.map((p) => {
                  const currentPlan = planData?.plan || "free";
                  const isCurrent = p.name === currentPlan;
                  const price = p.price ?? 0;
                  const isPaid = price > 0;
                  const planKey = String(p._id || p.id);

                  return (
                    <div
                      key={planKey}
                      className={`relative flex flex-col p-5 rounded-xl border-2 bg-gradient-to-b transition-all ${
                        isCurrent
                          ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                          : "border-slate-200 hover:shadow-md"
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute -top-2.5 left-4 px-3 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-primary to-secondary rounded-full shadow-sm">
                          CURRENT PLAN
                        </span>
                      )}

                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {p.label}
                          </h3>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-lg font-extrabold text-slate-900">
                              {price === 0
                                ? "Free"
                                : usdFormatter.format(price)}
                            </span>
                            {p.interval && (
                              <span className="text-xs text-muted">
                                /{p.interval}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs font-medium text-slate-600 mb-3 pb-3 border-b border-slate-100">
                        {p.documentsPerMonth === "Unlimited"
                          ? "Unlimited documents"
                          : `${p.documentsPerMonth} documents/month`}
                      </p>

                      <ul className="space-y-1.5 flex-1">
                        {(p.features || ["AI processing", "Export to Excel"]).map(
                          (f: string, i: number) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-xs text-slate-600"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                              {f}
                            </li>
                          )
                        )}
                      </ul>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        {isCurrent ? (
                          <div className="w-full py-2 text-center text-xs font-semibold text-primary bg-primary/5 rounded-lg">
                            ✓ Active Plan
                          </div>
                        ) : isPaid ? (
                          <button
                            onClick={() => handlePlanSelect(p)}
                            disabled={navigatingPlanId === planKey}
                            className="w-full py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:opacity-90 transition disabled:opacity-60"
                          >
                            {navigatingPlanId === planKey
                              ? "Opening..."
                              : "Upgrade"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePlanSelect(p)}
                            disabled={navigatingPlanId === planKey}
                            className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition disabled:opacity-60"
                          >
                            {navigatingPlanId === planKey
                              ? "Switching..."
                              : "Switch to Free"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
              <p className="text-[10px] text-muted">
                Paid plans coming soon. We&apos;ll notify you when they&apos;re available.
              </p>
              <button
                onClick={onClose}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
