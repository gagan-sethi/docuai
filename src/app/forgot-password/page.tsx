"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { apiUrl } from "@/lib/api";

// ─── Step indicator ─────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = [
    { label: "Email", icon: Mail },
    { label: "Verify", icon: KeyRound },
    { label: "New Password", icon: Lock },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => {
        const isActive = i === current;
        const isDone = i < current;
        return (
          <div key={step.label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${
                  isDone ? "bg-primary" : "bg-slate-200"
                }`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : isDone
                    ? "bg-success/10 text-success"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <step.icon className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── OTP Input ──────────────────────────────────────────────────
function OTPInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const newVal = value.split("");
    newVal[index] = char;
    const joined = newVal.join("").slice(0, 6);
    onChange(joined);

    if (char && index < 5) {
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
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 outline-none ${
            value[i]
              ? "border-primary bg-primary/5 text-primary"
              : "border-slate-200 bg-slate-50 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main Content ───────────────────────────────────────────────
function ForgotPasswordContent() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0: email, 1: code, 2: new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Step 1: Send reset code ──
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset code");
        setIsLoading(false);
        return;
      }

      setStep(1);
      setResendCooldown(60);
      setSuccess("A 6-digit reset code has been sent to your email.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  // ── Resend code ──
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setIsLoading(true);

    try {
      await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setResendCooldown(60);
      setSuccess("A new code has been sent to your email.");
      setCode("");
    } catch {
      setError("Failed to resend code.");
    }
    setIsLoading(false);
  };

  // ── Step 2→3: Verify code and set new password ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (step === 1) {
      // Move to password step
      if (code.length !== 6) {
        setError("Please enter the complete 6-digit code.");
        return;
      }
      setStep(2);
      setSuccess("");
      return;
    }

    // Step 3: actually reset
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        if (data.error?.includes("expired")) {
          // Go back to code step
          setStep(1);
          setCode("");
        }
        setIsLoading(false);
        return;
      }

      setStep(3); // success state
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  // Password strength
  const getPasswordStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "20%" };
    if (score <= 2) return { label: "Fair", color: "bg-amber-500", width: "40%" };
    if (score <= 3) return { label: "Good", color: "bg-blue-500", width: "60%" };
    if (score <= 4) return { label: "Strong", color: "bg-green-500", width: "80%" };
    return { label: "Very Strong", color: "bg-emerald-500", width: "100%" };
  };

  const strength = getPasswordStrength(newPassword);

  // ── Step 3: Success ──
  if (step === 3) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              Docu<span className="gradient-text">AI</span>
            </span>
          </div>

          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-success/10 to-emerald-50 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <ShieldCheck className="w-10 h-10 text-success" />
            </motion.div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Password Reset Successfully!
          </h1>
          <p className="text-sm text-muted mb-8 max-w-sm mx-auto">
            Your password has been updated. You can now log in with your new
            password.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
            <Sparkles className="w-3.5 h-3.5" />
            Secured by DocuAI
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            Docu<span className="gradient-text">AI</span>
          </span>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} />

        {/* Header */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            {step === 0 && (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Forgot your password?
                </h1>
                <p className="mt-2 text-sm text-muted">
                  No worries — enter your email and we&apos;ll send you a reset
                  code.
                </p>
              </>
            )}
            {step === 1 && (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Check your email
                </h1>
                <p className="mt-2 text-sm text-muted">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-slate-700">{email}</span>.
                  Enter it below.
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Set a new password
                </h1>
                <p className="mt-2 text-sm text-muted">
                  Create a strong password for your account. Minimum 8
                  characters.
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error / Success messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 p-3 mb-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 p-3 mb-5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Step 0: Email ── */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.form
              key="email-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSendCode}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="btn-shine group w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <>
                    Send Reset Code
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* ── Step 1: Enter Code ── */}
          {step === 1 && (
            <motion.form
              key="code-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleResetPassword}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                  Enter the 6-digit code
                </label>
                <OTPInput value={code} onChange={(val) => { setCode(val); setError(""); }} />
              </div>

              {/* Resend */}
              <div className="text-center">
                <p className="text-xs text-muted">
                  Didn&apos;t receive the code?{" "}
                  {resendCooldown > 0 ? (
                    <span className="text-slate-400">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isLoading}
                      className="font-semibold text-primary hover:text-primary-dark transition-colors"
                    >
                      Resend Code
                    </button>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(0); setError(""); setSuccess(""); }}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="btn-shine group flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* ── Step 2: New Password ── */}
          {step === 2 && (
            <motion.form
              key="password-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleResetPassword}
              className="space-y-5"
            >
              {/* New password */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    placeholder="At least 8 characters"
                    className="w-full pl-11 pr-11 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>

                {/* Strength meter */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: strength.width }}
                        className={`h-full rounded-full ${strength.color}`}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-[11px] text-muted mt-1">
                      Password strength:{" "}
                      <span className="font-semibold">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    placeholder="Confirm your password"
                    className={`w-full pl-11 pr-11 py-3 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400 ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-300 focus:border-red-400"
                        : confirmPassword && confirmPassword === newPassword
                          ? "border-green-300 focus:border-green-400"
                          : "border-slate-200 focus:border-primary"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="text-[11px] text-success mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Passwords do not match
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword ||
                    newPassword.length < 8
                  }
                  className="btn-shine group flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <>
                      Reset Password
                      <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Back to login link */}
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

// ─── Fallback ───────────────────────────────────────────────────
function ForgotPasswordFallback() {
  return (
    <AuthLayout>
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordFallback />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
