"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Copy,
  CheckCircle2,
  Users,
  Tag,
  BadgePercent,
  Loader2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Mail,
  Building2,
  Sparkles,
  Share2,
  Link2,
  MessageCircle,
  Award,
  UserPlus,
  Clock,
  ChevronDown,
  X,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiUrl } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────
interface ReferralCode {
  _id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usageCount: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

interface ReferredUser {
  _id: string;
  fullName: string;
  email: string;
  companyName?: string;
  plan: string;
  appliedPromoCode?: string;
  promoDiscountPercent?: number;
  isEmailVerified: boolean;
  createdAt: string;
}

interface ReferralStats {
  totalCodes: number;
  activeCodes: number;
  totalReferrals: number;
  totalRedemptions: number;
}

// ─── Share Menu ─────────────────────────────────────────────────
function ShareMenu({
  code,
  signupUrl,
  onClose,
}: {
  code: string;
  signupUrl: string;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareMessage = `Hey! Sign up for DocuAI using my referral link and get a discount on your plan: ${signupUrl}`;

  const shareOptions = [
    {
      id: "link",
      label: "Copy Referral Link",
      icon: Link2,
      onClick: () => handleCopy(signupUrl, "link"),
      color: "text-primary",
      bg: "bg-primary/5 hover:bg-primary/10",
    },
    {
      id: "code",
      label: "Copy Referral Code",
      icon: Copy,
      onClick: () => handleCopy(code, "code"),
      color: "text-indigo-600",
      bg: "bg-indigo-50 hover:bg-indigo-100",
    },
    {
      id: "whatsapp",
      label: "Share via WhatsApp",
      icon: MessageCircle,
      onClick: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
        onClose();
      },
      color: "text-green-600",
      bg: "bg-green-50 hover:bg-green-100",
    },
    {
      id: "email",
      label: "Share via Email",
      icon: Mail,
      onClick: () => {
        window.open(
          `mailto:?subject=${encodeURIComponent("Join DocuAI with my referral!")}&body=${encodeURIComponent(shareMessage)}`,
          "_blank"
        );
        onClose();
      },
      color: "text-amber-600",
      bg: "bg-amber-50 hover:bg-amber-100",
    },
  ];

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800">Share Your Referral</p>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      <div className="p-2">
        {shareOptions.map((option) => (
          <button
            key={option.id}
            onClick={option.onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${option.bg}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${option.bg}`}>
              <option.icon className={`w-4 h-4 ${option.color}`} />
            </div>
            <span className="text-sm font-medium text-slate-700 flex-1 text-left">{option.label}</span>
            {copied === option.id && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full"
              >
                Copied!
              </motion.span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
    >
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-muted font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Plan Badge ─────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    free: { bg: "bg-slate-100", text: "text-slate-600" },
    starter: { bg: "bg-blue-50", text: "text-blue-700" },
    professional: { bg: "bg-purple-50", text: "text-purple-700" },
    enterprise: { bg: "bg-amber-50", text: "text-amber-700" },
  };
  const c = config[plan] || config.free;
  return (
    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize ${c.bg} ${c.text}`}>
      {plan}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
export default function ReferralsPage() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalCodes: 0,
    activeCodes: 0,
    totalReferrals: 0,
    totalRedemptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // The primary (auto-generated) referral code
  const primaryCode = codes.find((c) => c.isActive) || codes[0];

  // Build signup URL with referral code
  const signupUrl = primaryCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${primaryCode.code}`
    : "";

  // ── Fetch referrals data ──
  const fetchReferrals = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/referrals"), {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 403) {
          setError("access_denied");
        } else {
          setError("Failed to load referrals");
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCodes(data.codes || []);
      setReferredUsers(data.referredUsers || []);
      setStats(data.stats || { totalCodes: 0, activeCodes: 0, totalReferrals: 0, totalRedemptions: 0 });
    } catch {
      setError("Failed to load referrals");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // ── Copy code to clipboard ──
  const handleCopyCode = () => {
    if (!primaryCode) return;
    navigator.clipboard.writeText(primaryCode.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ── Access denied state ──
  if (error === "access_denied") {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <Sidebar />
        <main className="ml-[260px] p-6">
          <TopBar title="Referrals" />
          <div className="max-w-2xl mx-auto mt-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
            <p className="text-sm text-muted max-w-md mx-auto">
              The referral program is available for accounting firm accounts only.
              If you believe this is an error, contact support.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="ml-[260px] p-6">
        <TopBar title="Referrals" />

        <div className="max-w-6xl mx-auto mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          ) : (
            <>
              {/* ─── Hero: Your Referral Code ─── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary to-purple-600 rounded-3xl p-8 mb-8 text-white"
              >
                {/* Background decorations */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="absolute top-6 right-24 w-2 h-2 bg-white/30 rounded-full" />
                <div className="absolute top-16 right-16 w-1.5 h-1.5 bg-white/20 rounded-full" />
                <div className="absolute bottom-8 left-32 w-2.5 h-2.5 bg-white/20 rounded-full" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Left: Code + info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Your Referral Code</p>
                        <p className="text-[11px] text-white/50">
                          Share with your clients to give them a discount
                        </p>
                      </div>
                    </div>

                    {primaryCode ? (
                      <div className="flex items-center gap-4 mt-4">
                        <button
                          onClick={handleCopyCode}
                          className="group flex items-center gap-3 px-6 py-3.5 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/25 transition-all"
                        >
                          <span className="text-2xl font-black font-mono tracking-[0.2em]">
                            {primaryCode.code}
                          </span>
                          {copiedCode ? (
                            <CheckCircle2 className="w-5 h-5 text-green-300" />
                          ) : (
                            <Copy className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                          )}
                        </button>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full">
                          <BadgePercent className="w-4 h-4" />
                          <span className="text-sm font-bold">{primaryCode.discountPercent}% off</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-white/60 mt-4">No referral code found. Contact support.</p>
                    )}

                    {/* Referral link preview */}
                    {signupUrl && (
                      <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl max-w-lg">
                        <Link2 className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                        <span className="text-xs text-white/60 truncate font-mono">{signupUrl}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Share button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowShare(!showShare)}
                      className="flex items-center gap-2.5 px-6 py-3.5 bg-white text-primary font-bold rounded-2xl shadow-lg shadow-black/10 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                      Share with Clients
                      <ChevronDown className={`w-4 h-4 transition-transform ${showShare ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {showShare && primaryCode && (
                        <ShareMenu
                          code={primaryCode.code}
                          signupUrl={signupUrl}
                          onClose={() => setShowShare(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Quick summary */}
                <div className="relative z-10 mt-6 pt-6 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Clients Signed Up", value: stats.totalReferrals.toString(), icon: UserPlus },
                    { label: "Code Uses", value: stats.totalRedemptions.toString(), icon: TrendingUp },
                    { label: "Discount Given", value: `${primaryCode?.discountPercent || 10}%`, icon: BadgePercent },
                    { label: "Active Since", value: primaryCode ? new Date(primaryCode.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—", icon: Calendar },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-white/70" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{item.value}</p>
                        <p className="text-[10px] text-white/50 font-medium">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ─── Stats Cards ─── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Signups" value={stats.totalReferrals} icon={UserPlus} gradient="from-primary to-indigo-500" delay={0.05} />
                <StatCard label="Code Uses" value={stats.totalRedemptions} icon={TrendingUp} gradient="from-success to-emerald-500" delay={0.1} />
                <StatCard label="Active Codes" value={stats.activeCodes} icon={Tag} gradient="from-secondary to-cyan-500" delay={0.15} />
                <StatCard label="This Month" value={referredUsers.filter((u) => { const d = new Date(u.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length} icon={Calendar} gradient="from-amber-500 to-orange-500" delay={0.2} />
              </div>

              {/* ─── Referred Clients Table ─── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary/10 to-cyan-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Referred Clients</h2>
                      <p className="text-[11px] text-muted">Businesses that signed up using your referral code</p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 rounded-full">
                    {referredUsers.length} client{referredUsers.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {referredUsers.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                      <Users className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-base font-semibold text-slate-600 mb-1.5">No referred clients yet</p>
                    <p className="text-sm text-muted max-w-md mx-auto mb-6 leading-relaxed">
                      Share your referral code or link with your clients. When they sign up
                      using your code, they&#39;ll appear here with their details.
                    </p>
                    <button
                      onClick={() => setShowShare(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Your Referral Code
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed Up</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {referredUsers.map((u, i) => (
                          <motion.tr
                            key={u._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs font-bold text-primary">
                                  {u.fullName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{u.fullName}</p>
                                  <p className="text-xs text-muted flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {u.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-slate-600 flex items-center gap-1.5">
                                {u.companyName ? (
                                  <>
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                    {u.companyName}
                                  </>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <PlanBadge plan={u.plan} />
                            </td>
                            <td className="px-4 py-4 text-center">
                              {u.promoDiscountPercent ? (
                                <span className="px-2.5 py-1 text-[11px] font-bold text-success bg-success/5 rounded-lg">
                                  {u.promoDiscountPercent}% off
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {u.isEmailVerified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-success bg-success/5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-600 bg-amber-50 rounded-full">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="text-xs text-muted flex items-center justify-end gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(u.createdAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>

              {/* ─── How It Works ─── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100 p-8"
              >
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-indigo-800">How Referrals Work</h3>
                    <p className="text-[11px] text-indigo-500">Grow your network and earn rewards</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      step: "1",
                      title: "Share Your Code",
                      desc: "Use the share button above to send your referral link or code to clients via WhatsApp, email, or just copy it.",
                      icon: Share2,
                      color: "bg-blue-100 text-blue-700",
                    },
                    {
                      step: "2",
                      title: "Client Signs Up",
                      desc: "When a client opens your link, the referral code is auto-applied. They get a discount on their plan.",
                      icon: UserPlus,
                      color: "bg-green-100 text-green-700",
                    },
                    {
                      step: "3",
                      title: "Track & Earn",
                      desc: "See all your referred clients here — their plan, status, and signup date. Rewards will be available soon!",
                      icon: Award,
                      color: "bg-purple-100 text-purple-700",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex flex-col items-start gap-3 p-4 bg-white/60 rounded-xl border border-white/80">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-indigo-700">{item.step}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-indigo-800">{item.title}</p>
                        <p className="text-xs text-indigo-600 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
