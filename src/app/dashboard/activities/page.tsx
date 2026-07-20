"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  UserPlus,
  LogIn,
  MailCheck,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Trash2,
  Settings,
  Package,
  CreditCard,
  MessageSquare,
  Shield,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Filter,
  X,
  Eye,
  RefreshCw,
  type LucideProps,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiFetch, apiUrl, handleUnauthorized } from "@/lib/api";
import { toast } from "react-toastify";

interface ActivityItem {
  _id: string;
  userId: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface FiltersInfo {
  availableActions: string[];
}

const actionConfig: Record<
  string,
  {
    icon: React.ComponentType<LucideProps>;
    color: string;
    bg: string;
    label: string;
  }
> = {
  user_signup: {
    icon: UserPlus,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    label: "User Signup",
  },
  user_login: {
    icon: LogIn,
    color: "text-blue-500",
    bg: "bg-blue-50",
    label: "User Login",
  },
  user_email_verified: {
    icon: MailCheck,
    color: "text-teal-500",
    bg: "bg-teal-50",
    label: "Email Verified",
  },
  doc_uploaded: {
    icon: Upload,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    label: "Document Uploaded",
  },
  doc_processing: {
    icon: Loader2,
    color: "text-amber-500",
    bg: "bg-amber-50",
    label: "Processing",
  },
  doc_processed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50",
    label: "Document Processed",
  },
  doc_reviewed: {
    icon: Eye,
    color: "text-purple-500",
    bg: "bg-purple-50",
    label: "Document Reviewed",
  },
  doc_approved: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50",
    label: "Document Approved",
  },
  doc_rejected: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Document Rejected",
  },
  doc_exported: {
    icon: Download,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
    label: "Document Exported",
  },
  doc_deleted: {
    icon: Trash2,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Document Deleted",
  },
  whatsapp_received: {
    icon: MessageSquare,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "WhatsApp Received",
  },
  settings_updated: {
    icon: Settings,
    color: "text-gray-500",
    bg: "bg-gray-50",
    label: "Settings Updated",
  },
  batch_processed: {
    icon: Package,
    color: "text-orange-500",
    bg: "bg-orange-50",
    label: "Batch Processed",
  },
  plan_changed: {
    icon: CreditCard,
    color: "text-purple-500",
    bg: "bg-purple-50",
    label: "Plan Changed",
  },
  support_ticket_created: {
    icon: MessageSquare,
    color: "text-blue-500",
    bg: "bg-blue-50",
    label: "Support Ticket",
  },
  support_ticket_reply: {
    icon: MessageSquare,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    label: "Support Reply",
  },
  admin_impersonation: {
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Admin Action",
  },
};

const defaultConfig = {
  icon: Activity,
  color: "text-slate-500",
  bg: "bg-slate-50",
  label: "Activity",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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
    second: "2-digit",
  });
}

function formatUserAgent(userAgent?: string): string {
  if (!userAgent) return "Unknown";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Mobile")) return "Mobile";
  return "Other";
}

export default function ActivitiesPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState<FiltersInfo>({
    availableActions: [],
  });
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [actionFilter, setActionFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      
      if (actionFilter) params.append("action", actionFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await apiFetch(apiUrl(`/api/activities?${params}`), {
        credentials: "include",
      });
      if (await handleUnauthorized(res)) return;


      if (!res.ok) throw new Error("Failed to fetch activities");

      const data = await res.json();
      setActivities(data.activities || []);
      setPagination(data.pagination);
      if (data.filters) {
        setFilters(data.filters);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, actionFilter, searchQuery, startDate, endDate]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return;
    const observer = new ResizeObserver(() => setSidebarWidth(sidebar.clientWidth));
    observer.observe(sidebar);
    setSidebarWidth(sidebar.clientWidth);
    return () => observer.disconnect();
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleResetFilters = () => {
    setActionFilter("");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchActivities();
  };

  // Check if any filters are active
  const hasActiveFilters = actionFilter || searchQuery || startDate || endDate;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <TopBar title="Activity Log" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Activity Log</h2>
                <p className="text-sm text-slate-500">
                  Track all your actions and system activities
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    showFilters
                      ? "bg-primary text-white shadow-lg shadow-primary/25"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-primary"></span>
                  )}
                </button>
                <button
                  onClick={fetchActivities}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Search */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Search
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Document name or description..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* Action Filter */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Action Type
                        </label>
                        <select
                          value={actionFilter}
                          onChange={(e) => setActionFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="">All Actions</option>
                          {filters.availableActions.map((action) => {
                            const cfg = actionConfig[action] || defaultConfig;
                            return (
                              <option key={action} value={action}>
                                {cfg.label}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          From Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* End Date */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          To Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleApplyFilters}
                        className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Activities", value: pagination.total, icon: Activity, color: "text-primary" },
                { label: "Documents", value: activities.filter(a => a.action.startsWith("doc_")).length, icon: FileText, color: "text-indigo-500" },
                { label: "Page", value: `${pagination.page} of ${pagination.pages}`, icon: ChevronRight, color: "text-amber-500" },
                { label: "Per Page", value: pagination.limit, icon: Eye, color: "text-accent" },
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

            {/* Activities List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No activities found</h3>
                  <p className="text-sm text-slate-400">
                    {hasActiveFilters 
                      ? "Try adjusting your filters"
                      : "Your activities will appear here"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-50">
                    {activities.map((activity, index) => {
                      const cfg = actionConfig[activity.action] || defaultConfig;
                      const Icon = cfg.icon;
                      
                      return (
                        <motion.div
                          key={activity._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-start gap-4 p-5 hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedActivity(activity)}
                        >
                          <div className={`p-2.5 rounded-xl ${cfg.bg} flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${cfg.color} ${activity.action === "doc_processing" ? "animate-spin" : ""}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {cfg.label}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {formatDate(activity.createdAt)}
                                </p>
                              </div>
                              <span className="text-xs text-slate-400 whitespace-nowrap">
                                {formatDate(activity.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">
                              {activity.description}
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
                        Showing {activities.length} of {pagination.total} activities
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

            {/* Activity Detail Modal */}
            <AnimatePresence>
              {selectedActivity && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setSelectedActivity(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                  >
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const cfg = actionConfig[selectedActivity.action] || defaultConfig;
                          const Icon = cfg.icon;
                          return (
                            <div className={`p-2 rounded-xl ${cfg.bg}`}>
                              <Icon className={`w-5 h-5 ${cfg.color}`} />
                            </div>
                          );
                        })()}
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {actionConfig[selectedActivity.action]?.label || "Activity Details"}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {formatFullDate(selectedActivity.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedActivity(null)}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      {/* Description */}
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Description</p>
                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
                          {selectedActivity.description}
                        </p>
                      </div>

                      {/* Metadata */}
                      {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">Additional Information</p>
                          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                            {Object.entries(selectedActivity.metadata).map(([key, value]) => (
                              <div key={key} className="flex items-start gap-2 text-sm">
                                <span className="font-mono text-xs text-primary font-medium min-w-[120px]">
                                  {key}:
                                </span>
                                <span className="text-slate-600 break-all">
                                  {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Technical Details */}
                      <div className="grid grid-cols-2 gap-4">
                        {selectedActivity.ip && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">IP Address</p>
                            <p className="text-sm text-slate-700 font-mono">{selectedActivity.ip}</p>
                          </div>
                        )}
                        {selectedActivity.userAgent && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">Browser / Device</p>
                            <p className="text-sm text-slate-700">
                              {formatUserAgent(selectedActivity.userAgent)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Activity ID</p>
                          <p className="text-xs text-slate-500 font-mono">{selectedActivity._id}</p>
                        </div>
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
