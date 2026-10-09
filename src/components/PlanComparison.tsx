"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import {
  formatStorageSize,
  loadPublicPlans,
  toNumber,
  type DisplayPlan,
} from "@/lib/plans";

/**
 * "Compare all features", generated from the same /api/plan/list response as
 * the pricing cards.
 *
 * Previously this table was a hard-coded Starter / Professional / Accounting
 * Firm / Enterprise matrix that contradicted the cards on plan names, seat
 * counts and storage, and listed three plans nobody could buy (CB-10, Oct
 * 2026 QA review). Deriving it from the plan data makes those contradictions
 * structurally impossible: the columns are the purchasable plans, and the
 * feature rows are the union of what those plans actually grant.
 */

type Row = { name: string; values: Array<string | boolean> };

function limitValue(
  value: number | string | undefined,
  fallback = "—"
): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "string") {
    return value.toLowerCase() === "unlimited" ? "Unlimited" : value;
  }
  return new Intl.NumberFormat("en-US").format(value);
}

function buildRows(plans: DisplayPlan[]): Array<{ category: string; rows: Row[] }> {
  const quotaRows: Row[] = [
    {
      name: "Price",
      values: plans.map((plan) =>
        plan.period ? `${plan.displayPrice}${plan.period}` : plan.displayPrice
      ),
    },
    {
      name: "Documents per month",
      values: plans.map((plan) => limitValue(plan.documentsPerMonth, "Unlimited")),
    },
    {
      name: "Pages per month",
      values: plans.map((plan) => limitValue(plan.pagesPerMonth)),
    },
    {
      name: "User accounts",
      values: plans.map((plan) => limitValue(plan.usersLimit)),
    },
    {
      name: "Companies",
      values: plans.map((plan) => limitValue(plan.companyLimit)),
    },
    {
      name: "Storage",
      values: plans.map(
        (plan) => formatStorageSize(toNumber(plan.storageLimitBytes)) ?? "—"
      ),
    },
  ].filter((row) =>
    // Drop a quota row entirely when no plan defines it, rather than showing
    // a column of em-dashes.
    row.values.some((value) => value !== "—")
  );

  // Union of every feature across the purchasable plans, in first-seen order.
  const featureNames: string[] = [];
  plans.forEach((plan) => {
    plan.features.forEach((feature) => {
      if (!featureNames.includes(feature)) featureNames.push(feature);
    });
  });

  const featureRows: Row[] = featureNames.map((feature) => ({
    name: feature,
    values: plans.map((plan) => plan.features.includes(feature)),
  }));

  const sections: Array<{ category: string; rows: Row[] }> = [
    { category: "Plan & limits", rows: quotaRows },
  ];
  if (featureRows.length > 0) {
    sections.push({ category: "Included features", rows: featureRows });
  }
  return sections;
}

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-5 w-5 text-success" aria-label="Included" />
    ) : (
      <X className="mx-auto h-4 w-4 text-slate-300" aria-label="Not included" />
    );
  }
  return <span className="text-sm font-medium text-slate-700">{value}</span>;
}

export default function PlanComparison() {
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadPublicPlans().then((result) => {
      if (cancelled) return;
      setPlans(result.plans);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="bg-slate-50/50 py-20">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </section>
    );
  }

  // Nothing useful to compare with a single plan.
  if (plans.length < 2) return null;

  const sections = buildRows(plans);

  return (
    <section className="bg-slate-50/50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Compare all features
          </h2>
          <p className="mt-3 text-muted">
            Every plan you can buy today, with the limits and features it grants.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-100"
        >
          {/* M-02: the table scrolls inside its own container instead of
              pushing the page wider than the screen. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-[34%] px-5 py-5 text-left text-sm font-semibold text-slate-600">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.key} className="px-4 py-5 text-center">
                      <span
                        className={`text-sm font-bold ${
                          plan.popular ? "text-primary" : "text-slate-600"
                        }`}
                      >
                        {plan.displayName}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <Fragment key={section.category}>
                    <tr>
                      <td
                        colSpan={plans.length + 1}
                        className="bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500"
                      >
                        {section.category}
                      </td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr
                        key={`${section.category}-${row.name}`}
                        className="border-b border-slate-50 transition-colors hover:bg-slate-50/50"
                      >
                        <td className="px-5 py-3.5 text-sm text-slate-700">
                          {row.name}
                        </td>
                        {row.values.map((value, i) => (
                          <td
                            key={plans[i].key}
                            className={`px-4 py-3.5 text-center ${
                              plans[i].popular ? "bg-primary/[0.02]" : ""
                            }`}
                          >
                            <CellValue value={value} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <p className="mt-4 text-center text-xs text-slate-500 sm:hidden">
          Scroll the table sideways to see every plan.
        </p>
      </div>
    </section>
  );
}
