"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiUrl } from "@/lib/api";
import {
  Paperclip,
  Send,
  FileText,
  MessageCircle,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Image as ImageIcon,
  X,
  Paperclip as PaperclipIcon,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from "lucide-react";

type Attachment = {
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
};

type Message = {
  _id: string;
  senderRole: "user" | "admin";
  message: string;
  attachments: Attachment[];
  createdAt: string;
};

type Ticket = {
  _id: string;
  issueType: string;
  message: string;
  status: string;
  attachments: Attachment[];
  messages: Message[];
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showDetails, setShowDetails] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [resolving, setResolving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/support/${id}`), {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setTicket(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchTicket();
  }, [fetchTicket, id]);

  useEffect(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return;

    const observer = new ResizeObserver(() => {
      setSidebarWidth(sidebar.getBoundingClientRect().width);
    });

    observer.observe(sidebar);
    setSidebarWidth(sidebar.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReply = async () => {
    if (!reply.trim()) return;

    const formData = new FormData();
    formData.append("message", reply);
    attachments.forEach((file) => formData.append("attachments", file));

    try {
      const res = await fetch(apiUrl(`/api/support/${id}/reply`), {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed");

      setReply("");
      setAttachments([]);
      fetchTicket();

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error(err);
      alert("Reply failed");
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'closed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <HelpCircle className="w-4 h-4" />;
      case 'in progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const handleResolve = async () => {
    try {
      setResolving(true);

      const res = await fetch(apiUrl(`/api/support/${id}`), {
        method: "PATCH",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Failed");

      // Option 1: Refetch (simple + safe)
      await fetchTicket();

      // Option 2 (faster UX):
      // setTicket((prev) => prev ? { ...prev, status: "resolved" } : prev);

    } catch (err) {
      console.error(err);
      alert("Failed to resolve ticket");
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div
          className="flex min-h-screen flex-col transition-all duration-200"
          style={{ marginLeft: sidebarWidth }}
        >
          <TopBar title="Support Ticket" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading ticket details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div
          className="flex min-h-screen flex-col transition-all duration-200"
          style={{ marginLeft: sidebarWidth }}
        >
          <TopBar title="Support Ticket" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Ticket Not Found</h2>
              <p className="text-gray-600">The requested ticket does not exist or has been removed.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div
        className="flex min-h-screen flex-col transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <TopBar title="Support Ticket" />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-6">
            {/* Header Section */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status}
                    </span>
                    {ticket.status !== "resolved" && (
                      <button
                        onClick={handleResolve}
                        disabled={resolving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {resolving ? "Resolving..." : "Mark as Resolved"}
                      </button>
                    )}
                    {/* <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      ID {ticket._id.slice(-8).toUpperCase()}
                    </span> */}
                  </div>
                  <h1 className="break-words text-2xl font-bold text-slate-900">
                    {ticket.issueType}
                  </h1>
                </div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                  aria-label={showDetails ? "Hide ticket details" : "Show ticket details"}
                >
                  {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Ticket Details */}
              {showDetails && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {ticket.message}
                    </p>
                  </div>

                  {/* Attachments */}
                  {ticket.attachments.length > 0 && (
                    <div className="mt-4">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <PaperclipIcon className="w-4 h-4" />
                        Attachments ({ticket.attachments.length})
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {ticket.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50"
                          >
                            <FileText className="h-4 w-4 flex-shrink-0 text-indigo-600" />
                            <span className="truncate text-sm text-slate-700">{att.fileName}</span>
                            <span className="flex-shrink-0 text-xs text-slate-400">{formatFileSize(att.fileSize)}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-800">Conversation</h2>
                <span className="text-sm text-gray-500">({ticket.messages.length} messages)</span>
              </div>

              <div className="space-y-4">
                {ticket.messages.map((msg, index) => (
                  <div
                    key={msg._id}
                    className={`flex gap-3 animate-fadeIn ${msg.senderRole === "user" ? "flex-row-reverse" : ""
                      }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.senderRole === "user"
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-600"
                        }`}>
                        {msg.senderRole === "user" ? (
                          <User className="w-5 h-5" />
                        ) : (
                          <ShieldCheck className="w-5 h-5" />
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 max-w-[min(70%,720px)] ${msg.senderRole === "user" ? "items-end" : ""}`}>
                      <div className={`rounded-xl p-4 ${msg.senderRole === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                        }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>

                        {/* Message Attachments */}
                        {msg.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.attachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 text-xs ${msg.senderRole === "user"
                                  ? "text-indigo-100 hover:text-white"
                                  : "text-indigo-600 hover:text-indigo-700"
                                  } transition-colors`}
                              >
                                <Paperclip className="w-3 h-3" />
                                <span className="break-all">{att.fileName}</span>
                                <span className="opacity-70">({formatFileSize(att.fileSize)})</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className={`text-xs text-gray-400 mt-1 px-2 ${msg.senderRole === "user" ? "text-right" : ""
                        }`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Reply Section */}
            {ticket.status === "resolved" ? (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-emerald-700">
                    This ticket has been resolved
                  </h3>
                  <p className="text-xs text-emerald-600">
                    You can no longer send messages on this ticket.
                  </p>
                </div>
              </div>
            ) : (
              <div className="sticky bottom-0 mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Reply to Ticket</h3>

                  {/* Textarea */}
                  <div className="mb-4">
                    <textarea
                      ref={textareaRef}
                      value={reply}
                      onChange={(e) => {
                        setReply(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                      }}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your reply here... (Press Enter to send, Shift+Enter for new line)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all text-gray-700 placeholder-gray-400"
                      rows={3}
                    />
                  </div>

                  {/* Attachments Preview */}
                  {attachments.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            {file.type.startsWith('image/') ? (
                              <ImageIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            )}
                            <span className="text-sm text-gray-700 break-all max-w-[200px]">{file.name}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">({formatFileSize(file.size)})</span>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="ml-2 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                      >
                        <Paperclip className="w-4 h-4" />
                        <span className="text-sm hidden sm:inline">Attach Files</span>
                      </button>
                    </div>

                    <button
                      onClick={handleReply}
                      disabled={!reply.trim()}
                      className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-all transform hover:scale-105 disabled:transform-none"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send Reply</span>
                    </button>

                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      hidden
                      onChange={(e) => {
                        if (e.target.files)
                          setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
