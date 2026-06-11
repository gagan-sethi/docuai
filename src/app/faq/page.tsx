"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Search,
  HelpCircle,
  MessageCircle,
  FileText,
  Brain,
  BarChart3,
  Users,
  Download,
  Link2,
  ShieldCheck,
  CreditCard,
  Gift,
  GraduationCap,
  Building2,
  Rocket,
  Mail,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Types ──────────────────────────────────────────────────────────────────

type FAQItem = {
  q: string;
  a: React.ReactNode;
};

type FAQCategory = {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  items: FAQItem[];
};

// ─── FAQ Data ────────────────────────────────────────────────────────────────

const categories: FAQCategory[] = [
  {
    id: "general",
    label: "General",
    icon: HelpCircle,
    color: "text-primary",
    bg: "bg-primary/8",
    items: [
      {
        q: "What is Invonix?",
        a: "Invonix is an AI-powered document processing platform that automatically extracts data from invoices, receipts, purchase orders, and financial documents, helping businesses reduce manual data entry and improve operational efficiency.",
      },
      {
        q: "Who is Invonix designed for?",
        a: (
          <div className="space-y-2">
            <p>Invonix is ideal for:</p>
            <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {[
                "Accounting Firms",
                "Bookkeepers",
                "SMEs",
                "Trading Companies",
                "Logistics Companies",
                "Construction Companies",
                "Manufacturing Companies",
                "Retail Businesses",
                "Corporate Finance Teams",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-slate-700">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        q: "Which countries does Invonix serve?",
        a: "Invonix serves businesses across the UAE, GCC, and Africa.",
      },
    ],
  },
  {
    id: "documents",
    label: "Document Processing",
    icon: FileText,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    items: [
      {
        q: "What document types can Invonix process?",
        a: (
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {["Sales Invoices", "Purchase Invoices", "Receipts", "Purchase Orders", "Credit Notes", "Expense Documents"].map((t) => (
              <li key={t} className="flex items-center gap-2 text-slate-700">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                {t}
              </li>
            ))}
          </ul>
        ),
      },
      {
        q: "What file formats are supported?",
        a: (
          <div className="flex flex-wrap gap-2">
            {["PDF", "JPG", "JPEG", "PNG", "TIFF"].map((f) => (
              <span key={f} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
                {f}
              </span>
            ))}
          </div>
        ),
      },
      {
        q: "Can I upload multiple documents at once?",
        a: "Yes. Invonix supports bulk uploads and batch processing.",
      },
      {
        q: "Does Invonix support Arabic documents?",
        a: "Yes. Both Arabic and English documents are fully supported.",
      },
    ],
  },
  {
    id: "ai",
    label: "AI & OCR",
    icon: Brain,
    color: "text-violet-600",
    bg: "bg-violet-50",
    items: [
      {
        q: "How accurate is Invonix?",
        a: "Document extraction accuracy typically exceeds 90%, depending on document quality.",
      },
      {
        q: "Does Invonix automatically identify document types?",
        a: "Yes. Invonix automatically classifies invoices, receipts, purchase orders, and other supported document types.",
      },
      {
        q: "Can Invonix extract VAT information?",
        a: "Yes. VAT amounts and tax-related fields are automatically extracted where available.",
      },
    ],
  },
  {
    id: "batches",
    label: "Upload Batch Management",
    icon: BarChart3,
    color: "text-orange-600",
    bg: "bg-orange-50",
    items: [
      {
        q: "What is Upload Batch Management?",
        a: (
          <div>
            <p>Every upload session automatically receives a unique Batch ID.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Batch #001", "Batch #002", "Batch #003"].map((b) => (
                <span key={b} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-bold text-orange-700">
                  {b}
                </span>
              ))}
            </div>
          </div>
        ),
      },
      {
        q: "Why is Batch Management useful?",
        a: (
          <ul className="space-y-1.5">
            {[
              "Process documents by upload session",
              "Export only recent uploads",
              "Organize documents by period",
              "Improve audit and reconciliation workflows",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                {item}
              </li>
            ))}
          </ul>
        ),
      },
    ],
  },
  {
    id: "dashboard",
    label: "Financial Dashboard",
    icon: BarChart3,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    items: [
      {
        q: "What information is available in the Financial Dashboard?",
        a: (
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {["Revenue", "Expenses", "Net Profit", "VAT Payable", "Financial Trends", "Processing Statistics"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-slate-700">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        ),
      },
      {
        q: "Can I export reports?",
        a: (
          <div>
            <p className="mb-3">Yes. Available export formats:</p>
            <div className="flex gap-2">
              {["Excel (XLSX)", "CSV", "PDF"].map((f) => (
                <span key={f} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                  {f}
                </span>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "users",
    label: "Multi-Company & Users",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/8",
    items: [
      {
        q: "Can I manage multiple companies?",
        a: "Yes, depending on your subscription plan.",
      },
      {
        q: "Can multiple users access the same company?",
        a: (
          <div>
            <p className="mb-3">Yes, depending on the subscription plan:</p>
            <div className="space-y-2">
              {[
                { plan: "Starter Plan", detail: "Single User" },
                { plan: "Professional Plan", detail: "Multiple Users" },
                { plan: "Enterprise Plan", detail: "Custom User Limits" },
              ].map(({ plan, detail }) => (
                <div key={plan} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <span className="text-sm font-semibold text-slate-800">{plan}</span>
                  <span className="text-sm font-medium text-slate-500">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "exports",
    label: "Exports",
    icon: Download,
    color: "text-teal-600",
    bg: "bg-teal-50",
    items: [
      {
        q: "Can I export only today's uploaded documents?",
        a: (
          <div>
            <p className="mb-3">Yes. Users can export:</p>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {["Latest Upload Batch", "Selected Batch", "Selected Documents", "Date Range", "Current Month", "Current Quarter", "Current Year"].map((opt) => (
                <li key={opt} className="flex items-center gap-2 text-slate-700">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  {opt}
                </li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        q: "Can I export approved documents only?",
        a: (
          <div>
            <p className="mb-3">Yes. Filters are available for:</p>
            <div className="flex flex-wrap gap-2">
              {["Approved Documents", "Pending Review", "All Documents"].map((f) => (
                <span key={f} className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
                  {f}
                </span>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "integrations",
    label: "Accounting Software",
    icon: Link2,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    items: [
      {
        q: "Does Invonix integrate with accounting software?",
        a: "Not directly. Invonix exports structured financial data in Excel and CSV formats that can be imported into most accounting systems like QuickBooks, Xero, Wafeq, or Zoho Books.",
      },
      {
        q: "Can I use Invonix alongside my existing accounting software?",
        a: "Yes. Invonix is designed to complement existing accounting workflows by providing clean, structured data for finance teams and accountants.",
      },
    ],
  },
  {
    id: "security",
    label: "Security & Privacy",
    icon: ShieldCheck,
    color: "text-slate-600",
    bg: "bg-slate-100",
    items: [
      {
        q: "Is my data secure?",
        a: "Yes. Invonix uses secure cloud infrastructure and access controls to protect customer data.",
      },
      {
        q: "Do you share customer data?",
        a: "No. Customer data is never sold or shared with third parties without authorization.",
      },
    ],
  },
  {
    id: "billing",
    label: "Pricing & Billing",
    icon: CreditCard,
    color: "text-rose-600",
    bg: "bg-rose-50",
    items: [
      {
        q: "Is there a free trial?",
        a: "Yes. New customers can request a free trial before subscribing.",
      },
      {
        q: "Can I upgrade my plan later?",
        a: "Yes. Plans can be upgraded at any time.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes. Subscriptions can be cancelled according to the terms of your plan.",
      },
    ],
  },
  {
    id: "referral",
    label: "Referral Program",
    icon: Gift,
    color: "text-pink-600",
    bg: "bg-pink-50",
    items: [
      {
        q: "How does the referral program work?",
        a: "Share your referral code with friends, colleagues, or clients. When they subscribe using your code, the configured referral discount is automatically applied.",
      },
    ],
  },
  {
    id: "support",
    label: "Training & Support",
    icon: GraduationCap,
    color: "text-amber-600",
    bg: "bg-amber-50",
    items: [
      {
        q: "Do you provide training?",
        a: (
          <div>
            <p className="mb-3">Yes. All customers receive access to:</p>
            <ul className="space-y-1.5">
              {["Video Tutorials", "User Guides", "Knowledge Base", "FAQ Center"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-slate-700">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        q: "Do you provide customer support?",
        a: (
          <div>
            <p className="mb-3">Yes. Support is available through:</p>
            <div className="flex flex-wrap gap-2">
              {["Email Support", "WhatsApp Support", "Help Center"].map((s) => (
                <span key={s} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise Onboarding",
    icon: Building2,
    color: "text-primary-dark",
    bg: "bg-primary/8",
    items: [
      {
        q: "Do you offer enterprise onboarding?",
        a: (
          <div>
            <p className="mb-3">Yes. Enterprise customers receive:</p>
            <ul className="space-y-1.5">
              {[
                "Dedicated onboarding sessions",
                "Team training workshops",
                "Multi-user setup assistance",
                "Workflow configuration support",
                "Priority support",
                "Dedicated account management",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "getting-started",
    label: "Getting Started",
    icon: Rocket,
    color: "text-secondary",
    bg: "bg-secondary/8",
    items: [
      {
        q: "How do I start using Invonix?",
        a: (
          <ol className="space-y-2.5">
            {[
              "Create an account",
              "Create your company",
              "Upload documents",
              "Review AI-extracted data",
              "Approve documents",
              "Analyze financial insights",
              "Export reports and structured data",
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
        ),
      },
      {
        q: "How long does setup take?",
        a: "Most businesses can start processing documents on the same day.",
      },
    ],
  },
];

// ─── Accordion Item ───────────────────────────────────────────────────────────

function AccordionItem({
  item,
  isOpen,
  onToggle,
  index,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
        isOpen
          ? "border-primary/25 bg-white shadow-md shadow-primary/8"
          : "border-slate-200 bg-white/70 hover:border-primary/20 hover:bg-white hover:shadow-sm"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
      >
        <span className="mt-0.5 flex-1 text-sm font-bold leading-snug text-slate-900 sm:text-base">
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="mt-0.5 shrink-0"
        >
          <ChevronDown
            className={`h-4 w-4 transition-colors ${
              isOpen ? "text-primary" : "text-slate-400"
            }`}
          />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600 sm:px-6 sm:py-5">
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>("general");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const currentCategory = categories.find((c) => c.id === activeCategory)!;

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          item.q.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const totalFAQs = categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white pt-24 sm:pt-28 lg:pt-32">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#f5f9ff_0%,#ffffff_60%)]" />
          <div className="absolute inset-0 dot-pattern opacity-15 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
          <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(90deg,rgba(20,87,201,0.07),rgba(14,165,233,0.06),rgba(16,185,129,0.05))]" />

          <div className="relative mx-auto max-w-3xl px-4 pb-16 text-center sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/90 px-4 py-2 text-sm font-semibold text-primary shadow-sm"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Frequently Asked Questions</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl"
            >
              Everything you need to know about{" "}
              <span className="gradient-text">Invonix</span>
            </motion.h1>

            {/* <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600"
            >
              Browse{" "}
              <span className="font-semibold text-slate-800">{totalFAQs} answers</span>{" "}
              across {categories.length} categories, or search for what you need.
            </motion.p> */}

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="relative mx-auto mt-8 max-w-lg"
            >
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </motion.div>
          </div>
        </section>

        {/* ── Body ─────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          {filteredCategories ? (
            /* Search results */
            <div className="space-y-10">
              {filteredCategories.length === 0 ? (
                <div className="py-20 text-center text-slate-500">
                  <Search className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                  <p className="text-lg font-semibold text-slate-700">No results found</p>
                  <p className="mt-1 text-sm">Try different keywords or browse by category below.</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-primary/30 hover:text-primary"
                  >
                    Browse all categories
                  </button>
                </div>
              ) : (
                filteredCategories.map((cat) => (
                  <div key={cat.id}>
                    <div className="mb-4 flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${cat.bg}`}>
                        <cat.icon className={`h-4 w-4 ${cat.color}`} />
                      </div>
                      <h2 className="text-base font-extrabold text-slate-800">{cat.label}</h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                        {cat.items.length}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {cat.items.map((item, i) => (
                        <AccordionItem
                          key={`${cat.id}-${i}`}
                          item={item}
                          isOpen={openItems.has(`${cat.id}-${i}`)}
                          onToggle={() => toggleItem(`${cat.id}-${i}`)}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Category browse */
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
              {/* Sidebar */}
              <aside className="top-28 w-full shrink-0 lg:sticky lg:w-64">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Categories
                </p>
                <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                  {categories.map((cat) => {
                    const isActive = cat.id === activeCategory;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.id);
                          setOpenItems(new Set());
                        }}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-all duration-150 ${
                          isActive
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <cat.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : cat.color}`} />
                        <span className="truncate">{cat.label}</span>
                        <span
                          className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                            isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {cat.items.length}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </aside>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${currentCategory.bg}`}>
                      <currentCategory.icon className={`h-5 w-5 ${currentCategory.color}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-950">{currentCategory.label}</h2>
                      <p className="text-xs font-medium text-slate-500">
                        {currentCategory.items.length} question{currentCategory.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {currentCategory.items.map((item, i) => (
                      <AccordionItem
                        key={`${activeCategory}-${i}`}
                        item={item}
                        isOpen={openItems.has(`${activeCategory}-${i}`)}
                        onToggle={() => toggleItem(`${activeCategory}-${i}`)}
                        index={i}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </section>

        {/* ── CTA Banner ───────────────────────────────────────── */}
        <section className="border-t border-slate-200 bg-[linear-gradient(135deg,#f5f9ff,#ffffff,#f0fbff)]">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm">
                <MessageCircle className="h-4 w-4" />
                Still have questions?
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Can't find what you're looking for?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600">
                Our support team is ready to help. Reach out via email or WhatsApp and we'll get back to you quickly.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="mailto:support@invonix.com"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-dark via-primary to-secondary px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-primary/40"
                >
                  <Mail className="h-4 w-4" />
                  Email Support
                </Link>
                <Link
                  href="https://wa.me/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Support
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}