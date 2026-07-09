import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, Tag, ArrowRight, Rss, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPosts, getCategories } from "@/lib/wordpress";

export const metadata: Metadata = {
  title: "Blog – Invonix | Finance Automation Insights",
  description:
    "Expert insights on AI-powered finance automation, invoice processing, VAT compliance, and accounting efficiency.",
  openGraph: {
    title: "Invonix Blog",
    description: "Expert insights on AI-powered finance automation and accounting efficiency.",
    type: "website",
  },
};

interface BlogPageProps {
  searchParams: Promise<{ page?: string; category?: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function PlaceholderImage({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 flex items-end p-5">
      <span className="text-primary/40 text-xs font-mono uppercase tracking-widest">
        {title.slice(0, 2)}
      </span>
    </div>
  );
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));
  const activeCategory = params.category ?? "";

  const [{ posts, total, totalPages }, categories] = await Promise.all([
    getPosts(currentPage, 9, activeCategory || undefined),
    getCategories(),
  ]);

  const heroPosts = currentPage === 1 && !activeCategory ? posts.slice(0, 1) : [];
  const gridPosts = currentPage === 1 && !activeCategory ? posts.slice(1) : posts;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Header */}
        <section className="pt-32 pb-12 bg-gradient-to-b from-slate-50 to-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-3">
                  <Rss className="w-4 h-4" />
                  Latest insights
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
                  The Invonix Blog
                </h1>
                <p className="mt-3 text-lg text-muted max-w-xl">
                  Expert guides, industry trends, and product updates on AI‑powered finance automation.
                </p>
              </div>
              {total > 0 && (
                <p className="text-sm text-muted self-end pb-1">
                  {total} article{total !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                <Link
                  href="/blog"
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    !activeCategory
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted hover:border-primary hover:text-primary"
                  }`}
                >
                  All
                </Link>
                {categories.slice(0, 8).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/blog?category=${cat.slug}`}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      activeCategory === cat.slug
                        ? "bg-primary text-white border-primary"
                        : "border-border text-muted hover:border-primary hover:text-primary"
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero post */}
          {heroPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block mb-12 rounded-2xl overflow-hidden border border-border hover:shadow-xl hover:shadow-slate-900/8 transition-all duration-300"
            >
              <div className="grid md:grid-cols-2">
                <div className="relative aspect-video md:aspect-auto min-h-[260px] bg-slate-100 overflow-hidden">
                  {post.featuredImage ? (
                    <Image
                      src={post.featuredImage}
                      alt={post.featuredImageAlt || post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <PlaceholderImage title={post.title} />
                  )}
                </div>
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  {post.categories.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                      <Tag className="w-3 h-3" />
                      {post.categories[0].name}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-muted leading-relaxed line-clamp-3">{post.excerpt}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" />
                      {formatDate(post.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {post.readingTime} min read
                    </span>
                    {/* {post.commentCount > 0 && (
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4" />
                        {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
                      </span>
                    )} */}

                    <span className="flex items-center gap-1 text-primary font-medium">
  <MessageCircle className="w-3.5 h-3.5" />
  {post.commentCount}
</span>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                    Read article <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Grid */}
          {gridPosts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:shadow-slate-900/8 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    {post.featuredImage ? (
                      <Image
                        src={post.featuredImage}
                        alt={post.featuredImageAlt || post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <PlaceholderImage title={post.title} />
                    )}
                    {post.categories.length > 0 && (
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                        {post.categories[0].name}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 p-5 flex flex-col">
                    <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDate(post.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {post.readingTime} min
                        </span>
                      </div>
                      {/* {post.commentCount > 0 && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {post.commentCount}
                        </span>
                      )} */}

                      <span className="flex items-center gap-1.5">
  <MessageCircle className="w-4 h-4" />
  {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted">
              <p className="text-lg font-medium">No posts found.</p>
              <Link href="/blog" className="mt-4 inline-block text-primary hover:underline text-sm">
                Clear filters
              </Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-12 flex justify-center gap-2" aria-label="Blog pagination">
              {currentPage > 1 && (
                <PaginationLink href={buildPageUrl(currentPage - 1, activeCategory)} label="← Previous" />
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationLink
                  key={p}
                  href={buildPageUrl(p, activeCategory)}
                  label={String(p)}
                  active={p === currentPage}
                />
              ))}
              {currentPage < totalPages && (
                <PaginationLink href={buildPageUrl(currentPage + 1, activeCategory)} label="Next →" />
              )}
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function buildPageUrl(page: number, category?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (category) params.set("category", category);
  const qs = params.toString();
  return `/blog${qs ? `?${qs}` : ""}`;
}

function PaginationLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? "bg-primary text-white border-primary"
          : "border-border text-muted hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );
}