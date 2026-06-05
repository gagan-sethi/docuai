"use client";

import { useState, useRef, useEffect } from "react";
import {
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Receipt,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  WandSparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DocType } from "@/lib/types";
import type { ProcessedDocument } from "@/lib/types";
import { DOC_TYPE_OPTIONS, getDocTypeMeta, normalizeDocTypeCode } from "@/lib/finance";

const BADGE_BASE =
  "inline-flex shrink-0 items-center gap-1 rounded-[20px] border px-[10px] py-[3px] text-[12px] font-medium leading-4";

const DOC_TYPE_ICONS: Record<DocType, LucideIcon> = {
  sales_invoice: FileText,
  expense_invoice: ReceiptText,
  purchase_order: ShoppingCart,
  receipt: Receipt,
  unknown: CircleHelp,
};

interface BadgeProps {
  code?: DocType | string | null;
  size?: "xs" | "sm";
  withDot?: boolean;
}

export function DocTypeBadge({ code, size = "sm", withDot = false }: BadgeProps) {
  const safeCode = normalizeDocTypeCode(code) ?? "unknown";
  const meta = getDocTypeMeta(safeCode);
  const Icon = DOC_TYPE_ICONS[safeCode];
  const iconSize = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span className={`${BADGE_BASE} ${meta.badge}`}>
      {withDot ? (
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      ) : (
        <Icon className={iconSize} aria-hidden />
      )}
      {meta.label}
    </span>
  );
}

function normalizeOcrAccuracy(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  const scaled = numeric > 0 && numeric <= 1 ? numeric * 100 : numeric;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

function ocrTone(value: number) {
  if (value >= 90) {
    return "bg-green-50 text-green-700 border-green-200 dark:bg-green-400/15 dark:text-green-200 dark:border-green-400/30";
  }
  if (value >= 70) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/15 dark:text-amber-200 dark:border-amber-400/30";
  }
  return "bg-red-50 text-red-700 border-red-200 dark:bg-red-400/15 dark:text-red-200 dark:border-red-400/30";
}

export function AiVerifiedBadge() {
  return (
    <span className={`${BADGE_BASE} bg-green-50 text-green-700 border-green-200 dark:bg-green-400/15 dark:text-green-200 dark:border-green-400/30`}>
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      AI Verified
    </span>
  );
}

export function OcrAccuracyBadge({ value }: { value?: number | string | null }) {
  const accuracy = normalizeOcrAccuracy(value);
  if (accuracy === null) return null;

  return (
    <span className={`${BADGE_BASE} ${ocrTone(accuracy)}`}>
      <ScanLine className="h-3.5 w-3.5" aria-hidden />
      OCR {accuracy}%
    </span>
  );
}

export function AutoCategorizedBadge() {
  return (
    <span className={`${BADGE_BASE} bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-400/15 dark:text-purple-200 dark:border-purple-400/30`}>
      <WandSparkles className="h-3.5 w-3.5" aria-hidden />
      Auto-Categorized
    </span>
  );
}

export function AiProcessingIndicators({
  doc,
  className,
}: {
  doc: Pick<ProcessedDocument, "ai_verified" | "ocr_accuracy" | "auto_categorized">;
  className?: string;
}) {
  const accuracy = normalizeOcrAccuracy(doc.ocr_accuracy);

  if (doc.ai_verified !== true && accuracy === null && doc.auto_categorized !== true) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      {doc.ai_verified === true && <AiVerifiedBadge />}
      {accuracy !== null && <OcrAccuracyBadge value={accuracy} />}
      {doc.auto_categorized === true && <AutoCategorizedBadge />}
    </div>
  );
}

interface DropdownProps {
  value: DocType;
  onChange: (next: DocType) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Inline doc-type selector used in the documents list and review page.
 * Renders as a coloured pill with a chevron; opens a popover with the
 * canonical options. Marks the row as manually overridden via onChange.
 */
export function DocTypeDropdown({
  value,
  onChange,
  disabled,
  size = "sm",
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const safeValue = normalizeDocTypeCode(value) ?? "unknown";
  const meta = getDocTypeMeta(safeValue);
  const CurrentIcon = DOC_TYPE_ICONS[safeValue];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block ${className ?? ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`${BADGE_BASE} transition ${meta.badge} ${size === "md" ? "text-[13px]" : ""} ${disabled ? "opacity-60 cursor-not-allowed" : "hover:brightness-95"
          }`}
      >
        <CurrentIcon className="h-3.5 w-3.5" aria-hidden />
        <span>{meta.label}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>
      {open && (
        <div
          className="absolute top-full z-30 mt-1 min-w-[190px] rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden dark:border-slate-700 dark:bg-slate-900"
        >
          {DOC_TYPE_OPTIONS.filter((o) => o.value !== "unknown").map((opt) => {
            const OptionIcon = DOC_TYPE_ICONS[opt.value];
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (opt.value !== value) onChange(opt.value);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition hover:bg-slate-50 dark:hover:bg-slate-800 ${opt.value === value ? "bg-slate-50 dark:bg-slate-800" : ""
                  }`}
              >
                <span className="flex items-center gap-2">
                  <OptionIcon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" aria-hidden />
                  <span className="font-medium text-slate-800 dark:text-slate-100">{opt.label}</span>
                </span>
                {opt.value === value && <Check className="h-3.5 w-3.5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
