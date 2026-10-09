import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileSpreadsheet,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PRIMARY_CTA_LABEL, SALES_EMAIL } from "@/lib/siteConfig";
import { REGISTERED_ADDRESS } from "@/lib/legalConfig";

export const metadata: Metadata = {
  title: "About – Invonix",
  description:
    "What Invonix does, who it is built for, and how documents become accounting-ready financial data.",
};

const whatWeDo = [
  {
    icon: ScanLine,
    title: "Read the document",
    body: "OCR lifts the text out of a PDF, scan or phone photo, including handwritten notes on printed forms.",
  },
  {
    icon: Sparkles,
    title: "Structure the data",
    body: "AI maps that text to accounting fields — supplier, TRN, dates, line items, subtotal, VAT and total — and scores its own confidence on each.",
  },
  {
    icon: UserCheck,
    title: "Keep a human in the loop",
    body: "Nothing is final until someone in your workspace reviews and approves it. Every field stays editable, and low-confidence extractions are flagged for review.",
  },
  {
    icon: Wallet,
    title: "Report on it",
    body: "Approved documents roll up into revenue, expense, profit and VAT reporting, scoped per company.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export it",
    body: "Download Excel or CSV with unified columns, ready to import into QuickBooks, Xero, Zoho Books or your own template.",
  },
  {
    icon: ShieldCheck,
    title: "Keep it private",
    body: "Documents are stored privately and reachable only through short-lived signed links. We do not train AI models on your data.",
  },
];

const builtFor = [
  "Trading companies reconciling supplier bills and VAT",
  "Logistics operators handling field receipts and delivery notes",
  "Accounting firms preparing client books and exports",
  "Construction companies tracking project costs",
  "Retail businesses capturing daily expenses",
  "Manufacturers tracking purchasing and spend",
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white pt-32 pb-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              About Invonix
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Invonix is a finance automation platform for teams that receive
              financial paperwork faster than they can key it in. It turns
              invoices, receipts and purchase orders into structured,
              accounting-ready data — with a review step, because finance data
              that nobody checked is not finance data.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              We are based in {REGISTERED_ADDRESS}, and the product is built
              around the way finance works in the UAE and the wider GCC: AED and
              multi-currency documents, TRN capture, and VAT reporting as a
              first-class output rather than an afterthought.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
              How it works
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {whatWeDo.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
              Who we build for
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {builtFor.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
              Want to talk to us?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Try the product on the free plan, or email{" "}
              <a
                href={`mailto:${SALES_EMAIL}`}
                className="font-medium text-primary hover:underline"
              >
                {SALES_EMAIL}
              </a>{" "}
              and tell us about your document volume.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="btn-shine group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 sm:w-auto"
              >
                {PRIMARY_CTA_LABEL}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary sm:w-auto"
              >
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
