"use client";

/**
 * Team / workspace management.
 *
 * Backed by the new `/api/team` router:
 *   GET    /api/team
 *   POST   /api/team/invite
 *   POST   /api/team/invite/:id/resend
 *   DELETE /api/team/invite/:id
 *   PATCH  /api/team/member/:userId
 *   DELETE /api/team/member/:userId
 *
 * Layout:
 *   1. Seat-usage hero (owner-only) with "Invite teammate" CTA
 *   2. Active members table (owner + members, with row actions)
 *   3. Pending invitations table (resend / revoke)
 *   4. Read-only state for non-owners
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  User as UserIcon,
  Mail,
  MoreVertical,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  ArrowUpRight,
  Send,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import ManagePlanModal from "@/components/dashboard/ManagePlanModal";
import { apiUrl } from "@/lib/api";

type TeamRole = "owner" | "admin" | "member";

interface TeamMember {
  _id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  teamRole: TeamRole;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface TeamInvite {
  _id: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  lastSentAt: string;
  createdAt: string;
}

interface TeamData {
  owner: TeamMember;
  members: TeamMember[];
  invites: TeamInvite[];
  seats: {
    used: number;
    pending: number;
    limit: number | "Unlimited";
    remaining: number | "Unlimited";
  };
  plan: { name: string; label: string };
  viewer: { isOwner: boolean; teamRole: TeamRole };
}

type Toast = { type: "success" | "error"; message: string } | null;

const ROLE_BADGE: Record<TeamRole, { label: string; cls: string; Icon: typeof Crown }> = {
  owner: {
    label: "Owner",
    cls: "bg-amber-50 text-amber-700 ring-amber-600/20",
    Icon: Crown,
  },
  admin: {
    label: "Admin",
    cls: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    Icon: Shield,
  },
  member: {
    label: "Member",
    cls: "bg-slate-100 text-slate-700 ring-slate-300/40",
    Icon: UserIcon,
  },
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function formatDate(d?: string | null): string {
  if (!d) return "Never";
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} day${Math.floor(diff / 86_400_000) === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/team"), { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error((await res.json())?.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const seatLimitLabel =
    data?.seats.limit === "Unlimited" ? "Unlimited" : String(data?.seats.limit ?? 0);
  const seatRemainingLabel =
    data?.seats.remaining === "Unlimited" ? "∞" : String(data?.seats.remaining ?? 0);
  const isAtSeatLimit =
    data?.seats.remaining !== "Unlimited" && (data?.seats.remaining ?? 0) <= 0;

  const handleInvited = (invite: TeamInvite) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            invites: [invite, ...prev.invites],
            seats: {
              ...prev.seats,
              pending: prev.seats.pending + 1,
              remaining:
                prev.seats.remaining === "Unlimited"
                  ? "Unlimited"
                  : Math.max(0, (prev.seats.remaining as number) - 1),
            },
          }
        : prev
    );
    setToast({ type: "success", message: `Invitation sent to ${invite.email}` });
    setInviteOpen(false);
  };

  const handleRevokeInvite = async (id: string) => {
    if (!confirm("Revoke this invitation? The link will no longer work.")) return;
    try {
      const res = await fetch(apiUrl(`/api/team/invite/${id}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to revoke");
      setData((prev) =>
        prev
          ? {
              ...prev,
              invites: prev.invites.filter((i) => i._id !== id),
              seats: {
                ...prev.seats,
                pending: Math.max(0, prev.seats.pending - 1),
                remaining:
                  prev.seats.remaining === "Unlimited"
                    ? "Unlimited"
                    : (prev.seats.remaining as number) + 1,
              },
            }
          : prev
      );
      setToast({ type: "success", message: "Invitation revoked" });
    } catch (e) {
      setToast({ type: "error", message: e instanceof Error ? e.message : "Failed" });
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/team/invite/${id}/resend`), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to resend");
      setData((prev) =>
        prev
          ? {
              ...prev,
              invites: prev.invites.map((i) =>
                i._id === id ? { ...i, lastSentAt: new Date().toISOString() } : i
              ),
            }
          : prev
      );
      setToast({ type: "success", message: "Invitation re-sent" });
    } catch (e) {
      setToast({ type: "error", message: e instanceof Error ? e.message : "Failed" });
    }
  };

  const handleChangeRole = async (userId: string, role: "admin" | "member") => {
    try {
      const res = await fetch(apiUrl(`/api/team/member/${userId}`), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to change role");
      setData((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.map((m) =>
                m._id === userId ? { ...m, teamRole: role } : m
              ),
            }
          : prev
      );
      setToast({ type: "success", message: `Role updated to ${role}` });
    } catch (e) {
      setToast({ type: "error", message: e instanceof Error ? e.message : "Failed" });
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this workspace? They'll lose access immediately.`)) return;
    try {
      const res = await fetch(apiUrl(`/api/team/member/${userId}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to remove");
      setData((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter((m) => m._id !== userId),
              seats: {
                ...prev.seats,
                used: Math.max(1, prev.seats.used - 1),
                remaining:
                  prev.seats.remaining === "Unlimited"
                    ? "Unlimited"
                    : (prev.seats.remaining as number) + 1,
              },
            }
          : prev
      );
      setToast({ type: "success", message: `${name} removed from workspace` });
    } catch (e) {
      setToast({ type: "error", message: e instanceof Error ? e.message : "Failed" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="ml-[260px] p-6">
        <TopBar title="Team" />

        <div className="max-w-6xl mx-auto mt-6">
          {/* ─── Header ────────────────────────────────────── */}
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-md shadow-primary/20">
                  <Users className="w-5 h-5" />
                </span>
                Team
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Invite teammates, manage roles, and keep your workspace organised.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setRefreshing(true);
                  load();
                }}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              {data?.viewer.isOwner && (
                <button
                  onClick={() => {
                    if (isAtSeatLimit) {
                      setShowPlanModal(true);
                    } else {
                      setInviteOpen(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-sm hover:shadow-md"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite teammate
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* ─── Seat usage hero ───────────────────────── */}
              <SeatHero
                data={data}
                seatLimitLabel={seatLimitLabel}
                seatRemainingLabel={seatRemainingLabel}
                isAtSeatLimit={isAtSeatLimit}
                onUpgrade={() => setShowPlanModal(true)}
              />

              {/* ─── Members table ────────────────────────── */}
              <SectionCard
                title="Active Members"
                subtitle={`${data.seats.used} active`}
                icon={<Users className="w-4 h-4" />}
              >
                <MembersTable
                  owner={data.owner}
                  members={data.members}
                  isOwnerView={data.viewer.isOwner}
                  onChangeRole={handleChangeRole}
                  onRemove={handleRemoveMember}
                />
              </SectionCard>

              {/* ─── Invites table ────────────────────────── */}
              <SectionCard
                title="Pending Invitations"
                subtitle={
                  data.invites.length === 0
                    ? "No pending invites"
                    : `${data.invites.length} awaiting`
                }
                icon={<Clock className="w-4 h-4" />}
                className="mt-5"
              >
                {data.invites.length === 0 ? (
                  <EmptyInvites isOwner={data.viewer.isOwner} onInvite={() => setInviteOpen(true)} />
                ) : (
                  <InvitesTable
                    invites={data.invites}
                    isOwnerView={data.viewer.isOwner}
                    onResend={handleResendInvite}
                    onRevoke={handleRevokeInvite}
                  />
                )}
              </SectionCard>
            </>
          ) : null}
        </div>
      </main>

      {/* Modals */}
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={handleInvited}
        onSeatLimitHit={() => {
          setInviteOpen(false);
          setShowPlanModal(true);
        }}
      />
      <ManagePlanModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        planData={
          data
            ? {
                plan: data.plan.name,
                label: data.plan.label,
              }
            : undefined
        }
      />

      {/* Toast */}
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}

// ─── Seat hero ─────────────────────────────────────────────────
function SeatHero({
  data,
  seatLimitLabel,
  seatRemainingLabel,
  isAtSeatLimit,
  onUpgrade,
}: {
  data: TeamData;
  seatLimitLabel: string;
  seatRemainingLabel: string;
  isAtSeatLimit: boolean;
  onUpgrade: () => void;
}) {
  const isUnlimited = data.seats.limit === "Unlimited";
  const total = isUnlimited ? Math.max(data.seats.used + data.seats.pending, 1) : (data.seats.limit as number);
  const usedPct = Math.min(100, (data.seats.used / total) * 100);
  const pendingPct = Math.min(100 - usedPct, (data.seats.pending / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-slate-900 text-white shadow-lg shadow-slate-900/10 mb-6"
    >
      <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-secondary/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {data.plan.label} plan · seats
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              {data.seats.used}
              <span className="text-white/50 mx-2">/</span>
              {seatLimitLabel}
            </h2>
            <p className="text-sm text-white/80 mt-2 max-w-md">
              {data.seats.pending > 0
                ? `${data.seats.pending} invitation${data.seats.pending === 1 ? "" : "s"} pending — they&rsquo;ll consume a seat once accepted.`
                : "Seats refresh automatically when teammates leave or invites are revoked."}
            </p>
          </div>
          {data.viewer.isOwner && (
            <div className="flex flex-col gap-2 items-end">
              <button
                onClick={onUpgrade}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-900 bg-white rounded-xl shadow hover:shadow-lg transition"
              >
                <Sparkles className="w-4 h-4" />
                {isAtSeatLimit ? "Upgrade for more seats" : "Manage plan"}
              </button>
              <Link
                href="/dashboard/billing"
                className="text-xs text-white/80 hover:text-white inline-flex items-center gap-1"
              >
                View billing
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Stacked seat bar */}
        <div className="h-3 w-full bg-white/15 rounded-full overflow-hidden flex">
          <div className="h-full bg-white transition-all" style={{ width: `${usedPct}%` }} />
          <div className="h-full bg-white/40 transition-all" style={{ width: `${pendingPct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/85">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-white" />
            {data.seats.used} active
          </span>
          {data.seats.pending > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-white/40" />
              {data.seats.pending} pending
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 ml-auto">
            <span className="w-2.5 h-2.5 rounded-sm border border-white/40" />
            {seatRemainingLabel} remaining
          </span>
        </div>

        {isAtSeatLimit && data.viewer.isOwner && (
          <div className="mt-5 p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white inline-flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              You&rsquo;ve reached your seat limit on the <strong>{data.plan.label}</strong> plan.
              <button onClick={onUpgrade} className="ml-1 underline font-semibold">
                Upgrade to invite more teammates.
              </button>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Section shell ─────────────────────────────────────────────
function SectionCard({
  children,
  title,
  subtitle,
  icon,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          {icon && (
            <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              {icon}
            </span>
          )}
          {title}
        </h3>
        {subtitle && (
          <span className="text-[11px] text-slate-400 font-semibold">{subtitle}</span>
        )}
      </div>
      {children}
    </motion.section>
  );
}

// ─── Members table ─────────────────────────────────────────────
function MembersTable({
  owner,
  members,
  isOwnerView,
  onChangeRole,
  onRemove,
}: {
  owner: TeamMember;
  members: TeamMember[];
  isOwnerView: boolean;
  onChangeRole: (userId: string, role: "admin" | "member") => void;
  onRemove: (userId: string, name: string) => void;
}) {
  // Owner first, then members in join order.
  const rows: TeamMember[] = useMemo(() => [owner, ...members], [owner, members]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Click outside to close menu.
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openMenu]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="text-left px-5 py-3 font-semibold">Member</th>
            <th className="text-left px-3 py-3 font-semibold">Role</th>
            <th className="text-left px-3 py-3 font-semibold">Status</th>
            <th className="text-left px-3 py-3 font-semibold">Last active</th>
            <th className="text-right px-5 py-3 font-semibold w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((m) => {
            const role = m.teamRole || "member";
            const badge = ROLE_BADGE[role];
            const BadgeIcon = badge.Icon;
            const isOwnerRow = role === "owner";
            const canManage = isOwnerView && !isOwnerRow;
            return (
              <tr key={m._id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {initials(m.fullName) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{m.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset ${badge.cls}`}
                  >
                    <BadgeIcon className="w-3 h-3" />
                    {badge.label}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {m.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                      <AlertCircle className="w-3 h-3" /> Pending
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">
                  {formatDate(m.lastLoginAt)}
                </td>
                <td className="px-5 py-3 text-right relative">
                  {canManage ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === m._id ? null : m._id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                        aria-label="Member actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === m._id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-3 top-10 z-20 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-left"
                        >
                          {role !== "admin" && (
                            <button
                              onClick={() => {
                                setOpenMenu(null);
                                onChangeRole(m._id, "admin");
                              }}
                              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Shield className="w-3.5 h-3.5 text-indigo-500" />
                              Make admin
                            </button>
                          )}
                          {role !== "member" && (
                            <button
                              onClick={() => {
                                setOpenMenu(null);
                                onChangeRole(m._id, "member");
                              }}
                              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                              Make member
                            </button>
                          )}
                          <div className="my-1 border-t border-slate-100" />
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              onRemove(m._id, m.fullName);
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove from team
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Invites table ─────────────────────────────────────────────
function InvitesTable({
  invites,
  isOwnerView,
  onResend,
  onRevoke,
}: {
  invites: TeamInvite[];
  isOwnerView: boolean;
  onResend: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  const [now] = useState(() => Date.now());
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="text-left px-5 py-3 font-semibold">Email</th>
            <th className="text-left px-3 py-3 font-semibold">Role</th>
            <th className="text-left px-3 py-3 font-semibold">Sent</th>
            <th className="text-left px-3 py-3 font-semibold">Expires</th>
            <th className="text-right px-5 py-3 font-semibold w-44"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invites.map((i) => {
            const badge = ROLE_BADGE[i.role];
            const BadgeIcon = badge.Icon;
            const isExpired = new Date(i.expiresAt).getTime() < now;
            return (
              <tr key={i._id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{i.email}</p>
                      <p className="text-[11px] text-amber-600 font-semibold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {isExpired ? "Expired" : "Pending acceptance"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset ${badge.cls}`}
                  >
                    <BadgeIcon className="w-3 h-3" />
                    {badge.label}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">{formatDate(i.lastSentAt)}</td>
                <td className="px-3 py-3 text-xs text-slate-600">
                  {new Date(i.expiresAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-3 text-right">
                  {isOwnerView ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onResend(i._id)}
                        title="Re-send invitation"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                      >
                        <Send className="w-3 h-3" />
                        Resend
                      </button>
                      <button
                        onClick={() => onRevoke(i._id)}
                        title="Revoke invitation"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyInvites({ isOwner, onInvite }: { isOwner: boolean; onInvite: () => void }) {
  return (
    <div className="py-10 text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-3">
        <Mail className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-700">No pending invitations</p>
      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
        {isOwner
          ? "Invite teammates to collaborate on documents and share usage."
          : "Only the workspace owner can invite teammates."}
      </p>
      {isOwner && (
        <button
          onClick={onInvite}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-sm hover:shadow-md"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite a teammate
        </button>
      )}
    </div>
  );
}

// ─── Invite modal ─────────────────────────────────────────────
function InviteModal({
  open,
  onClose,
  onInvited,
  onSeatLimitHit,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: (invite: TeamInvite) => void;
  onSeatLimitHit: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("member");
      setErr(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setErr("Email is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/team/invite"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.code === "SEAT_LIMIT_REACHED") {
          onSeatLimitHit();
          return;
        }
        throw new Error(data?.error || "Failed to send invitation");
      }
      onInvited(data.invite);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send invitation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary via-primary-dark to-slate-900 px-6 py-5 text-white relative">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-40 h-40 bg-secondary rounded-full blur-3xl" />
              </div>
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="w-5 h-5 text-amber-300" />
                    <h2 className="text-lg font-bold">Invite a teammate</h2>
                  </div>
                  <p className="text-sm text-slate-300">
                    They&rsquo;ll get an email with a one-click acceptance link.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={submit} className="p-6 space-y-4">
              <div>
                <label htmlFor="inviteEmail" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Work email
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="teammate@company.com"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["member", "admin"] as const).map((r) => {
                    const badge = ROLE_BADGE[r];
                    const Icon = badge.Icon;
                    const active = role === r;
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`text-left p-3 rounded-xl border-2 transition ${
                          active
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 capitalize">
                          <Icon
                            className={`w-3.5 h-3.5 ${
                              r === "admin" ? "text-indigo-500" : "text-slate-500"
                            }`}
                          />
                          {r}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          {r === "admin"
                            ? "Can upload, review, and manage other members."
                            : "Can upload and review documents only."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {err && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {err}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send invitation
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
