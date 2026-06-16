"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageCircle } from "lucide-react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

const navLinks = [
  { name: "Features", href: "/#features" },
  { name: "Insights", href: "/#financial-intelligence" },
  { name: "How It Works", href: "/#how-it-works" },
  { name: "WhatsApp", href: "/#whatsapp", highlight: true },
  { name: "Demo", href: "/#demo" },
  { name: "Pricing", href: "/pricing" },
  { name: "Faq", href: "/faq" },
  { name: "Partners", href: "/#partners" },
  // Find navLinks array, add Blog between Pricing and Faq:
{ name: "Blog", href: "/blog" },

];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed left-0 right-0 top-4 z-50 px-3 sm:px-6 lg:px-8"
    >
      <div
        className={`mx-auto max-w-6xl overflow-hidden rounded-[1.35rem] border transition-all duration-300 ${
          scrolled
            ? "border-slate-200/80 bg-white/95 shadow-xl shadow-slate-900/10 backdrop-blur-xl"
            : "border-white/80 bg-white/80 shadow-lg shadow-slate-900/5 backdrop-blur-xl"
        }`}
      >
        <div className="px-4 sm:px-5">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <BrandLogo
                priority
                className="h-9 w-[150px]"
                imageClassName="h-full w-full"
              />
            </Link>

            <div className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-50/80 p-1 ring-1 ring-slate-200/70">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    link.highlight
                      ? "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100 hover:bg-emerald-100 flex items-center gap-1.5"
                      : "text-slate-600 hover:text-primary hover:bg-white"
                  }`}
                >
                  {link.highlight && <MessageCircle className="w-3.5 h-3.5" />}
                  {link.name}
                </a>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-primary transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-shine rounded-xl bg-gradient-to-r from-primary-dark via-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-105 hover:shadow-primary/40"
              >
                Start Free Trial
              </Link>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-200/70 bg-white/95"
            >
              <div className="px-4 py-5 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-base font-semibold text-slate-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
                <div className="pt-4 space-y-2 border-t border-slate-200 mt-4">
                  <Link
                    href="/login"
                    className="block w-full px-4 py-3 text-center text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="block w-full rounded-xl bg-gradient-to-r from-primary-dark via-primary to-secondary px-4 py-3 text-center text-base font-semibold text-white shadow-lg"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
