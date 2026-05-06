"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function adminFetch(path: string, options: RequestInit = {}) {
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

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toInputDatetime(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 16);
}

// ── Date Time Picker ───────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_VALS  = ["01","02","03","04","05","06","07","08","09","10","11","12"];

const SEL_BASE = [
  "w-full appearance-none",
  "bg-white dark:bg-gray-900",
  "text-dark dark:text-white text-xs font-medium",
  "rounded-xl pl-3 pr-7 py-2.5",
  "border border-gray-200 dark:border-gray-600",
  "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/60",
  "cursor-pointer transition-colors",
].join(" ");

function Chevron() {
  return (
    <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 10 6">
      <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SBox({ value, onChange, children, className = "" }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select value={value} onChange={e => onChange(e.target.value)} className={SEL_BASE}>
        {children}
      </select>
      <Chevron />
    </div>
  );
}

function DateTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [year,   setYear]   = useState(value.slice(0, 4) || "2025");
  const [month,  setMonth]  = useState(value.slice(5, 7) || "01");
  const [day,    setDay]    = useState(value.slice(8, 10) || "01");
  const [hour,   setHour]   = useState(value.slice(11, 13) || "00");
  const [minute, setMinute] = useState(value.slice(14, 16) || "00");

  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
  const safeDay     = String(Math.min(Number(day), daysInMonth)).padStart(2, "0");

  const emit = (y: string, mo: string, d: string, h: string, mi: string) =>
    onChange(`${y}-${mo}-${d}T${h}:${mi}`);

  const years   = Array.from({ length: 11 }, (_, i) => String(2020 + i));
  const days    = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
  const hours   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  function onMonthChange(mo: string) {
    const nd = String(Math.min(Number(day), new Date(Number(year), Number(mo), 0).getDate())).padStart(2, "0");
    setMonth(mo); setDay(nd); emit(year, mo, nd, hour, minute);
  }
  function onYearChange(y: string) {
    const nd = String(Math.min(Number(day), new Date(Number(y), Number(month), 0).getDate())).padStart(2, "0");
    setYear(y); setDay(nd); emit(y, month, nd, hour, minute);
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 space-y-3">
      <div>
        <p className="text-[10px] font-semibold text-body-color uppercase tracking-wider mb-1.5">Date</p>
        <div className="flex gap-2">
          <SBox value={safeDay} onChange={v => { setDay(v); emit(year, month, v, hour, minute); }} className="w-[68px]">
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </SBox>
          <SBox value={month} onChange={onMonthChange} className="flex-1">
            {MONTH_VALS.map((m, i) => <option key={m} value={m}>{MONTH_NAMES[i]}</option>)}
          </SBox>
          <SBox value={year} onChange={onYearChange} className="w-[82px]">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </SBox>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-body-color uppercase tracking-wider mb-1.5">Time (UTC)</p>
        <div className="flex items-center gap-2">
          <SBox value={hour} onChange={v => { setHour(v); emit(year, month, safeDay, v, minute); }} className="w-[72px]">
            {hours.map(h => <option key={h} value={h}>{h}</option>)}
          </SBox>
          <span className="text-sm font-bold text-body-color">:</span>
          <SBox value={minute} onChange={v => { setMinute(v); emit(year, month, safeDay, hour, v); }} className="w-[72px]">
            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
          </SBox>
        </div>
      </div>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────

interface Author {
  id: string; firstName: string; lastName: string; email: string; profilePhoto?: string;
}

interface Post {
  id: string; title: string; content: string; images: string[];
  author: Author; likesCount: number; commentsCount: number;
  isPinned: boolean; isDeleted: boolean;
  createdAt: string; updatedAt: string;
}

interface Comment {
  id: string; content: string; author: Author;
  parentId: string | null; replyToName?: string;
  likesCount: number; isDeleted: boolean;
  createdAt: string; updatedAt: string;
}

// ── Edit Modal ─────────────────────────────────────────────────────

function EditPostModal({ post, onClose, onSaved }: {
  post: Post; onClose: () => void; onSaved: (p: Post) => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [createdAt, setCreatedAt] = useState(toInputDatetime(post.createdAt));
  const [updatedAt, setUpdatedAt] = useState(toInputDatetime(post.updatedAt));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const res = await adminFetch(`/api/admin/forum/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, createdAt: new Date(createdAt).toISOString(), updatedAt: new Date(updatedAt).toISOString() }),
      });
      const data = await res.json();
      if (data.success) { onSaved(data.data.post); onClose(); }
      else setErr(data.message || "Failed to save");
    } catch { setErr("Network error"); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-[#1c1c2e] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl border-t border-gray-200 dark:border-gray-700 sm:border overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-dark dark:text-white text-sm">Edit Post</h2>
          <button onClick={onClose} className="text-body-color hover:text-dark dark:hover:text-white text-lg leading-none p-1">✕</button>
        </div>
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {err && <p className="text-xs text-red-500">{err}</p>}
          <div>
            <label className="block text-xs font-semibold text-body-color uppercase tracking-wider mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full text-sm bg-gray-50 dark:bg-gray-800 text-dark dark:text-white rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-body-color uppercase tracking-wider mb-1">Content</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} className="w-full text-sm bg-gray-50 dark:bg-gray-800 text-dark dark:text-white rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary/50 resize-none" />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-body-color uppercase tracking-wider mb-2">Created At</label>
              <DateTimePicker value={createdAt} onChange={setCreatedAt} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-body-color uppercase tracking-wider mb-2">Updated At</label>
              <DateTimePicker value={updatedAt} onChange={setUpdatedAt} />
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-body-color hover:text-dark dark:hover:text-white transition-colors px-3 py-2">Cancel</button>
          <button onClick={save} disabled={saving} className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditCommentModal({ comment, onClose, onSaved }: {
  comment: Comment; onClose: () => void; onSaved: (c: Comment) => void;
}) {
  const [content, setContent] = useState(comment.content);
  const [createdAt, setCreatedAt] = useState(toInputDatetime(comment.createdAt));
  const [updatedAt, setUpdatedAt] = useState(toInputDatetime(comment.updatedAt));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const res = await adminFetch(`/api/admin/forum/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, createdAt: new Date(createdAt).toISOString(), updatedAt: new Date(updatedAt).toISOString() }),
      });
      const data = await res.json();
      if (data.success) { onSaved(data.data.comment); onClose(); }
      else setErr(data.message || "Failed to save");
    } catch { setErr("Network error"); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-[#1c1c2e] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl border-t border-gray-200 dark:border-gray-700 sm:border overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-dark dark:text-white text-sm">
            Edit {comment.parentId ? "Reply" : "Comment"}
          </h2>
          <button onClick={onClose} className="text-body-color hover:text-dark dark:hover:text-white text-lg leading-none p-1">✕</button>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          {err && <p className="text-xs text-red-500">{err}</p>}
          <div>
            <label className="block text-xs font-semibold text-body-color uppercase tracking-wider mb-1">Content</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full text-sm bg-gray-50 dark:bg-gray-800 text-dark dark:text-white rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary/50 resize-none" />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-body-color uppercase tracking-wider mb-2">Created At</label>
              <DateTimePicker value={createdAt} onChange={setCreatedAt} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-body-color uppercase tracking-wider mb-2">Updated At</label>
              <DateTimePicker value={updatedAt} onChange={setUpdatedAt} />
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-body-color hover:text-dark dark:hover:text-white transition-colors px-3 py-2">Cancel</button>
          <button onClick={save} disabled={saving} className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Comments Panel ─────────────────────────────────────────────────

function CommentsPanel({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    adminFetch(`/api/admin/forum/posts/${postId}/comments`)
      .then(r => r.json())
      .then(d => { if (d.success) setComments(d.data.comments); })
      .finally(() => setLoading(false));
  }, [postId]);

  async function deleteComment(id: string) {
    if (!confirm("Permanently delete this comment/reply?")) return;
    setDeletingId(id);
    await adminFetch(`/api/admin/forum/comments/${id}`, { method: "DELETE" });
    setComments(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
  }

  if (loading) return <div className="px-4 sm:px-6 py-4 text-xs text-body-color animate-pulse">Loading comments…</div>;
  if (!comments.length) return <div className="px-4 sm:px-6 py-4 text-xs text-body-color">No comments yet.</div>;

  const roots = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  return (
    <div className="border-t border-gray-100 dark:border-gray-800">
      {editingComment && (
        <EditCommentModal
          comment={editingComment}
          onClose={() => setEditingComment(null)}
          onSaved={updated => setComments(prev => prev.map(c => c.id === updated.id ? updated : c))}
        />
      )}
      {roots.map(comment => (
        <div key={comment.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
          {/* Root comment */}
          <div className={`px-4 sm:px-6 py-3 ${comment.isDeleted ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-semibold text-dark dark:text-white">
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span className="text-[10px] text-body-color truncate max-w-[160px] sm:max-w-none">{comment.author.email}</span>
                  {comment.isDeleted && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">deleted</span>}
                </div>
                <p className="text-xs text-dark/80 dark:text-white/80 leading-relaxed">{comment.content}</p>
                <p className="text-[10px] text-body-color mt-1">
                  {fmt(comment.createdAt)} · {comment.likesCount} likes
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                <button onClick={() => setEditingComment(comment)} className="text-xs text-primary hover:text-primary/80 font-medium transition-colors px-2 py-1">Edit</button>
                <button onClick={() => deleteComment(comment.id)} disabled={deletingId === comment.id} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50 px-2 py-1">Del</button>
              </div>
            </div>
          </div>

          {/* Replies */}
          {replies.filter(r => r.parentId === comment.id).map(reply => (
            <div key={reply.id} className={`pl-6 sm:pl-12 pr-4 sm:pr-6 py-2.5 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-50 dark:border-gray-800 ${reply.isDeleted ? "opacity-50" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold text-dark dark:text-white">
                      {reply.author.firstName} {reply.author.lastName}
                    </span>
                    {reply.replyToName && <span className="text-[10px] text-primary">→ @{reply.replyToName}</span>}
                    {reply.isDeleted && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">deleted</span>}
                  </div>
                  <p className="text-xs text-dark/80 dark:text-white/80 leading-relaxed">{reply.content}</p>
                  <p className="text-[10px] text-body-color mt-1">
                    {fmt(reply.createdAt)} · {reply.likesCount} likes
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                  <button onClick={() => setEditingComment(reply)} className="text-xs text-primary hover:text-primary/80 font-medium transition-colors px-2 py-1">Edit</button>
                  <button onClick={() => deleteComment(reply.id)} disabled={deletingId === reply.id} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50 px-2 py-1">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function AdminForumPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingPin, setTogglingPin] = useState<string | null>(null);

  const fetchPosts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/forum/posts?page=${p}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts);
        setTotal(data.data.total);
        setPages(data.data.pages);
        setPage(p);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  async function deletePost(id: string) {
    if (!confirm("Permanently delete this post and all its comments/likes?")) return;
    setDeletingId(id);
    await adminFetch(`/api/admin/forum/posts/${id}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== id));
    setTotal(t => t - 1);
    setDeletingId(null);
  }

  async function togglePin(post: Post) {
    setTogglingPin(post.id);
    const res = await adminFetch(`/api/admin/forum/posts/${post.id}/pin`, { method: "PATCH" });
    const data = await res.json();
    if (data.success) setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isPinned: data.data.pinned } : p));
    setTogglingPin(null);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 lg:pl-72">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">Forum Management</h1>
          <p className="text-sm text-body-color mt-1">{total} total posts</p>
        </div>

        {editingPost && (
          <EditPostModal
            post={editingPost}
            onClose={() => setEditingPost(null)}
            onSaved={updated => {
              setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
              setEditingPost(null);
            }}
          />
        )}

        {/* Posts list */}
        <div className="bg-white dark:bg-[#1c1c2e] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-body-color animate-pulse">Loading posts…</div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center text-sm text-body-color">No posts found.</div>
          ) : (
            posts.map(post => (
              <div key={post.id} className={`border-b border-gray-100 dark:border-gray-700 last:border-0 ${post.isDeleted ? "opacity-60" : ""}`}>

                {/* Post row — stacks on mobile, side-by-side on sm+ */}
                <div className="px-4 sm:px-5 py-4">
                  {/* Badges + title */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {post.isPinned && (
                      <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">Pinned</span>
                    )}
                    {post.isDeleted && (
                      <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Deleted</span>
                    )}
                    <span className="text-sm font-bold text-dark dark:text-white line-clamp-1">{post.title}</span>
                  </div>

                  {/* Content preview */}
                  <p className="text-xs text-dark/70 dark:text-white/70 line-clamp-2 mb-2">{post.content}</p>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-body-color mb-3">
                    <span className="font-medium">{post.author.firstName} {post.author.lastName}</span>
                    <span className="hidden sm:inline truncate max-w-[200px]">{post.author.email}</span>
                    <span>👍 {post.likesCount}</span>
                    <span>💬 {post.commentsCount}</span>
                    <span className="hidden sm:inline">Created: {fmt(post.createdAt)}</span>
                    <span className="sm:hidden">{new Date(post.createdAt).toLocaleDateString("en-GB")}</span>
                  </div>

                  {/* Action buttons — full-width row that wraps cleanly */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => togglePin(post)}
                      disabled={togglingPin === post.id}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                        post.isPinned
                          ? "border-primary text-primary hover:bg-primary/10"
                          : "border-gray-200 dark:border-gray-600 text-body-color hover:border-primary hover:text-primary"
                      }`}
                    >
                      {post.isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      onClick={() => setEditingPost(post)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-body-color hover:border-primary hover:text-primary transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      disabled={deletingId === post.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      {deletingId === post.id ? "Deleting…" : "Delete"}
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-dark dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {expandedId === post.id ? "Hide Comments" : `Comments (${post.commentsCount})`}
                    </button>
                  </div>
                </div>

                {/* Expanded comments */}
                {expandedId === post.id && <CommentsPanel postId={post.id} />}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => fetchPosts(page - 1)}
              disabled={page <= 1}
              className="text-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 text-body-color hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-body-color">{page} / {pages}</span>
            <button
              onClick={() => fetchPosts(page + 1)}
              disabled={page >= pages}
              className="text-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 text-body-color hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
