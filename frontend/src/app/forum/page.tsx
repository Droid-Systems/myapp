"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function authFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("_at") : null;
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ── Types ─────────────────────────────────────────────────────────

interface Author {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  author: Author;
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  isLikedByUser: boolean;
  createdAt: string;
  lastCommentAt?: string;
}

// ── Helpers ───────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Icons ─────────────────────────────────────────────────────────

const ThumbsUp = ({ filled }: { filled?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {filled
      ? <><path fill="currentColor" stroke="none" d="M7 11v9a1 1 0 0 0 1 1h9.28a2 2 0 0 0 1.98-1.7l1.38-9A2 2 0 0 0 18.66 7H14V4a3 3 0 0 0-3-3 1 1 0 0 0-.9.55L7 11z"/><rect fill="currentColor" stroke="none" x="2" y="10" width="4" height="11" rx="1"/></>
      : <><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></>
    }
  </svg>
);
const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ComposeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
  </svg>
);
const ImageUploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

// ── Avatar ────────────────────────────────────────────────────────

function Avatar({ author, size = 36 }: { author: Author; size?: number }) {
  const initials = `${author.firstName[0]}${author.lastName[0]}`.toUpperCase();
  return author.profilePhoto ? (
    <img
      src={author.profilePhoto}
      alt=""
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full bg-primary flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// ── Avatar with brand ring ────────────────────────────────────────

function AvatarRing({ author, size = 40 }: { author: Author; size?: number }) {
  return (
    <div
      className="rounded-full flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <Avatar author={author} size={size} />
    </div>
  );
}

// ── Image Carousel ────────────────────────────────────────────────

function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) return null;
  return (
    <div className="relative bg-black" style={{ aspectRatio: "1/1" }}>
      <img src={images[idx]} alt="" className="w-full h-full object-cover select-none" draggable={false} />
      {images.length > 1 && (
        <>
          {idx > 0 && (
            <button
              onClick={() => setIdx(i => i - 1)}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-dark text-lg font-bold flex items-center justify-center shadow-sm"
            >‹</button>
          )}
          {idx < images.length - 1 && (
            <button
              onClick={() => setIdx(i => i + 1)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-dark text-lg font-bold flex items-center justify-center shadow-sm"
            >›</button>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-primary w-3" : "bg-white/60 w-1.5"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────

function PostCard({ post, isLoggedIn }: { post: ForumPost; isLoggedIn: boolean }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLikedByUser ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [heartAnim, setHeartAnim] = useState(false);

  async function handleLike() {
    if (!isLoggedIn) { router.push("/signin"); return; }
    const prev = liked;
    setLiked(!prev);
    setLikesCount(c => prev ? c - 1 : c + 1);
    if (!prev) { setHeartAnim(true); setTimeout(() => setHeartAnim(false), 350); }
    try {
      await authFetch(`/api/forum/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      setLiked(prev);
      setLikesCount(c => prev ? c + 1 : c - 1);
    }
  }

  // Double-tap to like
  const lastTap = useRef(0);
  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300 && !liked) handleLike();
    lastTap.current = now;
  }

  return (
    <article
      onClick={() => router.push(`/forum/${post.id}`)}
      className="bg-white dark:bg-dark border-b border-gray-100 dark:border-gray-700 md:mb-4 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 md:dark:border-gray-700 overflow-hidden cursor-pointer"
    >

      {/* Post header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <AvatarRing author={post.author} size={40} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-dark dark:text-white leading-tight">
            {post.author.firstName} {post.author.lastName}
          </span>
          <p className="text-xs text-body-color mt-0.5">{timeAgo(post.createdAt)}</p>
        </div>
        {post.isPinned && (
          <div className="flex items-center gap-1 text-body-color flex-shrink-0">
            <PinIcon />
            <span className="text-xs font-semibold">Pinned</span>
          </div>
        )}
      </div>

      {/* Write-up: title bold, content below */}
      <div className="px-4 pb-3">
        <p className="text-base font-bold text-dark dark:text-white leading-snug mb-1 line-clamp-2">
          {post.title}
        </p>
        {post.content && (
          <p className="text-sm text-dark/80 dark:text-white/80 leading-relaxed line-clamp-2">
            {post.content}
          </p>
        )}
      </div>

      {/* Image (attachment, below write-up — double-tap to like) */}
      {post.images.length > 0 && (
        <div onClick={(e) => { e.stopPropagation(); handleDoubleTap(); }} className="relative">
          <ImageCarousel images={post.images} />
          {heartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-7xl opacity-90 animate-ping">👍</span>
            </div>
          )}
        </div>
      )}

      {/* Action row — Skool style: icon + count inline */}
      <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-800 flex items-center gap-3 sm:gap-5">
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold transition-all flex-shrink-0 ${
            liked ? "text-primary" : "text-body-color hover:text-primary"
          } ${heartAnim ? "scale-110" : ""}`}
        >
          <ThumbsUp filled={liked} />
          <span>{likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}</span>
        </button>
        <Link
          href={`/forum/${post.id}#comments`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold text-body-color hover:text-primary transition-colors flex-shrink-0"
        >
          <CommentIcon />
          <span>{post.commentsCount.toLocaleString()} {post.commentsCount === 1 ? "comment" : "comments"}</span>
        </Link>
        {post.lastCommentAt && (
          <span className="ml-auto text-[11px] sm:text-xs text-body-color whitespace-nowrap">
            {(() => { const t = timeAgo(post.lastCommentAt!); return `Last comment ${t === "just now" ? t : `${t} ago`}`; })()}
          </span>
        )}
      </div>
    </article>
  );
}

// ── Create Post Modal ─────────────────────────────────────────────

function CreatePostModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function addImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const next = [...images, ...files].slice(0, 5);
    setImages(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
  }

  function removeImage(i: number) {
    const next = images.filter((_, j) => j !== i);
    setImages(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
  }

  async function handleShare() {
    if (!title.trim() || !content.trim()) { setError("Title and caption are required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("content", content.trim());
      images.forEach(img => form.append("images", img));
      const res = await authFetch("/api/forum/posts", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) { onSuccess(); onClose(); }
      else setError(data.message || "Failed to share.");
    } catch { setError("Something went wrong. Please try again."); }
    setSubmitting(false);
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-dark rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700">

        {/* Header */}
        <div className="flex items-center px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="text-sm font-medium text-body-color hover:text-dark dark:hover:text-white transition-colors flex-1 text-left"
          >
            Cancel
          </button>
          <h2 className="text-sm font-bold text-dark dark:text-white">Create Post</h2>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleShare}
              disabled={submitting || !title.trim() || !content.trim()}
              className="px-4 py-1.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-40"
            >
              {submitting ? "Sharing..." : "Share"}
            </button>
          </div>
        </div>

        <div className="max-h-[76vh] overflow-y-auto">
          {error && <p className="text-xs text-red-500 px-5 pt-3">{error}</p>}

          {/* Form fields (primary) */}
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-body-color uppercase tracking-wider mb-1.5 block">Title</label>
              <input
                type="text"
                placeholder="Give your post a title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
                className="w-full text-sm font-semibold text-dark dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 border border-gray-100 dark:border-gray-700 focus:outline-none focus:border-primary/40 placeholder-body-color transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-body-color uppercase tracking-wider mb-1.5 block">Write-up</label>
              <textarea
                placeholder="Share your thoughts with investors..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={5}
                className="w-full text-sm text-dark dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 border border-gray-100 dark:border-gray-700 focus:outline-none focus:border-primary/40 resize-none placeholder-body-color transition-colors"
              />
            </div>
          </div>

          {/* Image attachments (optional, below write-up) */}
          <div className="px-5 pb-5 border-t border-gray-50 dark:border-gray-800 pt-4">
            <p className="text-xs font-semibold text-body-color uppercase tracking-wider mb-3">Attachments <span className="normal-case font-normal">(optional)</span></p>
            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="w-16 h-16 object-cover rounded-xl border border-gray-100 dark:border-gray-700" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-dark text-white rounded-full text-[10px] flex items-center justify-center"
                    >✕</button>
                  </div>
                ))}
                {previews.length < 5 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center text-body-color hover:border-primary/50 hover:text-primary transition-colors text-xl"
                  >+</button>
                )}
              </div>
            )}
            {previews.length === 0 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2.5 text-sm text-body-color hover:text-primary transition-colors"
              >
                <ImageUploadIcon />
                <span>Add photos (up to 5)</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addImages} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Forum Page ───────────────────────────────────────────────

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    fetchPosts(1);
  }, []);

  async function fetchPosts(p: number) {
    if (p === 1) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forum/posts?page=${p}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setPosts(p === 1 ? data.data.posts : prev => [...prev, ...data.data.posts]);
        setPages(data.data.pages);
        setPage(p);
      }
    } catch {}
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-dark pt-[85px]">

      {/* Feed */}
      <div className="pb-20 container mx-auto px-0 md:px-4 max-w-2xl">

        {/* Forum title row — part of scrollable content, not fixed */}
        <div className="flex items-center justify-between px-4 md:px-0 py-4 md:py-5">
          <h1 className="text-lg font-bold text-dark dark:text-white tracking-tight">Investors Forum</h1>
          {isLoggedIn ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              <ComposeIcon />
              <span className="hidden sm:inline">New Post</span>
            </button>
          ) : (
            <Link href="/signin" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          )}
        </div>

        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-dark border-b border-gray-100 dark:border-gray-700 md:mb-4 md:rounded-2xl md:shadow-sm animate-pulse overflow-hidden">
                {/* Header: avatar + name + time */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-2.5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
                  </div>
                </div>
                {/* Write-up: bold title + content lines */}
                <div className="px-4 pb-3 space-y-2">
                  <div className="h-3.5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full" />
                  <div className="h-3 w-5/6 bg-gray-100 dark:bg-gray-800 rounded-full" />
                  <div className="h-3 w-4/6 bg-gray-100 dark:bg-gray-800 rounded-full" />
                </div>
                {/* Action row: like | comment | last comment */}
                <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-800 flex items-center gap-3 sm:gap-5">
                  <div className="h-4 w-14 sm:w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-4 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-3 w-24 sm:w-28 bg-gray-100 dark:bg-gray-800 rounded-full ml-auto" />
                </div>
              </div>
            ))}
          </>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CommentIcon />
            </div>
            <p className="text-lg font-bold text-dark dark:text-white mb-1">No Posts Yet</p>
            <p className="text-sm text-body-color mb-5">Be the first investor to start a discussion.</p>
            {isLoggedIn && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Create a post
              </button>
            )}
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} />
            ))}
            {page < pages && (
              <div className="text-center py-8">
                <button
                  onClick={() => fetchPosts(page + 1)}
                  className="text-sm font-semibold text-body-color hover:text-primary transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <CreatePostModal onClose={() => setShowCreate(false)} onSuccess={() => fetchPosts(1)} />
      )}
    </div>
  );
}
