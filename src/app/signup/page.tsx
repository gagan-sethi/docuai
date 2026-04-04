"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
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
  FileText,
  Loader2,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  PartyPopper,
  Check,
  AlertCircle,
  MailCheck,
  ShieldCheck,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { apiUrl } from "@/lib/api";

type Step = "details" | "verify-email" | "verify-otp" | "whatsapp" | "complete";
type AccountRole = "business" | "accounting";

interface SignupForm {
  fullName: string;
  companyName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  role: AccountRole;
}

// Demo OTP — shown on screen for demo purposes
const DEMO_OTP = "123456";

// ─── Step Indicator ─────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = [
    { key: "details", label: "Account" },
    { key: "verify-email", label: "Email" },
    { key: "verify-otp", label: "Phone" },
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

// ─── OTP Input Component ────────────────────────────────────────
function OTPInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const newVal = value.split("");
    newVal[index] = char;
    const joined = newVal.join("").slice(0, length);
    onChange(joined);
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasteData);
    const focusIndex = Math.min(pasteData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2.5">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none ${
            value[i]
              ? "border-primary bg-primary/5 text-primary shadow-md shadow-primary/10"
              : "border-slate-200 bg-slate-50 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main Signup Page ───────────────────────────────────────────
function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("details");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(30);
  const [whatsAppLinked, setWhatsAppLinked] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [form, setForm] = useState<SignupForm>({
    fullName: "",
    companyName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    role: "business",
  });

  const updateField = (field: keyof SignupForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Handle return from email verification link ──
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "success") {
      setEmailVerified(true);
      setStep("verify-otp");
      setOtpCountdown(30);
    } else if (verified === "error") {
      setStep("verify-email");
    }
  }, [searchParams]);

  // ── Poll email verification status while on verify-email step ──
  useEffect(() => {
    if (step !== "verify-email" || emailVerified) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(apiUrl(`/api/auth/email-status?email=${encodeURIComponent(form.email)}`), { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.verified) {
            setEmailVerified(true);
            // Auto-advance after a short success animation
            setTimeout(() => {
              setOtpCountdown(30);
              setStep("verify-otp");
            }, 1500);
            clearInterval(interval);
          }
        }
      } catch { /* ignore polling errors */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, emailVerified]);

  // OTP countdown timer
  useEffect(() => {
    if (step !== "verify-otp") return;
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, otpCountdown]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: form.fullName,
          companyName: form.companyName,
          email: form.email,
          mobile: form.mobile,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setStep("verify-email");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = useCallback(async () => {
    setOtpError("");
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ otp: otpValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "Invalid OTP");
        setIsLoading(false);
        return;
      }

      setOtpVerified(true);
      setIsLoading(false);

      // Auto-advance after success animation
      setTimeout(() => {
        setStep("whatsapp");
      }, 1500);
    } catch {
      setOtpError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }, [otpValue]);

  const handleResendOtp = () => {
    setOtpCountdown(30);
    setOtpValue("");
    setOtpError("");
  };

  const handleLinkWhatsApp = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/link-whatsapp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (res.ok) {
        setWhatsAppLinked(true);
      }

      setIsLoading(false);
      setTimeout(() => {
        setStep("complete");
      }, 1200);
    } catch {
      setIsLoading(false);
      setStep("complete");
    }
  }, []);

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
                  Start with your free plan. No credit card needed.
                </p>
              </div>

              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    {
                      value: "business" as AccountRole,
                      label: "Business",
                      desc: "Process my own documents",
                      icon: Building2,
                    },
                    {
                      value: "accounting" as AccountRole,
                      label: "Accounting Firm",
                      desc: "Process for multiple clients",
                      icon: FileText,
                    },
                  ]).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, role: option.value }))}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                        form.role === option.value
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      {form.role === option.value && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        form.role === option.value
                          ? "bg-primary/10 text-primary"
                          : "bg-slate-100 text-slate-400"
                      }`}>
                        <option.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold transition-colors ${
                          form.role === option.value ? "text-primary" : "text-slate-700"
                        }`}>{option.label}</p>
                        <p className="text-[10px] text-muted mt-0.5">{option.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

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
                      (for OTP &amp; WhatsApp)
                    </span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={form.mobile}
                      onChange={(e) => updateField("mobile", e.target.value)}
                      placeholder="+91 98765 43210"
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
                      {[1, 2, 3, 4].map((level) => {
                        const strength =
                          form.password.length >= 12 && /[A-Z]/.test(form.password) && /\d/.test(form.password)
                            ? 4
                            : form.password.length >= 10
                            ? 3
                            : form.password.length >= 8
                            ? 2
                            : form.password.length >= 4
                            ? 1
                            : 0;
                        return (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              level <= strength
                                ? strength <= 1
                                  ? "bg-red-400"
                                  : strength <= 2
                                  ? "bg-orange-400"
                                  : "bg-success"
                                : "bg-slate-200"
                            }`}
                          />
                        );
                      })}
                      <span className="text-[10px] font-medium text-muted ml-1">
                        {form.password.length < 4
                          ? "Too short"
                          : form.password.length < 8
                          ? "Weak"
                          : form.password.length < 10
                          ? "Good"
                          : "Strong"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={form.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                    />
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
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

          {/* ─── STEP 2: Email Verification Sent ────────────────── */}
          {step === "verify-email" && (
            <motion.div
              key="verify-email"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  emailVerified
                    ? "bg-gradient-to-br from-success/20 to-emerald-100"
                    : "bg-gradient-to-br from-primary/10 to-secondary/10"
                }`}>
                  {emailVerified ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </motion.div>
                  ) : (
                    <MailCheck className="w-8 h-8 text-primary" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {emailVerified ? "Email verified!" : "Check your email"}
                </h1>
                <p className="mt-2 text-sm text-muted">
                  {emailVerified ? (
                    <span className="text-success font-medium">Your email has been verified. Moving to phone verification...</span>
                  ) : (
                    <>
                      We sent a verification link to{" "}
                      <span className="font-semibold text-slate-700">
                        {form.email}
                      </span>
                    </>
                  )}
                </p>
              </div>

              {!emailVerified && (
                <>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 mb-6">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-blue-800">
                          Verify your email address
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                          Click the link in the email we sent you to verify your account.
                          The link expires in 24 hours. Check your spam folder if you
                          don&apos;t see it.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Waiting indicator */}
                  <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted">Waiting for email verification...</span>
                  </div>

                  {/* Continue to Phone OTP — skip email verification */}
                  <button
                    onClick={() => {
                      setOtpCountdown(30);
                      setStep("verify-otp");
                    }}
                    className="btn-shine group w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    Continue to Phone Verification
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => setStep("complete")}
                    className="w-full mt-3 text-center text-sm text-muted hover:text-slate-600 transition-colors"
                  >
                    Skip — I&apos;ll verify later
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ─── STEP 3: Phone OTP Verification ─────────────────── */}
          {step === "verify-otp" && (
            <motion.div
              key="verify-otp"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Verify your phone
                </h1>
                <p className="mt-2 text-sm text-muted">
                  Enter the OTP sent to{" "}
                  <span className="font-semibold text-slate-700">
                    {form.mobile || "+91 XXXXX XXXXX"}
                  </span>
                </p>
              </div>

              {/* Demo OTP Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                      Demo Mode
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      In production, a real OTP will be sent via SMS. For demo, use this OTP:
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {DEMO_OTP.split("").map((digit, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center justify-center w-8 h-10 text-lg font-bold text-amber-800 bg-white border-2 border-amber-300 rounded-lg shadow-sm"
                          >
                            {digit}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpValue(DEMO_OTP)}
                        className="px-3 py-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors"
                      >
                        Auto-fill
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* OTP Input */}
              {otpVerified ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3 py-6"
                >
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <p className="text-sm font-semibold text-success">Phone verified successfully!</p>
                  <p className="text-xs text-muted">Redirecting to WhatsApp setup...</p>
                </motion.div>
              ) : (
                <>
                  <div className="mb-6">
                    <OTPInput value={otpValue} onChange={setOtpValue} />
                  </div>

                  {/* OTP Error */}
                  {otpError && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl mb-4">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {otpError}
                    </div>
                  )}

                  {/* Verify Button */}
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otpValue.length < 6}
                    className="btn-shine group w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify OTP
                      </>
                    )}
                  </button>

                  {/* Resend OTP */}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {otpCountdown > 0 ? (
                      <p className="text-xs text-muted">
                        Resend OTP in <span className="font-semibold text-primary">{otpCountdown}s</span>
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setStep("whatsapp")}
                    className="w-full mt-3 text-center text-sm text-muted hover:text-slate-600 transition-colors"
                  >
                    Skip — I&apos;ll verify later
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ─── STEP 4: WhatsApp Linking ───────────────────────── */}
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
                    +91 XXXXX XXXXX
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
                      When you send a document, you&apos;ll receive:
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {[
                        "\"Document received and processing\"",
                        "\"Data extraction complete — view in dashboard\"",
                        "Error alerts if document can't be read",
                      ].map((text) => (
                        <li key={text} className="flex items-center gap-1.5 text-xs text-blue-600">
                          <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {whatsAppLinked ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-sm font-medium text-green-700">WhatsApp linked successfully!</p>
                  <button
                    onClick={() => setStep("complete")}
                    className="btn-shine group w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ) : (
                <>
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
                </>
              )}
            </motion.div>
          )}

          {/* ─── STEP 5: Complete ───────────────────────────────── */}
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

              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
                You&apos;re all set!
                <PartyPopper className="w-6 h-6 text-amber-500" />
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
                    { label: "Name", value: form.fullName || "—" },
                    { label: "Company", value: form.companyName || "—" },
                    { label: "Account Type", value: form.role === "accounting" ? "Accounting Firm" : "Business" },
                    { label: "Email", value: form.email || "—", verified: true },
                    {
                      label: "Mobile",
                      value: form.mobile || "—",
                      verified: otpVerified,
                    },
                    { label: "WhatsApp", value: whatsAppLinked ? "Linked" : "Not linked", verified: whatsAppLinked },
                    { label: "Plan", value: "Free (5 docs/month)" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-muted">{row.label}</span>
                      <span className="text-sm font-medium text-slate-800 flex items-center gap-1">
                        {row.value}
                        {"verified" in row && row.verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        )}
                        {"verified" in row && !row.verified && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">Skipped</span>
                        )}
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

export default function SignupPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
