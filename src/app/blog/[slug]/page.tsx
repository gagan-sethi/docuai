import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, Tag, ArrowLeft, Share2, User, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPostBySlug, getRelatedPosts } from "@/lib/wordpress";

interface BlogPostPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug, false); // false here since we just need basic data for metadata
    if (!post) return { title: "Post not found – Invonix Blog" };

    return {
        title: `${post.title} – Invonix Blog`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: "article",
            publishedTime: post.date,
            modifiedTime: post.modified,
            images: post.featuredImage ? [{ url: post.featuredImage, alt: post.title }] : [],
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.excerpt,
            images: post.featuredImage ? [post.featuredImage] : [],
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug, true); // true = include comments
    if (!post) notFound();

    const relatedPosts = await getRelatedPosts(post.categories.map((c) => c.id), post.id, 3);

    const shareUrl = `https://invonix.com/blog/${post.slug}`; // ← update with real domain
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(post.title);

    // Separate top-level comments and replies
    const topLevelComments = (post.comments || []).filter((c) => c.parentId === 0);
    const replies = (post.comments || []).filter((c) => c.parentId !== 0);

    // Build comment thread structure
    const commentThread = topLevelComments.map((comment) => ({
        ...comment,
        replies: replies.filter((r) => r.parentId === comment.id),
    }));

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-white">
                {/* Header */}
                <section className="pt-28 pb-0 bg-gradient-to-b from-slate-50 to-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-8">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Blog
                        </Link>

                        {post.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/blog?category=${cat.slug}`}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-widest bg-primary/8 px-3 py-1 rounded-full hover:bg-primary/15 transition-colors"
                                    >
                                        <Tag className="w-3 h-3" />
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
                            {post.title}
                        </h1>

                        <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-muted">
                            <div className="flex items-center gap-2">
                                {post.author.avatar ? (
                                    <Image src={post.author.avatar} alt={post.author.name} width={28} height={28} className="rounded-full" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                )}
                                <span className="font-medium text-slate-700">{post.author.name}</span>
                            </div>
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="w-4 h-4" />
                                {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {post.readingTime} min read
                            </span>
                            {post.commentCount > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <MessageCircle className="w-4 h-4" />
                                    {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
                                </span>
                            )}
                        </div>
                    </div>

                    {post.featuredImage && (
                        <div className="mt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10">
                                <Image
                                    src={post.featuredImage}
                                    alt={post.featuredImageAlt || post.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1280px) 100vw, 1280px"
                                    priority
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* Content + Sidebar */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                    <div className="grid lg:grid-cols-[1fr_280px] gap-12 items-start">
                        <article
                            className="prose prose-slate prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-slate-900
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-md
                prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                prose-code:bg-slate-100 prose-code:text-primary prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono
                prose-pre:bg-slate-900 prose-pre:rounded-xl"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        <aside className="lg:sticky lg:top-28 space-y-6">
                            {/* Share */}
                            <div className="rounded-2xl border border-border p-5">
                                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <Share2 className="w-4 h-4" /> Share this article
                                </h3>
                                <div className="flex flex-col gap-2">

                                    <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-[#1d9bf0] hover:text-white text-slate-700 text-sm font-medium transition-all group"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                        Share on X / Twitter
                                    </a>

                                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-[#0a66c2] hover:text-white text-slate-700 text-sm font-medium transition-all group"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                        Share on LinkedIn
                                    </a>
                                </div>
                            </div>

                            {/* Tags */}
                            {post.tags.length > 0 && (
                                <div className="rounded-2xl border border-border p-5">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.map((tag) => (
                                            <span key={tag.id} className="px-3 py-1 rounded-full bg-slate-50 border border-border text-xs text-muted font-medium">
                                                #{tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <div className="rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-secondary p-5 text-white">
                                <h3 className="font-bold text-base mb-1">Try Invonix free</h3>
                                <p className="text-sm text-white/80 mb-4">Automate your invoices and expense tracking in minutes.</p>
                                <Link href="/signup" className="block text-center bg-white text-primary font-semibold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                                    Get started →
                                </Link>
                            </div>
                        </aside>
                    </div>
                </section>

                {/* Comments Section */}
                {post.commentStatus === "open" && (
                    <section className="border-t border-border py-14">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                                <MessageCircle className="w-6 h-6" />
                                Comments ({post.commentCount})
                            </h2>

                            {commentThread.length > 0 ? (
                                <div className="space-y-6">
                                    {commentThread.map((comment) => (
                                        <div key={comment.id}>
                                            {/* Top-level comment */}
                                            <div className="bg-slate-50 rounded-xl p-6 border border-border">
                                                <div className="flex gap-4">
                                                    {/* Avatar */}
                                                    {comment.authorAvatar ? (
                                                        <Image
                                                            src={comment.authorAvatar}
                                                            alt={comment.authorName}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-full flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                                                            <User className="w-5 h-5 text-primary" />
                                                        </div>
                                                    )}

                                                    {/* Comment content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline gap-2 mb-2">
                                                            <h4 className="font-semibold text-slate-900">{comment.authorName}</h4>
                                                            <span className="text-xs text-muted">
                                                                {new Date(comment.date).toLocaleDateString("en-US", {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    year: "numeric",
                                                                })}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-700 text-sm leading-relaxed">
                                                            {comment.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Replies */}
                                            {comment.replies.length > 0 && (
                                                <div className="mt-4 ml-8 space-y-4">
                                                    {comment.replies.map((reply) => (
                                                        <div key={reply.id} className="bg-white rounded-xl p-5 border border-slate-200">
                                                            <div className="flex gap-3">
                                                                {/* Avatar */}
                                                                {reply.authorAvatar ? (
                                                                    <Image
                                                                        src={reply.authorAvatar}
                                                                        alt={reply.authorName}
                                                                        width={36}
                                                                        height={36}
                                                                        className="rounded-full flex-shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                                                                        <User className="w-4 h-4 text-primary" />
                                                                    </div>
                                                                )}

                                                                {/* Reply content */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-baseline gap-2 mb-1">
                                                                        <h5 className="font-semibold text-slate-900 text-sm">{reply.authorName}</h5>
                                                                        <span className="text-xs text-muted">
                                                                            {new Date(reply.date).toLocaleDateString("en-US", {
                                                                                month: "short",
                                                                                day: "numeric",
                                                                                year: "numeric",
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-slate-700 text-sm leading-relaxed">
                                                                        {reply.content}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-600">No comments yet. Be the first to comment!</p>
                                </div>
                            )}

                            {/* Comment form notice */}
                            {post.commentStatus === "open" && (
                                <div className="mt-12 bg-primary/5 rounded-xl border border-primary/20 p-6">
                                    <h3 className="font-semibold text-slate-900 mb-2">Leave a comment</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Comments are moderated and will appear after they are approved.
                                    </p>
                                    <p className="text-xs text-muted">
                                        📝 Please note: Comments must be left on WordPress directly.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Related posts */}
                {relatedPosts.length > 0 && (
                    <section className="bg-slate-50 border-t border-border py-14">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-8">Related Articles</h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {relatedPosts.map((related) => (
                                    <Link
                                        key={related.id}
                                        href={`/blog/${related.slug}`}
                                        className="group flex flex-col rounded-2xl bg-white border border-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                            {related.featuredImage ? (
                                                <Image
                                                    src={related.featuredImage}
                                                    alt={related.featuredImageAlt || related.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-primary transition-colors">
                                                {related.title}
                                            </h3>
                                            <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                                                <span>{new Date(related.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                                <span>·</span>
                                                <span>{related.readingTime} min read</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>
            <Footer />
        </>
    );
}

export const revalidate = 60;