"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, MapPin, Clock, ShieldCheck, Send, LifeBuoy, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SALES_EMAIL, SUPPORT_EMAIL } from "@/lib/siteConfig";
import { REGISTERED_ADDRESS } from "@/lib/legalConfig";

type Topic = "support" | "sales" | "privacy" | "partnership";

const topics: Array<{ value: Topic; label: string; email: string; hint: string }> = [
  {
    value: "support",
    label: "Product support",
    email: SUPPORT_EMAIL,
    hint: "A document did not process, a number looks wrong, or something is broken.",
  },
  {
    value: "sales",
    label: "Plans & pricing",
    email: SALES_EMAIL,
    hint: "Which plan fits, volume pricing, or a question before you sign up.",
  },
  {
    value: "privacy",
    label: "Privacy & data request",
    email: SUPPORT_EMAIL,
    hint: "Access, correction, export or deletion of your data.",
  },
  {
    value: "partnership",
    label: "Partnerships",
    email: SALES_EMAIL,
    hint: "You are an accounting firm or consultant and want to work with us.",
  },
];

const channels = [
  {
    icon: LifeBuoy,
    title: "Support",
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    detail: "Existing customers — fastest route is the in-app support centre.",
  },
  {
    icon: Building2,
    title: "Sales & partnerships",
    value: SALES_EMAIL,
    href: `mailto:${SALES_EMAIL}`,
    detail: "Plans, volume pricing and partner enquiries.",
  },
  {
    icon: MapPin,
    title: "Office",
    value: REGISTERED_ADDRESS,
    detail: "Correspondence address for legal and privacy notices.",
  },
];

export default function ContactPageClient() {
  const [topic, setTopic] = useState<Topic>("support");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const selectedTopic = topics.find((t) => t.value === topic) ?? topics[0];
  const canSend = name.trim().length > 1 && email.includes("@") && message.trim().length > 9;

  /**
   * There is no public contact endpoint, so rather than show a form that
   * silently discards submissions we compose the message into the visitor's
   * own mail client. The address is also shown in full so it can be copied.
   */
  const mailtoHref = useMemo(() => {
    const subject = `${selectedTopic.label} enquiry — ${name.trim() || "Website contact"}`;
    const body = [
      `Name: ${name.trim()}`,
      company.trim() ? `Company: ${company.trim()}` : null,
      `Email: ${email.trim()}`,
      `Topic: ${selectedTopic.label}`,
      "",
      message.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    return `mailto:${selectedTopic.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [company, email, message, name, selectedTopic]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white pt-32 pb-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Contact Invonix
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
              Tell us what you need and the message goes to the right inbox. We
              reply to support and sales enquiries within one business day, and
              to privacy requests within 30 days.
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:gap-14 lg:px-8">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-lg font-bold text-slate-950">Send a message</h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    What is this about?
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {topics.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTopic(option.value)}
                        className={`rounded-xl border px-3.5 py-3 text-left transition ${
                          topic === option.value
                            ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-slate-900">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{selectedTopic.hint}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Your name
                    </label>
                    <input
                      id="contact-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-company" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Company <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="contact-company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Company name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Work email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="What would you like help with?"
                  />
                </div>

                <button
                  type="button"
                  disabled={!canSend}
                  onClick={() => {
                    window.location.href = mailtoHref;
                  }}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                    canSend
                      ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/40"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  Open in your email app
                </button>
                <p className="text-xs leading-relaxed text-slate-500">
                  This opens your own email application with the message
                  pre-filled, addressed to{" "}
                  <a
                    href={`mailto:${selectedTopic.email}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {selectedTopic.email}
                  </a>
                  . Nothing is sent until you send it, and we never see a draft
                  you do not send.
                </p>
              </div>
            </motion.div>

            {/* Channels */}
            <div className="space-y-4">
              {channels.map((channel) => (
                <div
                  key={channel.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <channel.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{channel.title}</p>
                      {channel.href ? (
                        <a
                          href={channel.href}
                          className="mt-0.5 block break-all text-sm font-medium text-primary hover:underline"
                        >
                          {channel.value}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm text-slate-700">{channel.value}</p>
                      )}
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                        {channel.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Response times</p>
                    <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-600">
                      <li>Support and sales — within 1 business day</li>
                      <li>Privacy and data requests — within 30 days</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Before you write</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      Many answers are already in the{" "}
                      <Link href="/faq" className="font-medium text-primary hover:underline">
                        FAQ
                      </Link>
                      . For how we handle your documents, see the{" "}
                      <Link href="/privacy" className="font-medium text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <p className="text-xs leading-relaxed text-slate-600">
                    Please do not email confidential financial documents. Upload
                    them to your workspace instead, where they are stored
                    privately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
