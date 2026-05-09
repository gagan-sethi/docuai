"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  EyeOff,
  X,
  User,
  CreditCard,
  Shield,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

import { apiUrl } from "@/lib/api";
import { toast } from "react-toastify";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const typeConfig: Record<
  string,
  {
    icon: typeof CheckCircle2;
    color: string;
    bg: string;
    label: string;
  }
> = {
  doc_processed: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    label: "Document Processed",
  },
  doc_approved: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    label: "Document Approved",
  },
  doc_rejected: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Document Rejected",
  },
  doc_error: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Processing Error",
  },
  doc_review: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
    label: "Needs Review",
  },
  whatsapp_received: {
    icon: FileText,
    color: "text-green-500",
    bg: "bg-green-50",
    label: "WhatsApp Received",
  },
  welcome: {
    icon: CheckCircle2,
    color: "text-primary",
    bg: "bg-primary/10",
    label: "Welcome",
  },
  system: {
    icon: FileText,
    color: "text-primary",
    bg: "bg-primary/10",
    label: "System Update",
  },
  batch_complete: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    label: "Batch Complete",
  },
  user_signup: {
    icon: User,
    color: "text-blue-500",
    bg: "bg-blue-50",
    label: "New User",
  },
  plan_change: {
    icon: CreditCard,
    color: "text-purple-500",
    bg: "bg-purple-50",
    label: "Plan Updated",
  },
  admin_action: {
    icon: Shield,
    color: "text-orange-500",
    bg: "bg-orange-50",
    label: "Admin Action",
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 5,
    total: 0,
    pages: 0,
  });
  const [filterUnread, setFilterUnread] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (filterUnread) {
        params.append("unread", "true");
      }

      const res = await fetch(apiUrl(`/api/notifications?${params}`), {
        credentials: "include",
      });

      

      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data = await res.json();
      setNotifications(data.notifications || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filterUnread]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return;
    const observer = new ResizeObserver(() => setSidebarWidth(sidebar.clientWidth));
    observer.observe(sidebar);
    setSidebarWidth(sidebar.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(apiUrl("/api/notifications"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Failed to mark all as read");

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setActionLoading(false);
    }
  };


  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <TopBar title="Notifications" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
        
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-500">
            Stay updated with system activities and alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              filterUnread
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Eye className="w-4 h-4" />
            Unread Only
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              <EyeOff className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Notifications", value: pagination.total, icon: Bell, color: "text-primary" },
          { label: "Unread", value: notifications.filter((n) => !n.isRead).length, icon: EyeOff, color: "text-amber-500" },
          { label: "Read", value: notifications.filter((n) => n.isRead).length, icon: CheckCircle2, color: "text-success" },
          { label: "Pages", value: pagination.pages, icon: FileText, color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-[11px] text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No notifications</h3>
            <p className="text-sm text-slate-400">
              {filterUnread
                ? "You don't have any unread notifications"
                : "You're all caught up! Check back later for updates"}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {notifications.map((notification, index) => {
                const cfg = typeConfig[notification.type] || typeConfig.system;
                const Icon = cfg.icon;
                
                return (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-start gap-4 p-5 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                      !notification.isRead ? "bg-primary/[0.02]" : ""
                    }`}
                    onClick={() => setSelectedNotification(notification)}
                  >
                    <div className={`p-2.5 rounded-xl ${cfg.bg} flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {cfg.label}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {formatDate(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-1">
                        {notification.message}
                      </p>
                      
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Showing {notifications.length} of {pagination.total} notifications
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                          pageNum === pagination.page
                            ? "bg-primary text-white"
                            : "hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const cfg = typeConfig[selectedNotification.type] || typeConfig.system;
                    const Icon = cfg.icon;
                    return (
                      <div className={`p-2 rounded-xl ${cfg.bg}`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedNotification.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {formatFullDate(selectedNotification.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-2">Message</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedNotification.message}
                  </p>
                </div>
                
                
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
