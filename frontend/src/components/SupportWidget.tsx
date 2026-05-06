"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import "./SignupForm/phoneInput.css";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/api";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "";
const SESSION_KEY = "chat_session_token";

interface ChatMsg {
  id: string;
  senderType: "visitor" | "admin";
  content: string;
  images?: string[];
  createdAt: string;
}

function getOrCreateToken(): string {
  let token = localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineForm, setOfflineForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [offlineSending, setOfflineSending] = useState(false);
  const [offlineSent, setOfflineSent] = useState(false);
  const [offlineError, setOfflineError] = useState("");

  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const pathname = usePathname();
  const socketRef = useRef<Socket | null>(null);
  const sessionTokenRef = useRef<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify admin on WhatsApp when a brand-new visitor lands on the site
  useEffect(() => {
    const alreadyHadToken = !!localStorage.getItem(SESSION_KEY);
    if (alreadyHadToken) return; // returning visitor — skip
    const token = getOrCreateToken();
    sessionTokenRef.current = token;
    fetch(`${API_BASE}/chat/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: token,
        currentPage: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-close widget and reset offline form 3s after successful submission
  useEffect(() => {
    if (!offlineSent) return;
    const t = setTimeout(() => {
      setOpen(false);
      setOfflineSent(false);
      setOfflineForm({ name: "", email: "", phone: "", message: "" });
    }, 3000);
    return () => clearTimeout(t);
  }, [offlineSent]);

  // Fetch online/offline status on mount and connect socket immediately
  // (socket must be alive even when widget is closed so chat_status events are received in real-time)
  useEffect(() => {
    const token = getOrCreateToken();
    sessionTokenRef.current = token;

    // Fetch initial status
    fetch(`${API_BASE}/chat/status`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setIsOnline(res.data.isOnline); })
      .catch(() => {});

    // Persistent socket connection — keeps chat_status & chat_reply live at all times
    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { sessionToken: token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("chat_status", ({ isOnline }: { isOnline: boolean }) => {
      setIsOnline(isOnline);
    });
    socket.on("chat_reply", (msg: ChatMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire-and-forget page update on every navigation (only if session exists)
  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return;
    fetch(`${API_BASE}/chat/page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: token, currentPage: window.location.href }),
    }).catch(() => {});
  }, [pathname]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  // Load chat history when widget opens for the first time
  const historyLoadedRef = useRef(false);
  useEffect(() => {
    if (!open || historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    const token = sessionTokenRef.current || getOrCreateToken();
    fetch(`${API_BASE}/chat/history/${token}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setMessages(res.data);
          setNameSubmitted(true);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleStartChat() {
    const name = visitorName.trim() || "Visitor";
    const token = sessionTokenRef.current;

    await fetch(`${API_BASE}/chat/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: token,
        visitorName: name,
        currentPage: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });

    setNameSubmitted(true);
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - attachedImages.length);
    if (files.length === 0) return;
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

  async function handleSend() {
    const content = input.trim();
    if ((!content && attachedImages.length === 0) || sending) return;

    const token = sessionTokenRef.current;
    const name = visitorName.trim() || "Visitor";

    setSending(true);
    setInput("");

    const currentFiles = [...attachedImages];
    const currentPreviews = [...imagePreviews];
    setAttachedImages([]);
    setImagePreviews([]);

    // Optimistic update — show blob URLs while uploading
    const tempMsg: ChatMsg = {
      id: `temp-${Date.now()}`,
      senderType: "visitor",
      content,
      images: currentPreviews.length > 0 ? currentPreviews : undefined,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      let fetchBody: FormData | string;
      const fetchHeaders: Record<string, string> = {};

      if (currentFiles.length > 0) {
        const fd = new FormData();
        fd.append("sessionToken", token);
        if (content) fd.append("content", content);
        fd.append("visitorName", name);
        fd.append("currentPage", window.location.href);
        currentFiles.forEach((f) => fd.append("images", f));
        fetchBody = fd;
      } else {
        fetchHeaders["Content-Type"] = "application/json";
        fetchBody = JSON.stringify({ sessionToken: token, content, visitorName: name, currentPage: window.location.href });
      }

      const res = await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: fetchHeaders,
        body: fetchBody,
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Replace temp with real (swaps blob URLs for Cloudinary URLs)
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? { ...data.data, senderType: "visitor" } : m))
        );
        currentPreviews.forEach((url) => URL.revokeObjectURL(url));
      }
    } catch {
      // keep the optimistic message even on error
    } finally {
      setSending(false);
    }
  }

  const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const phoneValid = (v: string) => (v.replace(/\D/g, "").length >= 10);

  async function handleOfflineSubmit() {
    const { name, email, phone, message } = offlineForm;
    if (!name.trim() || !emailValid(email) || !phoneValid(phone) || !message.trim()) return;
    setOfflineSending(true);
    setOfflineError("");
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setOfflineSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setOfflineError(data.message || "Failed to send. Please try again.");
      }
    } catch {
      setOfflineError("Network error. Please try again.");
    } finally {
      setOfflineSending(false);
    }
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed right-4 z-[9998] w-[370px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-hidden"
          style={{ top: "4.5rem", bottom: "5rem" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#4a6cf7] text-white shrink-0">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Alvarado Support</p>
              <p className="text-xs text-white/70 flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline && connected ? "bg-green-300" : isOnline ? "bg-yellow-300" : "bg-red-400"}`} />
                {!isOnline ? "Offline" : connected ? "Online" : "Connecting…"}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Offline state */}
          {!isOnline ? (
            <div className="flex flex-col flex-1 overflow-y-auto px-5 py-5 gap-3">
              {offlineSent ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
                  <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">Message sent!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">We&apos;ll get back to you as soon as we&apos;re back online.</p>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">We&apos;re offline right now</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Leave your details and we&apos;ll follow up shortly.</p>
                  <input
                    type="text"
                    placeholder="Your name *"
                    value={offlineForm.name}
                    onChange={(e) => setOfflineForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a6cf7]"
                  />
                  <div>
                    <input
                      type="email"
                      placeholder="Email address *"
                      value={offlineForm.email}
                      onChange={(e) => setOfflineForm((f) => ({ ...f, email: e.target.value }))}
                      className={`w-full rounded-xl border bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a6cf7] ${offlineForm.email && !emailValid(offlineForm.email) ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
                    />
                    {offlineForm.email && !emailValid(offlineForm.email) && (
                      <p className="text-[10px] text-red-400 mt-0.5 pl-1">Enter a valid email address</p>
                    )}
                  </div>
                  <div>
                    <div className={`phone-input-compact${offlineForm.phone.replace(/\D/g, "").length > 1 && !phoneValid(offlineForm.phone) ? " phone-input-error" : ""}`}>
                      <PhoneInput
                        defaultCountry="us"
                        value={offlineForm.phone}
                        onChange={(phone) => setOfflineForm((f) => ({ ...f, phone }))}
                      />
                    </div>
                    {offlineForm.phone.replace(/\D/g, "").length > 1 && !phoneValid(offlineForm.phone) && (
                      <p className="text-[10px] text-red-400 mt-0.5 pl-1">Enter a valid phone number (min 10 digits)</p>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Your message *"
                    value={offlineForm.message}
                    onChange={(e) => setOfflineForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a6cf7]"
                  />
                  {offlineError && (
                    <p className="text-[10px] text-red-400 text-center">{offlineError}</p>
                  )}
                  <button
                    onClick={handleOfflineSubmit}
                    disabled={offlineSending || !offlineForm.name.trim() || !emailValid(offlineForm.email) || !phoneValid(offlineForm.phone) || !offlineForm.message.trim()}
                    className="w-full rounded-xl bg-[#4a6cf7] text-white py-2.5 text-xs font-medium hover:bg-[#3a5ce7] transition-colors disabled:opacity-50"
                  >
                    {offlineSending ? "Sending…" : "Send Message"}
                  </button>
                </>
              )}
            </div>
          ) : !nameSubmitted ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-[#4a6cf7]/10 flex items-center justify-center">
                <svg className="h-7 w-7 text-[#4a6cf7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">How can we help?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Chat directly with our support team — no login needed.
                </p>
              </div>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleStartChat(); }}
                placeholder="Your name (optional)"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a6cf7]"
              />
              <button
                onClick={handleStartChat}
                className="w-full rounded-xl bg-[#4a6cf7] text-white py-2.5 text-sm font-medium hover:bg-[#3a5ce7] transition-colors"
              >
                Start Chat
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-xs text-gray-400 text-center mt-8">
                    Send a message to start chatting with support.
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2 ${m.senderType === "visitor" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold text-white
                        ${m.senderType === "visitor" ? "bg-[#4a6cf7]" : "bg-indigo-500"}`}
                    >
                      {m.senderType === "visitor" ? "You" : "S"}
                    </div>
                    <div className={`flex-1 flex flex-col gap-1 ${m.senderType === "visitor" ? "items-end" : "items-start"}`}>
                      {m.content && (
                        <div
                          className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap max-w-[85%]
                            ${m.senderType === "visitor"
                              ? "rounded-tr-none bg-[#4a6cf7] text-white"
                              : "rounded-tl-none bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                            }`}
                        >
                          {m.content}
                        </div>
                      )}
                      {m.images && m.images.length > 0 && (
                        <div className="flex flex-wrap gap-1 max-w-[85%]">
                          {m.images.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt="attachment"
                              className="rounded-xl max-h-44 max-w-[160px] object-cover cursor-pointer border border-gray-200 dark:border-gray-700"
                              onClick={() => window.open(url, "_blank")}
                            />
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-gray-400">{fmt(m.createdAt)}</span>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 dark:border-gray-700 px-3 pt-2 pb-3 shrink-0">
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
                <div className="flex gap-2 items-end">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {/* Paperclip button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={attachedImages.length >= 5}
                    className="shrink-0 h-8 w-8 rounded-full text-gray-400 hover:text-[#4a6cf7] hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center disabled:opacity-40 transition-colors"
                    aria-label="Attach image"
                    title="Attach image (max 5)"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message…"
                    className="min-w-0 flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a6cf7]"
                    style={{ maxHeight: 80 }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || (!input.trim() && attachedImages.length === 0)}
                    className="shrink-0 h-8 w-8 rounded-full bg-[#4a6cf7] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#3a5ce7] transition-colors"
                    aria-label="Send"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Support chat"
        className="fixed bottom-4 right-4 z-[9999] h-14 w-14 rounded-full bg-[#4a6cf7] text-white shadow-lg flex items-center justify-center hover:bg-[#3a5ce7] transition-all hover:scale-105"
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </>
  );
}
