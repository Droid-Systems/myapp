"use client";

import { useEffect, useState, useCallback, useRef, ChangeEvent } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/api";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "";

interface TicketUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Reply {
  id: string;
  message: string;
  isStaff: boolean;
  authorName: string;
  createdAt: string;
  images?: string[];
}

interface TicketSummary {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: TicketUser | null;
  firstMessage: string;
  messageCount: number;
  whatsappPhone?: string | null;
}

interface TicketDetail extends TicketSummary {
  message: string;
  replies: Reply[];
  whatsappPhone?: string | null;
}

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const;
type TicketStatus = (typeof STATUS_OPTIONS)[number];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-200 text-gray-600",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };
  return map[status] ?? status;
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };
  return map[priority] ?? "bg-gray-100 text-gray-500";
}

function fmt(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const currentTicketIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const LIMIT = 20;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminGetSupportTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page,
        limit: LIMIT,
      });
      if (res.success && res.data) {
        setTickets(res.data.tickets);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ── Socket.io connection ─────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      // Callback form: reads the LATEST localStorage token on every reconnect
      // attempt — avoids "expired token on reconnect" auth failure
      auth: (cb: (data: object) => void) => {
        cb({ token: localStorage.getItem("_at") ?? "" });
      },
      // Send httpOnly cookies as fallback auth (for when _at isn't in localStorage)
      withCredentials: true,
      // Never stop retrying — Render deploys/restarts disconnect all sockets
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });
    socketRef.current = socket;

    socket.on("support_new_reply", ({ ticketId, reply }: { ticketId: string; reply: Reply }) => {
      setSelected((prev) => {
        if (!prev || prev.id !== ticketId) return prev;
        if (prev.replies.some((r) => r.id === reply.id)) return prev;
        return { ...prev, replies: [...prev.replies, reply] };
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, messageCount: t.messageCount + 1, updatedAt: reply.createdAt } : t
        )
      );
    });

    socket.on("ticket_status_changed", ({ ticketId, status }: { ticketId: string; status: string }) => {
      setSelected((prev) => (prev?.id === ticketId ? { ...prev, status } : prev));
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    });

    socket.on("support_new_ticket", (ticket: TicketSummary) => {
      setTickets((prev) => {
        if (prev.some((t) => t.id === ticket.id)) return prev;
        return [ticket, ...prev];
      });
      setTotal((prev) => prev + 1);
    });

    // Re-join current ticket room after reconnect so room-based events still work
    socket.on("connect", () => {
      const ticketId = currentTicketIdRef.current;
      if (ticketId) socket.emit("join_ticket", ticketId);
    });

    socket.on("connect_error", () => { /* silent */ });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Join/leave ticket room when selected ticket changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const prev = currentTicketIdRef.current;
    if (prev) socket.emit("leave_ticket", prev);

    if (selected?.id) {
      socket.emit("join_ticket", selected.id);
      currentTicketIdRef.current = selected.id;
    } else {
      currentTicketIdRef.current = null;
    }
  }, [selected?.id]);

  // Auto-scroll to newest message
  useEffect(() => {
    if (selected) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selected?.replies.length]);

  async function openTicket(id: string) {
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await api.adminGetSupportTicket(id);
      if (res.success && res.data) {
        setSelected(res.data);
        setReplyText("");
      }
    } finally {
      setDetailLoading(false);
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - attachedImages.length);
    if (!files.length) return;
    setAttachedImages((prev) => [...prev, ...files].slice(0, 5));
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      setImagePreviews((prev) => [...prev, url].slice(0, 5));
    });
    e.target.value = "";
  }

  function removeImage(index: number) {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleReply() {
    if (!selected || (!replyText.trim() && attachedImages.length === 0)) return;
    setReplying(true);

    const currentFiles = [...attachedImages];
    const currentPreviews = [...imagePreviews];
    setAttachedImages([]);
    setImagePreviews([]);

    try {
      let data: any;

      if (currentFiles.length > 0) {
        // Use FormData so multer on the server can parse the images
        const token = typeof window !== "undefined" ? localStorage.getItem("_at") : null;
        const fd = new FormData();
        if (replyText.trim()) fd.append("message", replyText.trim());
        currentFiles.forEach((f) => fd.append("images", f));
        const res = await fetch(
          `${API_BASE}/admin/support/${encodeURIComponent(selected.id)}/reply`,
          {
            method: "POST",
            credentials: "include",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
          }
        );
        const json = await res.json();
        data = json.success ? json.data : null;
        currentPreviews.forEach((u) => URL.revokeObjectURL(u));
      } else {
        const res = await api.adminReplyToTicket(selected.id, replyText.trim());
        data = res.success ? res.data : null;
      }

      if (data) {
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                replies: [...prev.replies, data],
                status: prev.status === "open" ? "in_progress" : prev.status,
              }
            : prev
        );
        setReplyText("");
        fetchTickets();
      }
    } finally {
      setReplying(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!selected) return;
    setStatusUpdating(true);
    try {
      const res = await api.adminUpdateTicketStatus(selected.id, newStatus);
      if (res.success) {
        setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev));
        setTickets((prev) =>
          prev.map((t) => (t.id === selected.id ? { ...t, status: newStatus } : t))
        );
      }
    } finally {
      setStatusUpdating(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    /* Fixed-height container so inner panels scroll independently */
    <div className="flex h-[calc(100dvh-64px)] overflow-hidden bg-gray-50 dark:bg-gray-900">

      {/* ── Left Panel: ticket list ──────────────────────────────────────────── */}
      <div
        className={`
          flex flex-col overflow-hidden
          border-r border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800
          ${selected || detailLoading
            ? "hidden lg:flex lg:w-[42%] xl:w-2/5"
            : "w-full lg:w-[42%] xl:w-2/5"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3 shrink-0">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">Support Tickets</h1>
          <span className="text-xs text-gray-500 dark:text-gray-400">{total} total</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All priorities</option>
            {["low", "medium", "high", "urgent"].map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>

          <button
            onClick={() => { setStatusFilter(""); setPriorityFilter(""); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Clear
          </button>
        </div>

        {/* Ticket list — scrolls independently */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500 text-sm">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-500 text-sm">No tickets found</div>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => openTicket(ticket.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selected?.id === ticket.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1 flex-1">
                    {ticket.subject}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(ticket.status)}`}>
                    {statusLabel(ticket.status)}
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {ticket.whatsappPhone ? (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-green-100 text-green-700 font-medium">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {ticket.whatsappPhone}
                    </span>
                  ) : (
                    <span className="truncate max-w-[120px]">{ticket.user?.firstName ?? "Deleted"} {ticket.user?.lastName ?? "User"}</span>
                  )}
                  <span>·</span>
                  <span className={`rounded px-1.5 py-0.5 font-medium ${priorityBadge(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span>·</span>
                  <span>{ticket.category}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {ticket.firstMessage}
                </p>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>{fmt(ticket.updatedAt)}</span>
                  <span>{ticket.messageCount} msg{ticket.messageCount !== 1 ? "s" : ""}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 shrink-0">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="disabled:opacity-40 hover:text-gray-900 dark:hover:text-white"
            >
              ← Prev
            </button>
            <span className="text-xs">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-40 hover:text-gray-900 dark:hover:text-white"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Right Panel: ticket detail ────────────────────────────────────────── */}
      {selected || detailLoading ? (
        <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-gray-800">

          {/* Detail header */}
          <div className="flex items-start gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-3 shrink-0">
            {/* Back button — mobile only */}
            <button
              onClick={() => setSelected(null)}
              className="lg:hidden mt-0.5 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 shrink-0"
              aria-label="Back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {selected && (
              <div className="flex flex-1 min-w-0 flex-col gap-1.5">
                {/* Row 1: subject */}
                <h2 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight line-clamp-2">
                  {selected.subject}
                </h2>
                {/* Row 2: user info */}
                {selected.whatsappPhone ? (
                  <span className="inline-flex items-center gap-1 text-xs rounded px-1.5 py-0.5 bg-green-100 text-green-700 font-medium self-start">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp · {selected.whatsappPhone}
                  </span>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selected.user?.firstName ?? "Deleted"} {selected.user?.lastName ?? "User"}
                    {selected.user?.email ? ` · ${selected.user.email}` : ""}
                  </p>
                )}
                {/* Row 3: status selector */}
                <select
                  value={selected.status}
                  disabled={statusUpdating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="self-start rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {detailLoading ? (
            <div className="flex flex-1 items-center justify-center text-gray-500 text-sm">Loading…</div>
          ) : selected ? (
            <>
              {/* Ticket meta */}
              <div className="flex flex-wrap gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 text-xs shrink-0">
                <span className={`rounded-full px-2.5 py-1 font-medium ${priorityBadge(selected.priority)}`}>
                  Priority: {selected.priority}
                </span>
                <span className="rounded-full px-2.5 py-1 font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  Category: {selected.category}
                </span>
                <span className="hidden sm:inline text-gray-400 dark:text-gray-500 ml-auto self-center">
                  Opened {fmt(selected.createdAt)}
                </span>
              </div>

              {/* Message thread — scrolls independently */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Original message */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      {selected.user?.firstName?.[0] ?? "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selected.user?.firstName ?? "Deleted"} {selected.user?.lastName ?? "User"}
                      </span>
                      <span className="text-xs text-gray-400">{fmt(selected.createdAt)}</span>
                    </div>
                    <div className="rounded-xl bg-gray-100 dark:bg-gray-700 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">
                      {selected.message}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {selected.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`flex gap-3 ${reply.isStaff ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        reply.isStaff
                          ? "bg-indigo-100 dark:bg-indigo-900/40"
                          : "bg-blue-100 dark:bg-blue-900/40"
                      }`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          reply.isStaff
                            ? "text-indigo-700 dark:text-indigo-300"
                            : "text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {reply.isStaff ? "S" : reply.authorName?.[0] ?? "U"}
                      </span>
                    </div>
                    <div className={`flex-1 min-w-0 flex flex-col ${reply.isStaff ? "items-end" : "items-start"}`}>
                      <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1 ${reply.isStaff ? "flex-row-reverse" : ""}`}>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {reply.authorName}
                        </span>
                        <span className="text-xs text-gray-400">{fmt(reply.createdAt)}</span>
                      </div>
                      {reply.message && (
                        <div
                          className={`rounded-xl px-4 py-3 text-sm whitespace-pre-wrap break-words max-w-[85%] ${
                            reply.isStaff
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {reply.message}
                        </div>
                      )}
                      {reply.images && reply.images.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1 max-w-[85%]">
                          {reply.images.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt="attachment"
                              className="rounded-xl max-h-48 max-w-[200px] object-cover cursor-pointer border border-gray-200 dark:border-gray-700"
                              onClick={() => window.open(url, "_blank")}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              {selected.status !== "closed" && selected.status !== "resolved" ? (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 shrink-0">
                  {/* Image previews */}
                  {imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {imagePreviews.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt="" className="h-16 w-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                            aria-label="Remove image"
                          >
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply();
                    }}
                    placeholder="Type your reply…"
                    className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={attachedImages.length >= 5}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                        title="Attach image (max 5)"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Image{attachedImages.length > 0 ? ` (${attachedImages.length})` : ""}
                      </button>
                      <span className="text-xs text-gray-400 hidden sm:block">Ctrl+Enter to send</span>
                    </div>
                    <button
                      onClick={handleReply}
                      disabled={replying || (!replyText.trim() && attachedImages.length === 0)}
                      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {replying ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Sending…
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send Reply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-sm text-gray-500 shrink-0">
                  This ticket is {selected.status}. Change status to reply.
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : (
        /* Empty state — desktop only */
        <div className="hidden lg:flex flex-1 items-center justify-center text-gray-400 dark:text-gray-600 flex-col gap-3">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-sm">Select a ticket to view and respond</p>
        </div>
      )}
    </div>
  );
}
