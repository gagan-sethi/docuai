"use client";

import { motion } from "framer-motion";
import {
  FileText,
  ScanText,
  BrainCircuit,
  Shield,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const features = [
  { icon: ScanText, text: "AI-powered OCR with 90–95% accuracy" },
  { icon: BrainCircuit, text: "Smart document understanding — no templates" },
  { icon: Shield, text: "Enterprise-grade security & encryption" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left: Branding Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary/90 to-slate-900" />
        <div className="absolute inset-0 opacity-5 dot-pattern" />

        {/* Decorative shapes */}
        <div className="absolute top-20 -left-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-60 h-60 bg-secondary/20 rounded-full blur-3xl" />

        <div className="relative flex-1 flex flex-col justify-between p-10 xl:p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DocuAI</span>
          </Link>

          {/* Main content */}
          <div className="my-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
                Transform documents into{" "}
                <span className="text-secondary">structured data</span>{" "}
                instantly
              </h2>
              <p className="mt-4 text-base text-slate-300 leading-relaxed">
                Join hundreds of businesses automating their document
                processing with AI-powered OCR.
              </p>

              <div className="mt-10 space-y-5">
                {features.map((feature, i) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-sm text-slate-300">
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom testimonial */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-8 border-t border-white/10"
          >
            <p className="text-sm text-slate-400 italic leading-relaxed">
              &ldquo;DocuAI reduced our invoice processing time by 80%. The AI
              accuracy is remarkable.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-xs font-bold text-white">
                SA
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Sarah Al-Mansoori
                </p>
                <p className="text-xs text-slate-400">
                  Finance Director, Gulf Trading
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right: Form Area */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
