"use client";

import { useState, useEffect, useRef, type RefObject, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  authorId: string;
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  isLikedByUser: boolean;
  createdAt: string;
}

interface ForumComment {
  id: string;
  content: string;
  images: string[];
  author: Author;
  postId: string;
  parentId: string | null;
  replyToId: string | null;
  replyToName: string | null;
  likesCount: number;
  repliesCount?: number;
  isLikedByUser?: boolean;
  createdAt: string;
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

// ── Confirm Modal ─────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-dark rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <p className="text-sm font-medium text-dark dark:text-white mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-semibold text-body-color hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────


const CommentIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ThumbsUp = ({ size = 20, filled }: { size?: number; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {filled
      ? <><path fill="currentColor" stroke="none" d="M7 11v9a1 1 0 0 0 1 1h9.28a2 2 0 0 0 1.98-1.7l1.38-9A2 2 0 0 0 18.66 7H14V4a3 3 0 0 0-3-3 1 1 0 0 0-.9.55L7 11z"/><rect fill="currentColor" stroke="none" x="2" y="10" width="4" height="11" rx="1"/></>
      : <><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></>
    }
  </svg>
);
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);
const ImageAttachIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

// ── @mention renderer ─────────────────────────────────────────────

function CommentText({ text }: { text: string }) {
  const parts = text.split(/(@[A-Za-z]+(?:\s[A-Za-z]+)?)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="text-primary font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// ── Comment image thumbnails ──────────────────────────────────────

function CommentImages({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            onClick={() => setLightbox(src)}
            className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
          />
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white text-xl w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20">✕</button>
        </div>
      )}
    </>
  );
}

// ── Image Carousel ────────────────────────────────────────────────

function ImageCarousel({ images, contain = false }: { images: string[]; contain?: boolean }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  if (!images.length) return null;

  return (
    <>
      <div
        className={`relative w-full overflow-hidden ${contain ? "h-full flex items-center justify-center bg-black" : "bg-black"}`}
        style={contain ? {} : { aspectRatio: "1/1" }}
      >
        <img
          src={images[idx]}
          alt=""
          onClick={() => setLightbox(true)}
          className={`select-none cursor-zoom-in ${contain ? "max-w-full max-h-full object-contain" : "w-full h-full object-cover"}`}
          draggable={false}
        />
        {images.length > 1 && (
          <>
            {idx > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-dark/80 text-dark flex items-center justify-center shadow-sm text-lg font-bold"
              >‹</button>
            )}
            {idx < images.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-dark/80 text-dark flex items-center justify-center shadow-sm text-lg font-bold"
              >›</button>
            )}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-primary w-3" : "bg-white/60"}`} />
              ))}
            </div>
            <span className="absolute top-3 right-3 text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
              {idx + 1}/{images.length}
            </span>
          </>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <img src={images[idx]} alt="" className="max-w-full max-h-full object-contain" />
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-xl">✕</button>
        </div>
      )}
    </>
  );
}

// ── Reply Row ─────────────────────────────────────────────────────

function ReplyRow({
  reply,
  isLoggedIn,
  currentUserId,
  onReply,
  onDeleteReply,
}: {
  reply: ForumComment;
  isLoggedIn: boolean;
  currentUserId: string | null;
  onReply: (c: ForumComment) => void;
  onDeleteReply: (id: string) => void;
}) {
  const [liked, setLiked] = useState(reply.isLikedByUser ?? false);
  const [likesCount, setLikesCount] = useState(reply.likesCount);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.content);
  const [saving, setSaving] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isOwner = !!currentUserId && currentUserId === reply.author.id;

  async function toggleLike() {
    if (!isLoggedIn) return;
    const prev = liked;
    setLiked(!prev);
    setLikesCount(c => prev ? c - 1 : c + 1);
    try {
      await authFetch(`/api/forum/comments/${reply.id}/like`, { method: "POST", headers: { "Content-Type": "application/json" } });
    } catch {
      setLiked(prev);
      setLikesCount(c => prev ? c + 1 : c - 1);
    }
  }

  async function saveEdit() {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("content", editText.trim());
      const res = await authFetch(`/api/forum/comments/${reply.id}`, { method: "PATCH", body: form });
      const data = await res.json();
      if (data.success) setEditing(false);
    } catch {}
    setSaving(false);
  }

  async function handleDelete() {
    try {
      await authFetch(`/api/forum/comments/${reply.id}`, { method: "DELETE" });
      setDeleted(true);
      onDeleteReply(reply.id);
    } catch {}
  }

  if (deleted) return null;

  // Strip the leading @mention from display text to avoid duplication
  // (the @replyToName badge is shown separately in the JSX)
  const replyPrefix = reply.replyToName ? `@${reply.replyToName}` : null;
  const replyDisplayText = replyPrefix && editText.startsWith(replyPrefix)
    ? editText.slice(replyPrefix.length).trimStart()
    : editText;

  return (
    <>
    {showConfirm && (
      <ConfirmModal
        message="Delete this reply?"
        onConfirm={() => { setShowConfirm(false); handleDelete(); }}
        onCancel={() => setShowConfirm(false)}
      />
    )}
    <div className="flex gap-2.5 pl-8 py-2">
      <Avatar author={reply.author} size={28} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={2}
                  className="w-full text-sm bg-gray-50 dark:bg-gray-800 text-dark dark:text-white rounded-xl px-3 py-2 border border-primary/40 focus:outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => { setEditing(false); setEditText(reply.content); }} className="text-xs text-body-color hover:text-dark dark:hover:text-white transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-dark dark:text-white leading-snug">
                  <span className="font-semibold">{reply.author.firstName} {reply.author.lastName}</span>
                  {reply.replyToName && <span className="text-primary font-medium ml-1.5">@{reply.replyToName}</span>}
                  {" "}<CommentText text={replyDisplayText} />
                </p>
                <CommentImages images={reply.images} />
              </>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-body-color">{timeAgo(reply.createdAt)}</span>
              <span className="text-xs font-semibold text-body-color">{likesCount} {likesCount === 1 ? "like" : "likes"}</span>
              {isLoggedIn && !editing && (
                <button onClick={() => onReply(reply)} className="text-xs font-semibold text-body-color hover:text-primary transition-colors">Reply</button>
              )}
              {isOwner && !editing && (
                <>
                  <button onClick={() => setEditing(true)} className="text-xs text-body-color hover:text-primary transition-colors">Edit</button>
                  <button onClick={() => setShowConfirm(true)} className="text-xs text-body-color hover:text-red-500 transition-colors">Delete</button>
                </>
              )}
            </div>
          </div>
          <button onClick={toggleLike} className={`flex-shrink-0 mt-0.5 transition-transform active:scale-90 ${liked ? "text-primary" : "text-body-color hover:text-primary"}`}>
            <ThumbsUp size={12} filled={liked} />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

// ── Comment Row ───────────────────────────────────────────────────

function CommentRow({
  comment,
  isLoggedIn,
  currentUserId,
  replyTrigger,
  onReply,
  onDelete,
}: {
  comment: ForumComment;
  isLoggedIn: boolean;
  currentUserId: string | null;
  replyTrigger: number;
  onReply: (c: ForumComment) => void;
  onDelete: (id: string) => void;
}) {
  const [liked, setLiked] = useState(comment.isLikedByUser ?? false);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<ForumComment[]>([]);
  const [replyTotal, setReplyTotal] = useState(comment.repliesCount ?? 0);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isOwner = !!currentUserId && currentUserId === comment.author.id;

  useEffect(() => {
    if (replyTrigger > 0) fetchReplies(true);
  }, [replyTrigger]);

  async function fetchReplies(forceShow = false) {
    if (!forceShow && showReplies) { setShowReplies(false); return; }
    setLoadingReplies(true);
    try {
      const res = await fetch(`${API_URL}/api/forum/comments/${comment.id}/replies?limit=50`);
      const data = await res.json();
      if (data.success) {
        setReplies(data.data.replies);
        setReplyTotal(data.data.total);
        setShowReplies(true);
      }
    } catch {}
    setLoadingReplies(false);
  }

  async function toggleLike() {
    if (!isLoggedIn) return;
    const prev = liked;
    setLiked(!prev);
    setLikesCount(c => prev ? c - 1 : c + 1);
    try {
      await authFetch(`/api/forum/comments/${comment.id}/like`, { method: "POST", headers: { "Content-Type": "application/json" } });
    } catch {
      setLiked(prev);
      setLikesCount(c => prev ? c + 1 : c - 1);
    }
  }

  async function saveEdit() {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("content", editText.trim());
      const res = await authFetch(`/api/forum/comments/${comment.id}`, { method: "PATCH", body: form });
      const data = await res.json();
      if (data.success) setEditing(false);
    } catch {}
    setSaving(false);
  }

  async function handleDelete() {
    try {
      await authFetch(`/api/forum/comments/${comment.id}`, { method: "DELETE" });
      setDeleted(true);
      onDelete(comment.id);
    } catch {}
  }

  const total = replyTotal || replies.length;
  const MAX_CHARS = 160;
  const isLong = editText.length > MAX_CHARS;
  const displayText = isLong && !expanded ? editText.slice(0, MAX_CHARS) : editText;

  if (deleted) return null;

  return (
    <>
    {showConfirm && (
      <ConfirmModal
        message="Delete this comment?"
        onConfirm={() => { setShowConfirm(false); handleDelete(); }}
        onCancel={() => setShowConfirm(false)}
      />
    )}
    <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800 last:border-b-0">
      <div className="flex gap-3">
        <Avatar author={comment.author} size={34} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex flex-col gap-1.5">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={2}
                    className="w-full text-sm bg-gray-50 dark:bg-gray-800 text-dark dark:text-white rounded-xl px-3 py-2 border border-primary/40 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => { setEditing(false); setEditText(comment.content); }} className="text-xs text-body-color hover:text-dark dark:hover:text-white transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-dark dark:text-white leading-snug">
                  <span className="font-semibold mr-1.5">{comment.author.firstName} {comment.author.lastName}</span>
                  <CommentText text={displayText} />
                  {isLong && !expanded && (
                    <button onClick={() => setExpanded(true)} className="text-body-color ml-1 text-sm hover:text-primary transition-colors">
                      ... more
                    </button>
                  )}
                </p>
              )}
              <CommentImages images={comment.images} />

              {/* Actions row */}
              <div className="flex items-center gap-4 mt-1.5">
                <span className="text-xs text-body-color">{timeAgo(comment.createdAt)}</span>
                <span className="text-xs font-semibold text-body-color">{likesCount} {likesCount === 1 ? "like" : "likes"}</span>
                {isLoggedIn && !editing && (
                  <button onClick={() => onReply(comment)} className="text-xs font-semibold text-body-color hover:text-primary transition-colors">
                    Reply
                  </button>
                )}
                {isOwner && !editing && (
                  <>
                    <button onClick={() => setEditing(true)} className="text-xs text-body-color hover:text-primary transition-colors">Edit</button>
                    <button onClick={() => setShowConfirm(true)} className="text-xs text-body-color hover:text-red-500 transition-colors">Delete</button>
                  </>
                )}
              </div>

              {/* View replies toggle */}
              {total > 0 && (
                <button
                  onClick={() => fetchReplies()}
                  className="flex items-center gap-2 mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <span className="block w-5 h-px bg-primary/40" />
                  {loadingReplies ? "Loading..." : showReplies ? "Hide replies" : `View ${total} ${total === 1 ? "reply" : "replies"}`}
                </button>
              )}
            </div>

            {/* Thumbs up */}
            <button
              onClick={toggleLike}
              className={`flex-shrink-0 mt-0.5 transition-transform active:scale-90 ${liked ? "text-primary" : "text-body-color hover:text-primary"}`}
            >
              <ThumbsUp size={14} filled={liked} />
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-2 ml-4">
          {replies.map(reply => (
            <ReplyRow
              key={reply.id}
              reply={reply}
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
              onReply={onReply}
              onDeleteReply={(id) => {
                setReplies(prev => prev.filter(r => r.id !== id));
                setReplyTotal(t => Math.max(0, t - 1));
              }}
            />
          ))}
        </div>
      )}
    </div>
    </>
  );
}

// ── Comment Input (reused on both layouts) ────────────────────────

function CommentInput({
  isLoggedIn,
  replyingTo,
  inputText,
  setInputText,
  inputImages,
  setInputImages,
  inputPreviews,
  setInputPreviews,
  submitting,
  onSubmit,
  onCancelReply,
  inputRef,
  fileRef,
}: {
  isLoggedIn: boolean;
  replyingTo: ForumComment | null;
  inputText: string;
  setInputText: (v: string) => void;
  inputImages: File[];
  setInputImages: (v: File[]) => void;
  inputPreviews: string[];
  setInputPreviews: (v: string[]) => void;
  submitting: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancelReply: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  fileRef: RefObject<HTMLInputElement | null>;
}) {
  function addImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const next = [...inputImages, ...files].slice(0, 3);
    setInputImages(next);
    setInputPreviews(next.map(f => URL.createObjectURL(f)));
    e.target.value = "";
  }

  if (!isLoggedIn) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-body-color">
          <Link href="/signin" className="text-primary font-semibold hover:underline">Sign in</Link>{" "}to leave a comment
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Reply to banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <span className="text-xs text-body-color">
            Replying to <span className="font-semibold text-dark dark:text-white">@{replyingTo.author.firstName} {replyingTo.author.lastName}</span>
          </span>
          <button
            onClick={onCancelReply}
            className="text-xs font-semibold text-body-color hover:text-primary transition-colors ml-3"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Image previews */}
      {inputPreviews.length > 0 && (
        <div className="flex gap-2 px-4 pt-2">
          {inputPreviews.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt="" className="w-12 h-12 object-cover rounded-lg border border-gray-100 dark:border-gray-700" />
              <button
                onClick={() => {
                  const next = inputImages.filter((_, j) => j !== i);
                  setInputImages(next);
                  setInputPreviews(next.map(f => URL.createObjectURL(f)));
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-dark text-white rounded-full text-[10px] flex items-center justify-center"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <form onSubmit={onSubmit} className="flex items-center gap-2.5 px-4 py-3">
        <textarea
          ref={inputRef}
          id="comment-input"
          placeholder={replyingTo ? `Reply to ${replyingTo.author.firstName}...` : "Write a comment..."}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          rows={1}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(e as unknown as FormEvent); }
          }}
          className="flex-1 bg-gray-50 dark:bg-gray-800 text-sm text-dark dark:text-white placeholder-body-color focus:outline-none resize-none rounded-2xl px-4 py-2.5 border border-gray-100 dark:border-gray-700 focus:border-primary/40 transition-colors"
          style={{ minHeight: 40, maxHeight: 100 }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 text-body-color hover:text-primary transition-colors"
          title="Attach photo"
        >
          <ImageAttachIcon />
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addImages} />
        <button
          type="submit"
          disabled={submitting || (!inputText.trim() && !inputImages.length)}
          className="flex-shrink-0 px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-40"
        >
          {submitting ? "..." : "Post"}
        </button>
      </form>
    </div>
  );
}

// ── Post Header (shared) ──────────────────────────────────────────

function PostHeader({ post }: { post: ForumPost }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="flex-shrink-0">
        <Avatar author={post.author} size={40} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold text-dark dark:text-white">{post.author.firstName} {post.author.lastName}</span>
          {post.isPinned && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              <PinIcon /> Pinned
            </span>
          )}
        </div>
        <p className="text-xs text-body-color mt-0.5">{timeAgo(post.createdAt)}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function ForumPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentPages, setCommentPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Post like
  const [postLiked, setPostLiked] = useState(false);
  const [postLikesCount, setPostLikesCount] = useState(0);
  const [heartAnim, setHeartAnim] = useState(false);

  // Reply triggers (keyed by root comment id)
  const [replyTriggers, setReplyTriggers] = useState<Record<string, number>>({});

  // Shared input state
  const [inputText, setInputText] = useState("");
  const [inputImages, setInputImages] = useState<File[]>([]);
  const [inputPreviews, setInputPreviews] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<ForumComment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u?.id) setCurrentUserId(u.id);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPost(1);
  }, [id]);

  useEffect(() => {
    if (!loading && (window.location.hash === "#comments" || window.location.hash === "#comment-input")) {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: "smooth" });
        if (window.location.hash === "#comment-input") inputRef.current?.focus();
      }, 200);
    }
  }, [loading]);

  async function fetchPost(p: number) {
    if (p === 1) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/forum/posts/${id}?page=${p}&limit=20`);
      const data = await res.json();
      if (!data.success) { router.push("/forum"); return; }
      setPost(data.data.post);
      setPostLikesCount(data.data.post.likesCount);
      if (p === 1) setPostLiked(data.data.post.isLikedByUser ?? false);
      setComments(p === 1 ? data.data.comments : prev => [...prev, ...data.data.comments]);
      setCommentPages(data.data.pages);
      setCommentPage(p);
    } catch {}
    setLoading(false);
  }

  // Double tap to like
  const lastTap = useRef(0);
  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300 && !postLiked) togglePostLike();
    lastTap.current = now;
  }

  async function togglePostLike() {
    if (!isLoggedIn) { router.push("/signin"); return; }
    const prev = postLiked;
    setPostLiked(!prev);
    setPostLikesCount(c => prev ? c - 1 : c + 1);
    if (!prev) { setHeartAnim(true); setTimeout(() => setHeartAnim(false), 350); }
    try {
      await authFetch(`/api/forum/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      setPostLiked(prev);
      setPostLikesCount(c => prev ? c + 1 : c - 1);
    }
  }

  // ── Post edit / delete ───────────────────────────────────────────
  const [postEditing, setPostEditing] = useState(false);
  const [postEditTitle, setPostEditTitle] = useState("");
  const [postEditContent, setPostEditContent] = useState("");
  const [postSaving, setPostSaving] = useState(false);
  const [postShowConfirm, setPostShowConfirm] = useState(false);

  function startEditPost() {
    if (!post) return;
    setPostEditTitle(post.title);
    setPostEditContent(post.content);
    setPostEditing(true);
  }

  async function handleSavePost() {
    if (!post || postSaving) return;
    setPostSaving(true);
    try {
      const form = new FormData();
      if (postEditTitle.trim()) form.append("title", postEditTitle.trim());
      if (postEditContent.trim()) form.append("content", postEditContent.trim());
      const res = await authFetch(`/api/forum/posts/${post.id}`, { method: "PATCH", body: form });
      const data = await res.json();
      if (data.success) {
        setPost(p => p ? { ...p, title: data.data.post.title, content: data.data.post.content } : p);
        setPostEditing(false);
      }
    } catch {}
    setPostSaving(false);
  }

  async function handleDeletePost() {
    if (!post) return;
    try {
      await authFetch(`/api/forum/posts/${post.id}`, { method: "DELETE" });
      router.push("/forum");
    } catch {}
  }

  function handleReply(target: ForumComment) {
    if (!isLoggedIn) { router.push("/signin"); return; }
    const mention = `@${target.author.firstName} ${target.author.lastName} `;
    setReplyingTo(target);
    setInputText(mention);
    // Use the known mention length directly — don't read from DOM which may not
    // have updated yet when the timeout fires
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(mention.length, mention.length);
    }, 50);
  }

  function cancelReply() {
    setReplyingTo(null);
    setInputText("");
    setInputImages([]);
    setInputPreviews([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!inputText.trim() && !inputImages.length) || submitting) return;
    if (!isLoggedIn) { router.push("/signin"); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("content", inputText.trim());
      inputImages.forEach(img => form.append("images", img));
      let res: Response;
      if (replyingTo) {
        res = await authFetch(`/api/forum/comments/${replyingTo.id}/replies`, { method: "POST", body: form });
      } else {
        res = await authFetch(`/api/forum/posts/${id}/comments`, { method: "POST", body: form });
      }
      const data = await res.json();
      if (data.success) {
        if (replyingTo) {
          const rootId = replyingTo.parentId ?? replyingTo.id;
          setReplyTriggers(prev => ({ ...prev, [rootId]: (prev[rootId] || 0) + 1 }));
        } else {
          setComments(prev => [data.data.comment, ...prev]);
          setPost(p => p ? { ...p, commentsCount: p.commentsCount + 1 } : p);
        }
        setInputText("");
        setInputImages([]);
        setInputPreviews([]);
        setReplyingTo(null);
      }
    } catch {}
    setSubmitting(false);
  }

  const isPostOwner = !!currentUserId && post?.authorId === currentUserId;

  // Shared write-up block (used in both desktop & mobile)
  const postWriteUp = post ? (
    <>
      {postShowConfirm && (
        <ConfirmModal
          message="Delete this post? This cannot be undone."
          onConfirm={handleDeletePost}
          onCancel={() => setPostShowConfirm(false)}
        />
      )}
      <div className="px-5 py-4">
        {postEditing ? (
          <div className="space-y-3">
            <input
              value={postEditTitle}
              onChange={e => setPostEditTitle(e.target.value)}
              className="w-full text-sm font-bold text-dark dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary/40"
              placeholder="Title"
            />
            <textarea
              value={postEditContent}
              onChange={e => setPostEditContent(e.target.value)}
              rows={5}
              className="w-full text-sm text-dark dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary/40 resize-none"
              placeholder="Write-up..."
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSavePost}
                disabled={postSaving}
                className="text-xs font-semibold text-white bg-primary px-4 py-1.5 rounded-full disabled:opacity-50"
              >
                {postSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setPostEditing(false)}
                className="text-xs font-semibold text-body-color hover:text-dark dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-dark dark:text-white leading-relaxed">
              <span className="font-bold mr-1.5">{post.title}</span>
              {post.content && <span className="text-dark/80 dark:text-white/80">{post.content}</span>}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-xs text-body-color">
                {new Date(post.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
              {isPostOwner && (
                <>
                  <button onClick={startEditPost} className="text-xs text-body-color hover:text-primary transition-colors">Edit</button>
                  <button onClick={() => setPostShowConfirm(true)} className="text-xs text-body-color hover:text-red-500 transition-colors">Delete</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  ) : null;

  const inputProps = {
    isLoggedIn,
    replyingTo,
    inputText,
    setInputText,
    inputImages,
    setInputImages,
    inputPreviews,
    setInputPreviews,
    submitting,
    onSubmit: handleSubmit,
    onCancelReply: cancelReply,
    inputRef,
    fileRef,
  };

  // ── Loading ──────────────────────────────────────────────────────

  if (loading) {
    const shimmer = "bg-gray-200 dark:bg-gray-700 rounded-full";
    const shimmerLight = "bg-gray-100 dark:bg-gray-800 rounded-full";
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-dark pt-[85px]">
        <div className="container mx-auto px-0 md:px-4 max-w-6xl">
          <div className="max-w-2xl mx-auto mt-4 px-0 md:px-0 pb-12 animate-pulse">

            {/* Post card skeleton */}
            <div className="bg-white dark:bg-dark rounded-none md:rounded-2xl shadow-sm border-b md:border border-gray-100 dark:border-gray-700 overflow-hidden mb-4">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 dark:border-gray-800">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 ${shimmer}`} />
                <div className="space-y-2 flex-1">
                  <div className={`h-3 w-36 ${shimmer}`} />
                  <div className={`h-2.5 w-16 ${shimmerLight}`} />
                </div>
              </div>
              {/* Write-up */}
              <div className="px-5 py-4 space-y-2.5">
                <div className={`h-4 w-3/5 ${shimmer}`} />
                <div className={`h-3 w-full ${shimmerLight}`} />
                <div className={`h-3 w-full ${shimmerLight}`} />
                <div className={`h-3 w-4/5 ${shimmerLight}`} />
                <div className={`h-3 w-3/5 ${shimmerLight}`} />
              </div>
              {/* Action bar */}
              <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-800 flex items-center gap-5">
                <div className={`h-4 w-16 ${shimmer}`} />
                <div className={`h-4 w-24 ${shimmer}`} />
              </div>
            </div>

            {/* Comments card skeleton */}
            <div className="bg-white dark:bg-dark rounded-none md:rounded-2xl shadow-sm border-b md:border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800">
                <div className={`h-3.5 w-24 ${shimmer}`} />
              </div>
              {/* Comment rows */}
              {[1, 2, 3].map(i => (
                <div key={i} className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 last:border-0 flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 ${shimmer}`} />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className={`h-3 w-28 ${shimmer}`} />
                    <div className={`h-3 w-full ${shimmerLight}`} />
                    <div className={`h-3 w-4/5 ${shimmerLight}`} />
                    <div className="flex gap-4 pt-0.5">
                      <div className={`h-2.5 w-8 ${shimmerLight}`} />
                      <div className={`h-2.5 w-10 ${shimmerLight}`} />
                      <div className={`h-2.5 w-10 ${shimmerLight}`} />
                    </div>
                  </div>
                </div>
              ))}
              {/* Input area placeholder */}
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2.5">
                <div className={`flex-1 h-10 rounded-2xl ${shimmerLight}`} />
                <div className={`w-16 h-9 rounded-full ${shimmer}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const hasImages = post.images.length > 0;

  // ── Shared comments section markup ───────────────────────────────
  const commentsSection = (
    <div ref={commentsRef} id="comments">
      {comments.length === 0 ? (
        <div className="py-10 text-center px-5">
          <p className="text-sm font-semibold text-dark dark:text-white mb-1">No comments yet</p>
          <p className="text-xs text-body-color">Be the first to share your thoughts.</p>
        </div>
      ) : (
        <div>
          {comments.map(comment => (
            <CommentRow
              key={comment.id}
              comment={comment}
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
              replyTrigger={replyTriggers[comment.id] || 0}
              onReply={handleReply}
              onDelete={(id) => {
                setComments(prev => prev.filter(c => c.id !== id));
                setPost(p => p ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p);
              }}
            />
          ))}
          {commentPage < commentPages && (
            <div className="text-center py-4">
              <button
                onClick={() => fetchPost(commentPage + 1)}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Load more comments
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Action buttons (Like + Comment) ──────────────────────────────
  const actionBar = (
    <div className="px-5 py-3 flex items-center gap-5">
      <button
        onClick={togglePostLike}
        className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
          postLiked ? "text-primary" : "text-body-color hover:text-primary"
        }`}
      >
        <ThumbsUp size={18} filled={postLiked} />
        <span>{postLikesCount.toLocaleString()} {postLikesCount === 1 ? "like" : "likes"}</span>
      </button>
      <button
        onClick={() => {
          commentsRef.current?.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => inputRef.current?.focus(), 300);
        }}
        className="flex items-center gap-1.5 text-sm font-semibold text-body-color hover:text-primary transition-colors"
      >
        <CommentIcon size={18} />
        <span>{post.commentsCount.toLocaleString()} {post.commentsCount === 1 ? "comment" : "comments"}</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-dark pt-[85px]">

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="container mx-auto px-0 md:px-4 max-w-6xl">

        {/* ── DESKTOP: Two-column natural-scroll layout ── */}
        <div className="hidden md:block mt-4 pb-12">

          {/* Back nav */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-body-color hover:text-primary transition-colors"
            >
              <BackIcon />
              <span className="font-medium">Back</span>
            </button>
            <span className="text-body-color/30 text-xs">·</span>
            <Link href="/forum" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
              Investors Forum
            </Link>
          </div>

          <div className="max-w-2xl mx-auto">

            {/* Post card */}
            <div className="bg-white dark:bg-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-4">

              {/* Post header */}
              <div className="border-b border-gray-100 dark:border-gray-700">
                <PostHeader post={post} />
              </div>

              {/* Write-up (primary) */}
              {postWriteUp}

              {/* Images (attachments, below write-up) */}
              {hasImages && !postEditing && (
                <div onClick={handleDoubleTap} className="relative border-t border-gray-50 dark:border-gray-800 cursor-pointer">
                  <ImageCarousel images={post.images} contain={false} />
                  {heartAnim && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-7xl animate-ping opacity-80">❤️</span>
                    </div>
                  )}
                </div>
              )}

              {/* Like + Comment buttons (always below images / write-up) */}
              {!postEditing && (
                <div className="py-3 border-t border-gray-50 dark:border-gray-800">
                  {actionBar}
                </div>
              )}
            </div>

            {/* Comments card */}
            <div className="bg-white dark:bg-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

              {/* Comments header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
                <h2 className="text-sm font-bold text-dark dark:text-white">Comments</h2>
                {post.commentsCount > 0 && (
                  <span className="text-xs text-body-color font-medium">{post.commentsCount}</span>
                )}
              </div>

              {commentsSection}

              {/* Comment input at bottom of card */}
              <div className="border-t border-gray-100 dark:border-gray-700">
                <CommentInput {...inputProps} />
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE: Single column stacked layout ── */}
        <div className="md:hidden pb-24">

          {/* Mobile back nav */}
          <div className="flex items-center gap-2 px-4 py-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm font-medium text-body-color hover:text-primary transition-colors"
            >
              <BackIcon />
              Back to Forum
            </button>
          </div>

          <div className="bg-white dark:bg-dark border-b border-gray-100 dark:border-gray-700 overflow-hidden mb-4">

            {/* Post header */}
            <div className="border-b border-gray-50 dark:border-gray-800">
              <PostHeader post={post} />
            </div>

            {/* Write-up (primary) */}
            {postWriteUp}

            {/* Images (attachments, below write-up) */}
            {hasImages && !postEditing && (
              <div onClick={handleDoubleTap} className="relative border-t border-gray-50 dark:border-gray-800">
                <ImageCarousel images={post.images} contain={false} />
                {heartAnim && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-7xl animate-ping opacity-80">❤️</span>
                  </div>
                )}
              </div>
            )}

            {/* Like + Comment buttons (always below images / write-up) */}
            {!postEditing && (
              <div className="py-3 border-t border-gray-50 dark:border-gray-800">
                {actionBar}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white dark:bg-dark border-b border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-bold text-dark dark:text-white">Comments</h2>
              {post.commentsCount > 0 && (
                <span className="text-xs text-body-color font-medium">{post.commentsCount}</span>
              )}
            </div>
            {commentsSection}
          </div>
        </div>
      </div>

      {/* ── Mobile: Fixed bottom input ─────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark border-t border-gray-100 dark:border-gray-700 shadow-lg">
        <CommentInput {...inputProps} />
      </div>
    </div>
  );
}
