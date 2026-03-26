"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Pricing Data ───────────────────────────────────────────────
const plans = [
  {
    name: "Starter",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "Perfect for small businesses getting started with automation",
    features: [
      "100 documents/month",
      "PDF & image upload",
      "AI OCR extraction",
      "Excel & CSV export",
      "Email support",
      "1 user account",
      "Basic dashboard",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: 149,
    yearlyPrice: 119,
    description: "For growing teams with higher volume and advanced features",
    features: [
      "1,000 documents/month",
      "Everything in Starter",
      "WhatsApp integration",
      "Bulk upload",
      "Priority support",
      "5 user accounts",
      "Sub-admin roles",
      "API access",
      "Custom fields",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "For large organizations with custom needs and compliance",
    features: [
      "Unlimited documents",
      "Everything in Professional",
      "ERP integration",
      "Custom workflows",
      "Dedicated account manager",
      "Unlimited users",
      "SLA guarantee",
      "On-premise option",
      "Custom AI training",
      "White-label option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const comparisonFeatures = [
  {
    category: "Document Processing",
    features: [
      {
        name: "Documents per month",
        starter: "100",
        pro: "1,000",
        enterprise: "Unlimited",
      },
      {
        name: "PDF upload",
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "Image upload (JPG/PNG)",
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "Scanned document support",
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "Bulk upload",
        starter: false,
        pro: true,
        enterprise: true,
      },
      {
        name: "WhatsApp document upload",
        starter: false,
        pro: true,
        enterprise: true,
      },
    ],
  },
  {
    category: "AI & OCR",
    features: [
      {
        name: "AI OCR extraction",
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "Table detection",
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "Auto field detection",
        starter: "Basic",
        pro: "Advanced",
        enterprise: "Custom",
      },
      {
        name: "Handwriting support",
        starter: false,
        pro: "Limited",
        enterprise: true,
      },
      {
        name: "Custom AI model training",
        starter: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Export & Integration",
    features: [
      {
        name: "Excel export (XLSX)",
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "CSV export",
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "API access",
        starter: false,
        pro: true,
        enterprise: true,
      },
      {
        name: "ERP integration",
        starter: false,
        pro: false,
        enterprise: true,
      },
      {
        name: "Webhook notifications",
        starter: false,
        pro: true,
        enterprise: true,
      },
    ],
  },
  {
    category: "Team & Admin",
    features: [
      {
        name: "User accounts",
        starter: "1",
        pro: "5",
        enterprise: "Unlimited",
      },
      {
        name: "Role-based access",
        starter: false,
        pro: true,
        enterprise: true,
      },
      {
        name: "Sub-admin roles",
        starter: false,
        pro: true,
        enterprise: true,
      },
      {
        name: "Audit log",
        starter: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Support",
    features: [
      {
        name: "Email support",
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "Priority support",
        starter: false,
        pro: true,
        enterprise: true,
      },
      {
        name: "Dedicated account manager",
        starter: false,
        pro: false,
        enterprise: true,
      },
      {
        name: "SLA guarantee",
        starter: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
];

const faqs = [
  {
    question: "How does the 14-day free trial work?",
    answer:
      "You get full access to your chosen plan for 14 days, no credit card required. If you love it, simply add payment to continue. If not, your account will be paused — no charges.",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Yes! You can upgrade or downgrade at any time. When upgrading, you get immediate access to new features. When downgrading, changes take effect at the next billing cycle.",
  },
  {
    question: "What document formats are supported?",
    answer:
      "We support PDF, JPG, PNG, and scanned documents. Our AI handles invoices, purchase orders, delivery notes, receipts, and more — all without requiring pre-configured templates.",
  },
  {
    question: "How accurate is the AI extraction?",
    answer:
      "Our AI achieves 90–95% accuracy on high-quality documents. For lower quality scans, accuracy may vary. All extracted data can be reviewed and edited before export.",
  },
  {
    question: "How does WhatsApp integration work?",
    answer:
      "On Professional and Enterprise plans, you link your mobile number during signup. Then simply send document photos or PDFs to our WhatsApp Business number — they're automatically processed and appear in your dashboard.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use AES-256 encryption at rest, TLS 1.3 in transit, and store files on AWS S3 with restricted access. We're GDPR-compliant and never share your data.",
  },
  {
    question: "What is the Partner/Affiliate program?",
    answer:
      "Accounting firms and consultants can earn recurring commissions by referring clients to DocuAI. Each partner gets a unique referral link, a dashboard to track referrals, and automated commission tracking.",
  },
  {
    question: "Do you offer annual billing discounts?",
    answer:
      "Yes! Annual billing saves you 20% compared to monthly pricing. You can switch between monthly and annual billing at any time.",
  },
];

// ─── Cell renderer for comparison table ─────────────────────────
function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="w-5 h-5 text-success mx-auto" />
    ) : (
      <X className="w-4 h-4 text-slate-300 mx-auto" />
    );
  }
  return (
    <span className="text-sm font-medium text-slate-700">{value}</span>
  );
}

// ─── FAQ Item ───────────────────────────────────────────────────
function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-muted leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Pricing Page ──────────────────────────────────────────
export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 pb-8 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-semibold text-primary tracking-wide uppercase mb-3">
              Pricing
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Simple pricing,{" "}
              <span className="gradient-text">powerful results</span>
            </h1>
            <p className="mt-5 text-lg text-muted leading-relaxed max-w-2xl mx-auto">
              Start free, upgrade when you&apos;re ready. All plans include a 14-day
              free trial with no credit card required.
            </p>

            {/* Billing toggle */}
            <div className="mt-10 flex items-center justify-center gap-4">
              <span
                className={`text-sm font-medium ${
                  !annual ? "text-slate-900" : "text-slate-400"
                }`}
              >
                Monthly
              </span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  annual ? "bg-primary" : "bg-slate-200"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    annual ? "translate-x-7" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  annual ? "text-slate-900" : "text-slate-400"
                }`}
              >
                Annual
              </span>
              {annual && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-success bg-success/10 rounded-full"
                >
                  Save 20%
                </motion.span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-3xl ${
                  plan.popular
                    ? "bg-white shadow-2xl shadow-primary/10 border-2 border-primary/20 scale-105 z-10"
                    : "bg-white shadow-lg shadow-slate-100 border border-slate-100"
                } p-8 flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-full shadow-lg shadow-primary/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted mt-1">{plan.description}</p>
                </div>

                <div className="mb-8">
                  {plan.monthlyPrice > 0 ? (
                    <>
                      <span className="text-5xl font-extrabold text-slate-900">
                        ${annual ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted">/month</span>
                      {annual && (
                        <div className="mt-1">
                          <span className="text-xs text-muted line-through">
                            ${plan.monthlyPrice}/mo
                          </span>
                          <span className="text-xs text-success font-semibold ml-2">
                            Save ${(plan.monthlyPrice - plan.yearlyPrice) * 12}/yr
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-5xl font-extrabold text-slate-900">
                        Custom
                      </span>
                      <p className="text-sm text-muted mt-1">
                        Tailored to your needs
                      </p>
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === "Enterprise" ? "#" : "/signup"}
                  className={`btn-shine group w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                    plan.popular
                      ? "text-white bg-gradient-to-r from-primary to-primary-dark shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105"
                      : "text-slate-700 bg-slate-50 border border-slate-200 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-muted mt-8">
            All plans include a{" "}
            <span className="font-semibold text-slate-700">
              14-day free trial
            </span>
            . No credit card required.
          </p>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Compare all features
            </h2>
            <p className="mt-3 text-muted">
              A detailed breakdown of what&apos;s included in each plan
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-lg shadow-slate-100 border border-slate-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                {/* Table header */}
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-5 text-left text-sm font-semibold text-slate-600 w-[40%]">
                      Feature
                    </th>
                    <th className="px-4 py-5 text-center text-sm font-semibold text-slate-600">
                      Starter
                    </th>
                    <th className="px-4 py-5 text-center">
                      <span className="text-sm font-bold text-primary">
                        Professional
                      </span>
                    </th>
                    <th className="px-4 py-5 text-center text-sm font-semibold text-slate-600">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category) => (
                    <>
                      <tr key={category.category}>
                        <td
                          colSpan={4}
                          className="px-6 py-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider"
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature) => (
                        <tr
                          key={feature.name}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-3.5 text-sm text-slate-700">
                            {feature.name}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <CellValue value={feature.starter} />
                          </td>
                          <td className="px-4 py-3.5 text-center bg-primary/[0.02]">
                            <CellValue value={feature.pro} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <CellValue value={feature.enterprise} />
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-sm font-medium text-primary mb-4">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-lg shadow-slate-100 border border-slate-100 p-6 sm:p-8"
          >
            {faqs.map((faq) => (
              <FAQItem key={faq.question} {...faq} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-primary/90 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to automate your document processing?
            </h2>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
              Start your free trial today and see how DocuAI can save your team
              hours every week.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="btn-shine group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold text-slate-900 bg-white rounded-2xl shadow-xl hover:scale-105 transition-all"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold text-white border-2 border-white/20 rounded-2xl hover:bg-white/10 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
