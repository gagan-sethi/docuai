"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Al-Mansoori",
    role: "Finance Director",
    company: "Gulf Trading Co.",
    content:
      "DocuAI has transformed our invoice processing. What used to take our team hours now takes minutes. The accuracy is remarkable — we rarely need to make corrections.",
    rating: 5,
    avatar: "SA",
  },
  {
    name: "Ahmed Khalil",
    role: "Operations Manager",
    company: "Dubai Logistics",
    content:
      "The WhatsApp integration is a game-changer. Our suppliers send invoices directly, and the system processes them automatically. It's seamless.",
    rating: 5,
    avatar: "AK",
  },
  {
    name: "Maria Chen",
    role: "Head of Accounting",
    company: "TechPrime Solutions",
    content:
      "We process over 500 documents monthly. DocuAI handles different formats without any template setup. The Excel export integrates perfectly with our ERP.",
    rating: 5,
    avatar: "MC",
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-surface via-white to-surface" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-sm font-semibold text-primary tracking-wide uppercase mb-3">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Loved by <span className="gradient-text">businesses</span>{" "}
            worldwide
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            See what our customers say about automating their document
            workflows with DocuAI.
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative bg-white rounded-2xl p-8 shadow-lg shadow-slate-100 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-primary/10 mb-4" />

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-4 h-4 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
