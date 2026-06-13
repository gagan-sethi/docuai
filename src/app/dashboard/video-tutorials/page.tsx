"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    Clock,
    Search,
    X,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiUrl, handleUnauthorized } from "@/lib/api";
import { toast } from "react-toastify";

interface VideoTutorial {
    _id: string;
    title: string;
    description: string;
    youtubeUrl: string;
    thumbnail: string;
    duration?: string;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatDuration(duration?: string): string {
    if (!duration) return "—";
    return duration;
}

export default function VideoTutorialsPage() {
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [videos, setVideos] = useState<VideoTutorial[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const limit = 9;
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentSearchRef = useRef("");

    // Fetch videos function - independent of state
    const fetchVideos = useCallback(async (page: number, search: string, showLoader: boolean = true) => {
        try {
            if (showLoader) {
                setLoading(true);
            }

            const offset = (page - 1) * limit;

            const params = new URLSearchParams({
                offset: String(offset),
                limit: String(limit),
            });

            if (search) {
                params.append("search", search);
            }

            const res = await fetch(apiUrl(`/api/support/video-tutorials?${params}`), {
                credentials: "include",
            });

            if (await handleUnauthorized(res)) return;

            if (!res.ok) throw new Error("Failed to fetch video tutorials");

            const data = await res.json();
            setVideos(data.data || []);
            setTotalItems(data.total);
            setTotalPages(Math.ceil(data.total / limit));
        } catch (error) {
            console.error("Error fetching videos:", error);
            if (showLoader) {
                toast.error("Failed to load video tutorials");
            }
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    }, [limit]);

    // Initial load
    useEffect(() => {
        fetchVideos(1, "", true);
    }, []);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
        fetchVideos(newPage, currentSearchRef.current, true);
    };

    // Handle search with debounce
    const handleSearch = (value: string) => {
        setSearchTerm(value);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set new timeout
        searchTimeoutRef.current = setTimeout(() => {
            const newSearch = value;
            currentSearchRef.current = newSearch;
            setCurrentPage(1);
            fetchVideos(1, newSearch, false); // No loader on search
        }, 500);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const sidebar = document.querySelector("aside");
        if (!sidebar) return;
        const observer = new ResizeObserver(() => setSidebarWidth(sidebar.clientWidth));
        observer.observe(sidebar);
        setSidebarWidth(sidebar.clientWidth);
        return () => observer.disconnect();
    }, []);

    // Handle view video
    const handleViewVideo = (video: VideoTutorial) => {
        setSelectedVideo(video);
        setIsViewModalOpen(true);
    };

    // Close view modal
    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedVideo(null);
    };

    // Get YouTube embed URL
    const getYoutubeEmbedUrl = (url: string): string => {
        try {
            const parsed = new URL(url);
            let videoId = parsed.searchParams.get("v");
            if (!videoId && parsed.hostname === "youtu.be") {
                videoId = parsed.pathname.slice(1);
            }
            if (!videoId && parsed.pathname.startsWith("/shorts/")) {
                videoId = parsed.pathname.split("/")[2];
            }
            if (!videoId && parsed.pathname.startsWith("/embed/")) {
                videoId = parsed.pathname.split("/")[2];
            }
            return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
        } catch {
            return url;
        }
    };

    const startIndex = (currentPage - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalItems);

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <div
                className="flex flex-col min-h-screen transition-all duration-200"
                style={{ marginLeft: sidebarWidth }}
            >
                <TopBar title="Video Tutorials" />

                <main className="flex-1 p-6">
                    <div className="space-y-6">
                        {/* Header */}
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Video Tutorials</h2>
                            <p className="text-sm text-slate-500">
                                Learn how to use DocuAI with our step-by-step video guides
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search tutorials by title or description..."
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        {/* Video Grid */}
                        {loading && videos.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : videos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                    <Play className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">No videos found</h3>
                                <p className="text-sm text-slate-400">
                                    {searchTerm
                                        ? "Try adjusting your search term"
                                        : "No video tutorials available at the moment"}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {videos.map((video, index) => (
                                        <motion.div
                                            key={video._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => handleViewVideo(video)}
                                        >
                                            {/* Thumbnail */}
                                            <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200">
                                                {video.thumbnail ? (
                                                    <img
                                                        src={video.thumbnail}
                                                        alt={video.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Play className="w-12 h-12 text-slate-400" />
                                                    </div>
                                                )}
                                                {/* Play overlay on hover */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="bg-white rounded-full p-3">
                                                        <Play className="w-6 h-6 text-primary fill-primary" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h3 className="font-semibold text-slate-900 line-clamp-2">
                                                        {video.title}
                                                    </h3>
                                                </div>

                                                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                                    {video.description || "No description available"}
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    {video.duration && (
                                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{formatDuration(video.duration)}</span>
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-slate-400">
                                                        {formatDate(video.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4">
                                        <p className="text-sm text-slate-500">
                                            Showing {startIndex + 1} to {endIndex} of {totalItems} videos
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="w-4 h-4 text-slate-400" />
                                            </button>

                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum: number;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${pageNum === currentPage
                                                                ? "bg-primary text-white"
                                                                : "hover:bg-slate-50 text-slate-600"
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}

                                            <button
                                                disabled={currentPage === totalPages}
                                                onClick={() => handlePageChange(currentPage + 1)}
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
                </main>
            </div>

            {/* Video View Modal */}
            <AnimatePresence>
                {isViewModalOpen && selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={closeViewModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">{selectedVideo.title}</h3>
                                <button
                                    onClick={closeViewModal}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Video Embed */}
                                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden mb-4">
                                    <iframe
                                        src={getYoutubeEmbedUrl(selectedVideo.youtubeUrl)}
                                        title={selectedVideo.title}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Description</label>
                                    <p className="text-slate-700 whitespace-pre-wrap">
                                        {selectedVideo.description || "No description available"}
                                    </p>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedVideo.duration && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 mb-1">Duration</label>
                                            <p className="text-slate-900">{formatDuration(selectedVideo.duration)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Published</label>
                                        <p className="text-slate-900">{formatDate(selectedVideo.createdAt)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 flex gap-3">
                                <button
                                    onClick={closeViewModal}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                                >
                                    Close
                                </button>
                                <a
                                    href={selectedVideo.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-center font-medium"
                                >
                                    Watch on YouTube
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}