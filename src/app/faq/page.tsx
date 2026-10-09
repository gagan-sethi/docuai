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
import FaqAnswer from "@/components/FaqAnswer";
import {
  faqAnswerToText,
  faqCategories,
  faqQuestionCount,
  type FaqCategory,
  type FaqCategoryId,
  type FaqEntry,
} from "@/lib/faqContent";
import { SUPPORT_EMAIL, WHATSAPP_LIVE, whatsAppLink } from "@/lib/siteConfig";

// ─── Types ──────────────────────────────────────────────────────────────────

type FAQItem = FaqEntry;

type FAQCategory = FaqCategory & {
  icon: React.ElementType;
  color: string;
  bg: string;
  dot: string;
};

// ─── FAQ Data ────────────────────────────────────────────────────────────────
//
// Questions and answers come from src/lib/faqContent.ts, which the in-app
// Help Center reads too. Only the per-category presentation (icon, colours)
// lives here — previously both pages carried their own copy of the content
// and they drifted apart (UX-06, Oct 2026 QA review).

const categoryStyles: Record<
  FaqCategoryId,
  { icon: React.ElementType; color: string; bg: string; dot: string }
> = {
  general: { icon: HelpCircle, color: "text-primary", bg: "bg-primary/8", dot: "bg-primary" },
  documents: { icon: FileText, color: "text-cyan-600", bg: "bg-cyan-50", dot: "bg-cyan-500" },
  ai: { icon: Brain, color: "text-violet-600", bg: "bg-violet-50", dot: "bg-violet-500" },
  batches: { icon: BarChart3, color: "text-orange-600", bg: "bg-orange-50", dot: "bg-orange-500" },
  dashboard: { icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  users: { icon: Users, color: "text-primary", bg: "bg-primary/8", dot: "bg-primary" },
  exports: { icon: Download, color: "text-teal-600", bg: "bg-teal-50", dot: "bg-teal-500" },
  integrations: { icon: Link2, color: "text-indigo-600", bg: "bg-indigo-50", dot: "bg-indigo-500" },
  security: { icon: ShieldCheck, color: "text-slate-600", bg: "bg-slate-100", dot: "bg-slate-500" },
  billing: { icon: CreditCard, color: "text-rose-600", bg: "bg-rose-50", dot: "bg-rose-500" },
  referral: { icon: Gift, color: "text-pink-600", bg: "bg-pink-50", dot: "bg-pink-500" },
  support: { icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
  enterprise: { icon: Building2, color: "text-primary-dark", bg: "bg-primary/8", dot: "bg-primary-dark" },
  "getting-started": { icon: Rocket, color: "text-secondary", bg: "bg-secondary/8", dot: "bg-secondary" },
};

const categories: FAQCategory[] = faqCategories.map((category) => ({
  ...category,
  ...categoryStyles[category.id],
}));

// ─── Accordion Item ───────────────────────────────────────────────────────────

function AccordionItem({
  item,
  isOpen,
  onToggle,
  index,
  accent,
  dot,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  accent: string;
  dot: string;
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
              <FaqAnswer answer={item.a} accent={accent} accentBg={dot} />
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
        items: cat.items.filter(
          (item) =>
            item.q.toLowerCase().includes(q) ||
            faqAnswerToText(item.a).toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600"
            >
              Browse{" "}
              <span className="font-semibold text-slate-800">
                {faqQuestionCount} answers
              </span>{" "}
              across {categories.length} categories, or search for what you need.
            </motion.p>

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
                          accent={cat.color}
                          dot={cat.dot}
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
                        accent={currentCategory.color}
                        dot={currentCategory.dot}
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
                Can&apos;t find what you&apos;re looking for?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600">
                Our support team is ready to help. Email us or send a message
                and we&apos;ll get back to you within one business day.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-dark via-primary to-secondary px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-primary/40"
                >
                  <Mail className="h-4 w-4" />
                  Email Support
                </a>
                {WHATSAPP_LIVE ? (
                  <a
                    href={whatsAppLink("Hi, I have a question about Invonix")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Support
                  </a>
                ) : (
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contact form
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
