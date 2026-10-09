"use client";

import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import {
  BLOG_LIVE,
  COMPANY_CITY,
  PARTNER_PROGRAM_LIVE,
  SALES_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/siteConfig";

type FooterLink = { name: string; href: string };

/**
 * Every link here must resolve to a real page. Sections that do not exist
 * yet (blog with real posts, partner programme) are gated behind their flag
 * rather than linked to "#" — a dead "#" link in a footer was a launch
 * blocker in the Oct 2026 QA review, and the Legal column in particular is
 * referenced from the signup consent text.
 */
const productLinks: FooterLink[] = [
  { name: "Features", href: "/#features" },
  { name: "Financial Intelligence", href: "/#financial-intelligence" },
  { name: "How It Works", href: "/#how-it-works" },
  { name: "Batch Processing", href: "/#batch-merge" },
  { name: "Pricing", href: "/pricing" },
  { name: "Sample Output", href: "/#demo" },
];

const companyLinks: FooterLink[] = [
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" },
  ...(PARTNER_PROGRAM_LIVE ? [{ name: "Partners", href: "/#partners" }] : []),
  ...(BLOG_LIVE ? [{ name: "Blog", href: "/blog" }] : []),
];

const supportLinks: FooterLink[] = [
  { name: "FAQ", href: "/faq" },
  { name: "Help Center", href: "/faq" },
  { name: "Contact Support", href: "/contact" },
  { name: "Sign In", href: "/login" },
];

const legalLinks: FooterLink[] = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
  { name: "Cookie Policy", href: "/cookies" },
];

const footerColumns: Array<[string, FooterLink[]]> = [
  ["Product", productLinks],
  ["Company", companyLinks],
  ["Support", supportLinks],
  ["Legal", legalLinks],
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-3 lg:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <BrandLogo
                className="h-11 w-[178px] rounded-xl bg-white px-2.5 py-1.5 shadow-lg shadow-black/20"
                imageClassName="h-full w-full"
              />
            </Link>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-slate-400">
              Invonix — from documents to financial intelligence. Turn invoices,
              receipts, purchase orders, and financial documents into structured
              accounting data and reports your finance team can act on.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold text-white">{category}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={`${category}-${link.name}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact bar */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-800 py-6">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4" />
            <span>{SUPPORT_EMAIL}</span>
          </a>
          <a
            href={`mailto:${SALES_EMAIL}`}
            className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4" />
            <span>{SALES_EMAIL}</span>
          </a>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin className="h-4 w-4" />
            <span>{COMPANY_CITY}</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 py-6 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Invonix. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">Powered by AI • Built in Dubai</p>
        </div>
      </div>
    </footer>
  );
}
