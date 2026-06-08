"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const stats = [
  {
    value: 500,
    suffix: "+",
    label: "Businesses",
    description: "Across the UAE, GCC & Africa",
  },
  {
    value: 50000,
    suffix: "+",
    label: "Documents Processed",
    description: "Invoices, receipts, POs, and VAT records",
  },
  {
    value: 90,
    suffix: "%+",
    label: "OCR Accuracy",
    description: "On supported finance documents",
  },
];

function AnimatedCounter({
  value,
  suffix,
  inView,
}: {
  value: number;
  suffix: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return (
    <span className="text-5xl lg:text-6xl font-extrabold tracking-tight">
      {count.toLocaleString("en-US")}
      <span className="text-primary">{suffix}</span>
    </span>
  );
}

export default function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-20 lg:py-28">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-secondary/[0.03]" />

      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-block text-sm font-semibold text-primary tracking-wide uppercase mb-3">
            Platform Statistics
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Trusted proof for regional finance teams
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            Built for businesses handling financial documents across trading,
            logistics, accounting, construction, retail, and manufacturing.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                inView={isInView}
              />
              <p className="mt-2 text-base font-semibold text-slate-800">
                {stat.label}
              </p>
              <p className="text-sm text-muted">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
