"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import {
  Search,
  MessageCircle,
  Clock,
  Eye,
  Plus,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Ticket,
} from "lucide-react";
import { apiUrl } from "@/lib/api";

interface SupportTicket {
  _id: string;
  issueType: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function TicketsListPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  
  const limit = 10;
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const sidebar = document.querySelector("aside");
    if (sidebar) {
      setSidebarWidth(sidebar.getBoundingClientRect().width);
      const observer = new MutationObserver(() => {
        if (sidebar) setSidebarWidth(sidebar.getBoundingClientRect().width);
      });
      observer.observe(sidebar, { attributes: true, attributeFilter: ["style"] });
      return () => observer.disconnect();
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
      });
      if (status !== "all") params.append("status", status);
      if (searchQuery.trim()) params.append("search", searchQuery);

      const res = await fetch(apiUrl(`/api/support?${params.toString()}`), {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data.data || []);
        setTotalTickets(data.total || data.data?.length || 0);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  }, [status, searchQuery, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "resolved":
        return { color: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle };
      case "in_progress":
        return { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: AlertCircle };
      default:
        return { color: "bg-red-50 text-red-600 border-red-200", icon: HelpCircle };
    }
  };

  return (
    <div className="flex h-screen bg-[#f8f9fb]">
      <Sidebar />
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, marginLeft: mounted ? sidebarWidth : 260 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <TopBar title="Support Tickets" />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <button
                onClick={() => router.push("/dashboard/support")}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Help Center</span>
              </button>
              
              <button
                onClick={() => router.push("/dashboard/support")}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Ticket
              </button>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Ticket className="w-8 h-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-slate-800">My Support Tickets</h1>
              </div>
              <p className="text-slate-500 text-sm">
                You have {totalTickets} ticket{totalTickets !== 1 ? 's' : ''} in total
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300"
                />
              </div>

              <div className="relative w-full sm:w-48">
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>

            {/* Tickets List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No support tickets found</p>
                <button
                  onClick={() => router.push("/dashboard/support")}
                  className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium inline-flex items-center gap-1"
                >
                  Create a new ticket
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {tickets.map((ticket) => {
                  const StatusIcon = getStatusConfig(ticket.status).icon;
                  return (
                    <div
                      key={ticket._id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/dashboard/support/detail/${ticket._id}`)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageCircle className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-semibold text-slate-800">
                              {ticket.issueType}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {ticket.message}
                          </p>
                          <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(ticket.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full border ${getStatusConfig(ticket.status).color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {ticket.status.replace("_", " ")}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/support/detail/${ticket._id}`);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                <div className="flex items-center justify-between mt-8">
                  <span className="text-sm text-slate-500">
                    Page <span className="font-semibold text-slate-700">{page}</span> of {Math.ceil(totalTickets / limit)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3.5 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>
                    <button
                      disabled={tickets.length < limit}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3.5 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </motion.div>
    </div>
  );
}