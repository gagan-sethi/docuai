"use client";

/**
 * Public team-invite acceptance page.
 *
 * Backed by the public endpoints on `/api/team/accept/:token`:
 *   GET   → preview the invite (workspace + role + email)
 *   POST  → accept it; creates a new account if none exists, otherwise
 *           attaches the existing account to the workspace.
 *
 * Flow:
 *   1. Read `?token=…` from the URL.
 *   2. Fetch the preview. Render a friendly state for invalid / expired
 *      links.
 *   3. Show a single form: full name + password (only required when
 *      we don't yet have an account for this email — the API handles
 *      both cases, but we always collect them so existing users can
 *      ignore the password field).
 *   4. On success, the API sets the auth cookie; redirect to /dashboard.
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Crown,
  Shield,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
} from "lucide-react";
import { apiUrl } from "@/lib/api";

interface InvitePreview {
  email: string;
  role: "admin" | "member";
  expiresAt: string;
  workspace: { name: string; ownerName: string };
}

function AcceptInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  // ── Load preview ─────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setErrorMsg("This invite link is missing a token.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/team/accept/${encodeURIComponent(token)}`), {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data?.error || "Invitation not found.");
          setErrorCode(res.status);
          return;
        }
        setPreview(data);
      } catch {
        setErrorMsg("We couldn't reach the server. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // ── Submit accept ────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    if (!fullName.trim()) {
      setSubmitErr("Please enter your full name.");
      return;
    }
    if (password && password.length < 8) {
      setSubmitErr("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/team/accept/${encodeURIComponent(token)}`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          ...(password ? { password } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitErr(data?.error || "We couldn't accept this invitation.");
        return;
      }
      setAccepted(true);
      // Redirect into the dashboard once the cookie is set.
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch {
      setSubmitErr("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading shell ────────────────────────────────────────────
  if (loading) {
    return (
      <Shell>
        <div className="text-center py-16">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-4">Verifying invitation…</p>
        </div>
      </Shell>
    );
  }

  // ── Error / expired state ────────────────────────────────────
  if (errorMsg || !preview) {
    const expired = errorCode === 410;
    return (
      <Shell>
        <div className="text-center py-12">
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              expired ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
            }`}
          >
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-4">
            {expired ? "This invitation has expired" : "Invitation not valid"}
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            {errorMsg ||
              "This invite link is no longer valid. Ask the workspace owner to send you a new one."}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-sm hover:shadow-md"
          >
            Go to sign in
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Shell>
    );
  }

  // ── Success state ────────────────────────────────────────────
  if (accepted) {
    return (
      <Shell>
        <div className="text-center py-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center"
          >
            <CheckCircle2 className="w-7 h-7" />
          </motion.div>
          <h1 className="text-xl font-bold text-slate-900 mt-4">
            Welcome to {preview.workspace.name}!
          </h1>
          <p className="text-sm text-slate-500 mt-2">Taking you to the dashboard…</p>
          <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto mt-4" />
        </div>
      </Shell>
    );
  }

  // ── Accept form ──────────────────────────────────────────────
  const RoleIcon = preview.role === "admin" ? Shield : UserIcon;

  return (
    <Shell>
      {/* Workspace pill */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 mb-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/30 flex items-center justify-center">
          <Users className="w-7 h-7" />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> You&rsquo;re invited
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Join {preview.workspace.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            <strong className="text-slate-700">{preview.workspace.ownerName}</strong> invited
            you to collaborate on DocuAI.
          </p>
        </div>
      </motion.div>

      {/* Invite metadata */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <Mail className="w-4 h-4 text-slate-400" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Email
            </p>
            <p className="text-xs font-semibold text-slate-700 truncate">{preview.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <RoleIcon
            className={`w-4 h-4 ${
              preview.role === "admin" ? "text-indigo-500" : "text-slate-500"
            }`}
          />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</p>
            <p className="text-xs font-semibold text-slate-700 capitalize">{preview.role}</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="acceptName" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Full name
          </label>
          <input
            id="acceptName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoFocus
            placeholder="Your name"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
        </div>

        <div>
          <label htmlFor="acceptPwd" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Password
            <span className="text-[10px] text-slate-400 font-normal ml-1">
              (only needed if this is your first DocuAI account)
            </span>
          </label>
          <input
            id="acceptPwd"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
        </div>

        {submitErr && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {submitErr}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-sm hover:shadow-md disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Crown className="w-4 h-4 text-amber-300" />
              Accept &amp; join workspace
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-slate-400">
          By accepting you agree to share your usage with this workspace owner.
        </p>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-7 sm:p-9"
      >
        {children}
      </motion.div>
    </div>
  );
}

export default function TeamAcceptPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="text-center py-16">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          </div>
        </Shell>
      }
    >
      <AcceptInner />
    </Suspense>
  );
}
