"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Edit3,
  Save,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  AlertTriangle,
  Check,
  X,
  Eye,
  Mail,
  Sparkles,
  Copy,
  MoreHorizontal,
  MessageSquare,
  Clock,
  ArrowLeft,
  Send,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

// ─── Types ──────────────────────────────────────────────────────
interface ExtractedField {
  id: string;
  label: string;
  value: string;
  confidence: number;
  edited: boolean;
}

interface LineItem {
  id: string;
  code: string;
  description: string;
  qty: number;
  unitPrice: string;
  total: string;
  confidence: number;
}

interface ReviewDoc {
  id: string;
  name: string;
  type: string;
  source: "upload" | "whatsapp";
  date: string;
  overallConfidence: number;
  status: "pending" | "approved" | "rejected";
}

// ─── Sample Data ────────────────────────────────────────────────
const reviewQueue: ReviewDoc[] = [
  {
    id: "DOC-002",
    name: "PO_AlFuttaim_March.pdf",
    type: "Purchase Order",
    source: "whatsapp",
    date: "15 min ago",
    overallConfidence: 82,
    status: "pending",
  },
  {
    id: "DOC-007",
    name: "Invoice_DEWA_March2026.pdf",
    type: "Invoice",
    source: "upload",
    date: "30 min ago",
    overallConfidence: 88,
    status: "pending",
  },
  {
    id: "DOC-008",
    name: "DN_Aramex_084723.jpg",
    type: "Delivery Note",
    source: "upload",
    date: "45 min ago",
    overallConfidence: 76,
    status: "pending",
  },
  {
    id: "DOC-009",
    name: "Receipt_LuLu_2026.png",
    type: "Receipt",
    source: "whatsapp",
    date: "1 hr ago",
    overallConfidence: 91,
    status: "pending",
  },
  {
    id: "DOC-010",
    name: "Invoice_Etisalat_Q1.pdf",
    type: "Invoice",
    source: "upload",
    date: "2 hrs ago",
    overallConfidence: 95,
    status: "pending",
  },
];

const initialFields: ExtractedField[] = [
  { id: "f1", label: "Document Type", value: "Purchase Order", confidence: 99, edited: false },
  { id: "f2", label: "Vendor Name", value: "Al Futtaim Group", confidence: 96, edited: false },
  { id: "f3", label: "Vendor Code", value: "AF-00112", confidence: 93, edited: false },
  { id: "f4", label: "PO Number", value: "PO-2026-55219", confidence: 99, edited: false },
  { id: "f5", label: "PO Date", value: "2026-03-14", confidence: 97, edited: false },
  { id: "f6", label: "Delivery Date", value: "2026-04-01", confidence: 85, edited: false },
  { id: "f7", label: "Payment Terms", value: "Net 30", confidence: 72, edited: false },
  { id: "f8", label: "Currency", value: "AED", confidence: 98, edited: false },
  { id: "f9", label: "Subtotal", value: "45,320.00", confidence: 94, edited: false },
  { id: "f10", label: "VAT (5%)", value: "2,266.00", confidence: 91, edited: false },
  { id: "f11", label: "Grand Total", value: "47,586.00", confidence: 96, edited: false },
  { id: "f12", label: "Shipping Address", value: "Dubai Industrial City, Plot 234", confidence: 68, edited: false },
];

const initialLineItems: LineItem[] = [
  {
    id: "l1",
    code: "PRD-001",
    description: "Industrial Pump A300",
    qty: 5,
    unitPrice: "1,250.00",
    total: "6,250.00",
    confidence: 96,
  },
  {
    id: "l2",
    code: "PRD-042",
    description: "Valve Assembly V12",
    qty: 12,
    unitPrice: "340.00",
    total: "4,080.00",
    confidence: 94,
  },
  {
    id: "l3",
    code: "PRD-108",
    description: "Seal Kit SK-Pro",
    qty: 20,
    unitPrice: "85.50",
    total: "1,710.00",
    confidence: 97,
  },
  {
    id: "l4",
    code: "PRD-205",
    description: "Hydraulic Hose 12mm",
    qty: 50,
    unitPrice: "42.00",
    total: "2,100.00",
    confidence: 88,
  },
  {
    id: "l5",
    code: "PRD-311",
    description: "Bearing Set BS-400",
    qty: 8,
    unitPrice: "3,897.50",
    total: "31,180.00",
    confidence: 71,
  },
];

// ─── Confidence Badge ───────────────────────────────────────────
function ConfBadge({ value }: { value: number }) {
  const color =
    value >= 90
      ? "text-success bg-success/10"
      : value >= 80
      ? "text-amber-600 bg-amber-50"
      : "text-red-500 bg-red-50";
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${color}`}>
      {value}%
    </span>
  );
}

// ─── Main Review Page ───────────────────────────────────────────
export default function ReviewPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [selectedDoc, setSelectedDoc] = useState(0);
  const [fields, setFields] = useState(initialFields);
  const [lineItems, setLineItems] = useState(initialLineItems);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingLineItem, setEditingLineItem] = useState<{ id: string; col: string } | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [tab, setTab] = useState<"fields" | "lineItems">("fields");
  const [emailOnApprove, setEmailOnApprove] = useState(true);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector("aside");
      if (sidebar) setSidebarWidth(sidebar.getBoundingClientRect().width);
    });
    const sidebar = document.querySelector("aside");
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ["style"] });
      setSidebarWidth(sidebar.getBoundingClientRect().width);
    }
    return () => observer.disconnect();
  }, []);

  const currentDoc = reviewQueue[selectedDoc];
  const lowConfCount = fields.filter((f) => f.confidence < 80).length;

  const updateField = (id: string, value: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value, edited: true, confidence: 100 } : f))
    );
  };

  const updateLineItem = (id: string, col: string, value: string) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [col]: col === "qty" ? Number(value) : value, confidence: 100 } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <motion.div
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.2 }}
        className="min-h-screen flex flex-col"
      >
        <TopBar title="Review & Edit" />

        <div className="flex-1 flex overflow-hidden">
          {/* ─── Left: Document Queue ──────────────────────── */}
          <div className="w-64 xl:w-72 border-r border-slate-100 bg-white flex flex-col flex-shrink-0">
            <div className="px-4 py-3 border-b border-slate-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Review Queue
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-600 rounded-full">
                  {reviewQueue.length} pending
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {reviewQueue.map((doc, i) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(i)}
                  className={`w-full text-left px-4 py-3.5 transition-colors ${
                    selectedDoc === i
                      ? "bg-primary/5 border-l-2 border-primary"
                      : "hover:bg-slate-50 border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {doc.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <span className="text-[10px] text-muted">{doc.type}</span>
                    <span className="text-[10px] text-muted">·</span>
                    <span className="text-[10px] text-muted">{doc.date}</span>
                    {doc.source === "whatsapp" && (
                      <span className="px-1 py-0.5 text-[8px] font-bold bg-green-50 text-green-600 rounded">
                        WA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 ml-6 mt-1.5">
                    <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          doc.overallConfidence >= 90
                            ? "bg-success"
                            : doc.overallConfidence >= 80
                            ? "bg-amber-400"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${doc.overallConfidence}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">
                      {doc.overallConfidence}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ─── Center: Document Preview ─────────────────── */}
          <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {currentDoc.name}
                  </p>
                  <p className="text-[10px] text-muted">
                    {currentDoc.type} · {currentDoc.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted w-10 text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document viewer area */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
              <motion.div
                animate={{ scale: zoom / 100, rotate: rotation }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-xl shadow-black/10 w-full max-w-2xl aspect-[8.5/11] relative overflow-hidden"
              >
                {/* Simulated document */}
                <div className="p-8 sm:p-12 h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="w-32 h-8 bg-primary/10 rounded mb-2" />
                      <div className="w-48 h-3 bg-slate-100 rounded mb-1" />
                      <div className="w-40 h-3 bg-slate-100 rounded" />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary mb-1">
                        PURCHASE ORDER
                      </div>
                      <div className="text-sm font-mono text-slate-600">
                        PO-2026-55219
                      </div>
                      <div className="text-xs text-muted mt-1">
                        Date: 14 Mar 2026
                      </div>
                    </div>
                  </div>

                  {/* Vendor & Ship To */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Vendor
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        Al Futtaim Group
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        Dubai, UAE
                      </div>
                      <div className="text-xs text-muted">
                        Code: AF-00112
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Ship To
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        Dubai Industrial City
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        Plot 234, Warehouse 7
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">
                            Code
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">
                            Description
                          </th>
                          <th className="px-3 py-2 text-center font-semibold text-slate-600">
                            Qty
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-600">
                            Unit Price
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-600">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {initialLineItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 font-mono text-slate-600">
                              {item.code}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {item.description}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">
                              {item.qty}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600">
                              {item.unitPrice}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-700">
                              {item.total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-48 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span>AED 45,320.00</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>VAT (5%)</span>
                        <span>AED 2,266.00</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                        <span>Grand Total</span>
                        <span>AED 47,586.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI highlight overlays */}
                <div className="absolute top-[80px] right-[48px] sm:right-[96px] w-24 sm:w-32 h-5 border-2 border-primary/40 bg-primary/5 rounded pointer-events-none" />
                <div className="absolute top-[172px] left-[32px] sm:left-[48px] w-28 sm:w-36 h-4 border-2 border-amber-400/40 bg-amber-50/50 rounded pointer-events-none" />
              </motion.div>
            </div>

            {/* Doc navigation */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-slate-100">
              <button
                onClick={() => setSelectedDoc(Math.max(0, selectedDoc - 1))}
                disabled={selectedDoc === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-xs text-muted">
                {selectedDoc + 1} of {reviewQueue.length}
              </span>
              <button
                onClick={() =>
                  setSelectedDoc(Math.min(reviewQueue.length - 1, selectedDoc + 1))
                }
                disabled={selectedDoc === reviewQueue.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Right: Extracted Data Panel ──────────────── */}
          <div className="w-96 xl:w-[420px] border-l border-slate-100 bg-white flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Extracted Data
                </h3>
                <div className="flex items-center gap-1.5">
                  <ConfBadge value={currentDoc.overallConfidence} />
                  {lowConfCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      {lowConfCount} low
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-slate-50 rounded-lg p-0.5">
                <button
                  onClick={() => setTab("fields")}
                  className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    tab === "fields"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-muted hover:text-slate-700"
                  }`}
                >
                  Header Fields ({fields.length})
                </button>
                <button
                  onClick={() => setTab("lineItems")}
                  className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    tab === "lineItems"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-muted hover:text-slate-700"
                  }`}
                >
                  Line Items ({lineItems.length})
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {tab === "fields" ? (
                  <motion.div
                    key="fields"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="divide-y divide-slate-50"
                  >
                    {fields.map((field) => (
                      <div
                        key={field.id}
                        className={`px-4 py-3 transition-colors ${
                          field.confidence < 80
                            ? "bg-red-50/30"
                            : "hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {field.label}
                          </label>
                          <div className="flex items-center gap-1.5">
                            {field.edited && (
                              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                Edited
                              </span>
                            )}
                            <ConfBadge value={field.confidence} />
                          </div>
                        </div>
                        {editingField === field.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              defaultValue={field.value}
                              onBlur={(e) => {
                                updateField(field.id, e.target.value);
                                setEditingField(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateField(field.id, e.currentTarget.value);
                                  setEditingField(null);
                                }
                                if (e.key === "Escape") setEditingField(null);
                              }}
                              className="flex-1 px-2.5 py-1.5 text-sm bg-white border-2 border-primary/30 rounded-lg focus:outline-none focus:border-primary text-slate-800"
                            />
                            <button
                              onClick={() => setEditingField(null)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <p className="text-sm font-medium text-slate-800">
                              {field.value}
                            </p>
                            <button
                              onClick={() => setEditingField(field.id)}
                              className="p-1 rounded text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="lineItems"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="p-4"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="px-2 py-2 text-left font-semibold text-slate-500">
                              Code
                            </th>
                            <th className="px-2 py-2 text-left font-semibold text-slate-500">
                              Description
                            </th>
                            <th className="px-2 py-2 text-center font-semibold text-slate-500">
                              Qty
                            </th>
                            <th className="px-2 py-2 text-right font-semibold text-slate-500">
                              Price
                            </th>
                            <th className="px-2 py-2 text-right font-semibold text-slate-500">
                              Total
                            </th>
                            <th className="px-2 py-2 text-center font-semibold text-slate-500">
                              Conf.
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {lineItems.map((item) => (
                            <tr
                              key={item.id}
                              className={`${
                                item.confidence < 80
                                  ? "bg-red-50/30"
                                  : "hover:bg-slate-50"
                              } transition-colors`}
                            >
                              {(
                                [
                                  ["code", "left"],
                                  ["description", "left"],
                                  ["qty", "center"],
                                  ["unitPrice", "right"],
                                  ["total", "right"],
                                ] as const
                              ).map(([col, align]) => (
                                <td
                                  key={col}
                                  className={`px-2 py-2.5 text-${align} cursor-pointer group`}
                                  onClick={() =>
                                    setEditingLineItem({ id: item.id, col })
                                  }
                                >
                                  {editingLineItem?.id === item.id &&
                                  editingLineItem?.col === col ? (
                                    <input
                                      autoFocus
                                      defaultValue={String(
                                        item[col as keyof LineItem]
                                      )}
                                      className="w-full px-1.5 py-0.5 text-xs border-2 border-primary/30 rounded focus:outline-none focus:border-primary text-slate-800"
                                      onBlur={(e) => {
                                        updateLineItem(
                                          item.id,
                                          col,
                                          e.target.value
                                        );
                                        setEditingLineItem(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          updateLineItem(
                                            item.id,
                                            col,
                                            e.currentTarget.value
                                          );
                                          setEditingLineItem(null);
                                        }
                                        if (e.key === "Escape")
                                          setEditingLineItem(null);
                                      }}
                                    />
                                  ) : (
                                    <span className="text-slate-700 group-hover:text-primary transition-colors">
                                      {String(item[col as keyof LineItem])}
                                    </span>
                                  )}
                                </td>
                              ))}
                              <td className="px-2 py-2.5 text-center">
                                <ConfBadge value={item.confidence} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Bar */}
            <div className="border-t border-slate-100 p-4 space-y-3">
              {/* Email option */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailOnApprove}
                  onChange={() => setEmailOnApprove(!emailOnApprove)}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                />
                <span className="text-xs text-slate-600">
                  Send extracted data via email on approve
                </span>
                <Mail className="w-3.5 h-3.5 text-muted" />
              </label>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-success to-emerald-600 rounded-xl shadow-md shadow-success/20 hover:shadow-success/40 hover:scale-[1.02] transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors">
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Export Excel
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                  Copy JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Approve Modal ───────────────────────────────── */}
        <AnimatePresence>
          {showApproveModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setShowApproveModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Approve Document?
                  </h3>
                  <p className="text-sm text-muted mb-1">
                    <span className="font-semibold text-slate-700">
                      {currentDoc.name}
                    </span>
                  </p>
                  <p className="text-xs text-muted">
                    {fields.filter((f) => f.edited).length} field(s) were
                    manually corrected.
                    {emailOnApprove && " Extracted data will be emailed."}
                  </p>
                </div>

                {/* Summary */}
                <div className="px-6 pb-4">
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">Document</span>
                      <span className="font-medium text-slate-700">
                        {currentDoc.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Fields Extracted</span>
                      <span className="font-medium text-slate-700">
                        {fields.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Line Items</span>
                      <span className="font-medium text-slate-700">
                        {lineItems.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Confidence</span>
                      <span className="font-semibold text-success">
                        {currentDoc.overallConfidence}%
                      </span>
                    </div>
                    {emailOnApprove && (
                      <div className="flex justify-between">
                        <span className="text-muted">Email to</span>
                        <span className="font-medium text-slate-700">
                          gagan@company.com
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 px-6 pb-6">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowApproveModal(false);
                      // In production: API call to approve + optionally email
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-success to-emerald-600 rounded-xl shadow-md hover:scale-105 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Confirm Approve
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
