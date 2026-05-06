"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/api";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("_at") ?? "";
}

/** Fetch wrapper that sends both the httpOnly cookie AND the Bearer header.
 *  Cookie is the primary auth on production (cross-domain Vercel→Render).
 *  Bearer header is the fallback for local dev. */
function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

export default function WhatsAppAdminPage() {
  const router = useRouter();
  const [waConnected, setWaConnected]   = useState(false);
  const [hasQR, setHasQR]               = useState(false);
  const [qrDataUrl, setQrDataUrl]       = useState<string | null>(null);
  const [chatOnline, setChatOnline]     = useState(true);

  const [statusLoading, setStatusLoading]   = useState(true);
  const [qrLoading, setQrLoading]           = useState(false);
  const [resetLoading, setResetLoading]     = useState(false);
  const [chatToggling, setChatToggling]     = useState(false);
  const [resetMsg, setResetMsg]             = useState("");
  const [authError, setAuthError]           = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Stops polling and marks auth error — call on any 401 response */
  const handleUnauthorized = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setAuthError(true);
    setStatusLoading(false);
  }, []);

  // ── Fetch WA status ─────────────────────────────────────────────────────────
  const fetchWaStatus = useCallback(async (): Promise<boolean> => {
    try {
      const res = await authFetch(`${API_BASE}/admin/whatsapp/status`);
      if (res.status === 401) { handleUnauthorized(); return false; }
      const data = await res.json();
      if (data.success) {
        setWaConnected(data.data.connected);
        setHasQR(data.data.hasQR);
        setStatusLoading(false);
        return data.data.connected as boolean;
      }
    } catch {}
    setStatusLoading(false);
    return false;
  }, [handleUnauthorized]);

  // ── Fetch QR code ────────────────────────────────────────────────────────────
  const fetchQR = useCallback(async () => {
    setQrLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/whatsapp/qr`);
      if (res.status === 401) { handleUnauthorized(); return; }
      const data = await res.json();
      if (data.success && data.data?.qr) {
        setQrDataUrl(data.data.qr);
      } else {
        setQrDataUrl(null);
      }
    } catch {}
    setQrLoading(false);
  }, [handleUnauthorized]);

  // ── Fetch chat widget status ─────────────────────────────────────────────────
  const fetchChatStatus = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/admin/chat/status`);
      if (res.status === 401) { handleUnauthorized(); return; }
      const data = await res.json();
      if (data.success) setChatOnline(data.data.isOnline);
    } catch {}
  }, [handleUnauthorized]);

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchWaStatus();
    fetchChatStatus();
  }, [fetchWaStatus, fetchChatStatus]);

  // ── Auto-poll QR every 6s when not connected ─────────────────────────────────
  useEffect(() => {
    if (authError) return; // don't poll if not authenticated
    if (pollRef.current) clearInterval(pollRef.current);

    if (!waConnected) {
      fetchQR();
      pollRef.current = setInterval(async () => {
        const connected = await fetchWaStatus();
        if (connected) {
          setQrDataUrl(null);
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          fetchQR();
        }
      }, 6000);
    } else {
      setQrDataUrl(null);
    }

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [waConnected, authError, fetchQR, fetchWaStatus]);

  // ── Reset WhatsApp ────────────────────────────────────────────────────────────
  async function handleReset() {
    if (!confirm("This will clear the WhatsApp session and force a new QR scan. Continue?")) return;
    setResetLoading(true);
    setResetMsg("");
    try {
      const res = await authFetch(`${API_BASE}/admin/whatsapp/reset`, { method: "POST" });
      const data = await res.json();
      setResetMsg(data.message ?? (data.success ? "Reset successful." : "Reset failed."));
      if (data.success) {
        setWaConnected(false);
        setHasQR(false);
        setQrDataUrl(null);
        // Start polling for the new QR after a short delay
        setTimeout(() => fetchWaStatus(), 3000);
      }
    } catch {
      setResetMsg("Network error. Try again.");
    }
    setResetLoading(false);
  }

  // ── Toggle chat widget online/offline ─────────────────────────────────────────
  async function handleChatToggle() {
    setChatToggling(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/chat/status`, {
        method: "PATCH",
        body: JSON.stringify({ isOnline: !chatOnline }),
      });
      const data = await res.json();
      if (data.success) setChatOnline(data.data.isOnline);
    } catch {}
    setChatToggling(false);
  }

  if (authError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="rounded-2xl bg-white dark:bg-gray-dark shadow-sm border border-red-200 dark:border-red-700 p-8 flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Session expired</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your admin session has expired. Please log in again.</p>
          </div>
          <button
            onClick={() => router.push("/signin")}
            className="rounded-xl bg-[#4a6cf7] text-white px-6 py-2.5 text-sm font-medium hover:bg-[#3a5ce7] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp & Chat</h1>

      {/* ── WhatsApp Connection Card ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-gray-dark shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">WhatsApp Connection</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Link a WhatsApp number to receive visitor notifications and support messages.
            </p>
          </div>

          {/* Status badge */}
          {statusLoading ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
              Checking…
            </span>
          ) : waConnected ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-900/20 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Disconnected
            </span>
          )}
        </div>

        {/* QR section — shown when not connected */}
        {!waConnected && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
              Scan the QR code below with WhatsApp on your phone.<br />
              <span className="text-xs text-gray-400">WhatsApp → Linked Devices → Link a Device</span>
            </p>

            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800"
              style={{ width: 220, height: 220 }}>
              {qrLoading && !qrDataUrl ? (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-xs">Loading QR…</span>
                </div>
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt="WhatsApp QR" className="w-52 h-52 object-contain rounded-lg" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 px-4 text-center">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs">QR not ready yet — waiting for server…</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400">QR refreshes automatically every 6 seconds</p>
          </div>
        )}

        {/* Connected state */}
        {waConnected && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 px-4 py-3">
            <svg className="h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-700 dark:text-green-300">
              WhatsApp is connected. Visitor notifications and admin replies are active.
            </p>
          </div>
        )}

        {/* Reset button */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reset Session</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Use this if WhatsApp shows &quot;Bad MAC&quot; or session errors. Forces a fresh QR scan.
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetLoading}
            className="shrink-0 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
          >
            {resetLoading ? "Resetting…" : "Reset & Re-link"}
          </button>
        </div>

        {resetMsg && (
          <p className="mt-3 text-xs text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
            {resetMsg}
          </p>
        )}
      </div>

      {/* ── Chat Widget Toggle Card ──────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-gray-dark shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Chat Widget</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Toggle the live chat widget on your website. When offline, visitors see a contact form instead.
            </p>
          </div>

          {/* Toggle switch */}
          <button
            onClick={handleChatToggle}
            disabled={chatToggling}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none disabled:opacity-50
              ${chatOnline ? "bg-[#4a6cf7]" : "bg-gray-300 dark:bg-gray-600"}`}
            aria-label="Toggle chat widget"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
                ${chatOnline ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>

        <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium
          ${chatOnline
            ? "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800"
            : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700"}`}
        >
          <span className={`h-2 w-2 rounded-full ${chatOnline ? "bg-green-500" : "bg-gray-400"}`} />
          Chat widget is currently <strong className="ml-1">{chatOnline ? "Online" : "Offline"}</strong>
          {chatToggling && <span className="ml-2 text-xs opacity-60">Updating…</span>}
        </div>
      </div>
    </div>
  );
}
