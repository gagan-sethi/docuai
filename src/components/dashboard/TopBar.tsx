"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";
import {
  Bell,
  Search,
  Upload,
  Plus,
  ChevronDown,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  doc_processed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  doc_approved: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  doc_rejected: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  doc_error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  doc_review: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  whatsapp_received: { icon: FileText, color: "text-green-500", bg: "bg-green-50" },
  welcome: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
  system: { icon: FileText, color: "text-primary", bg: "bg-primary/10" },
  batch_complete: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function TopBar({ title }: { title: string }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<{ fullName: string } | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/notifications?limit=10"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Fetch user
    fetch(apiUrl("/api/auth/me"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});

    // Refresh notifications every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    await fetch(apiUrl("/api/notifications"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 overflow-hidden"
                >
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search documents, invoices..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2.5 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
            >
              {showSearch ? (
                <X className="w-5 h-5" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Upload button */}
          <Link href="/dashboard/review" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all">
            <Upload className="w-4 h-4" />
            Upload
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2.5 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            <AnimatePresence>
              {showNotif && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotif(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-slate-100 overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900">
                        Notifications
                      </h3>
                      <button onClick={handleMarkAllRead} className="text-xs font-medium text-primary hover:underline">
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-muted">
                          No notifications yet
                        </div>
                      )}
                      {notifications.map((n) => {
                        const cfg = typeConfig[n.type] || typeConfig.system;
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={n._id}
                            className={`flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                              !n.isRead ? "bg-primary/[0.02]" : ""
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${cfg.bg} flex-shrink-0 mt-0.5`}
                            >
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${!n.isRead ? "text-slate-900" : "text-slate-600"}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-muted mt-0.5 truncate">
                                {n.message}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap mt-1">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                      <button className="w-full text-center text-xs font-medium text-primary hover:underline">
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User avatar */}
          <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
