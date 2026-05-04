"use client";

/**
 * Account settings.
 *
 * Sections (in order of importance):
 *   1. Profile          – PATCH /api/auth/me  (fullName, companyName, mobile)
 *   2. Email            – POST  /api/auth/update-email  (re-triggers verification)
 *   3. Password         – POST  /api/auth/forgot-password  (sends reset link)
 *   4. Preferences      – GET/PATCH /api/user/preferences  (WhatsApp auto-merge)
 *   5. Account & Sign-out
 *
 * The page is intentionally one column with section cards so that
 * both desktop and mobile feel calm — settings are a low-frequency,
 * focused task, not a dashboard.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Mail,
  Lock,
  MessageSquare,
  ShieldCheck,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Phone,
  Building2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiUrl } from "@/lib/api";

interface MeUser {
  _id?: string;
  fullName?: string;
  email?: string;
  companyName?: string;
  mobile?: string;
  role?: string;
  plan?: string;
  isEmailVerified?: boolean;
  isWhatsAppLinked?: boolean;
}

interface Preferences {
  whatsappAutoMerge: boolean;
  whatsappAutoMergeWindowSec: number;
}

type Toast = { type: "success" | "error"; message: string } | null;

export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, prefRes] = await Promise.all([
          fetch(apiUrl("/api/auth/me"), { credentials: "include" }),
          fetch(apiUrl("/api/user/preferences"), { credentials: "include" }),
        ]);
        if (meRes.status === 401) {
          router.replace("/login");
          return;
        }
        const meData = meRes.ok ? await meRes.json() : null;
        const prefData = prefRes.ok ? await prefRes.json() : null;
        if (!cancelled) {
          setMe(meData?.user ?? null);
          setPrefs(
            prefData?.preferences ?? {
              whatsappAutoMerge: false,
              whatsappAutoMergeWindowSec: 120,
            }
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (t: NonNullable<Toast>) => setToast(t);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="ml-[260px] p-6">
        <TopBar title="Settings" />

        <div className="max-w-3xl mx-auto mt-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-md shadow-primary/20">
                <SettingsIcon className="w-5 h-5" />
              </span>
              Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your profile, security, and processing preferences.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-5">
              <ProfileSection me={me} onSaved={(u) => { setMe(u); showToast({ type: "success", message: "Profile updated" }); }} onError={(m) => showToast({ type: "error", message: m })} />
              <EmailSection me={me} onUpdated={(email) => { setMe((prev) => prev ? { ...prev, email, isEmailVerified: false } : prev); showToast({ type: "success", message: "Verification email sent" }); }} onError={(m) => showToast({ type: "error", message: m })} />
              <PasswordSection email={me?.email} onSent={() => showToast({ type: "success", message: "Password reset link sent" })} onError={(m) => showToast({ type: "error", message: m })} />
              <PreferencesSection prefs={prefs} onSaved={(p) => { setPrefs(p); showToast({ type: "success", message: "Preferences saved" }); }} onError={(m) => showToast({ type: "error", message: m })} />
              <AccountSection me={me} />
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ring-1 ring-inset text-sm font-semibold ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-red-50 text-red-700 ring-red-600/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.message}
        </motion.div>
      )}
    </div>
  );
}

// ─── Section shell ──────────────────────────────────────────────
function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </motion.section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── 1. Profile ────────────────────────────────────────────────
function ProfileSection({
  me,
  onSaved,
  onError,
}: {
  me: MeUser | null;
  onSaved: (u: MeUser) => void;
  onError: (m: string) => void;
}) {
  const [fullName, setFullName] = useState(me?.fullName ?? "");
  const [companyName, setCompanyName] = useState(me?.companyName ?? "");
  const [mobile, setMobile] = useState(me?.mobile ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(me?.fullName ?? "");
    setCompanyName(me?.companyName ?? "");
    setMobile(me?.mobile ?? "");
  }, [me]);

  const dirty =
    fullName !== (me?.fullName ?? "") ||
    companyName !== (me?.companyName ?? "") ||
    mobile !== (me?.mobile ?? "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/auth/me"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, companyName, mobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save profile");
      onSaved(data.user);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      icon={<User className="w-4 h-4" />}
      title="Profile"
      description="How you appear inside DocuAI and on extracted invoice exports."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" htmlFor="fullName">
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              placeholder="Your name"
              maxLength={100}
            />
          </Field>
          <Field label="Company" htmlFor="companyName">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="Acme Trading LLC"
                maxLength={200}
              />
            </div>
          </Field>
        </div>
        <Field label="Mobile" htmlFor="mobile" hint="Used for WhatsApp linking — include country code, e.g. +971…">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              placeholder="+971 50 123 4567"
            />
          </div>
        </Field>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save changes
          </button>
        </div>
      </form>
    </Section>
  );
}

// ─── 2. Email ──────────────────────────────────────────────────
function EmailSection({
  me,
  onUpdated,
  onError,
}: {
  me: MeUser | null;
  onUpdated: (newEmail: string) => void;
  onError: (m: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || trimmed === (me?.email ?? "").toLowerCase()) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/auth/update-email"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update email");
      onUpdated(trimmed);
      setEditing(false);
      setNewEmail("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update email");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      icon={<Mail className="w-4 h-4" />}
      title="Email"
      description="Used for sign-in, notifications, and invoice receipts."
    >
      {!editing ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 break-all">{me?.email || "—"}</p>
            <p className="text-xs mt-1">
              {me?.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                  <AlertCircle className="w-3 h-3" /> Not verified yet
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            Change email
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="New email"
            htmlFor="newEmail"
            hint="We'll send a verification link to your new address. You'll stay signed in."
          >
            <input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              autoFocus
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              placeholder="you@company.com"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setEditing(false); setNewEmail(""); }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !newEmail.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Update email
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}

// ─── 3. Password ───────────────────────────────────────────────
function PasswordSection({
  email,
  onSent,
  onError,
}: {
  email?: string;
  onSent: () => void;
  onError: (m: string) => void;
}) {
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!email) return;
    setSending(true);
    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send reset link");
      onSent();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setSending(false);
    }
  };

  return (
    <Section
      icon={<Lock className="w-4 h-4" />}
      title="Password"
      description="For your security, password changes happen through a verified email link."
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-slate-500 max-w-md">
          We&apos;ll email <strong className="text-slate-700">{email || "your address"}</strong> a single-use link.
          The link expires in 1 hour.
        </p>
        <button
          onClick={send}
          disabled={sending || !email}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 transition"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
          Send reset link
        </button>
      </div>
    </Section>
  );
}

// ─── 4. Preferences ────────────────────────────────────────────
function PreferencesSection({
  prefs,
  onSaved,
  onError,
}: {
  prefs: Preferences | null;
  onSaved: (p: Preferences) => void;
  onError: (m: string) => void;
}) {
  const [enabled, setEnabled] = useState(prefs?.whatsappAutoMerge ?? false);
  const [windowSec, setWindowSec] = useState(prefs?.whatsappAutoMergeWindowSec ?? 120);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefs) {
      setEnabled(prefs.whatsappAutoMerge);
      setWindowSec(prefs.whatsappAutoMergeWindowSec);
    }
  }, [prefs]);

  const dirty =
    enabled !== (prefs?.whatsappAutoMerge ?? false) ||
    windowSec !== (prefs?.whatsappAutoMergeWindowSec ?? 120);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/user/preferences"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappAutoMerge: enabled,
          whatsappAutoMergeWindowSec: windowSec,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save preferences");
      onSaved(data.preferences);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const formatWindow = (s: number) => {
    if (s < 60) return `${s} seconds`;
    if (s < 3600) {
      const m = Math.floor(s / 60);
      const r = s % 60;
      return r ? `${m} min ${r} s` : `${m} minute${m > 1 ? "s" : ""}`;
    }
    return `${(s / 3600).toFixed(1)} hours`;
  };

  return (
    <Section
      icon={<MessageSquare className="w-4 h-4" />}
      title="WhatsApp Processing"
      description="Control how documents arriving via WhatsApp are bundled and merged."
    >
      <div className="space-y-5">
        {/* Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Auto-merge bursts</p>
            <p className="text-xs text-slate-500 mt-0.5 max-w-md">
              When enabled, multiple files received within the burst window are
              automatically combined into a single audit-ready CSV.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
              enabled ? "bg-primary" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Slider */}
        <div className={`transition-opacity ${enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="windowSec" className="text-xs font-semibold text-slate-700">
              Burst window
            </label>
            <span className="text-xs font-bold text-primary tabular-nums">
              {formatWindow(windowSec)}
            </span>
          </div>
          <input
            id="windowSec"
            type="range"
            min={10}
            max={1800}
            step={10}
            value={windowSec}
            onChange={(e) => setWindowSec(Number(e.target.value))}
            disabled={!enabled}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>10s</span>
            <span>5 min</span>
            <span>30 min</span>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save preferences
          </button>
        </div>
      </div>
    </Section>
  );
}

// ─── 5. Account ────────────────────────────────────────────────
function AccountSection({ me }: { me: MeUser | null }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
    }
  };

  return (
    <Section
      icon={<ShieldCheck className="w-4 h-4" />}
      title="Account"
      description="Plan, role, and session management."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <InfoTile label="Current plan" value={(me?.plan || "free").replace(/^./, (c) => c.toUpperCase())} />
        <InfoTile label="Role" value={me?.role ? me.role.charAt(0).toUpperCase() + me.role.slice(1) : "—"} />
        <InfoTile
          label="WhatsApp"
          value={me?.isWhatsAppLinked ? "Linked" : "Not linked"}
          tone={me?.isWhatsAppLinked ? "success" : "muted"}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center justify-between gap-2 px-4 py-3 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Manage billing & invoices
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="inline-flex items-center justify-between gap-2 px-4 py-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 disabled:opacity-50 transition"
        >
          <span className="inline-flex items-center gap-2">
            {signingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            Sign out
          </span>
        </button>
      </div>
    </Section>
  );
}

function InfoTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "muted";
}) {
  const cls =
    tone === "success"
      ? "text-emerald-700"
      : tone === "muted"
        ? "text-slate-500"
        : "text-slate-800";
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${cls}`}>{value}</p>
    </div>
  );
}
