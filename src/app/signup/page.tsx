"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Building2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle2,
  MessageCircle,
  Smartphone,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";

type Step = "details" | "otp" | "whatsapp" | "complete";

interface SignupForm {
  fullName: string;
  companyName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

// ─── OTP Input Component ───────────────────────────────────────
function OTPInput({
  length = 6,
  value,
  onChange,
}: {
  length?: number;
  value: string;
  onChange: (val: string) => void;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const arr = value.split("");
    arr[idx] = char;
    const next = arr.join("").slice(0, length);
    onChange(next);
    if (char && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(paste);
    const nextIdx = Math.min(paste.length, length - 1);
    inputs.current[nextIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none ${
            value[i]
              ? "border-primary bg-primary/5 text-primary"
              : "border-slate-200 bg-slate-50 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Step Indicator ─────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = [
    { key: "details", label: "Account" },
    { key: "otp", label: "Verify" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "complete", label: "Done" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < currentIndex
                  ? "bg-success text-white"
                  : i === currentIndex
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {i < currentIndex ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`mt-1.5 text-[10px] font-medium ${
                i <= currentIndex ? "text-primary" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 mx-2 mb-5">
              <div
                className={`h-0.5 rounded-full transition-all duration-500 ${
                  i < currentIndex ? "bg-success" : "bg-slate-200"
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Signup Page ───────────────────────────────────────────
export default function SignupPage() {
  const [step, setStep] = useState<Step>("details");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [form, setForm] = useState<SignupForm>({
    fullName: "",
    companyName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const updateField = (field: keyof SignupForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Resend OTP timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
      setResendTimer(30);
    }, 1500);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("whatsapp");
    }, 1500);
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setOtp("");
  };

  const handleLinkWhatsApp = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("complete");
    }, 1500);
  };

  const slideVariants = {
    enter: { x: 30, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -30, opacity: 0 },
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            Docu<span className="gradient-text">AI</span>
          </span>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        <AnimatePresence mode="wait">
          {/* ─── STEP 1: Account Details ────────────────────────── */}
          {step === "details" && (
            <motion.div
              key="details"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Create your account
                </h1>
                <p className="mt-1.5 text-sm text-muted">
                  Start your 14-day free trial. No credit card needed.
                </p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={form.companyName}
                      onChange={(e) =>
                        updateField("companyName", e.target.value)
                      }
                      placeholder="Acme Corp"
                      className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Mobile Number{" "}
                    <span className="text-xs text-muted font-normal">
                      (for WhatsApp linking)
                    </span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={form.mobile}
                      onChange={(e) => updateField("mobile", e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-11 pr-11 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {form.password && (
                    <div className="mt-2 flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            form.password.length >= level * 3
                              ? level <= 2
                                ? "bg-orange-400"
                                : "bg-success"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                      <span className="text-[10px] font-medium text-muted ml-1">
                        {form.password.length < 6
                          ? "Weak"
                          : form.password.length < 10
                          ? "Good"
                          : "Strong"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Terms */}
                <p className="text-xs text-muted leading-relaxed">
                  By creating an account, you agree to our{" "}
                  <Link
                    href="#"
                    className="text-primary hover:underline font-medium"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="#"
                    className="text-primary hover:underline font-medium"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-shine group w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <p className="mt-6 text-center text-sm text-muted">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  Log in
                </Link>
              </p>
            </motion.div>
          )}

          {/* ─── STEP 2: OTP Verification ───────────────────────── */}
          {step === "otp" && (
            <motion.div
              key="otp"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => setStep("details")}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-slate-700 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Verify your mobile number
                </h1>
                <p className="mt-2 text-sm text-muted">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-slate-700">
                    {form.mobile || "+971 50 *** 4567"}
                  </span>
                </p>
              </div>

              {/* OTP Input */}
              <div className="mb-6">
                <OTPInput value={otp} onChange={setOtp} />
              </div>

              {/* Resend */}
              <div className="text-center mb-8">
                {resendTimer > 0 ? (
                  <p className="text-sm text-muted">
                    Resend code in{" "}
                    <span className="font-semibold text-primary">
                      {resendTimer}s
                    </span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    Resend verification code
                  </button>
                )}
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || isLoading}
                className="btn-shine group w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Why do we verify your number?
                    </p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                      Your mobile number is used to link your WhatsApp account.
                      When you send documents via WhatsApp, we auto-route them
                      to your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: WhatsApp Linking ───────────────────────── */}
          {step === "whatsapp" && (
            <motion.div
              key="whatsapp"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/10 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Link your WhatsApp
                </h1>
                <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
                  Send documents directly to our WhatsApp number and they&apos;ll
                  appear in your dashboard automatically.
                </p>
              </div>

              {/* WhatsApp number card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 mb-6">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">
                  Our WhatsApp Business Number
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-green-800 tracking-wide">
                    +971 4 XXX XXXX
                  </span>
                </div>
                <p className="text-xs text-green-600 text-center mt-3">
                  Save this number to start sending documents
                </p>
              </div>

              {/* How it works */}
              <div className="space-y-3 mb-8">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  How it works
                </p>
                {[
                  {
                    num: "1",
                    title: "Save our number",
                    desc: "Add the WhatsApp Business number to your contacts",
                  },
                  {
                    num: "2",
                    title: "Send any document",
                    desc: "Forward invoices, POs, or receipts as photos or PDFs",
                  },
                  {
                    num: "3",
                    title: "Auto-processing",
                    desc: 'We identify your account, extract data & send a confirmation: "Document received and processing"',
                  },
                ].map((item) => (
                  <div
                    key={item.num}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {item.num}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto-responses info */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800">
                      Automatic Acknowledgments
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                      When you send a document, you&apos;ll receive: <br />
                      ✓ &quot;Document received and processing&quot; <br />
                      ✓ &quot;Data extraction complete — view in dashboard&quot; <br />
                      ✓ Error alerts if document can&apos;t be read
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleLinkWhatsApp}
                  disabled={isLoading}
                  className="btn-shine group flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      Link WhatsApp & Continue
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setStep("complete")}
                className="w-full mt-3 text-center text-sm text-muted hover:text-slate-600 transition-colors"
              >
                Skip for now — I&apos;ll set this up later
              </button>
            </motion.div>
          )}

          {/* ─── STEP 4: Complete ───────────────────────────────── */}
          {step === "complete" && (
            <motion.div
              key="complete"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-success/20 to-emerald-100 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-success" />
              </motion.div>

              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                You&apos;re all set! 🎉
              </h1>
              <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
                Welcome to DocuAI, <span className="font-semibold text-slate-700">{form.fullName || "there"}</span>!
                Your account is ready. Start uploading documents to see AI magic.
              </p>

              {/* Quick summary */}
              <div className="mt-8 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-left">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Account Summary
                </p>
                <div className="space-y-3">
                  {[
                    { label: "Name", value: form.fullName || "John Doe" },
                    { label: "Company", value: form.companyName || "Acme Corp" },
                    { label: "Email", value: form.email || "john@acme.com" },
                    {
                      label: "Mobile",
                      value: form.mobile || "+971 50 123 4567",
                    },
                    { label: "WhatsApp", value: "Linked ✓" },
                    { label: "Plan", value: "Free Trial (14 days)" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-muted">{row.label}</span>
                      <span className="text-sm font-medium text-slate-800">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/dashboard"
                className="btn-shine group w-full mt-8 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AuthLayout>
  );
}
