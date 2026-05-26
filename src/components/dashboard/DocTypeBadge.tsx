"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { DocType } from "@/lib/types";
import { DOC_TYPE_OPTIONS, getDocTypeMeta } from "@/lib/finance";

interface BadgeProps {
  code: DocType;
  size?: "xs" | "sm";
  withDot?: boolean;
}

export function DocTypeBadge({ code, size = "sm", withDot = false }: BadgeProps) {
  const meta = getDocTypeMeta(code);
  const px = size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${meta.badge} ${px}`}>
      {withDot ? (
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      ) : (
        <span aria-hidden>{meta.emoji}</span>
      )}
      {meta.short}
    </span>
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
  const meta = getDocTypeMeta(value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const px = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <div ref={ref} className={`relative inline-block ${className ?? ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition ${meta.badge} ${px} ${
          disabled ? "opacity-60 cursor-not-allowed" : "hover:brightness-95"
        }`}
      >
        <span aria-hidden>{meta.emoji}</span>
        <span>{meta.short}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 min-w-[170px] rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
          {DOC_TYPE_OPTIONS.filter((o) => o.value !== "unknown").map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setOpen(false);
                if (opt.value !== value) onChange(opt.value);
              }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition hover:bg-slate-50 ${
                opt.value === value ? "bg-slate-50" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden>{opt.emoji}</span>
                <span className="font-medium text-slate-800">{opt.label}</span>
              </span>
              {opt.value === value && <Check className="h-3.5 w-3.5 text-emerald-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
