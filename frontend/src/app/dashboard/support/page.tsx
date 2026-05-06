"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { TabWrapper } from "./TabWrapper";
import SupportSkeleton from "@/components/SupportSkeleton";
import TicketDetailSkeleton from "@/components/TicketDetailSkeleton";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "";

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  message: string;
  attachments?: FileAttachment[];
  createdAt: string;
  updatedAt: string;
  replyCount?: number;
  replies: TicketReply[];
}

interface TicketReply {
  id: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  authorName: string;
  attachments?: FileAttachment[];
}

interface CreateTicketForm {
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  message: string;
}

function SupportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const urlTab = searchParams.get("tab");
  const initialTab = urlTab === "new" ? "new" : "tickets";
  const [activeTab, setActiveTab] = useState<"tickets" | "new">(initialTab);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const currentTicketIdRef = useRef<string | null>(null);

  // Cache ticket count for better skeleton loading
  const [cachedTicketCount, setCachedTicketCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('supportTicketCount');
      return cached ? parseInt(cached, 10) : 3;
    }
    return 3;
  });

  const handleTabChange = useCallback((tab: "tickets" | "new") => {
    setActiveTab(tab);
    setSelectedTicket(null);
    router.replace(`?tab=${tab}`, { scroll: false });
  }, [router]);

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setIsLoadingTicket(true);
    router.replace(`?tab=tickets&ticket=${ticket.id}`, { scroll: false });
    try {
      const result = await api.getSupportTicket(ticket.id);
      if (result.success && result.data) {
        setSelectedTicket(result.data);
      }
    } catch (err: any) {
      showNotification(err?.response?.data?.message || "Failed to load ticket", "error");
    } finally {
      setIsLoadingTicket(false);
    }
  };

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // New ticket form
  const [newTicket, setNewTicket] = useState<CreateTicketForm>({
    subject: "",
    category: "",
    priority: "medium",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // File upload state for new ticket
  const [ticketAttachments, setTicketAttachments] = useState<FileAttachment[]>([]);
  const [isUploadingTicketFile, setIsUploadingTicketFile] = useState(false);
  const ticketFileInputRef = useRef<HTMLInputElement>(null);

  // Reply state
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // File upload state for reply
  const [replyAttachments, setReplyAttachments] = useState<FileAttachment[]>([]);
  const [isUploadingReplyFile, setIsUploadingReplyFile] = useState(false);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  // ── Socket.io for real-time ticket updates ───────────────────────────────
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("_at") : null;
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on("support_new_reply", ({ ticketId, reply }: { ticketId: string; reply: TicketReply }) => {
      setSelectedTicket((prev) => {
        if (!prev || prev.id !== ticketId) return prev;
        if (prev.replies.some((r) => r.id === reply.id)) return prev;
        return { ...prev, replies: [...prev.replies, reply] };
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, replyCount: (t.replyCount ?? 0) + 1 } : t))
      );
    });

    socket.on("ticket_status_changed", ({ ticketId, status }: { ticketId: string; status: string }) => {
      setSelectedTicket((prev) =>
        prev?.id === ticketId ? { ...prev, status: status as SupportTicket["status"] } : prev
      );
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: status as SupportTicket["status"] } : t))
      );
    });

    socket.on("connect_error", () => { /* silent */ });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Join/leave ticket room when a ticket is opened/closed
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const prev = currentTicketIdRef.current;
    if (prev) socket.emit("leave_ticket", prev);

    if (selectedTicket?.id) {
      socket.emit("join_ticket", selectedTicket.id);
      currentTicketIdRef.current = selectedTicket.id;
    } else {
      currentTicketIdRef.current = null;
    }
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.replies]);

  const fetchTickets = async () => {
    try {
      const result = await api.getSupportTickets();
      if (result.success && result.data) {
        setTickets(result.data);
        // Cache ticket count for better skeleton loading next time
        const count = result.data.length;
        setCachedTicketCount(count);
        if (typeof window !== 'undefined') {
          localStorage.setItem('supportTicketCount', count.toString());
        }
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccessMessage(message);
      setErrorMessage("");
    } else {
      setErrorMessage(message);
      setSuccessMessage("");
    }
    setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);
  };

  const handleFileUpload = async (
    file: File,
    setAttachments: React.Dispatch<React.SetStateAction<FileAttachment[]>>,
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setIsUploading(true);
    try {
      const result = await api.uploadSupportAttachment(file);
      if (result.success && result.data) {
        setAttachments((prev) => [...prev, result.data!]);
      } else {
        showNotification(result.message || "Failed to upload file", "error");
      }
    } catch (err: any) {
      showNotification(err?.response?.data?.message || "Failed to upload file", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTicketFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (ticketAttachments.length >= 5) {
        showNotification("Maximum 5 files allowed", "error");
        return;
      }
      handleFileUpload(file, setTicketAttachments, setIsUploadingTicketFile);
    }
    e.target.value = "";
  };

  const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (replyAttachments.length >= 3) {
        showNotification("Maximum 3 files allowed per reply", "error");
        return;
      }
      handleFileUpload(file, setReplyAttachments, setIsUploadingReplyFile);
    }
    e.target.value = "";
  };

  const removeTicketAttachment = (id: string) => {
    setTicketAttachments((prev) => prev.filter((f) => f.id !== id));
  };

  const removeReplyAttachment = (id: string) => {
    setReplyAttachments((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (type === "application/pdf") {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newTicket.subject.trim()) {
      errors.subject = "Subject is required";
    }
    if (!newTicket.category) {
      errors.category = "Please select a category";
    }
    if (!newTicket.message.trim()) {
      errors.message = "Message is required";
    } else if (newTicket.message.trim().length < 20) {
      errors.message = "Please provide more details (at least 20 characters)";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const result = await api.createSupportTicket({
        ...newTicket,
        attachmentIds: ticketAttachments.map((a) => a.id),
      });

      if (result.success && result.data) {
        setTickets([result.data, ...tickets]);
        setNewTicket({ subject: "", category: "", priority: "medium", message: "" });
        setTicketAttachments([]);
        handleTabChange("tickets");
        showNotification("Support ticket created successfully!", "success");
      } else {
        showNotification(result.message || "Failed to create ticket", "error");
      }
    } catch (err: any) {
      showNotification(err?.response?.data?.message || "An error occurred. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    setIsSendingReply(true);

    try {
      const result = await api.replySupportTicket(selectedTicket.id, {
        message: replyMessage,
        attachmentIds: replyAttachments.map((a) => a.id),
      });

      if (result.success && result.data) {
        const updatedTicket = {
          ...selectedTicket,
          replies: [...selectedTicket.replies, result.data],
        };
        setSelectedTicket(updatedTicket);
        setTickets(tickets.map((t) => (t.id === selectedTicket.id ? { ...t, replyCount: (t.replyCount || 0) + 1 } : t)));
        setReplyMessage("");
        setReplyAttachments([]);
      } else {
        showNotification("Failed to send reply", "error");
      }
    } catch (err: any) {
      showNotification(err?.response?.data?.message || "An error occurred. Please try again.", "error");
    } finally {
      setIsSendingReply(false);
    }
  };

  const getStatusColor = (status: SupportTicket["status"]) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "resolved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "closed":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      case "medium":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "high":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
      case "urgent":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const categories = [
    { value: "account", label: "Account Issues" },
    { value: "billing", label: "Billing & Payments" },
    { value: "technical", label: "Technical Support" },
    { value: "investment", label: "Investment Questions" },
    { value: "kyc", label: "KYC Verification" },
    { value: "other", label: "Other" },
  ];

  const AttachmentList = ({
    attachments,
    canRemove = false,
    onRemove,
  }: {
    attachments?: FileAttachment[];
    canRemove?: boolean;
    onRemove?: (id: string) => void;
  }) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-medium text-body-color dark:text-body-color-dark">Attachments:</p>
        <div className="flex flex-wrap gap-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800"
            >
              <span className="text-primary">{getFileIcon(file.type)}</span>
              <div className="min-w-0 flex-1">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block max-w-[150px] truncate text-xs font-medium text-black hover:text-primary dark:text-white sm:max-w-[200px]"
                >
                  {file.name}
                </a>
                <p className="text-xs text-body-color dark:text-body-color-dark">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {canRemove && onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(file.id)}
                  className="rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Check ticket detail loading first to show correct skeleton
  if (isLoadingTicket) {
    return <TicketDetailSkeleton />;
  }

  // Check main loading
  if (isLoading) {
    return <SupportSkeleton tab={activeTab} count={cachedTicketCount} />;
  }

  // Ticket Detail View
  if (selectedTicket) {
    return (
      <div className="mx-auto max-w-4xl">
        {/* Notifications */}
        {errorMessage && (
          <div className="fixed left-4 right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white shadow-lg sm:left-auto sm:right-4 sm:w-auto">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="flex-1 text-sm font-medium">{errorMessage}</p>
            <button onClick={() => setErrorMessage("")} className="rounded-full p-1 hover:bg-white/20">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => {
            handleTabChange("tickets");
            setReplyAttachments([]);
          }}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-body-color hover:text-primary dark:text-body-color-dark"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tickets
        </button>

        {/* Ticket Header */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-lg dark:bg-gray-dark sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="mb-2 text-lg font-bold text-black dark:text-white sm:text-xl">
                {selectedTicket!.subject}
              </h1>
              <p className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">
                Ticket #{selectedTicket!.id} • Created {formatDate(selectedTicket!.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(selectedTicket!.status)}`}>
                {selectedTicket!.status.replace("_", " ")}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(selectedTicket!.priority)}`}>
                {selectedTicket!.priority}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-body-color dark:text-body-color-dark sm:text-sm">
            <span>
              Category:{" "}
              <strong className="text-black dark:text-white">
                {categories.find((c) => c.value === selectedTicket!.category)?.label || selectedTicket!.category}
              </strong>
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="mb-4 rounded-xl bg-white shadow-lg dark:bg-gray-dark">
          <div className="max-h-[400px] overflow-y-auto p-4 sm:p-6">
            {/* Original Message */}
            <div className="mb-4 overflow-hidden rounded-lg bg-gray-50 p-4 dark:bg-black/20">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  U
                </div>
                <div>
                  <p className="text-sm font-medium text-black dark:text-white">You</p>
                  <p className="text-xs text-body-color dark:text-body-color-dark">
                    {formatDate(selectedTicket!.createdAt)}
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-black dark:text-white">
                {selectedTicket!.message}
              </p>
              <AttachmentList attachments={selectedTicket!.attachments} />
            </div>

            {/* Replies */}
            {selectedTicket!.replies.map((reply) => (
              <div
                key={reply.id}
                className={`mb-4 overflow-hidden rounded-lg p-4 ${
                  reply.isStaff ? "bg-primary/5 dark:bg-primary/10" : "bg-gray-50 dark:bg-black/20"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white ${
                      reply.isStaff ? "bg-green-500" : "bg-primary"
                    }`}
                  >
                    {reply.isStaff ? "S" : "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {reply.authorName}
                      {reply.isStaff && (
                        <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Staff
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-body-color dark:text-body-color-dark">
                      {formatDate(reply.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-black dark:text-white">{reply.message}</p>
                <AttachmentList attachments={reply.attachments} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Input */}
          {selectedTicket!.status !== "closed" && (
            <div className="border-t border-gray-200 p-4 dark:border-gray-800 sm:p-6">
              {replyAttachments.length > 0 && (
                <div className="mb-3">
                  <AttachmentList attachments={replyAttachments} canRemove onRemove={removeReplyAttachment} />
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex-1">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={2}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      ref={replyFileInputRef}
                      type="file"
                      onChange={handleReplyFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    />
                    <button
                      type="button"
                      onClick={() => replyFileInputRef.current?.click()}
                      disabled={isUploadingReplyFile || replyAttachments.length >= 3}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    >
                      {isUploadingReplyFile ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Attach
                        </>
                      )}
                    </button>
                    <span className="text-xs text-body-color dark:text-body-color-dark">
                      {replyAttachments.length}/3 files
                    </span>
                  </div>

                  <button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || isSendingReply}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2 font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSendingReply ? (
                      "Sending..."
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedTicket!.status === "closed" && (
            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
              <p className="text-center text-sm text-body-color dark:text-body-color-dark">
                This ticket is closed. Create a new ticket if you need further assistance.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Tab synchronization with URL */}
      <Suspense fallback={null}>
        <TabWrapper onTabChange={handleTabChange} />
      </Suspense>

      {/* Notifications */}
      {successMessage && (
        <div className="fixed left-4 right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg sm:left-auto sm:right-4 sm:w-auto sm:gap-3 sm:px-6 sm:py-4">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="flex-1 text-sm font-medium">{successMessage}</p>
          <button onClick={() => setSuccessMessage("")} className="rounded-full p-1 hover:bg-white/20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="fixed left-4 right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white shadow-lg sm:left-auto sm:right-4 sm:w-auto">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="flex-1 text-sm font-medium">{errorMessage}</p>
          <button onClick={() => setErrorMessage("")} className="rounded-full p-1 hover:bg-white/20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white sm:text-3xl">Support Center</h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark sm:text-base">
          Get help from our support team
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => handleTabChange("tickets")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "tickets"
              ? "bg-primary text-white"
              : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          My Tickets
        </button>
        <button
          onClick={() => handleTabChange("new")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "new"
              ? "bg-primary text-white"
              : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Ticket
        </button>
      </div>

      {/* My Tickets Tab */}
      {activeTab === "tickets" && (
        <div className="rounded-xl bg-white shadow-lg dark:bg-gray-dark">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">No tickets yet</h3>
              <p className="mb-4 text-sm text-body-color dark:text-body-color-dark">
                Create a new ticket to get help from our support team
              </p>
              <button
                onClick={() => handleTabChange("new")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Create Ticket
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-black/20 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-black dark:text-white sm:text-base">
                        {ticket.subject}
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mb-2 line-clamp-1 break-all text-xs text-body-color dark:text-body-color-dark sm:text-sm">
                      {ticket.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-body-color dark:text-body-color-dark">
                      <span>#{ticket.id.slice(-8)}</span>
                      <span>•</span>
                      <span>{categories.find((c) => c.value === ticket.category)?.label}</span>
                      <span>•</span>
                      <span>{formatDate(ticket.createdAt)}</span>
                      {ticket.attachments && ticket.attachments.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {ticket.attachments.length}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    {(ticket.replyCount ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs text-body-color dark:text-body-color-dark">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {ticket.replyCount}
                      </span>
                    )}
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Ticket Tab */}
      {activeTab === "new" && (
        <div className="rounded-xl bg-white p-4 shadow-lg dark:bg-gray-dark sm:p-6">
          <h2 className="mb-2 text-lg font-bold text-black dark:text-white sm:text-xl">Create New Ticket</h2>
          <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
            Fill out the form below and our team will get back to you as soon as possible
          </p>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Subject *</label>
              <input
                type="text"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-black outline-none transition-colors focus:border-primary dark:bg-gray-800 dark:text-white ${
                  formErrors.subject ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                }`}
                placeholder="Brief description of your issue"
              />
              {formErrors.subject && <p className="mt-1 text-xs text-red-500">{formErrors.subject}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Category *</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className={`w-full appearance-none rounded-lg border bg-white px-4 py-3 text-sm text-black outline-none transition-colors focus:border-primary dark:bg-gray-800 dark:text-white ${
                    formErrors.category ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    backgroundSize: "20px",
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {formErrors.category && <p className="mt-1 text-xs text-red-500">{formErrors.category}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, priority: e.target.value as CreateTicketForm["priority"] })
                  }
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    backgroundSize: "20px",
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Message *</label>
              <textarea
                value={newTicket.message}
                onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                rows={5}
                className={`w-full resize-none rounded-lg border bg-white px-4 py-3 text-sm text-black outline-none transition-colors focus:border-primary dark:bg-gray-800 dark:text-white ${
                  formErrors.message ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                }`}
                placeholder="Please describe your issue in detail..."
              />
              {formErrors.message && <p className="mt-1 text-xs text-red-500">{formErrors.message}</p>}
            </div>

            {/* File Upload Section */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Attachments (Optional)
              </label>
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 dark:border-gray-700">
                <input
                  ref={ticketFileInputRef}
                  type="file"
                  onChange={handleTicketFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                />

                {ticketAttachments.length > 0 && (
                  <div className="mb-4">
                    <AttachmentList attachments={ticketAttachments} canRemove onRemove={removeTicketAttachment} />
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => ticketFileInputRef.current?.click()}
                    disabled={isUploadingTicketFile || ticketAttachments.length >= 5}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    {isUploadingTicketFile ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Choose file
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-xs text-body-color dark:text-body-color-dark">
                    Images, PDF, Word, Excel, or text files. Max 10MB each. ({ticketAttachments.length}/5 files)
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-semibold text-blue-800 dark:text-blue-300">Response Time</p>
                  <p className="text-blue-700 dark:text-blue-400">
                    Our team typically responds within 24 hours. Urgent issues are prioritized.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<SupportSkeleton />}>
      <SupportContent />
    </Suspense>
  );
}
