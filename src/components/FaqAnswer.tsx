"use client";

import type { FaqAnswer as FaqAnswerData } from "@/lib/faqContent";

/**
 * Renders a canonical FAQ answer. Shared by the public /faq page and the
 * in-app Help Center so both read from src/lib/faqContent.ts (UX-06).
 */
export default function FaqAnswer({
  answer,
  accent = "text-primary",
  accentBg = "bg-primary",
}: {
  answer: FaqAnswerData;
  /** Tailwind text colour for chips, matched to the category. */
  accent?: string;
  /** Tailwind background colour for bullet dots. */
  accentBg?: string;
}) {
  return (
    <div className="space-y-3">
      {answer.lead && <p className="leading-relaxed text-slate-700">{answer.lead}</p>}

      {answer.items && answer.itemStyle === "chips" && (
        <div className="flex flex-wrap gap-2">
          {answer.items.map((item) => (
            <span
              key={item}
              className={`rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold ${accent}`}
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {answer.items && answer.itemStyle !== "chips" && (
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {answer.items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-slate-700">
              <span className={`mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full ${accentBg}`} />
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      )}

      {answer.rows && (
        <div className="space-y-2">
          {answer.rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <span className="text-sm font-semibold text-slate-800">{row.label}</span>
              <span className="text-sm font-medium text-slate-500">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {answer.note && (
        <p className="text-sm leading-relaxed text-slate-500">{answer.note}</p>
      )}
    </div>
  );
}
