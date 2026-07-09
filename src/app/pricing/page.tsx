"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing"; // Import the Pricing component

const comparisonFeatures = [
  {
    category: "Finance Automation",
    features: [
      {
        name: "Documents per month",
        starter: "100",
        pro: "1,000",
        firm: "Client-based",
        enterprise: "Unlimited",
      },
      {
        name: "AI document extraction",
        starter: true,
        pro: true,
        firm: true,
        enterprise: true,
      },
      {
        name: "Expense tracking",
        starter: true,
        pro: true,
        firm: true,
        enterprise: true,
      },
      {
        name: "Batch processing",
        starter: false,
        pro: true,
        firm: true,
        enterprise: true,
      },
      {
        name: "WhatsApp processing",
        starter: false,
        pro: true,
        firm: true,
        enterprise: true,
      },
    ],
  },
  {
    category: "Financial Intelligence",
    features: [
      {
        name: "Financial dashboard",
        starter: "Basic",
        pro: "Advanced",
        firm: "Client-level",
        enterprise: "Custom",
      },
      {
        name: "VAT reporting",
        starter: false,
        pro: true,
        firm: true,
        enterprise: true,
      },
      {
        name: "Profit & loss monitoring",
        starter: false,
        pro: true,
        firm: true,
        enterprise: true,
      },
      {
        name: "Supplier insights",
        starter: false,
        pro: true,
        firm: true,
        enterprise: true,
      },
      {
        name: "Custom AI model training",
        starter: false,
        pro: false,
        firm: false,
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
        firm: true,
        enterprise: true,
      },
      {
        name: "CSV export",
        starter: true,
        pro: true,
        firm: true,
        enterprise: true,
      },
      {
        name: "Accounting-ready reports",
        starter: true,
        pro: true,
        firm: true,
        enterprise: true,
      },
      {
        name: "API access",
        starter: false,
        pro: true,
        firm: true,
        enterprise: true,
      },
      {
        name: "ERP integration",
        starter: false,
        pro: false,
        firm: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Teams & Companies",
    features: [
      {
        name: "User accounts",
        starter: "1",
        pro: "5",
        firm: "Firm team",
        enterprise: "Unlimited",
      },
      {
        name: "Multi-company management",
        starter: false,
        pro: "Limited",
        firm: true,
        enterprise: true,
      },
      {
        name: "Client management",
        starter: false,
        pro: false,
        firm: true,
        enterprise: "Custom",
      },
      {
        name: "Role-based access",
        starter: false,
        pro: true,
        firm: true,
        enterprise: true,
      },
      {
        name: "Audit logs",
        starter: false,
        pro: false,
        firm: true,
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
        firm: true,
        enterprise: true,
      },
      {
        name: "Priority support",
        starter: false,
        pro: true,
        firm: true,
        enterprise: true,
      },
      {
        name: "Partner dashboard",
        starter: false,
        pro: false,
        firm: true,
        enterprise: false,
      },
      {
        name: "Dedicated account manager",
        starter: false,
        pro: false,
        firm: false,
        enterprise: true,
      },
    ],
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

// ─── Main Pricing Page ──────────────────────────────────────────
export default function PricingPage() {
  // const [annual, setAnnual] = useState(false);
  // const [plans, setPlans] = useState<PlanApiItem[]>([]);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchPlans = async () => {
  //     try {
  //       const res = await fetch(apiUrl("/api/plan/list"), {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         credentials: "include",
  //       });

  //       const json = (await res.json()) as PlanListResponse;

  //       if (json.success) {
  //         setPlans(json.data ?? []);
  //       } else {
  //         console.error("API error:", json.error);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch plans", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchPlans();
  // }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      {/* <section className="relative pt-16 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_50%,#eefaf8_100%)]" />
        <div className="absolute inset-0 dot-pattern opacity-30" />
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
              Finance automation pricing for{" "}
              <span className="gradient-text">every team</span>
            </h1>
            <p className="mt-5 text-lg text-muted leading-relaxed max-w-2xl mx-auto">
              Choose a plan for small businesses, growing finance teams,
              accounting firms, or enterprise operations. All plans include a
              14-day free trial with no credit card required.
            </p>
          </motion.div>
        </div>
      </section> */}

      {/* Pricing Cards - Using the Pricing component */}
      <Pricing />

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
              A detailed breakdown of what&apos;s included for businesses,
              finance teams, accounting firms, and enterprises
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-lg shadow-slate-100 border border-slate-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
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
                      Accounting Firm
                    </th>
                    <th className="px-4 py-5 text-center text-sm font-semibold text-slate-600">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category) => (
                    <Fragment key={category.category}>
                      <tr>
                        <td
                          colSpan={5}
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
                            <CellValue value={feature.firm} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <CellValue value={feature.enterprise} />
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      {/* <section className="py-20">
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
      </section> */}

      {/* Bottom CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-primary/90 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to automate finance operations?
            </h2>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
              Start your free trial today and see how Invonix can reduce
              bookkeeping work, improve VAT visibility, and turn documents into
              business insights.
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
