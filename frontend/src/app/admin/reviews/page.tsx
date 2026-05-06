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

function fmtShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
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
  const emit = (y: string, mo: string, d: string, h: string, mi: string) => onChange(`${y}-${mo}-${d}T${h}:${mi}`);

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

interface ReviewUser {
  firstName: string; lastName: string; email?: string; profilePhoto?: string;
}
interface ReviewProperty {
  id: string; title: string; location?: string;
}
interface Review {
  id: string;
  propertyId: string;
  property?: ReviewProperty;
  user?: ReviewUser;
  rating: number;
  title: string;
  body: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Stars display ──────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className={i <= rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

// ── Edit Review Modal ──────────────────────────────────────────────

function EditReviewModal({ review, onClose, onSaved }: {
  review: Review; onClose: () => void; onSaved: (r: Review) => void;
}) {
  const [title, setTitle]         = useState(review.title);
  const [body, setBody]           = useState(review.body);
  const [rating, setRating]       = useState(String(review.rating));
  const [approved, setApproved]   = useState(review.isApproved);
  const [createdAt, setCreatedAt] = useState(toInputDatetime(review.createdAt));
  const [updatedAt, setUpdatedAt] = useState(toInputDatetime(review.updatedAt));
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const res = await adminFetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, body,
          rating: Number(rating),
          isApproved: approved,
          createdAt: new Date(createdAt).toISOString(),
          updatedAt: new Date(updatedAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) { onSaved(data.data.review); onClose(); }
      else setErr(data.message || "Failed to save");
    } catch { setErr("Network error"); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-[#1c1c2e] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl border-t border-gray-200 dark:border-gray-700 sm:border overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-dark dark:text-white text-sm">Edit Review</h2>
          <button onClick={onClose} className="text-body-color hover:text-dark dark:hover:text-white text-lg leading-none p-1">✕</button>
        </div>
        <div className="p-4 sm:p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {err && <p className="text-xs text-red-500">{err}</p>}

          <div>
            <label className="block text-xs font-semibold text-body-color uppercase tracking-wider mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full text-sm bg-gray-50 dark:bg-gray-800 text-dark dark:text-white rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-body-color uppercase tracking-wider mb-1">Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} className="w-full text-sm bg-gray-50 dark:bg-gray-800 text-dark dark:text-white rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary/50 resize-none" />
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-body-color uppercase tracking-wider mb-1">Rating</label>
              <div className="relative">
                <select value={rating} onChange={e => setRating(e.target.value)} className={SEL_BASE}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
                </select>
                <Chevron />
              </div>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <span className="text-xs font-semibold text-body-color uppercase tracking-wider">Approved</span>
              <button
                type="button"
                onClick={() => setApproved(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${approved ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${approved ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
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

// ── Main Page ──────────────────────────────────────────────────────

type Filter = "all" | "approved" | "pending";

export default function AdminReviewsPage() {
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [filter, setFilter]         = useState<Filter>("all");
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [togglingId, setTogglingId]       = useState<string | null>(null);

  const fetchReviews = useCallback(async (p: number, f: Filter) => {
    setLoading(true);
    setFetchError("");
    try {
      const approvedParam = f === "approved" ? "&approved=true" : f === "pending" ? "&approved=false" : "";
      const res = await adminFetch(`/api/admin/reviews?page=${p}&limit=20${approvedParam}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews ?? []);
        setTotal(data.data.total ?? 0);
        setPages(data.data.pages ?? 1);
        setPage(p);
      } else {
        setFetchError(data.message || "Failed to load reviews");
      }
    } catch (e: any) {
      setFetchError(e?.message || "Network error — check backend is running");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchReviews(1, filter); }, [fetchReviews, filter]);

  async function deleteReview(id: string) {
    if (!confirm("Permanently delete this review?")) return;
    setDeletingId(id);
    await adminFetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setReviews(prev => prev.filter(r => r.id !== id));
    setTotal(t => t - 1);
    setDeletingId(null);
  }

  async function toggleApprove(review: Review) {
    setTogglingId(review.id);
    const res = await adminFetch(`/api/admin/reviews/${review.id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: !review.isApproved }),
    });
    const data = await res.json();
    if (data.success) {
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, isApproved: data.data.isApproved } : r));
    }
    setTogglingId(null);
  }

  const filterBtnClass = (f: Filter) =>
    `text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${
      filter === f
        ? "bg-primary text-white border-primary"
        : "border-gray-200 dark:border-gray-600 text-body-color hover:border-primary hover:text-primary"
    }`;

  return (
    <div className="p-4 md:p-6 lg:p-8 lg:pl-72">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">Reviews Management</h1>
          <p className="text-sm text-body-color mt-1">{total} total reviews</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setFilter("all")} className={filterBtnClass("all")}>All</button>
          <button onClick={() => setFilter("approved")} className={filterBtnClass("approved")}>Approved</button>
          <button onClick={() => setFilter("pending")} className={filterBtnClass("pending")}>Pending</button>
        </div>

        {editingReview && (
          <EditReviewModal
            review={editingReview}
            onClose={() => setEditingReview(null)}
            onSaved={updated => {
              setReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
              setEditingReview(null);
            }}
          />
        )}

        {fetchError && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            {fetchError}
          </div>
        )}

        {/* Reviews list */}
        <div className="bg-white dark:bg-[#1c1c2e] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-body-color animate-pulse">Loading reviews…</div>
          ) : reviews.length === 0 ? (
            <div className="py-20 text-center text-sm text-body-color">No reviews found.</div>
          ) : reviews.map(review => (
            <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 px-4 sm:px-5 py-4">

              {/* Status badge + property name */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {review.isApproved ? (
                  <span className="text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded">Approved</span>
                ) : (
                  <span className="text-[10px] font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded">Pending</span>
                )}
                <span className="text-sm font-bold text-dark dark:text-white line-clamp-1">
                  {review.property?.title ?? review.propertyId}
                </span>
              </div>

              {/* Author + rating */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs font-medium text-dark/70 dark:text-white/70">
                  {review.user ? `${review.user.firstName} ${review.user.lastName}` : "Unknown"}
                </span>
                {review.user?.email && (
                  <span className="text-[11px] text-body-color hidden sm:inline">{review.user.email}</span>
                )}
                <Stars rating={review.rating} />
              </div>

              {/* Review title + body */}
              {review.title && (
                <p className="text-sm font-semibold text-dark dark:text-white mb-0.5">{review.title}</p>
              )}
              <p className="text-xs text-dark/70 dark:text-white/70 line-clamp-2 mb-2">{review.body}</p>

              {/* Date */}
              <p className="text-[11px] text-body-color mb-3">
                <span className="hidden sm:inline">Created: {fmt(review.createdAt)} · Updated: {fmt(review.updatedAt)}</span>
                <span className="sm:hidden">{fmtShort(review.createdAt)}</span>
              </p>

              {/* Action buttons — always on their own row, wrap cleanly */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleApprove(review)}
                  disabled={togglingId === review.id}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                    review.isApproved
                      ? "border-yellow-300 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                      : "border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  }`}
                >
                  {togglingId === review.id ? "…" : review.isApproved ? "Unapprove" : "Approve"}
                </button>
                <button
                  onClick={() => setEditingReview(review)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-body-color hover:border-primary hover:text-primary transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteReview(review.id)}
                  disabled={deletingId === review.id}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {deletingId === review.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => fetchReviews(page - 1, filter)}
              disabled={page <= 1}
              className="text-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 text-body-color hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-body-color">{page} / {pages}</span>
            <button
              onClick={() => fetchReviews(page + 1, filter)}
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
