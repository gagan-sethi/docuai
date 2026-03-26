"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Upload,
  Sparkles,
  CheckCircle2,
  FileText,
  Table2,
  Receipt,
  Building2,
  Landmark,
  ShoppingBag,
  Truck,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

const floatingDocs = [
  { icon: FileText, label: "Invoice.pdf", x: -60, y: -40, delay: 0 },
  { icon: Receipt, label: "PO-4521.pdf", x: 60, y: -60, delay: 0.5 },
  { icon: Table2, label: "Order.xlsx", x: -40, y: 40, delay: 1 },
];

const typingWords = [
  "Invoices",
  "Purchase Orders",
  "Delivery Notes",
  "Receipts",
  "Bills of Lading",
  "Scanned Forms",
];

const trustedCompanies = [
  { name: "Gulf Trading Co.", icon: Building2 },
  { name: "Emirates Logistics", icon: Truck },
  { name: "Al-Rajhi Finance", icon: Landmark },
  { name: "Dubai Retail Group", icon: ShoppingBag },
  { name: "TechPrime Solutions", icon: Briefcase },
];

function TypingAnimation() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const word = typingWords[currentIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setDisplayText(word.slice(0, displayText.length + 1));
          if (displayText.length === word.length) {
            setTimeout(() => setIsDeleting(true), 1800);
          }
        } else {
          setDisplayText(word.slice(0, displayText.length - 1));
          if (displayText.length === 0) {
            setIsDeleting(false);
            setCurrentIndex((prev) => (prev + 1) % typingWords.length);
          }
        }
      },
      isDeleting ? 40 : 80
    );
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex, mounted]);

  if (!mounted) {
    return (
      <span className="relative inline-block">
        <span className="gradient-text">Invoices</span>
        <span className="inline-block w-[3px] h-[0.85em] bg-primary ml-1 align-middle cursor-blink" />
      </span>
    );
  }

  return (
    <span className="relative inline-block">
      <span className="gradient-text">{displayText}</span>
      <span className="inline-block w-[3px] h-[0.85em] bg-primary ml-1 align-middle cursor-blink" />
    </span>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/3 rounded-full blur-3xl" />
        <div className="absolute inset-0 dot-pattern opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-sm font-medium text-primary mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Document Processing</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight">
              Stop{" "}
              <span className="relative">
                <span className="gradient-text">Manual</span>
              </span>
              <br />
              Data Entry
            </h1>

            {/* Typing animation subtitle */}
            <div className="mt-4 h-10 flex items-center justify-center lg:justify-start">
              <span className="text-lg sm:text-xl text-muted font-medium">
                Process{" "}
              </span>
              <span className="text-lg sm:text-xl font-bold ml-1.5 min-w-[180px]">
                <TypingAnimation />
              </span>
            </div>

            <p className="mt-6 text-lg sm:text-xl text-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Upload any document — invoices, purchase orders, delivery notes —
              and get{" "}
              <span className="font-semibold text-foreground">
                structured data instantly
              </span>
              . Reduce manual data entry by{" "}
              <span className="font-semibold text-primary">70–80%</span> with
              AI-powered OCR.
            </p>

            {/* Trust indicators */}
            <div className="mt-6 flex flex-wrap items-center gap-4 justify-center lg:justify-start">
              {[
                "90–95% Accuracy",
                "No Templates Needed",
                "Process in Seconds",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-1.5 text-sm text-muted"
                >
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href="/signup"
                className="btn-shine group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-primary via-primary-dark to-primary rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-200"
              >
                <Upload className="w-5 h-5" />
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-2xl hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-200"
              >
                See Live Demo
              </Link>
            </div>
          </motion.div>

          {/* Right: Interactive Demo Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative mx-auto max-w-lg">
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-2xl scale-110" />

              {/* Main card */}
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center gap-2 px-6 py-4 bg-slate-50/80 border-b border-slate-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs font-medium text-slate-400">
                      DocuAI Dashboard
                    </span>
                  </div>
                </div>

                {/* Upload zone */}
                <div className="p-8">
                  <div className="drop-zone rounded-2xl p-8 text-center cursor-pointer hover:border-primary group">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      Drag & drop your documents here
                    </p>
                    <p className="text-xs text-muted mt-1">
                      PDF, JPG, PNG • Up to 50MB
                    </p>
                  </div>

                  {/* Simulated extracted data */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="mt-6 space-y-3"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        Extracted Data Preview
                      </span>
                    </div>
                    {[
                      { field: "Customer", value: "Acme Corp", confidence: 98 },
                      {
                        field: "Invoice #",
                        value: "INV-2026-0847",
                        confidence: 99,
                      },
                      {
                        field: "Total",
                        value: "$12,450.00",
                        confidence: 97,
                      },
                      { field: "Date", value: "2026-03-15", confidence: 99 },
                    ].map((row, i) => (
                      <motion.div
                        key={row.field}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 + i * 0.15 }}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50/80 hover:bg-primary/5 transition-colors"
                      >
                        <span className="text-xs text-muted">{row.field}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {row.value}
                          </span>
                          <span className="text-[10px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded-full">
                            {row.confidence}%
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* Floating document badges */}
              {floatingDocs.map((doc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, -10, 0],
                  }}
                  transition={{
                    delay: 0.8 + doc.delay,
                    y: {
                      repeat: Infinity,
                      duration: 3 + i,
                      ease: "easeInOut",
                    },
                  }}
                  className="absolute hidden lg:flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-lg shadow-slate-200/60 border border-slate-100"
                  style={{
                    top: `${50 + doc.y}%`,
                    left: doc.x < 0 ? `${doc.x + 10}px` : undefined,
                    right: doc.x > 0 ? `${-doc.x + 10}px` : undefined,
                  }}
                >
                  <doc.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-slate-600">
                    {doc.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trusted by section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="mt-24 pt-16 border-t border-slate-100"
        >
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-slate-200" />
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              Trusted by industry leaders
            </p>
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-slate-200" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {trustedCompanies.map((company, i) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.0 + i * 0.1 }}
                className="group flex items-center gap-3 px-5 py-3 rounded-xl hover:bg-slate-50 transition-colors cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <company.icon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-600 transition-colors whitespace-nowrap">
                  {company.name}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              {["SA", "AK", "MC", "JD"].map((initials, i) => (
                <div
                  key={initials}
                  className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ zIndex: 4 - i }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400 ml-2">
              <span className="font-semibold text-slate-600">500+</span>{" "}
              businesses process documents daily
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
