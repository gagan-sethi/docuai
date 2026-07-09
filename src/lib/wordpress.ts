/**
 * WordPress REST API utility for Invonix Blog
 * Enhanced with full comment support
 */

const WP_API = "https://production.promaticstechnologies.com/invonix/index.php/wp-json/wp/v2";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WPComment {
  id: number;
  post: number;
  parent: number;
  author_name: string;
  author_url: string;
  author_avatar_urls: Record<string, string>;
  date: string;
  content: { rendered: string };
  status: string;
  type: string;
}

export interface WPPost {
  id: number;
  slug: string;
  status: string;
  date: string;
  modified: string;
  title: { rendered: string };
  excerpt: { rendered: string; protected: boolean };
  content: { rendered: string; protected: boolean };
  featured_media: number;
  categories: number[];
  tags: number[];
  author: number;
  link: string;
  comment_status: string;
  comment_count?: number;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      id: number;
      source_url: string;
      alt_text: string;
      media_details: { sizes: Record<string, { source_url: string }> };
    }>;
    "wp:term"?: Array<Array<{ id: number; name: string; slug: string; taxonomy: string }>>;
    author?: Array<{
      id: number;
      name: string;
      avatar_urls: Record<string, string>;
    }>;
    replies?: Array<Array<WPComment>>;
  };
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface Comment {
  id: number;
  authorName: string;
  authorUrl: string;
  authorAvatar: string | null;
  date: string;
  content: string;
  status: string;
  parentId: number;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  modified: string;
  featuredImage: string | null;
  featuredImageAlt: string;
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  author: { name: string; avatar: string | null };
  readingTime: number;
  commentCount: number;
  commentStatus: string;
  comments?: Comment[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function estimateReadingTime(html: string): number {
  const words = stripHtml(html).split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function mapComment(raw: WPComment): Comment {
  return {
    id: raw.id,
    authorName: raw.author_name,
    authorUrl: raw.author_url,
    authorAvatar: raw.author_avatar_urls?.["48"] ?? null,
    date: raw.date,
    content: stripHtml(raw.content.rendered),
    status: raw.status,
    parentId: raw.parent,
  };
}

function mapPost(raw: WPPost, includeComments = false): BlogPost {
  const media = raw._embedded?.["wp:featuredmedia"]?.[0];
  const terms = raw._embedded?.["wp:term"] ?? [];
  const categories = (terms[0] ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
  }));
  const tags = (terms[1] ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
  }));
  const authorRaw = raw._embedded?.author?.[0];

  const post: BlogPost = {
    id: raw.id,
    slug: raw.slug,
    title: stripHtml(raw.title.rendered),
    excerpt: stripHtml(raw.excerpt.rendered),
    content: raw.content.rendered,
    date: raw.date,
    modified: raw.modified,
    featuredImage:
      media?.media_details?.sizes?.["large"]?.source_url ??
      media?.source_url ??
      null,
    featuredImageAlt: media?.alt_text ?? "",
    categories,
    tags,
    author: {
      name: authorRaw?.name ?? "Invonix Team",
      avatar: authorRaw?.avatar_urls?.["96"] ?? null,
    },
    readingTime: estimateReadingTime(raw.content.rendered),
    commentCount: raw.comment_count ?? 0,
    commentStatus: raw.comment_status,
  };

  if (includeComments && raw._embedded?.replies) {
    post.comments = raw._embedded.replies[0]?.map(mapComment) ?? [];
  }

  return post;
}

// ─── API calls ───────────────────────────────────────────────────────────────

const EMBED = "_embed=wp:featuredmedia,wp:term,author";
const EMBED_WITH_COMMENTS = "_embed=wp:featuredmedia,wp:term,author,replies";

export async function getPosts(
  page = 1,
  perPage = 9,
  categorySlug?: string,
  includeComments = false
): Promise<{ posts: BlogPost[]; total: number; totalPages: number }> {
  const embedParam = includeComments ? EMBED_WITH_COMMENTS : EMBED;
  let url = `${WP_API}/posts?${embedParam}&page=${page}&per_page=${perPage}&orderby=date&order=desc`;

  if (categorySlug) {
    const catRes = await fetch(`${WP_API}/categories?slug=${categorySlug}`, {
      next: { revalidate: 300 },
    });
    const cats: WPCategory[] = await catRes.json();
    if (cats.length) url += `&categories=${cats[0].id}`;
  }

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`WP API error: ${res.status}`);

  const raw: WPPost[] = await res.json();
  const total = parseInt(res.headers.get("X-WP-Total") ?? "0", 10);
  const totalPages = parseInt(res.headers.get("X-WP-TotalPages") ?? "1", 10);

  return {
    posts: raw.map((post) => mapPost(post, includeComments)),
    total,
    totalPages,
  };
}

export async function getPostBySlug(
  slug: string,
  includeComments = true
): Promise<BlogPost | null> {
  const embedParam = includeComments ? EMBED_WITH_COMMENTS : EMBED;
  const res = await fetch(
    `${WP_API}/posts?${embedParam}&slug=${slug}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return null;
  const raw: WPPost[] = await res.json();
  if (!raw.length) return null;
  return mapPost(raw[0], includeComments);
}

export async function getCategories(): Promise<WPCategory[]> {
  const res = await fetch(
    `${WP_API}/categories?hide_empty=true&per_page=50&orderby=count&order=desc`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function getRelatedPosts(
  categoryIds: number[],
  excludeId: number,
  limit = 3,
  includeComments = false
): Promise<BlogPost[]> {
  if (!categoryIds.length) return [];
  const embedParam = includeComments ? EMBED_WITH_COMMENTS : EMBED;
  const res = await fetch(
    `${WP_API}/posts?${embedParam}&categories=${categoryIds.join(
      ","
    )}&exclude=${excludeId}&per_page=${limit}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const raw: WPPost[] = await res.json();
  return raw.map((post) => mapPost(post, includeComments));
}

/**
 * Get all approved comments for a specific post
 * @param postId - WordPress post ID
 * @param parentId - Optional parent comment ID to get replies to a specific comment
 * @returns Array of comments
 */
export async function getPostComments(
  postId: number,
  parentId?: number
): Promise<Comment[]> {
  let url = `${WP_API}/comments?post=${postId}&status=approve&per_page=50`;
  if (parentId) url += `&parent=${parentId}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];

  const raw: WPComment[] = await res.json();
  return raw.map(mapComment);
}

/**
 * Get a single comment with replies
 * @param commentId - WordPress comment ID
 * @returns Comment with nested replies
 */
export async function getComment(commentId: number): Promise<Comment | null> {
  const res = await fetch(`${WP_API}/comments/${commentId}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;

  const raw: WPComment = await res.json();
  return mapComment(raw);
}

/**
 * Get total comment count for a post (without fetching all comments)
 * @param postId - WordPress post ID
 * @returns Comment count
 */
export async function getCommentCount(postId: number): Promise<number> {
  const res = await fetch(`${WP_API}/posts/${postId}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return 0;

  const post: WPPost = await res.json();
  return post.comment_count ?? 0;
}