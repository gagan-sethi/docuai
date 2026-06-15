"use client";

import {
  Globe,
  Link2,
  ExternalLink,
  Mail,
  MapPin,
  Heart,
} from "lucide-react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

const footerLinks = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Financial Intelligence", href: "#financial-intelligence" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "/pricing" },
    { name: "Demo", href: "#demo" },
    { name: "WhatsApp Processing", href: "#whatsapp" },
  ],
  Company: [
    { name: "About Us", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Contact", href: "#" },
    { name: "Partners", href: "#partners" },
  ],
  Support: [
    { name: "Help Center", href: "#" },
    { name: "Documentation", href: "#" },
    { name: "Status", href: "#" },
    { name: "Changelog", href: "#" },
    { name: "faq", href: "/faq" },
    { name: "Blog", href: "/blog" },

  ],
  Legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
    { name: "GDPR", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <BrandLogo
                className="h-11 w-[178px] rounded-xl bg-white px-2.5 py-1.5 shadow-lg shadow-black/20"
                imageClassName="h-full w-full"
              />
            </Link>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
              Invonix - From Documents to Financial Intelligence.
              Transform invoices, receipts, purchase orders, and financial
              documents into structured accounting data and actionable business
              insights.
            </p>
            <div className="flex items-center gap-4">
              {[Globe, Link2, ExternalLink].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Icon className="w-4 h-4 text-slate-400 hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact bar */}
        <div className="py-6 border-t border-slate-800 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Mail className="w-4 h-4" />
            <span>hello@invonix.ai</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin className="w-4 h-4" />
            <span>Dubai, UAE</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © 2026 Invonix. All rights reserved.
          </p>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            Powered by AI • Built with <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
          </p>
        </div>
      </div>
    </footer>
  );
}
