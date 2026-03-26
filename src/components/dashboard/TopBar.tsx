"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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

const notifications = [
  {
    id: 1,
    type: "success" as const,
    title: "Invoice processed",
    desc: "INV-2026-08472 extracted successfully (97% confidence)",
    time: "2 min ago",
  },
  {
    id: 2,
    type: "warning" as const,
    title: "Low confidence detected",
    desc: "PO-55219 has 3 fields below 80% confidence",
    time: "15 min ago",
  },
  {
    id: 3,
    type: "info" as const,
    title: "WhatsApp document received",
    desc: "New document from +971-50-XXX-1234",
    time: "1 hr ago",
  },
  {
    id: 4,
    type: "success" as const,
    title: "Batch complete",
    desc: "12 invoices processed and exported to Excel",
    time: "3 hrs ago",
  },
];

const typeConfig = {
  success: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  warning: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
  info: { icon: FileText, color: "text-primary", bg: "bg-primary/10" },
};

export default function TopBar({ title }: { title: string }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
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
                      <button className="text-xs font-medium text-primary hover:underline">
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifications.map((n) => {
                        const cfg = typeConfig[n.type];
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={n.id}
                            className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div
                              className={`p-2 rounded-lg ${cfg.bg} flex-shrink-0 mt-0.5`}
                            >
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800">
                                {n.title}
                              </p>
                              <p className="text-xs text-muted mt-0.5 truncate">
                                {n.desc}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap mt-1">
                              {n.time}
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
              GS
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
