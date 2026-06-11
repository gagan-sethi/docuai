"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useFormik } from "formik";
import * as Yup from "yup";
import { apiUrl } from "@/lib/api";
import {
  Search,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Clock,
  Eye,
  Paperclip,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Ticket,
  ArrowRight,
  Send,
  Filter,
  XCircle,
  Calendar,
  Tag,
  Brain,
  BarChart3,
  Users,
  Download,
  Link2,
  ShieldCheck,
  CreditCard,
  Gift,
  GraduationCap,
  Building2,
  Rocket,
  CircleDot,
} from "lucide-react";

// ============================================================
// Types
// ============================================================
interface Attachment {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface IssueType {
  _id: string;
  name: string;
  description: string;
  priority: string;
}

interface SupportTicket {
  _id: string;
  issueType: string;
  message: string;
  status: string;
  createdAt: string;
}

// ============================================================
// FAQ Data with Lucide Icons
// ============================================================
const faqCategories = [
  {
    title: "General",
    icon: HelpCircle,
    iconColor: "text-primary",
    iconBg: "bg-primary/8",
    description: "General information about Invonix platform",
    faqs: [
      { q: "What is Invonix?", a: "Invonix is an AI-powered document processing platform that automatically extracts data from invoices, receipts, purchase orders, and financial documents, helping businesses reduce manual data entry and improve operational efficiency." },
      { q: "Who is Invonix designed for?", a: "Invonix is ideal for:\n\n• Accounting Firms\n• Bookkeepers\n• SMEs\n• Trading Companies\n• Logistics Companies\n• Construction Companies\n• Manufacturing Companies\n• Retail Businesses\n• Corporate Finance Teams" },
      { q: "Which countries does Invonix serve?", a: "Invonix serves businesses across the UAE, GCC, and Africa." }
    ]
  },
  {
    title: "Document Processing",
    icon: FileText,
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50",
    description: "Supported documents, formats, and batch processing",
    faqs: [
      { q: "What document types can Invonix process?", a: "Invonix supports:\n\n• Sales Invoices\n• Purchase Invoices\n• Receipts\n• Purchase Orders\n• Credit Notes\n• Expense Documents" },
      { q: "What file formats are supported?", a: "• PDF\n• JPG\n• JPEG\n• PNG\n• TIFF" },
      { q: "Can I upload multiple documents at once?", a: "Yes. Invonix supports bulk uploads and batch processing." },
      { q: "Does Invonix support Arabic documents?", a: "Yes. Both Arabic and English documents are supported." },
      { q: "Does Invonix support handwritten documents?", a: "Yes. Invonix can process both handwritten and typed documents." },
      { q: "What happens if AI extracts incorrect information?", a: "Users can review, edit, and approve extracted information before exporting or using the data." }
    ]
  },
  {
    title: "AI & OCR",
    icon: Brain,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    description: "Accuracy, identification, and VAT extraction",
    faqs: [
      { q: "How accurate is Invonix?", a: "Document extraction accuracy typically exceeds 90%, depending on document quality." },
      { q: "Does Invonix automatically identify document types?", a: "Yes. Invonix automatically classifies invoices, receipts, purchase orders, and other supported document types." },
      { q: "Can Invonix extract VAT information?", a: "Yes. VAT amounts and tax-related fields are automatically extracted where available." },
      { q: "Does Invonix learn from corrections?", a: "AI learning capabilities are being continuously improved to enhance classification and extraction accuracy over time." }
    ]
  },
  {
    title: "Upload Batch Management",
    icon: BarChart3,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
    description: "Batch IDs, organization, and audit workflows",
    faqs: [
      { q: "What is Upload Batch Management?", a: "Every upload session automatically receives a unique Batch ID.\n\nExample:\n\n• Batch #001\n• Batch #002\n• Batch #003" },
      { q: "Why is Batch Management useful?", a: "It allows users to:\n\n• Process documents by upload session\n• Export only recent uploads\n• Organize documents by period\n• Improve audit and reconciliation workflows" }
    ]
  },
  {
    title: "Financial Dashboard",
    icon: BarChart3,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    description: "Reports, filters, and exports",
    faqs: [
      { q: "What information is available in the Financial Dashboard?", a: "The dashboard provides:\n\n• Revenue\n• Expenses\n• Net Profit\n• VAT Payable\n• Financial Trends\n• Processing Statistics" },
      { q: "Can I filter reports by date?", a: "Yes.\n\nAvailable filters include:\n\n• This Month\n• Last Month\n• This Quarter\n• Last Quarter\n• This Year\n• Last Year\n• Custom Date Range" },
      { q: "Can I export reports?", a: "Yes.\n\nAvailable export formats:\n\n• Excel (XLSX)\n• CSV\n• PDF" }
    ]
  },
  {
    title: "Multi-Company & Users",
    icon: Users,
    iconColor: "text-primary",
    iconBg: "bg-primary/8",
    description: "Team management and access control",
    faqs: [
      { q: "Can I manage multiple companies?", a: "Yes, depending on your subscription plan.\n\nWhich plans support multiple companies?\nMulti-Company access is available on eligible plans. Company limits depend on the selected subscription." },
      { q: "Can multiple users access the same company?", a: "Yes, depending on the subscription plan.\n\n• Starter Plan: Single User\n• Professional Plan: Multiple Users\n• Enterprise Plan: Custom User Limits" },
      { q: "Can I create Sub-Admins?", a: "Yes. Supported plans allow role-based access and user permissions." }
    ]
  },
  {
    title: "Exports",
    icon: Download,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50",
    description: "Export options for documents and reports",
    faqs: [
      { q: "Can I export only today's uploaded documents?", a: "Yes.\n\nUsers can export:\n\n• Latest Upload Batch\n• Selected Batch\n• Selected Documents\n• Date Range\n• Current Month\n• Current Quarter\n• Current Year" },
      { q: "Can I export approved documents only?", a: "Yes. Filters are available for:\n\n• Approved Documents\n• Pending Review\n• All Documents" }
    ]
  },
  {
    title: "Accounting Software",
    icon: Link2,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50",
    description: "Integration with accounting platforms",
    faqs: [
      { q: "Does Invonix integrate directly with QuickBooks, Xero, Wafeq, or Zoho Books?", a: "Not currently.\n\nInvonix exports structured financial data in Excel and CSV formats that can be imported into most accounting systems." },
      { q: "Can I use Invonix alongside my existing accounting software?", a: "Yes.\n\nInvonix is designed to complement existing accounting workflows by providing clean, structured data for finance teams and accountants." }
    ]
  },
  {
    title: "Security & Privacy",
    icon: ShieldCheck,
    iconColor: "text-slate-600",
    iconBg: "bg-slate-100",
    description: "Data protection and access control",
    faqs: [
      { q: "Is my data secure?", a: "Yes. Invonix uses secure cloud infrastructure and access controls to protect customer data." },
      { q: "Who can access my documents?", a: "Only authorized users within your organization can access your documents." },
      { q: "Do you share customer data?", a: "No. Customer data is never sold or shared with third parties without authorization." }
    ]
  },
  {
    title: "Pricing & Billing",
    icon: CreditCard,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
    description: "Plans, trials, and payments",
    faqs: [
      { q: "Is there a free trial?", a: "Yes. New customers can request a free trial before subscribing." },
      { q: "What currency are subscription plans priced in?", a: "All plans are priced in USD." },
      { q: "Can I upgrade my plan later?", a: "Yes. Plans can be upgraded at any time." },
      { q: "Can I cancel my subscription?", a: "Yes. Subscriptions can be cancelled according to the terms of your plan." },
      { q: "What payment methods do you accept?", a: "Major credit and debit cards are accepted through our secure payment platform." }
    ]
  },
  {
    title: "Referral Program",
    icon: Gift,
    iconColor: "text-pink-600",
    iconBg: "bg-pink-50",
    description: "Referral benefits and tracking",
    faqs: [
      { q: "How does the referral program work?", a: "Share your referral code with friends, colleagues, or clients.\n\nWhen they subscribe using your code, the configured referral discount is automatically applied." },
      { q: "Can I track my referrals?", a: "Yes. Eligible users can view referral activity through their account dashboard." }
    ]
  },
  {
    title: "Training & Support",
    icon: GraduationCap,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    description: "Training materials and customer support",
    faqs: [
      { q: "Do you provide training?", a: "Yes.\n\nAll customers receive access to:\n\n• Video Tutorials\n• User Guides\n• Knowledge Base\n• FAQ Center" },
      { q: "Do you provide customer support?", a: "Yes.\n\nSupport is available through:\n\n• Email Support\n• WhatsApp Support\n• Help Center" },
      { q: "How quickly can my team learn Invonix?", a: "Most users can begin processing documents within minutes using our onboarding materials and video guides." }
    ]
  },
  {
    title: "Enterprise Onboarding",
    icon: Building2,
    iconColor: "text-primary-dark",
    iconBg: "bg-primary/8",
    description: "Enterprise features and onboarding",
    faqs: [
      { q: "Do you offer enterprise onboarding?", a: "Yes.\n\nEnterprise customers receive:\n\n• Dedicated onboarding sessions\n• Team training workshops\n• Multi-user setup assistance\n• Workflow configuration support\n• Best practice consultation\n• Priority support\n• Dedicated account management" },
      { q: "Who should choose the Enterprise Onboarding Package?", a: "Recommended for:\n\n• Accounting Firms\n• Large SMEs\n• Corporate Finance Teams\n• Multi-Company Organizations\n• High-Volume Document Processing Businesses" }
    ]
  },
  {
    title: "Getting Started",
    icon: Rocket,
    iconColor: "text-secondary",
    iconBg: "bg-secondary/8",
    description: "Setup and onboarding",
    faqs: [
      { q: "How do I start using Invonix?", a: "Step 1: Create an account\n\nStep 2: Create your company\n\nStep 3: Upload documents\n\nStep 4: Review AI-extracted data\n\nStep 5: Approve documents\n\nStep 6: Analyze financial insights\n\nStep 7: Export reports and structured data" },
      { q: "How long does setup take?", a: "Most businesses can start processing documents on the same day." }
    ]
  }
];

// Get all unique category titles for search filter
const categoryOptions = ["All Categories", ...faqCategories.map(cat => cat.title)];

// ============================================================
// Helper function to render text with line breaks
// ============================================================
function renderWithLineBreaks(text: string) {
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      {i < text.split('\n').length - 1 && <br />}
    </span>
  ));
}

// ============================================================
// Components
// ============================================================
function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-10">
      <p className="text-xs font-semibold tracking-[0.08em] uppercase text-indigo-600 mb-2">{label}</p>
      <h2 className="font-bold text-2xl sm:text-3xl text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 text-[15px] max-w-md mx-auto">{subtitle}</p>
    </div>
  );
}

function AttachmentUpload({ attachments, onAdd, onRemove }: {
  attachments: Attachment[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">Attachments (Optional)</label>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-lg border-2 border-dashed border-slate-200 text-sm px-3.5 py-3 text-slate-600 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Paperclip className="w-4 h-4" />
        <span>Click to upload files</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAdd(e.target.files);
            e.target.value = '';
          }
        }}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
      />
      <p className="text-xs text-slate-400 mt-1.5">Supports PDF, JPG, PNG, DOC, TXT (Max 10MB each)</p>

      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{attachment.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(attachment.size)}</p>
                </div>
              </div>
              <button type="button" onClick={() => onRemove(attachment.id)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SupportTicketForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success">("idle");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(true);

  useEffect(() => {
    const fetchIssueTypes = async () => {
      try {
        const res = await fetch(apiUrl("/api/support/issue-types/active"), {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setIssueTypes(data.data);
      } catch (err) {
        console.error("Failed to fetch issue types", err);
      } finally {
        setLoadingIssueTypes(false);
      }
    };
    fetchIssueTypes();
  }, []);

  const handleAddAttachments = (files: FileList) => {
    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file: file,
      name: file.name,
      size: file.size,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      issueType: "",
      message: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      issueType: Yup.string().required("Please select an issue"),
      message: Yup.string().min(10, "Please provide more detail (minimum 10 characters)").required("Message is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        setSubmitState("loading");
        const selectedIssueType = issueTypes.find(issue => issue.name === values.issueType);
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("email", values.email);
        formData.append("issueType", values.issueType);
        formData.append("priority", selectedIssueType?.priority || "medium");
        formData.append("message", values.message);
        attachments.forEach((attachment) => formData.append("attachments", attachment.file));

        const res = await fetch(apiUrl("/api/support"), {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed");

        setSubmitState("success");
        resetForm();
        setAttachments([]);
        onSuccess();
        setTimeout(() => setSubmitState("idle"), 3000);
      } catch (err) {
        console.error(err);
        setSubmitState("idle");
        alert("Failed to send message. Please try again.");
      }
    },
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 md:p-8">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Send className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="font-bold text-xl text-slate-800">Create Support Ticket</h3>
        <p className="text-slate-500 text-sm mt-1">Our support team will respond within 24 hours</p>
      </div>

      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name *</label>
            <input
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              type="text"
              placeholder="Your full name"
              className="w-full rounded-lg border border-slate-200 text-sm px-3.5 py-2.5 text-slate-800 bg-white outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300"
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Email Address *</label>
            <input
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-slate-200 text-sm px-3.5 py-2.5 text-slate-800 bg-white outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.email}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Issue Type *</label>
          <select
            name="issueType"
            value={formik.values.issueType}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full rounded-lg border border-slate-200 text-sm px-3.5 py-2.5 text-slate-800 bg-white outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300"
          >
            <option value="" disabled>
              {loadingIssueTypes ? "Loading..." : "Select a category…"}
            </option>
            {issueTypes.map((issue) => (
              <option key={issue._id} value={issue.name}>
                {issue.description}
              </option>
            ))}
          </select>
          {formik.touched.issueType && formik.errors.issueType && (
            <p className="text-xs text-red-500 mt-1">{formik.errors.issueType}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Message *</label>
          <textarea
            name="message"
            value={formik.values.message}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            rows={4}
            placeholder="Please describe your issue or question in detail..."
            className="w-full rounded-lg border border-slate-200 text-sm px-3.5 py-2.5 text-slate-800 bg-white outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 resize-y"
          />
          {formik.touched.message && formik.errors.message && (
            <p className="text-xs text-red-500 mt-1">{formik.errors.message}</p>
          )}
        </div>

        <AttachmentUpload
          attachments={attachments}
          onAdd={handleAddAttachments}
          onRemove={handleRemoveAttachment}
        />

        <button
          type="submit"
          disabled={submitState === "loading" || !formik.isValid}
          className={`w-full py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${submitState === "success"
            ? "bg-emerald-500 text-white"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
            } disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          {submitState === "idle" && "Submit Ticket"}
          {submitState === "loading" && (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Submitting...
            </span>
          )}
          {submitState === "success" && (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Ticket submitted successfully!
            </span>
          )}
        </button>
      </form>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================
export default function SupportPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [openCategory, setOpenCategory] = useState<string | null>("General");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketCount, setTicketCount] = useState(0);
  
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
      setLoadingTickets(true);
      const res = await fetch(apiUrl("/api/support?limit=5&offset=0"), {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data.data || []);
        setTicketCount(data.total || data.data?.length || 0);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const toggleFaq = (categoryTitle: string, index: number) => {
    const faqId = `${categoryTitle}-${index}`;
    setOpenFaqId(prev => prev === faqId ? null : faqId);
  };

  const toggleCategory = (categoryTitle: string) => {
    setOpenCategory(prev => prev === categoryTitle ? null : categoryTitle);
    setOpenFaqId(null);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory("All Categories");
  };

  const filteredCategories = faqCategories
    .filter(category => {
      if (selectedCategory !== "All Categories" && category.title !== selectedCategory) {
        return false;
      }
      return true;
    })
    .map(category => ({
      ...category,
      faqs: category.faqs.filter(faq => 
        searchQuery === "" || 
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(category => category.faqs.length > 0);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "resolved":
        return { color: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle2, label: "Resolved" };
      case "in_progress":
        return { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: AlertCircle, label: "In Progress" };
      default:
        return { color: "bg-red-50 text-red-600 border-red-200", icon: HelpCircle, label: "Open" };
    }
  };

  const totalResults = filteredCategories.reduce((acc, cat) => acc + cat.faqs.length, 0);

  return (
    <div className="flex h-screen bg-[#f8f9fb]">
      <Sidebar />
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, marginLeft: mounted ? sidebarWidth : 260 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <TopBar title="Help & Support" />
        
        <main className="flex-1 overflow-y-auto">
          <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white">
            <div className="max-w-4xl mx-auto px-6 py-16 text-center relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Help Center
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">How can we help you?</h1>
              <p className="text-white/80 text-lg max-w-md mx-auto mb-9">
                Find answers, get support, and manage your tickets.
              </p>
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
              <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />
            </div>
          </section>

          <section className="bg-white border-b border-slate-100 py-16 px-6">
            <div className="max-w-5xl mx-auto">
              <SectionHeader
                label="Browse Topics"
                title="Frequently Asked Questions"
                subtitle="Find quick answers to common questions about Invonix."
              />
              
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search FAQs by keywords..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 outline-none transition text-slate-800"
                    />
                  </div>
                  
                  <div className="relative sm:w-64">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full appearance-none pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 outline-none transition text-slate-800 text-sm cursor-pointer"
                    >
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  </div>
                  
                  {(searchQuery || selectedCategory !== "All Categories") && (
                    <button
                      onClick={clearSearch}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600 text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      Clear Filters
                    </button>
                  )}
                </div>
                
                {(searchQuery || selectedCategory !== "All Categories") && (
                  <div className="mt-3 text-sm text-slate-500">
                    Found {totalResults} result{totalResults !== 1 ? 's' : ''}
                    {searchQuery && <span> for "<span className="font-medium text-slate-700">{searchQuery}</span>"</span>}
                    {selectedCategory !== "All Categories" && <span> in <span className="font-medium text-slate-700">{selectedCategory}</span></span>}
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <div key={category.title} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <button
                      onClick={() => toggleCategory(category.title)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${category.iconBg}`}>
                          <category.icon className={`w-4 h-4 ${category.iconColor}`} />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-800">{category.title}</h2>
                          <p className="text-xs text-slate-400 mt-0.5">{category.description}</p>
                        </div>
                        <span className="text-sm text-slate-400 ml-2">({category.faqs.length})</span>
                      </div>
                      {openCategory === category.title ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    
                    {openCategory === category.title && (
                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {category.faqs.map((faq, idx) => {
                          const faqId = `${category.title}-${idx}`;
                          const isOpen = openFaqId === faqId;
                          return (
                            <div key={idx}>
                              <button
                                onClick={() => toggleFaq(category.title, idx)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors group"
                              >
                                <span className="text-sm font-extrabold text-slate-800 pr-4 group-hover:text-indigo-600 transition-colors">
                                  {faq.q}
                                </span>
                                {isOpen ? (
                                  <ChevronUp className="w-4 h-4 text-indigo-500 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-indigo-400" />
                                )}
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-4">
                                  <div className="pl-2 border-l-2 border-indigo-200">
                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                      {renderWithLineBreaks(faq.a)}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No results found</p>
                    <button
                      onClick={clearSearch}
                      className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium inline-flex items-center gap-1"
                    >
                      Clear all filters
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-indigo-50 to-violet-50 py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <SupportTicketForm onSuccess={fetchTickets} />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Ticket className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">Your Support Tickets</h3>
                          <p className="text-xs text-slate-500">
                            You have {ticketCount} ticket{ticketCount !== 1 ? 's' : ''} in total
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push("/dashboard/support/tickets")}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        View All
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {loadingTickets ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No support tickets yet</p>
                        <p className="text-slate-400 text-xs mt-1">Submit a ticket above to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tickets.map((ticket) => {
                          const statusConfig = getStatusConfig(ticket.status);
                          const StatusIcon = statusConfig.icon;
                          return (
                            <div
                              key={ticket._id}
                              onClick={() => router.push(`/dashboard/support/detail/${ticket._id}`)}
                              className="group p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:shadow-lg hover:border-indigo-200 transition-all duration-200 hover:-translate-y-0.5"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                                      <Tag className="w-3 h-3 text-indigo-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-800">
                                      {ticket.issueType}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                    {ticket.message}
                                  </p>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                      <Clock className="w-3 h-3 ml-1" />
                                      {new Date(ticket.createdAt).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    
                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig.color}`}>
                                      <StatusIcon className="w-3 h-3" />
                                      {statusConfig.label}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {tickets.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                        <button
                          onClick={() => router.push("/dashboard/support/tickets")}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1 group"
                        >
                          View all {ticketCount} tickets
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </motion.div>
    </div>
  );
}