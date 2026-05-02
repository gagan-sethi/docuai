"use client";

import { useState, type KeyboardEvent, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import MergeBar from "@/components/dashboard/MergeBar";
import {
  Search,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Mail,
  Users,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { apiUrl } from "@/lib/api";


// ─── Types ────────────────────────────────────────────────────────────────────
interface FaqItem {
  question: string;
  answer: string;
}

interface Category {
  icon: string;
  title: string;
  description: string;
  iconBg: string;
}

interface Guide {
  tag: string;
  tagClass: string;
  title: string;
  description: string;
  link: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const categories: Category[] = [
  {
    icon: "🚀",
    title: "Getting Started",
    description: "Set up your account, upload your first document, and get familiar with the platform.",
    iconBg: "bg-indigo-50",
  },
  {
    icon: "👤",
    title: "Account & Profile",
    description: "Manage your profile, update credentials, and configure account preferences.",
    iconBg: "bg-blue-50",
  },
  {
    icon: "💳",
    title: "Subscriptions & Billing",
    description: "Upgrade, downgrade, or cancel your plan. Understand billing cycles and pricing.",
    iconBg: "bg-green-50",
  },
  {
    icon: "📊",
    title: "Usage & Limits",
    description: "Track document usage, understand processing limits, and monitor your consumption.",
    iconBg: "bg-orange-50",
  },
  {
    icon: "🧾",
    title: "Invoices & Payments",
    description: "Download invoices, update payment methods, and review transaction history.",
    iconBg: "bg-sky-50",
  },
  {
    icon: "🔧",
    title: "Troubleshooting",
    description: "Resolve upload failures, extraction errors, and common technical issues quickly.",
    iconBg: "bg-red-50",
  },
];

const faqs: FaqItem[] = [
  {
    question: "How does AI extract data from PDFs?",
    answer:
      "Our AI uses a combination of Optical Character Recognition (OCR) and large language models to read your PDF, identify key fields (like dates, amounts, names), and convert them into clean, structured data. The process runs in seconds and achieves over 94% accuracy across most document types.",
  },
  {
    question: "What file formats are supported?",
    answer:
      "We currently support PDF, JPG, PNG, and scanned document images. We're working on adding support for Word documents (.docx) and Excel files (.xlsx) in an upcoming release. File size limit is 25MB per upload.",
  },
  {
    question: "Why did my upload fail?",
    answer:
      "Upload failures are usually caused by: (1) File size exceeding 25MB — try compressing the PDF. (2) Unsupported file format — check our supported formats above. (3) Corrupted file — try re-exporting from the source application. (4) Slow internet connection — refresh and try again. If the issue persists, contact support.",
  },
  {
    question: "Where can I download invoices?",
    answer:
      "Your invoices are available under Settings → Billing → Invoice History. You can download individual invoices as PDF files, or export your full billing history as a CSV for accounting purposes.",
  },
  {
    question: "What happens if I exceed my usage limit?",
    answer:
      "When you reach your monthly limit, new uploads are paused until the next billing cycle or until you upgrade your plan. You'll receive email warnings at 80% and 95% usage. Your existing processed documents remain fully accessible — nothing is deleted.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, absolutely. You can cancel your subscription at any time from Settings → Billing. Your plan stays active until the end of the current billing period. We don't charge cancellation fees, and you can reactivate at any time.",
  },
];

const guides: Guide[] = [
  {
    tag: "Getting started",
    tagClass: "bg-indigo-50 text-indigo-700",
    title: "Uploading your first PDF",
    description: "A step-by-step walkthrough of uploading, reviewing, and downloading your first extracted document.",
    link: "/help/uploading-first-pdf",
  },
  {
    tag: "Data output",
    tagClass: "bg-blue-50 text-blue-700",
    title: "Understanding structured data output",
    description: "Learn how DocuAI organizes extracted fields, handles tables, and what the JSON format looks like.",
    link: "/help/structured-data",
  },
  {
    tag: "Billing",
    tagClass: "bg-green-50 text-green-700",
    title: "Managing subscriptions",
    description: "How to upgrade, downgrade, or pause your plan, and what changes take effect immediately vs. next cycle.",
    link: "/help/managing-subscriptions",
  },
  {
    tag: "Payments",
    tagClass: "bg-orange-50 text-orange-700",
    title: "Billing and invoices guide",
    description: "Everything about payment methods, invoice downloads, failed charges, and tax documentation.",
    link: "/help/billing-guide",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center mb-10">
      <p className="text-xs font-semibold tracking-[0.08em] uppercase text-indigo-600 mb-2">{label}</p>
      <h2 className="font-bold text-2xl sm:text-3xl text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 text-[15px] max-w-md mx-auto">{subtitle}</p>
    </div>
  );
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={`rounded-xl border overflow-hidden transition-all duration-200 ${isOpen ? "border-indigo-400 shadow-sm" : "border-slate-200"
              }`}
          >
            <button
              onClick={() => toggle(i)}
              className={`w-full flex items-center justify-between gap-4 px-5 py-[18px] text-left text-sm font-medium transition-colors ${isOpen ? "bg-indigo-50 text-indigo-700" : "bg-white text-slate-800 hover:bg-slate-50"
                }`}
            >
              <span>{faq.question}</span>
              <svg
                className={`shrink-0 w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180 text-indigo-500" : "text-slate-400"
                  }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-3 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SupportPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success">("idle");

  // Handle sidebar width for margin animation
  useState(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector("aside");
      if (sidebar) setSidebarWidth(sidebar.getBoundingClientRect().width);
    });
    const sidebar = document.querySelector("aside");
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ["style"] });
      setSidebarWidth(sidebar.getBoundingClientRect().width);
    }
    return () => observer.disconnect();
  });

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitState("loading");
    setTimeout(() => {
      setSubmitState("success");
      setTimeout(() => setSubmitState("idle"), 3000);
    }, 1200);
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      issueType: "",
      message: "",
    },

    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      issueType: Yup.string().required("Please select an issue"),
      message: Yup.string().min(10, "Too short").required("Message is required"),
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        setSubmitState("loading");

        const res = await fetch(
          apiUrl("/api/support"),
          {
            method: "POST",
            credentials: "include", // ✅ important
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed");
        }

        setSubmitState("success");
        resetForm();

        setTimeout(() => setSubmitState("idle"), 3000);
      } catch (err) {
        console.error(err);
        setSubmitState("idle");
        alert("Failed to send message");
      }
    },
  });

  return (
    <div className="flex h-screen bg-[#f8f9fb]">
      <Sidebar />
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, marginLeft: sidebarWidth }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <TopBar title="Help & Support" />
        <main className="flex-1 overflow-y-auto">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white">
            <div className="max-w-4xl mx-auto px-6 py-16 text-center relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Support Center
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">How can we help you?</h1>
              <p className="text-white/80 text-lg max-w-md mx-auto mb-9">
                Find answers, manage your account, and get assistance with DocuAI.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search for articles, guides, or questions..."
                  className="w-full pl-12 pr-32 py-4 rounded-xl text-slate-800 bg-white shadow-xl outline-none focus:ring-2 focus:ring-indigo-300 transition text-base"
                />
                <button
                  onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
            {/* Background Blobs */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
              <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />
            </div>
          </section>

          {/* Categories */}
          <section className="max-w-6xl mx-auto px-6 py-16">
            <SectionHeader
              label="Browse Topics"
              title="Help Categories"
              subtitle="Choose a topic to browse relevant guides and articles."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <button
                  key={cat.title}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex gap-4 items-start text-left cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 w-full"
                >
                  <div className={`w-12 h-12 rounded-xl ${cat.iconBg} flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{cat.description}</p>
                  </div>
                  <ArrowRight className="shrink-0 self-center text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-200 w-5 h-5" />
                </button>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="bg-white border-y border-slate-100 py-16 px-6">
            <div className="max-w-3xl mx-auto">
              <SectionHeader
                label="Common Questions"
                title="Frequently Asked Questions"
                subtitle="Quick answers to the questions we hear most often."
              />
              <FaqAccordion />
            </div>
          </section>

          {/* Guides Section */}
          <section className="max-w-6xl mx-auto px-6 py-16">
            <SectionHeader
              label="Documentation"
              title="Guides & Articles"
              subtitle="Step-by-step guides to help you get the most out of DocuAI."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {guides.map((guide) => (
                // <Link
                //   key={guide.title}
                //   href={guide.link}
                //   className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 no-underline"
                // >
                //   <span className={`inline-flex w-fit text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full ${guide.tagClass}`}>
                //     {guide.tag}
                //   </span>
                //   <h3 className="font-semibold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                //     {guide.title}
                //   </h3>
                //   <p className="text-sm text-slate-500 leading-relaxed flex-1">{guide.description}</p>
                //   <span className="text-sm font-medium text-indigo-600 group-hover:underline mt-1 inline-flex items-center gap-1">
                //     Read guide <ArrowRight className="w-3.5 h-3.5" />
                //   </span>
                // </Link>
                <div
                  key={guide.title}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 no-underline"
                >
                  <span className={`inline-flex w-fit text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full ${guide.tagClass}`}>
                    {guide.tag}
                  </span>
                  <h3 className="font-semibold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{guide.description}</p>
                  <span className="text-sm font-medium text-indigo-600 group-hover:underline mt-1 inline-flex items-center gap-1">
                    Read guide <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* System Status */}
          <div className="max-w-6xl mx-auto px-6 pb-8">
            <div className="bg-white rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4 px-5 py-3.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-sm font-medium text-emerald-700">All systems operational</span>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">Last checked: just now</span>
              <Link href="/status" className="text-xs font-medium text-indigo-600 hover:underline ml-auto inline-flex items-center gap-1">
                View status page <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Contact Section */}
          <section className="bg-gradient-to-br from-indigo-50 to-violet-50 border-t border-slate-100 py-16 px-6">
            <div className="max-w-5xl mx-auto">
              <SectionHeader
                label="Contact"
                title="Still need help?"
                subtitle="Our support team is here for you — usually responding within a few hours."
              />
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 items-start">
                {/* Contact Options */}
                <div className="flex flex-col gap-4">
                  {[
                    { icon: Mail, bg: "bg-indigo-50", title: "Email Support", desc: "support@docuai.com — Response within 4–8 hours on business days.", badge: null },
                    { icon: MessageCircle, bg: "bg-emerald-50", title: "Live Chat", desc: "Chat with our team in real time. Mon–Fri, 9 AM–6 PM IST.", badge: "Online" },
                    { icon: Users, bg: "bg-amber-50", title: "Community Forum", desc: "Browse discussions, share tips, and get help from other DocuAI users.", badge: null },
                  ].map((opt) => (
                    <div key={opt.title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4 cursor-pointer group transition-all duration-200 hover:border-indigo-200 hover:shadow-md">
                      <div className={`w-10 h-10 rounded-xl ${opt.bg} flex items-center justify-center text-indigo-600 shrink-0`}>
                        <opt.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {opt.title}
                          </h4>
                          {opt.badge && (
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{opt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Contact Form */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-md p-7">
                  <h3 className="font-bold text-slate-800 mb-6">Send us a message</h3>
                  <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="fname" className="block text-xs font-medium text-slate-500 mb-1.5">Name</label>
                        <input
                          id="fname"
                          name="name"
                          value={formik.values.name}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          type="text"
                          placeholder="Your full name"
                          required
                          className="w-full rounded-lg border border-slate-200 text-sm px-3.5 py-2.5 text-slate-800 bg-white outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 placeholder:text-slate-400"
                        />
                        {formik.touched.name && formik.errors.name && (
                          <p className="text-xs text-red-500 mt-1">{formik.errors.name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="femail" className="block text-xs font-medium text-slate-500 mb-1.5">Email address</label>
                        <input
                          id="femail"
                          name="email"
                          type="email"
                          value={formik.values.email}
                          onChange={formik.handleChange}
                          placeholder="you@company.com"
                          required
                          className="w-full rounded-lg border border-slate-200 text-sm px-3.5 py-2.5 text-slate-800 bg-white outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 placeholder:text-slate-400"
                        />
                        {formik.touched.email && formik.errors.email && (
                          <p className="text-xs text-red-500 mt-1">{formik.errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="fissue" className="block text-xs font-medium text-slate-500 mb-1.5">Issue type</label>
                      <select
                        id="fissue"
                        name="issueType"
                        value={formik.values.issueType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        required
                        defaultValue=""
                        className="w-full rounded-lg border border-slate-200 text-sm px-3.5 py-2.5 text-slate-800 bg-white outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300"
                      >
                        <option value="" disabled>Select a category…</option>
                        <option value="upload">Upload or extraction issue</option>
                        <option value="billing">Billing or payment question</option>
                        <option value="account">Account or login problem</option>
                        <option value="subscription">Subscription change request</option>
                        <option value="feature">Feature request or feedback</option>
                        <option value="other">Other</option>
                      </select>
                      {formik.touched.issueType && formik.errors.issueType && (
                        <p className="text-xs text-red-500 mt-1">{formik.errors.issueType}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="fmsg" className="block text-xs font-medium text-slate-500 mb-1.5">Message</label>
                      <textarea
                        id="fmsg"
                        name="message"
                        value={formik.values.message}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        rows={4}
                        required
                        placeholder="Describe your issue or question in detail…"
                        className="w-full rounded-lg border border-slate-200 text-sm px-3.5 py-2.5 text-slate-800 bg-white outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 resize-y placeholder:text-slate-400"
                      />
                      {formik.touched.message && formik.errors.message && (
                        <p className="text-xs text-red-500 mt-1">{formik.errors.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitState === "loading" || !formik.isValid}
                      className={`w-full py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${submitState === "success"
                        ? "bg-emerald-500 text-white"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                      {submitState === "idle" && "Send Message"}
                      {submitState === "loading" && (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Sending…
                        </span>
                      )}
                      {submitState === "success" && (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Message sent!
                        </span>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Note - in dashboard context, we don't need full footer */}
          <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
            © 2025 DocuAI. All rights reserved.
          </div>
        </main>
      </motion.div>
    </div>
  );
}