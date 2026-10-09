import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { POLICY_EFFECTIVE_DATE } from "@/lib/legalConfig";

const policyLinks = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
  { name: "Cookie Policy", href: "/cookies" },
  { name: "Contact", href: "/contact" },
];

/**
 * Shared shell for the published policy pages so Privacy, Terms and Cookie
 * Policy stay visually identical and cross-link to one another.
 */
export default function LegalPage({
  title,
  intro,
  showEffectiveDate = true,
  children,
}: {
  title: string;
  intro?: string;
  showEffectiveDate?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white pt-32 pb-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            {intro && (
              <p className="mt-4 text-base leading-relaxed text-slate-600">{intro}</p>
            )}
            {showEffectiveDate && (
              <p className="mt-5 text-sm font-medium text-slate-500">
                Effective {POLICY_EFFECTIVE_DATE}
              </p>
            )}
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="legal-prose mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-10">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-4 sm:px-6 lg:px-8">
            <span className="text-sm font-semibold text-slate-700">
              Related:
            </span>
            {policyLinks
              .filter((link) => link.name !== title)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {link.name}
                </Link>
              ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
