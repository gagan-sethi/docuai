"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Save,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiUrl } from "@/lib/api";
import { toast } from "react-toastify";
import ManagePlanModal from "@/components/dashboard/ManagePlanModal";

interface Company {
  _id: string;
  userId: string;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  status: "active" | "inactive";
  address?: {
    line?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CompanyFormData {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  address?: {
    line?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  offset: number;
  hasMore: boolean;
}

interface PlanData {
  plan: string;
  label: string;

  documentsPerMonth: number | "Unlimited";
  documentsUsed: number;
  documentsRemaining: number | "Unlimited";

  pagesPerMonth: number | "Unlimited";
  pagesUsed: number;
  pagesRemaining: number | "Unlimited";

  maxUsers: number;

  viewerIsOwner: boolean;
  isManagedByTeam: boolean;

  planStartedAt?: string;
  planExpiresAt?: string | null;

  usagePercent: number;
  pagesUsagePercent: number;
}

const initialFormData: CompanyFormData = {
  name: "",
  legalName: "",
  email: "",
  phone: "",
  status: "active",
  address: {
    line: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
  },
};

export default function CompaniesPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 5,
    total: 0,
    offset: 0,
    hasMore: false,
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Form states
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [planLoading, setPlanLoading] = useState(false);


  // Calculate page from offset and limit
  const calculatePage = (offset: number, limit: number): number => {
    return Math.floor(offset / limit) + 1;
  };

  // Fetch companies with filters and pagination
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);

      // Calculate offset from page
      const offset = (pagination.page - 1) * pagination.limit;

      // Build query params
      const params = new URLSearchParams();
      params.append("limit", String(pagination.limit));
      params.append("offset", String(offset));

      if (searchTerm) {
        params.append("search", searchTerm);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const url = apiUrl(`/api/company?${params.toString()}`);

      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch companies");
      }

      const data = await res.json();
      setCompanies(data.companies || []);

      if (data.pagination) {
        setPagination({
          ...data.pagination,
          page: calculatePage(data.pagination.offset, data.pagination.limit),
        });
      }

      if (data.counts) {
        setStats(data.counts);
      }
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      toast.error(error.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter]);

  const fetchPlan = useCallback(async () => {
    try {
      setPlanLoading(true);

      const res = await fetch(apiUrl("/api/plan"), {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch plan");
      }

      const data = await res.json();

      setPlanData(data);
    } catch (error) {
      console.error("Failed to fetch plan:", error);
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return;
    const observer = new ResizeObserver(() => setSidebarWidth(sidebar.clientWidth));
    observer.observe(sidebar);
    setSidebarWidth(sidebar.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Debounced search - reset to page 1 when search/filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchCompanies();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    if (!pagination.hasMore && newPage > pagination.page) return;

    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name || !formData.name.trim()) {
      errors.name = "Company name is required";
    } else if (formData.name.length > 200) {
      errors.name = "Company name must be less than 200 characters";
    }

    if (!formData.legalName || !formData.legalName.trim()) {
      errors.legalName = "legal name is required";
    } else if (formData.legalName.length > 250) {
      errors.legalName = "Legal name must be less than 250 characters";
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = "email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (formData.address?.postalCode && !/^\d{4,10}$/.test(formData.address.postalCode)) {
      errors["address.postalCode"] = "Invalid postal code format";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setFormLoading(true);

      // Prepare data - remove empty address fields
      const submitData: any = {
        name: formData.name.trim(),
        legalName: formData.legalName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        status: formData.status,
      };

      // Only include address if it has any non-empty fields
      if (formData.address) {
        const hasAddressFields = Object.values(formData.address).some(v => v && v.trim());
        if (hasAddressFields) {
          submitData.address = {
            line: formData.address.line || undefined,
            city: formData.address.city || undefined,
            state: formData.address.state || undefined,
            country: formData.address.country || "India",
            postalCode: formData.address.postalCode || undefined,
          };
        }
      }

      const res = await fetch(apiUrl("/api/company"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Check if it's a company limit error
        if (data.code === "COMPANY_LIMIT_REACHED") {
          await fetchPlan();

          setIsCreateModalOpen(false);
          setShowPlanModal(true);
          toast.error(data.error);
          return;
        }
        throw new Error(data.error || "Failed to create company");
      }

      toast.success("Company created successfully");
      setIsCreateModalOpen(false);
      setFormData(initialFormData);
      // Reset to first page and refresh
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchCompanies();
      fetchPlan();
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast.error(error.message || "Failed to create company");
    } finally {
      setFormLoading(false);
    }
  };

  // Update company
  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedCompany) return;

    try {
      setFormLoading(true);

      // Prepare data
      const submitData: any = {
        name: formData.name.trim(),
        legalName: formData.legalName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        status: formData.status,
      };

      // Only include address if it has any non-empty fields
      if (formData.address) {
        const hasAddressFields = Object.values(formData.address).some(v => v && v.trim());
        if (hasAddressFields) {
          submitData.address = {
            line: formData.address.line || undefined,
            city: formData.address.city || undefined,
            state: formData.address.state || undefined,
            country: formData.address.country || "India",
            postalCode: formData.address.postalCode || undefined,
          };
        } else {
          submitData.address = undefined;
        }
      }

      const res = await fetch(apiUrl(`/api/company/${selectedCompany._id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update company");
      }

      toast.success("Company updated successfully");
      setIsEditModalOpen(false);
      setSelectedCompany(null);
      setFormData(initialFormData);
      fetchCompanies();
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.message || "Failed to update company");
    } finally {
      setFormLoading(false);
    }
  };

  // Open edit modal
  const handleEditClick = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      legalName: company.legalName || "",
      email: company.email || "",
      phone: company.phone || "",
      status: company.status,
      address: {
        line: company.address?.line || "",
        city: company.address?.city || "",
        state: company.address?.state || "",
        country: company.address?.country || "India",
        postalCode: company.address?.postalCode || "",
      },
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open view modal
  const handleViewClick = (company: Company) => {
    setSelectedCompany(company);
    setIsViewModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <TopBar title="Companies" />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Companies</h2>
                <p className="text-sm text-slate-500">
                  Manage your business entities and their details
                </p>
              </div>
              <button
                onClick={() => {
                  setFormData(initialFormData);
                  setFormErrors({});
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
              >
                <Plus className="w-4 h-4" />
                Add Company
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Total Companies", value: stats.total, icon: Building2, color: "text-primary" },
                { label: "Active Companies", value: stats.active, icon: CheckCircle2, color: "text-green-600" },
                { label: "Inactive Companies", value: stats.inactive, icon: XCircle, color: "text-red-500" },
                { label: "Pages", value: totalPages, icon: FileText, color: "text-accent" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
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

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search companies by name, legal name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center bg-white gap-2 border border-slate-200 rounded-xl px-3 ">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-1 py-2.5 bg-white focus:outline-none "
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Companies List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : companies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <Building2 className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No companies found</h3>
                  <p className="text-sm text-slate-400">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter"
                      : "Get started by adding your first company"}
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <button
                      onClick={() => {
                        setFormData(initialFormData);
                        setFormErrors({});
                        setIsCreateModalOpen(true);
                      }}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add Company
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-50">
                    {companies.map((company, index) => (
                      <motion.div
                        key={company._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-5 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900">{company.name}</h3>
                                {company.legalName && company.legalName !== company.name && (
                                  <p className="text-xs text-slate-400">{company.legalName}</p>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${company.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}>
                                {company.status === "active" ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                              {company.email && (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{company.email}</span>
                                </div>
                              )}
                              {company.phone && (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>{company.phone}</span>
                                </div>
                              )}
                              {company.address?.city && (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">
                                    {[company.address.city, company.address.state]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleViewClick(company)}
                              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </button>
                            <button
                              onClick={() => handleEditClick(company)}
                              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit Company"
                            >
                              <Edit className="w-4 h-4 text-slate-500" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                      <p className="text-sm text-slate-500">
                        Showing {companies.length} of {pagination.total} companies
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          disabled={pagination.page === 1}
                          onClick={() => handlePageChange(pagination.page - 1)}
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-400" />
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${pageNum === pagination.page
                                ? "bg-primary text-white"
                                : "hover:bg-slate-50 text-slate-600"
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          disabled={!pagination.hasMore || pagination.page === totalPages}
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
          </div>
        </main>
      </div>

      {/* Create Company Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsCreateModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <form onSubmit={handleCreateCompany}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Add New Company</h3>
                      <p className="text-xs text-slate-400">Create a new business entity</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg border ${formErrors.name ? "border-red-500" : "border-slate-200"
                            } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                          placeholder="Enter company name"
                        />
                        {formErrors.name && (
                          <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Legal Name
                        </label>
                        <input
                          type="text"
                          name="legalName"
                          value={formData.legalName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="Enter legal name"
                        />
                        {formErrors.legalName && (
                          <p className="text-xs text-red-500 mt-1">{formErrors.legalName}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg border ${formErrors.email ? "border-red-500" : "border-slate-200"
                            } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                          placeholder="company@example.com"
                        />
                        {formErrors.email && (
                          <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Address Information
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="address.line"
                          value={formData.address?.line || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="Street address"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            name="address.city"
                            value={formData.address?.city || ""}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="City"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            name="address.state"
                            value={formData.address?.state || ""}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="State"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            name="address.country"
                            value={formData.address?.country || "India"}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Country"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            name="address.postalCode"
                            value={formData.address?.postalCode || ""}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 rounded-lg border ${formErrors["address.postalCode"] ? "border-red-500" : "border-slate-200"
                              } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                            placeholder="Postal code"
                          />
                          {formErrors["address.postalCode"] && (
                            <p className="text-xs text-red-500 mt-1">{formErrors["address.postalCode"]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {formLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Create Company
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Company Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedCompany && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <form onSubmit={handleUpdateCompany}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Edit className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Edit Company</h3>
                      <p className="text-xs text-slate-400">Update company information</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Legal Name
                        </label>
                        <input
                          type="text"
                          name="legalName"
                          value={formData.legalName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Address Information
                    </h4>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="address.line"
                        value={formData.address?.line || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="Street Address"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address?.city || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          name="address.state"
                          value={formData.address?.state || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="State"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="address.country"
                          value={formData.address?.country || "India"}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="Country"
                        />
                        <input
                          type="text"
                          name="address.postalCode"
                          value={formData.address?.postalCode || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="Postal Code"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Company Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedCompany && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsViewModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedCompany.name}</h3>
                    {selectedCompany.legalName && selectedCompany.legalName !== selectedCompany.name && (
                      <p className="text-xs text-slate-400">Legal Name: {selectedCompany.legalName}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex justify-start">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedCompany.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                    }`}>
                    {selectedCompany.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                {(selectedCompany.email || selectedCompany.phone) && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Contact Information
                    </h4>
                    <div className="space-y-2">
                      {selectedCompany.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{selectedCompany.email}</span>
                        </div>
                      )}
                      {selectedCompany.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{selectedCompany.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedCompany.address && Object.values(selectedCompany.address).some(v => v) && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Address
                    </h4>
                    <div className="text-sm text-slate-600 space-y-1">
                      {selectedCompany.address.line && <p>{selectedCompany.address.line}</p>}
                      <p>
                        {[selectedCompany.address.city, selectedCompany.address.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p>
                        {[selectedCompany.address.postalCode, selectedCompany.address.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                    <div>
                      <span className="font-medium">Created</span>
                      <p>{new Date(selectedCompany.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Last Updated</span>
                      <p>{new Date(selectedCompany.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEditClick(selectedCompany);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Edit Company
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Add this after your modals */}
      <ManagePlanModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        planData={planData}
      // loading={planLoading}
      />
    </div>
  );
}