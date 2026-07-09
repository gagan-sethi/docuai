"use client";

/**
 * UpgradeModal — shared "you've hit your plan limit" dialog.
 *
 * Used by both the Upload page (when the per-month document/page quota
 * is exceeded) and the Merge bar on the Documents page (when the user
 * tries to merge more documents than their plan allows in one batch).
 *
 * Surfacing the same modal everywhere keeps the upgrade story consistent
 * and gives users a one-click path to /pricing.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Crown, ArrowRight, X } from "lucide-react";

export interface UpgradeModalPlanInfo {
  plan: string;
  label: string;
  documentsPerMonth: number | "Unlimited";
  documentsUsed: number;
  documentsRemaining: number | "Unlimited";
  pagesPerMonth: number | "Unlimited";
  pagesUsed: number;
  pagesRemaining: number | "Unlimited";
}

interface Props {
  open: boolean;
  message: string;
  planInfo?: UpgradeModalPlanInfo | null;
  /** Optional title override — defaults to "You've hit your <plan> limit". */
  title?: string;
  onClose: () => void;
  /**
   * Called when the user clicks "Upgrade Plan". The parent should open the
   * shared `ManagePlanModal` so the user stays in-app instead of being
   * redirected to the public /pricing page.
   */
  onUpgrade?: () => void;
}

export default function UpgradeModal({ open, message, planInfo, title, onClose, onUpgrade }: Props) {
  const heading =
    title ?? `You've hit your ${planInfo?.label || "Free"} plan limit`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="upgrade-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 pt-7 pb-2 bg-gradient-to-br from-amber-50 via-orange-50 to-white">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 mb-4">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{heading}</h2>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                {message || "You've reached the limit on your current plan."}
              </p>
            </div>

            {planInfo && (
              <div className="px-6 py-4 grid grid-cols-2 gap-3 border-t border-slate-100">
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documents</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {planInfo.documentsUsed}
                    <span className="text-slate-400 font-medium">
                      {" / "}
                      {planInfo.documentsPerMonth === "Unlimited"
                        ? "∞"
                        : planInfo.documentsPerMonth}
                    </span>
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pages</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {planInfo.pagesUsed}
                    <span className="text-slate-400 font-medium">
                      {" / "}
                      {planInfo.pagesPerMonth === "Unlimited"
                        ? "∞"
                        : planInfo.pagesPerMonth}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div className="px-6 pt-2 pb-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUpgrade?.();
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Crown className="w-4 h-4" />
                Upgrade Plan
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
