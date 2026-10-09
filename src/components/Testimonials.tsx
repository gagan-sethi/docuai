"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

/**
 * EMPTY BY DESIGN.
 *
 * This section previously carried three quotes attributed to named people
 * ("Sarah Al-Mansoori", "Ahmed Khalil", "Maria Chen") who are not customers
 * of the platform. Publishing invented testimonials was a launch blocker
 * (CB-02, Oct 2026 QA review), so the data has been removed and the section
 * renders nothing while the list is empty.
 *
 * Only add an entry here once the named customer has given written consent to
 * be quoted, and keep that consent on file.
 */
const testimonials: Testimonial[] = [];

export default function Testimonials() {
  if (testimonials.length === 0) return null;

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-surface via-white to-surface" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wide text-primary">
            Testimonials
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            What customers say about <span className="gradient-text">Invonix</span>
          </h2>
        </motion.div>

        {/* Testimonial Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-2xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <Quote className="mb-4 h-8 w-8 text-primary/10" />

              <div className="mb-4 flex items-center gap-1">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="mb-6 text-sm leading-relaxed text-slate-600">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
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
