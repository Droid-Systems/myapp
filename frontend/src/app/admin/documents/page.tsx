"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

const PdfViewerModal = dynamic(
  () => import("@/app/dashboard/documents/PdfViewerModal"),
  { ssr: false },
);

interface DocUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Document {
  id: string;
  title: string;
  description: string;
  userMessage: string;
  documentUrl: string;
  signedDocumentUrl: string | null;
  status: string;
  signedAt: string | null;
  createdAt: string;
  user: DocUser;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    signed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
}

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Document | null>(null);
  const [signingTarget, setSigningTarget] = useState<Document | null>(null);
  const [viewer, setViewer] = useState<{ url: string; title: string } | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null); // doc id being loaded
  const limit = 20;

  const openPdf = useCallback(async (doc: Document, signed: boolean) => {
    const key = `${doc.id}-${signed}`;
    setLoadingPdf(key);
    try {
      const blob = await api.adminDownloadDocument(doc.id, signed);
      const url = URL.createObjectURL(blob);
      setViewer({ url, title: signed ? `${doc.title} (Signed)` : doc.title });
    } catch {
      alert("Failed to load PDF. Please try again.");
    } finally {
      setLoadingPdf(null);
    }
  }, []);

  const closeViewer = useCallback(() => {
    if (viewer) URL.revokeObjectURL(viewer.url);
    setViewer(null);
  }, [viewer]);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminGetDocuments({
        status: statusFilter || undefined,
        page,
        limit,
      });
      const data = res.data ?? res;
      setDocs(data.docs ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.adminDeleteDocument(deleteTarget.id);
      setDeleteTarget(null);
      fetchDocs();
    } catch {
      alert("Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-black dark:text-white sm:text-3xl">Documents</h1>
        <button
          onClick={() => setSendOpen(true)}
          className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 sm:px-5 sm:py-2.5 sm:text-sm"
        >
          + Send Document
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {["", "pending", "signed", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading / empty */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl bg-white py-20 shadow dark:bg-gray-dark">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl bg-white py-20 shadow dark:bg-gray-dark">
          <p className="text-body-color">No documents found.</p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-3 sm:hidden">
            {docs.map((doc) => (
              <div key={doc.id} className="rounded-2xl bg-white p-4 shadow dark:bg-gray-dark">
                {/* User + status row */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-black dark:text-white">
                      {doc.user.firstName} {doc.user.lastName}
                    </p>
                    <p className="truncate text-xs text-body-color">{doc.user.email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
                {/* Document title + description */}
                <p className="mb-1 text-sm font-medium text-black dark:text-white">{doc.title}</p>
                {doc.description && (
                  <p className="mb-2 truncate text-xs text-body-color">{doc.description}</p>
                )}
                {/* Dates */}
                <div className="mb-3 flex gap-4 text-xs text-body-color">
                  <span>Sent: {fmt(doc.createdAt)}</span>
                  {doc.signedAt && <span>Signed: {fmt(doc.signedAt)}</span>}
                </div>
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openPdf(doc, false)}
                    disabled={loadingPdf === `${doc.id}-false`}
                    className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {loadingPdf === `${doc.id}-false` ? "Loading…" : "Original"}
                  </button>
                  {doc.signedDocumentUrl && (
                    <button
                      onClick={() => openPdf(doc, true)}
                      disabled={loadingPdf === `${doc.id}-true`}
                      className="rounded-lg bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-300"
                    >
                      {loadingPdf === `${doc.id}-true` ? "Loading…" : "Signed PDF"}
                    </button>
                  )}
                  <button
                    onClick={() => setEditTarget(doc)}
                    className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setSigningTarget(doc)}
                    className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
                  >
                    Sign/Stamp
                  </button>
                  <button
                    onClick={() => setDeleteTarget(doc)}
                    className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl bg-white shadow dark:bg-gray-dark sm:block">
            <table className="w-full text-sm">
              <thead className="border-b border-stroke dark:border-gray-700">
                <tr className="text-left text-xs font-semibold uppercase text-body-color dark:text-gray-400">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Signed</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-stroke last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-black dark:text-white">
                        {doc.user.firstName} {doc.user.lastName}
                      </p>
                      <p className="text-xs text-body-color">{doc.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-black dark:text-white">{doc.title}</p>
                      {doc.description && (
                        <p className="max-w-[200px] truncate text-xs text-body-color">
                          {doc.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-body-color">{fmt(doc.createdAt)}</td>
                    <td className="px-4 py-3 text-body-color">{fmt(doc.signedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openPdf(doc, false)}
                          disabled={loadingPdf === `${doc.id}-false`}
                          className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {loadingPdf === `${doc.id}-false` ? "Loading…" : "Original"}
                        </button>
                        {doc.signedDocumentUrl && (
                          <button
                            onClick={() => openPdf(doc, true)}
                            disabled={loadingPdf === `${doc.id}-true`}
                            className="rounded-lg bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-300"
                          >
                            {loadingPdf === `${doc.id}-true` ? "Loading…" : "Signed PDF"}
                          </button>
                        )}
                        <button
                          onClick={() => setEditTarget(doc)}
                          className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setSigningTarget(doc)}
                          className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
                        >
                          Sign/Stamp
                        </button>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-body-color">
          <span>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-stroke px-3 py-1 disabled:opacity-40 dark:border-gray-700"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-stroke px-3 py-1 disabled:opacity-40 dark:border-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewer && <PdfViewerModal url={viewer.url} title={viewer.title} onClose={closeViewer} />}

      {/* Edit Document Modal */}
      {editTarget && (
        <EditDocumentModal
          doc={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); fetchDocs(); }}
        />
      )}

      {/* Admin Sign/Stamp Modal */}
      {signingTarget && (
        <AdminSigningModal
          doc={signingTarget}
          onClose={() => setSigningTarget(null)}
          onSigned={() => { setSigningTarget(null); fetchDocs(); }}
        />
      )}

      {/* Send Document Modal */}
      {sendOpen && (
        <SendDocumentModal
          onClose={() => setSendOpen(false)}
          onSent={() => { setSendOpen(false); fetchDocs(); }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h3 className="mb-2 text-lg font-bold text-black dark:text-white">Delete Document</h3>
            <p className="mb-6 text-sm text-body-color">
              Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-stroke px-4 py-2 text-sm dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Edit Document Modal ──────────────────────────────────────────────────────

function EditDocumentModal({
  doc,
  onClose,
  onSaved,
}: {
  doc: Document;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle]           = useState(doc.title);
  const [description, setDescription] = useState(doc.description ?? "");
  const [userMessage, setUserMessage] = useState(doc.userMessage ?? "");
  const [status, setStatus]         = useState(doc.status);
  const [file, setFile]             = useState<File | null>(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setError("");
    if (!title.trim()) return setError("Title is required");
    setSaving(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("title", title.trim());
        fd.append("description", description.trim());
        fd.append("userMessage", userMessage.trim());
        // status is forced to "pending" by backend when file provided
        await api.adminUpdateDocumentWithFile(doc.id, fd);
      } else {
        await api.adminUpdateDocument(doc.id, {
          title: title.trim(),
          description: description.trim(),
          userMessage: userMessage.trim(),
          status,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to update document");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-black dark:text-white">Edit Document</h3>
          <button onClick={onClose} className="text-body-color hover:text-black dark:hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Message to user */}
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Message to user</label>
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              rows={2}
              placeholder="Instructions or note…"
              className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
            >
              <option value="pending">Pending</option>
              <option value="signed">Signed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Replace PDF — only for pending documents */}
          {doc.status === "pending" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                Replace PDF{" "}
                <span className="font-normal text-body-color">(optional — clears any existing signature)</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-stroke px-4 py-3 hover:border-primary dark:border-gray-600"
              >
                <svg className="h-5 w-5 text-body-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-body-color">
                  {file ? file.name : "Click to upload new PDF (max 50 MB)"}
                </span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-stroke px-5 py-2 text-sm dark:border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared types + constants ─────────────────────────────────────────────────

interface DocField {
  id: string;
  type: "signature" | "name" | "date" | "text" | "stamp";
  assignedTo: "user" | "admin" | "witness";
  required: boolean;
  xPct: number; yPct: number;
  wPct: number; hPct: number;
  pageNum: number; // 1-based page index
}

const FIELD_COLORS: Record<DocField["assignedTo"], { border: string; bg: string; label: string }> = {
  user:    { border: "#3b82f6", bg: "rgba(59,130,246,0.12)",  label: "User" },
  admin:   { border: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  label: "Admin" },
  witness: { border: "#f97316", bg: "rgba(249,115,22,0.12)",  label: "Witness" },
};

const FIELD_ICONS: Record<DocField["type"], string> = {
  signature: "✍", name: "A", date: "📅", text: "T", stamp: "🔏",
};

const FIELD_TYPE_LABELS: Record<DocField["type"], string> = {
  signature: "✍ Sig", name: "A  Name", date: "📅 Date", text: "T  Text", stamp: "🔏 Stamp",
};

const RH = [
  { id: "nw", cursor: "nw-resize", style: { top: -4, left: -4 } },
  { id: "n",  cursor: "n-resize",  style: { top: -4, left: "50%", marginLeft: -4 } },
  { id: "ne", cursor: "ne-resize", style: { top: -4, right: -4 } },
  { id: "e",  cursor: "e-resize",  style: { top: "50%", marginTop: -4, right: -4 } },
  { id: "se", cursor: "se-resize", style: { bottom: -4, right: -4 } },
  { id: "s",  cursor: "s-resize",  style: { bottom: -4, left: "50%", marginLeft: -4 } },
  { id: "sw", cursor: "sw-resize", style: { bottom: -4, left: -4 } },
  { id: "w",  cursor: "w-resize",  style: { top: "50%", marginTop: -4, left: -4 } },
] as const;

// ─── Send Document Modal ──────────────────────────────────────────────────────

function SendDocumentModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  // Step 1 state
  const [users, setUsers]               = useState<UserOption[]>([]);
  const [userSearch, setUserSearch]     = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [userMessage, setUserMessage]   = useState("");
  const [file, setFile]                 = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [modalStep, setModalStep]         = useState<"form" | "fields">("form");
  const [fields, setFields]               = useState<DocField[]>([]);
  const [pdfObjectUrl, setPdfObjectUrl]   = useState<string | null>(null);
  const [pageDims, setPageDims]           = useState<{ w: number; h: number } | null>(null);
  const [pageRenderError, setPageRenderError] = useState(false);
  const [activeType, setActiveType]       = useState<DocField["type"] | null>(null);
  const [activeAssignee, setActiveAssignee] = useState<DocField["assignedTo"]>("user");
  const [isRequired, setIsRequired]       = useState(true);
  const [currentPage, setCurrentPage]     = useState(1);
  const [totalPageCount, setTotalPageCount] = useState(1);
  const [pdfLoaded, setPdfLoaded]         = useState(false);

  const posContainerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef   = useRef<HTMLCanvasElement>(null);
  const pdfDocRef       = useRef<any>(null);

  // Drag / resize refs
  const isDragging       = useRef(false);
  const dragFieldId      = useRef<string | null>(null);
  const dragOffset       = useRef({ x: 0, y: 0 });
  const didDrag          = useRef(false);
  const isResizing       = useRef(false);
  const resizeHandleRef  = useRef<string | null>(null);
  const resizingFieldId  = useRef<string | null>(null);
  const resizeStartBox   = useRef({ left: 0, top: 0, w: 0, h: 0 });
  const resizeStartMouse = useRef({ x: 0, y: 0 });

  // Shared
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState("");

  // Load users
  useEffect(() => {
    api.adminGetUsers({ limit: 100 }).then((res: any) => {
      const d = res.data ?? res;
      setUsers(d.users ?? d ?? []);
    }).catch(() => {});
  }, []);

  // Cleanup object URL on unmount
  useEffect(() => () => { if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl); }, [pdfObjectUrl]);

  // Load PDF document once when step 2 opens (or when file changes)
  useEffect(() => {
    if (modalStep !== "fields" || !pdfObjectUrl) return;
    pdfDocRef.current = null;
    setPdfLoaded(false);
    setPageRenderError(false);
    setPageDims(null);
    setCurrentPage(1);
    setTotalPageCount(1);
    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        const pdf = await (pdfjsLib as any).getDocument(pdfObjectUrl).promise;
        pdfDocRef.current = pdf;
        setTotalPageCount(pdf.numPages);
        setPdfLoaded(true); // triggers the render effect below
      } catch {
        setPageRenderError(true);
      }
    })();
  }, [modalStep, pdfObjectUrl]);

  // Re-render whenever the current page changes (or when PDF first loads)
  useEffect(() => {
    if (!pdfLoaded || !pdfDocRef.current || modalStep !== "fields") return;
    setPageRenderError(false);
    setPageDims(null);
    (async () => {
      try {
        const page      = await pdfDocRef.current.getPage(currentPage);
        const container = posContainerRef.current;
        const canvas    = pageCanvasRef.current;
        if (!container || !canvas) return;
        const cw       = container.clientWidth;
        const baseVp   = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: cw / baseVp.width });
        canvas.width   = Math.round(viewport.width);
        canvas.height  = Math.round(viewport.height);
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
        setPageDims({ w: canvas.width, h: canvas.height });
      } catch {
        setPageRenderError(true);
      }
    })();
  }, [pdfLoaded, currentPage, modalStep]);

  const filteredUsers = users.filter(
    (u) => !userSearch || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase()),
  );

  // Step 1 → Step 2
  const goToFields = () => {
    setError("");
    if (!selectedUser) return setError("Please select a user");
    if (!title.trim())  return setError("Title is required");
    if (!file)          return setError("Please attach a PDF file");
    setPdfObjectUrl(URL.createObjectURL(file));
    setModalStep("fields");
  };

  // Final submit
  const handleSend = async () => {
    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file!);
      fd.append("userId", selectedUser!.id);
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("userMessage", userMessage.trim());
      fd.append("fields", JSON.stringify(fields));
      await api.adminSendDocument(fd);
      onSent();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to send document");
      setSending(false);
    }
  };

  // Canvas helpers
  const getRect = () => pageCanvasRef.current!.getBoundingClientRect();
  const getXY   = (e: React.MouseEvent | React.TouchEvent) =>
    "touches" in e
      ? { cx: e.touches[0].clientX, cy: e.touches[0].clientY }
      : { cx: (e as React.MouseEvent).clientX, cy: (e as React.MouseEvent).clientY };

  // Click to place
  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (didDrag.current) { didDrag.current = false; return; }
    if (!activeType || !pageDims || !pageCanvasRef.current) return;
    const rect = getRect();
    const xPct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width,  0.80));
    const yPct = Math.max(0, Math.min((e.clientY - rect.top)  / rect.height, 0.94));
    const isBig   = activeType === "signature" || activeType === "stamp";
    const assignTo: DocField["assignedTo"] = activeType === "stamp" ? "admin" : activeAssignee;
    setFields(prev => [...prev, {
      id: crypto.randomUUID(),
      type: activeType, assignedTo: assignTo, required: isRequired,
      xPct, yPct, wPct: isBig ? 0.28 : 0.20, hPct: isBig ? 0.08 : 0.05,
      pageNum: currentPage,
    }]);
  };

  // Field drag start
  const onFieldMouseDown = (fieldId: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!pageDims || !pageCanvasRef.current) return;
    e.stopPropagation();
    isDragging.current  = true;
    dragFieldId.current = fieldId;
    didDrag.current     = false;
    const rect = getRect();
    const { cx, cy } = getXY(e);
    const f = fields.find(f => f.id === fieldId)!;
    dragOffset.current = { x: cx - rect.left - f.xPct * rect.width, y: cy - rect.top - f.yPct * rect.height };
  };

  // Resize start
  const onResizeStart = (fieldId: string, handle: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!pageDims || !pageCanvasRef.current) return;
    e.stopPropagation();
    didDrag.current       = true;
    isResizing.current    = true;
    resizingFieldId.current = fieldId;
    resizeHandleRef.current = handle;
    const rect = getRect();
    const { cx, cy } = getXY(e);
    resizeStartMouse.current = { x: cx, y: cy };
    const f = fields.find(f => f.id === fieldId)!;
    resizeStartBox.current = { left: f.xPct * rect.width, top: f.yPct * rect.height, w: f.wPct * rect.width, h: f.hPct * rect.height };
  };

  // Mouse/touch move
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!pageDims || !pageCanvasRef.current) return;
    const rect = getRect();
    const { cx, cy } = getXY(e);

    if (isResizing.current && resizingFieldId.current && resizeHandleRef.current) {
      didDrag.current = true;
      const dx = cx - resizeStartMouse.current.x, dy = cy - resizeStartMouse.current.y;
      const { left: iL, top: iT, w: iW, h: iH } = resizeStartBox.current;
      const hk = resizeHandleRef.current;
      const MIN_W = 40, MIN_H = 14;
      let nL = iL, nT = iT, nW = iW, nH = iH;
      if (hk.includes("e")) nW = Math.max(MIN_W, iW + dx);
      if (hk.includes("w")) { nW = Math.max(MIN_W, iW - dx); nL = iL + iW - nW; }
      if (hk.includes("s")) nH = Math.max(MIN_H, iH + dy);
      if (hk.includes("n")) { nH = Math.max(MIN_H, iH - dy); nT = iT + iH - nH; }
      nL = Math.max(0, Math.min(nL, rect.width - nW));
      nT = Math.max(0, Math.min(nT, rect.height - nH));
      setFields(prev => prev.map(f =>
        f.id === resizingFieldId.current
          ? { ...f, xPct: nL / rect.width, yPct: nT / rect.height, wPct: nW / rect.width, hPct: nH / rect.height }
          : f
      ));
      return;
    }

    if (isDragging.current && dragFieldId.current) {
      didDrag.current = true;
      const f = fields.find(f => f.id === dragFieldId.current)!;
      const fw = f.wPct * rect.width, fh = f.hPct * rect.height;
      const newL = cx - rect.left - dragOffset.current.x;
      const newT = cy - rect.top  - dragOffset.current.y;
      setFields(prev => prev.map(fi =>
        fi.id === dragFieldId.current
          ? { ...fi, xPct: Math.max(0, Math.min(newL, rect.width - fw)) / rect.width, yPct: Math.max(0, Math.min(newT, rect.height - fh)) / rect.height }
          : fi
      ));
    }
  };

  const onEnd = () => {
    isDragging.current      = false;
    dragFieldId.current     = null;
    isResizing.current      = false;
    resizingFieldId.current = null;
    resizeHandleRef.current = null;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark ${modalStep === "fields" ? "max-w-5xl" : "max-w-lg"}`}>
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-body-color">
              {modalStep === "form" ? "Step 1 of 2" : "Step 2 of 2"}
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-black dark:text-white">
              {modalStep === "form" ? "Document Details" : "Place Field Zones"}
            </h3>
          </div>
          <button onClick={onClose} className="text-body-color hover:text-black dark:hover:text-white">✕</button>
        </div>

        {/* ── Step 1: Form ─────────────────────────────────────────────────── */}
        {modalStep === "form" && (
          <>
            <div className="space-y-4">
              {/* User */}
              <div className="relative">
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Select User *</label>
                <input type="text" placeholder="Search by name or email…"
                  value={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})` : userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setSelectedUser(null); setShowUserList(true); }}
                  onFocus={() => setShowUserList(true)}
                  className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
                />
                {showUserList && !selectedUser && filteredUsers.length > 0 && (
                  <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-stroke bg-white shadow-lg dark:border-gray-700 dark:bg-gray-dark">
                    {filteredUsers.slice(0, 20).map((u) => (
                      <li key={u.id} onClick={() => { setSelectedUser(u); setUserSearch(""); setShowUserList(false); }}
                        className="cursor-pointer px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                        <span className="font-medium text-black dark:text-white">{u.firstName} {u.lastName}</span>{" "}
                        <span className="text-body-color">{u.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Document Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Investment Agreement"
                  className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white" />
              </div>
              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Description (optional)</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description"
                  className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white" />
              </div>
              {/* Message */}
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Message to user (optional)</label>
                <textarea value={userMessage} onChange={(e) => setUserMessage(e.target.value)} rows={2} placeholder="Instructions or note…"
                  className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white" />
              </div>
              {/* File */}
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">PDF File *</label>
                <div onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-stroke px-4 py-3 hover:border-primary dark:border-gray-600">
                  <svg className="h-5 w-5 text-body-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-body-color">{file ? file.name : "Click to upload PDF (max 50MB)"}</span>
                </div>
                <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="rounded-xl border border-stroke px-5 py-2 text-sm dark:border-gray-700">Cancel</button>
              <button onClick={goToFields} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                Next: Place Fields
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Field placement ───────────────────────────────────────── */}
        {modalStep === "fields" && (
          <>
            {/* Toolbar */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {(Object.keys(FIELD_TYPE_LABELS) as DocField["type"][]).map((t) => (
                <button key={t}
                  onClick={() => setActiveType(activeType === t ? null : t)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition ${
                    activeType === t ? "border-primary bg-primary text-white" : "border-stroke text-body-color hover:border-primary hover:text-primary dark:border-gray-600"
                  }`}>
                  {FIELD_TYPE_LABELS[t]}
                </button>
              ))}
              <div className="h-5 w-px bg-stroke dark:bg-gray-700" />
              <select value={activeAssignee} onChange={(e) => setActiveAssignee(e.target.value as DocField["assignedTo"])}
                className="rounded-lg border border-stroke bg-transparent px-2 py-1.5 text-xs text-black dark:border-gray-600 dark:text-white">
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="witness">Witness</option>
              </select>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-body-color">
                <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="accent-primary" />
                Required
              </label>
              <span className="ml-auto text-xs text-body-color">
                {totalPageCount > 1
                  ? `${fields.filter(f => f.pageNum === currentPage).length}/${fields.length} field${fields.length !== 1 ? "s" : ""}`
                  : `${fields.length} field${fields.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {activeType && (
              <p className="mb-2 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                Click on the document to place a <strong>{activeType}</strong> field assigned to <strong>{activeType === "stamp" ? "admin" : activeAssignee}</strong>
              </p>
            )}

            {/* Page navigation */}
            {totalPageCount > 1 && (
              <div className="mb-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-stroke px-3 py-1 text-xs font-medium text-black hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                >
                  ← Prev
                </button>
                <span className="text-sm font-semibold text-black dark:text-white">
                  Page {currentPage} of {totalPageCount}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPageCount, p + 1))}
                  disabled={currentPage === totalPageCount}
                  className="rounded-lg border border-stroke px-3 py-1 text-xs font-medium text-black hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                >
                  Next →
                </button>
              </div>
            )}

            {/* PDF canvas */}
            <div ref={posContainerRef}
              className="relative overflow-hidden rounded-xl border border-stroke bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              style={{ userSelect: "none", touchAction: "none", cursor: activeType ? "crosshair" : "default", maxHeight: "55vh", overflowY: "auto" }}
              onClick={onCanvasClick}
              onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
              onTouchMove={onMove} onTouchEnd={onEnd}
            >
              <canvas ref={pageCanvasRef} style={{ display: pageDims ? "block" : "none" }} />
              {!pageDims && !pageRenderError && (
                <div className="flex h-64 items-center justify-center gap-3 text-body-color">
                  <svg className="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-sm">Loading PDF…</span>
                </div>
              )}
              {pageRenderError && (
                <div className="flex h-64 items-center justify-center text-sm text-body-color">Could not render PDF preview.</div>
              )}

              {/* Field overlays — only show fields belonging to the current page */}
              {pageDims && fields.filter(f => f.pageNum === currentPage).map((field) => {
                const clr = FIELD_COLORS[field.assignedTo];
                const fw  = field.wPct * pageDims.w;
                const fh  = field.hPct * pageDims.h;
                return (
                  <div key={field.id}
                    style={{ position: "absolute", left: field.xPct * pageDims.w, top: field.yPct * pageDims.h, width: fw, height: fh,
                      border: `2px dashed ${clr.border}`, background: clr.bg, borderRadius: 4, cursor: "grab", touchAction: "none" }}
                    onMouseDown={(e) => onFieldMouseDown(field.id, e)}
                    onTouchStart={(e) => onFieldMouseDown(field.id, e)}
                  >
                    <div className="flex h-full items-center justify-center overflow-hidden px-1">
                      <span style={{ fontSize: Math.max(8, fh * 0.35), color: clr.border, fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap" }}>
                        {FIELD_ICONS[field.type]} {field.type}{field.required ? " *" : ""}
                      </span>
                    </div>
                    {/* Delete — kept inside the zone so overflow-hidden on the container doesn't clip it */}
                    <button
                      style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%",
                        background: "#ef4444", color: "white", fontSize: 9, display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer", zIndex: 10 }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setFields(p => p.filter(f => f.id !== field.id)); }}
                    >✕</button>
                    {/* Resize handles */}
                    {RH.map((h) => (
                      <div key={h.id}
                        style={{ position: "absolute", width: 8, height: 8, background: "white", border: `1.5px solid ${clr.border}`, borderRadius: 2, cursor: h.cursor, ...h.style }}
                        onMouseDown={(e) => onResizeStart(field.id, h.id, e)}
                        onTouchStart={(e) => onResizeStart(field.id, h.id, e)}
                        onClick={(e) => e.stopPropagation()} />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-body-color">
              {(Object.entries(FIELD_COLORS) as [DocField["assignedTo"], typeof FIELD_COLORS[keyof typeof FIELD_COLORS]][]).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ border: `1.5px solid ${v.border}`, background: v.bg }} />
                  {v.label}
                </span>
              ))}
              <span className="ml-auto">Click to place · drag to move · drag edges to resize · ✕ to remove</span>
            </div>

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setModalStep("form")} className="rounded-xl border border-stroke px-5 py-2 text-sm dark:border-gray-700">
                ← Back
              </button>
              <button onClick={handleSend} disabled={sending}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                {sending ? "Sending…" : "Send Document"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Admin Signing Modal ──────────────────────────────────────────────────────

interface FreePlacement {
  id: string;
  type: "signature" | "stamp" | "name" | "date";
  value: string; // PNG data URL for sig/stamp; text string for name/date
  xPct: number; yPct: number;
  wPct: number; hPct: number;
  pageNum: number;
  rotation: number; // degrees clockwise (sig/stamp only)
}

interface AdminFieldValue {
  fieldId: string;
  value: string;
  sigW?: number;
  sigH?: number;
}

function AdminSigningModal({
  doc,
  onClose,
  onSigned,
}: {
  doc: Document;
  onClose: () => void;
  onSigned: () => void;
}) {
  const [step, setStep] = useState<"fill" | "preview" | "done">("fill");

  // PDF blob
  const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
  const [docBlobFetching, setDocBlobFetching] = useState(true);
  const [blobError, setBlobError] = useState(false);
  const docBlobUrlRef = useRef<string | null>(null);

  // Multi-page
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageDims, setPageDims] = useState<{ w: number; h: number } | null>(null);
  const [pageRenderError, setPageRenderError] = useState(false);
  const pdfDocRef = useRef<any>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfRenderCount, setPdfRenderCount] = useState(0);

  // Canvas refs
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigCanvasRef  = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const padRef        = useRef<any>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Admin guided fields
  const adminFields = (doc as any).fields
    ? ((doc as any).fields as DocField[]).filter((f) => f.assignedTo === "admin")
    : [];
  const [adminFieldValues, setAdminFieldValues] = useState<AdminFieldValue[]>([]);
  const [activeAdminFieldId, setActiveAdminFieldId] = useState<string | null>(null);

  // Free placements
  const [freePlacements, setFreePlacements] = useState<FreePlacement[]>([]);
  const [activeFreeType, setActiveFreeType] = useState<"signature" | "stamp" | "name" | "date" | null>(null);

  // Draw/upload/text panel
  const [openPanel, setOpenPanel] = useState<"signature" | "stamp" | "name" | "date" | null>(null);
  const [sigInputMode, setSigInputMode] = useState<"draw" | "upload">("draw");
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [sigW] = useState(200);
  const [sigH] = useState(70);

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Drag/resize/rotate refs for free placements
  const isDragging       = useRef(false);
  const dragFpId         = useRef<string | null>(null);
  const dragOffset       = useRef({ x: 0, y: 0 });
  const didDrag          = useRef(false);
  const isResizing       = useRef(false);
  const resizeFpId       = useRef<string | null>(null);
  const resizeHandle     = useRef<string | null>(null);
  const resizeStartBox   = useRef({ left: 0, top: 0, w: 0, h: 0 });
  const resizeStartMouse = useRef({ x: 0, y: 0 });
  const isRotating       = useRef(false);
  const rotateFpId       = useRef<string | null>(null);

  // ── Fetch PDF blob on mount ────────────────────────────────────────────────

  useEffect(() => {
    setDocBlobFetching(true);
    const signed = !!doc.signedDocumentUrl;
    api.adminDownloadDocument(doc.id, signed)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        docBlobUrlRef.current = url;
        setDocBlobUrl(url);
      })
      .catch(() => setBlobError(true))
      .finally(() => setDocBlobFetching(false));
    return () => {
      if (docBlobUrlRef.current) {
        URL.revokeObjectURL(docBlobUrlRef.current);
        docBlobUrlRef.current = null;
      }
    };
  }, [doc.id, doc.signedDocumentUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load PDF via pdfjs ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!docBlobUrl) return;
    pdfDocRef.current = null;
    setPdfLoaded(false);
    setPageRenderError(false);
    setPageDims(null);
    setCurrentPage(1);
    setTotalPages(1);
    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        const pdf = await (pdfjsLib as any).getDocument(docBlobUrl).promise;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setPdfLoaded(true);
      } catch {
        setPageRenderError(true);
      }
    })();
  }, [docBlobUrl]);

  // ── Re-render page when currentPage changes ────────────────────────────────

  useEffect(() => {
    if (!pdfLoaded || !pdfDocRef.current) return;
    // Do NOT call setPageDims(null) here — hiding the canvas resets the
    // container scroll position, making the user jump to the top of the page.
    // pageDims(null) is set explicitly only on initial load (Load PDF effect)
    // and when going back from preview (← Edit handler).
    setPageRenderError(false);
    (async () => {
      try {
        const page      = await pdfDocRef.current.getPage(currentPage);
        const container = containerRef.current;
        const canvas    = pageCanvasRef.current;
        if (!container || !canvas) return;
        const cw       = container.clientWidth || 800;
        const baseVp   = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: cw / baseVp.width });
        canvas.width   = Math.round(viewport.width);
        canvas.height  = Math.round(viewport.height);
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
        setPageDims({ w: canvas.width, h: canvas.height });
      } catch {
        setPageRenderError(true);
      }
    })();
  }, [pdfLoaded, currentPage, pdfRenderCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Signature pad init ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!openPanel || sigInputMode !== "draw" || !sigCanvasRef.current) return;
    let pad: any;
    import("signature_pad").then((mod) => {
      pad = new mod.default(sigCanvasRef.current!, {
        backgroundColor: "rgba(0,0,0,0)",
        penColor: "rgb(0,0,0)",
        minWidth: 1,
        maxWidth: 3,
      });
      padRef.current = pad;
    });
    return () => { pad?.off(); };
  }, [openPanel, sigInputMode]);

  useEffect(() => {
    if (!openPanel || sigInputMode !== "draw" || !sigCanvasRef.current) return;
    const canvas = sigCanvasRef.current;
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const saved = padRef.current?.toData?.();
      canvas.width  = canvas.offsetWidth  * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);
      padRef.current?.clear();
      if (saved) padRef.current?.fromData(saved);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [openPanel, sigInputMode]);

  // Cleanup preview URL
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // ── Canvas helpers ─────────────────────────────────────────────────────────

  const getRect = () => pageCanvasRef.current!.getBoundingClientRect();
  const getXY   = (e: React.MouseEvent | React.TouchEvent) =>
    "touches" in e
      ? { cx: e.touches[0].clientX, cy: e.touches[0].clientY }
      : { cx: (e as React.MouseEvent).clientX, cy: (e as React.MouseEvent).clientY };

  // ── Canvas click — place free element OR fill guided zone ─────────────────

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (didDrag.current) { didDrag.current = false; return; }
    if (!activeFreeType || !pageDims || !pageCanvasRef.current) return;
    const rect = getRect();
    const xPct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width,  0.80));
    const yPct = Math.max(0, Math.min((e.clientY - rect.top)  / rect.height, 0.94));
    // Arm the panel for this placement
    setOpenPanel(activeFreeType);
    // Pre-fill today's date when placing a date field
    if (activeFreeType === "date") {
      const today = new Date();
      setTextValue(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
    } else {
      setTextValue("");
    }
    const isText = activeFreeType === "name" || activeFreeType === "date";
    const id = crypto.randomUUID();
    setFreePlacements((prev) => [
      ...prev,
      { id, type: activeFreeType, value: "", xPct, yPct, wPct: isText ? 0.30 : 0.25, hPct: isText ? 0.05 : 0.08, pageNum: currentPage, rotation: 0 },
    ]);
    dragFpId.current = id;
    setActiveFreeType(null);
  };

  // ── Guided admin field click ───────────────────────────────────────────────

  const onAdminFieldClick = (f: DocField) => {
    setActiveAdminFieldId(f.id);
    setSigInputMode("draw");
    setUploadedPreview(null);
    setOpenPanel(f.type === "stamp" ? "stamp" : "signature");
  };

  // ── Drag ──────────────────────────────────────────────────────────────────

  const onFpMouseDown = (fpId: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!pageDims || !pageCanvasRef.current) return;
    e.stopPropagation();
    isDragging.current  = true;
    dragFpId.current    = fpId;
    didDrag.current     = false;
    const rect = getRect();
    const { cx, cy } = getXY(e);
    const fp = freePlacements.find((f) => f.id === fpId)!;
    dragOffset.current = { x: cx - rect.left - fp.xPct * rect.width, y: cy - rect.top - fp.yPct * rect.height };
  };

  const onResizeStart = (fpId: string, handle: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!pageDims || !pageCanvasRef.current) return;
    e.stopPropagation();
    didDrag.current     = true;
    isResizing.current  = true;
    resizeFpId.current  = fpId;
    resizeHandle.current = handle;
    const rect = getRect();
    const { cx, cy } = getXY(e);
    resizeStartMouse.current = { x: cx, y: cy };
    const fp = freePlacements.find((f) => f.id === fpId)!;
    resizeStartBox.current = { left: fp.xPct * rect.width, top: fp.yPct * rect.height, w: fp.wPct * rect.width, h: fp.hPct * rect.height };
  };

  const onRotateStart = (fpId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    didDrag.current   = true;
    isRotating.current = true;
    rotateFpId.current = fpId;
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!pageDims || !pageCanvasRef.current) return;
    const rect = getRect();
    const { cx, cy } = getXY(e);

    if (isRotating.current && rotateFpId.current) {
      const fp = freePlacements.find((f) => f.id === rotateFpId.current);
      if (!fp) return;
      // Center of element in screen coordinates
      const elemCx = rect.left + (fp.xPct + fp.wPct / 2) * rect.width;
      const elemCy = rect.top  + (fp.yPct + fp.hPct / 2) * rect.height;
      // Angle from center to mouse — 0° = straight up, CW positive (matches CSS rotate)
      const rotation = Math.atan2(cx - elemCx, elemCy - cy) * 180 / Math.PI;
      setFreePlacements((prev) => prev.map((f) =>
        f.id === rotateFpId.current ? { ...f, rotation } : f
      ));
      return;
    }

    if (isResizing.current && resizeFpId.current && resizeHandle.current) {
      didDrag.current = true;
      const dx = cx - resizeStartMouse.current.x, dy = cy - resizeStartMouse.current.y;
      const { left: iL, top: iT, w: iW, h: iH } = resizeStartBox.current;
      const hk = resizeHandle.current;
      const MIN_W = 40, MIN_H = 14;
      let nL = iL, nT = iT, nW = iW, nH = iH;
      if (hk.includes("e")) nW = Math.max(MIN_W, iW + dx);
      if (hk.includes("w")) { nW = Math.max(MIN_W, iW - dx); nL = iL + iW - nW; }
      if (hk.includes("s")) nH = Math.max(MIN_H, iH + dy);
      if (hk.includes("n")) { nH = Math.max(MIN_H, iH - dy); nT = iT + iH - nH; }
      nL = Math.max(0, Math.min(nL, rect.width - nW));
      nT = Math.max(0, Math.min(nT, rect.height - nH));
      setFreePlacements((prev) => prev.map((fp) =>
        fp.id === resizeFpId.current
          ? { ...fp, xPct: nL / rect.width, yPct: nT / rect.height, wPct: nW / rect.width, hPct: nH / rect.height }
          : fp
      ));
      return;
    }

    if (isDragging.current && dragFpId.current) {
      didDrag.current = true;
      const fp = freePlacements.find((f) => f.id === dragFpId.current);
      if (!fp) return;
      const fw = fp.wPct * rect.width, fh = fp.hPct * rect.height;
      const newL = cx - rect.left - dragOffset.current.x;
      const newT = cy - rect.top  - dragOffset.current.y;
      setFreePlacements((prev) => prev.map((fi) =>
        fi.id === dragFpId.current
          ? { ...fi, xPct: Math.max(0, Math.min(newL, rect.width - fw)) / rect.width, yPct: Math.max(0, Math.min(newT, rect.height - fh)) / rect.height }
          : fi
      ));
    }
  };

  const onEnd = () => {
    // Capture whether a drag/resize/rotate was active BEFORE resetting
    const wasActive = isDragging.current || isResizing.current || isRotating.current;
    isDragging.current   = false;
    isResizing.current   = false;
    resizeFpId.current   = null;
    resizeHandle.current = null;
    isRotating.current   = false;
    rotateFpId.current   = null;
    // If no drag/resize/rotate was active (e.g. just mousing out of canvas),
    // clear didDrag so the next canvas click can place a new element normally.
    if (!wasActive) didDrag.current = false;
  };

  // ── Confirm signature/stamp from panel ────────────────────────────────────

  const confirmImage = (rawDataUrl: string) => {
    setError("");
    const img = new window.Image();
    img.onload = () => {
      const tmp = document.createElement("canvas");
      tmp.width  = img.naturalWidth  || img.width;
      tmp.height = img.naturalHeight || img.height;
      const ctx = tmp.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0);
      const pngDataUrl = tmp.toDataURL("image/png");

      if (activeAdminFieldId) {
        // Fill admin guided field
        const fid = activeAdminFieldId;
        setAdminFieldValues((prev) => [
          ...prev.filter((fv) => fv.fieldId !== fid),
          { fieldId: fid, value: pngDataUrl, sigW, sigH },
        ]);
        setActiveAdminFieldId(null);
      } else if (dragFpId.current) {
        // Fill the pending free placement
        const fpId = dragFpId.current;
        setFreePlacements((prev) => prev.map((fp) =>
          fp.id === fpId ? { ...fp, value: pngDataUrl } : fp
        ));
        dragFpId.current = null;
      }
      setOpenPanel(null);
      setSigInputMode("draw");
      setUploadedPreview(null);
    };
    img.src = rawDataUrl;
  };

  // Confirm text-based (name / date) placement
  const confirmText = () => {
    const val = textValue.trim();
    if (!val) { setError("Please enter a value."); return; }
    // Find the pending text placement: prefer dragFpId, otherwise the most-recent empty one of this type
    const pendingId = dragFpId.current;
    setFreePlacements((prev) => {
      // Try exact id match first, then fall back to last empty placement of matching type
      const target = pendingId
        ? prev.find((fp) => fp.id === pendingId)
        : prev.slice().reverse().find((fp) => (fp.type === "name" || fp.type === "date") && !fp.value);
      if (!target) return prev;
      return prev.map((fp) => fp.id === target.id ? { ...fp, value: val } : fp);
    });
    dragFpId.current = null;
    setOpenPanel(null);
    setTextValue("");
    setError("");
  };

  // Remove empty free placements if panel closes without confirming
  const closePanel = () => {
    if (dragFpId.current) {
      setFreePlacements((prev) => prev.filter((fp) => fp.id !== dragFpId.current || fp.value));
      dragFpId.current = null;
    }
    setActiveAdminFieldId(null);
    setOpenPanel(null);
    setSigInputMode("draw");
    setUploadedPreview(null);
    setTextValue("");
    setError("");
  };

  // ── Generate preview ───────────────────────────────────────────────────────

  const goToPreview = async () => {
    if (!docBlobUrl) return;
    setError("");
    setPreviewLoading(true);
    setStep("preview");
    try {
      const resp = await fetch(docBlobUrl);
      if (!resp.ok) throw new Error("fetch failed");
      const pdfBytes = await resp.arrayBuffer();
      const { PDFDocument: PDFDoc, rgb: pdfRgb, StandardFonts: SF, degrees: pdfDegrees } = await import("pdf-lib");
      const pdfDoc = await PDFDoc.load(pdfBytes);
      const pages  = pdfDoc.getPages();
      let embFont: any = null;
      const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

      // Render admin guided fields
      for (const f of adminFields) {
        const fv = adminFieldValues.find((v) => v.fieldId === f.id);
        if (!fv?.value) continue;
        const pageIdx  = f.pageNum != null ? f.pageNum - 1 : pages.length - 1;
        const pg       = pages[Math.max(0, Math.min(pageIdx, pages.length - 1))];
        const { width: pgW, height: pgH } = pg.getSize();
        const fx = f.xPct * pgW;
        const fw = f.wPct * pgW;
        const fh = f.hPct * pgH;
        const fy = pgH * (1 - f.yPct) - fh;

        if (f.type === "signature" || f.type === "stamp") {
          const b64  = fv.value.replace(/^data:image\/\w+;base64,/, "");
          const bin  = atob(b64);
          const buf  = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
          const img  = await pdfDoc.embedPng(buf);
          pg.drawImage(img, { x: Math.max(0, fx), y: Math.max(0, fy), width: fw, height: fh });
        } else {
          if (!embFont) embFont = await pdfDoc.embedFont(SF.Helvetica);
          let text = fv.value.trim();
          if (f.type === "date") {
            const d = new Date(text + "T00:00:00");
            text = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
          }
          pg.drawText(text, { x: Math.max(0, fx) + 2, y: Math.max(0, fy) + fh * 0.3, size: 10, font: embFont, color: pdfRgb(0, 0, 0) });
        }
      }

      // Render free placements (with rotation around center for images)
      for (const fp of freePlacements) {
        if (!fp.value) continue;
        const pageIdx = (fp.pageNum ?? 1) - 1;
        const pg      = pages[Math.max(0, Math.min(pageIdx, pages.length - 1))];
        const { width: pgW, height: pgH } = pg.getSize();
        const fw = fp.wPct * pgW;
        const fh = fp.hPct * pgH;

        if (fp.type === "name" || fp.type === "date") {
          // Text placement — draw at the top-left of the zone
          if (!embFont) embFont = await pdfDoc.embedFont(SF.Helvetica);
          let text = fp.value.trim();
          if (fp.type === "date") {
            const d = new Date(text + "T00:00:00");
            text = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
          }
          const textX = fp.xPct * pgW;
          const textY = pgH * (1 - fp.yPct) - fh * 0.7;
          pg.drawText(text, {
            x: Math.max(0, textX),
            y: Math.max(0, textY),
            size: Math.max(8, Math.min(fh * 0.6, 14)),
            font: embFont,
            color: pdfRgb(0, 0, 0),
          });
        } else {
          // Image placement (signature / stamp) — rotate around center
          const cx = fp.xPct * pgW + fw / 2;          // center X in PDF space
          const cy = pgH * (1 - fp.yPct) - fh / 2;   // center Y in PDF space (y-up)
          const θ  = fp.rotation ?? 0;
          const rad = (θ * Math.PI) / 180;
          const cosθ = Math.cos(rad), sinθ = Math.sin(rad);
          // Adjust (x,y) so pdf-lib rotates around center (not bottom-left)
          const tx = cx - cosθ * fw / 2 - sinθ * fh / 2;
          const ty = cy + sinθ * fw / 2 - cosθ * fh / 2;
          const b64  = fp.value.replace(/^data:image\/\w+;base64,/, "");
          const bin  = atob(b64);
          const buf  = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
          const img  = await pdfDoc.embedPng(buf);
          // pdfDegrees positive = CCW in PDF = CCW on screen; CSS rotate positive = CW → negate
          pg.drawImage(img, { x: tx, y: ty, width: fw, height: fh, rotate: pdfDegrees(-θ) });
        }
      }

      const signedBytes = await pdfDoc.save();
      const blob = new Blob([signedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Preview generation failed:", err);
      setError("Could not generate preview. You can still submit.");
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await api.adminSignDocument(doc.id, {
        fieldValues: adminFieldValues,
        freePlacements: freePlacements.filter((fp) => fp.value).map((fp) => ({
          type: fp.type,
          value: fp.value,
          xPct: fp.xPct, yPct: fp.yPct,
          wPct: fp.wPct, hPct: fp.hPct,
          pageNum: fp.pageNum,
          rotation: fp.rotation ?? 0,
        })),
        canvasW: pageDims?.w ?? 595,
      });
      setStep("done");
      setTimeout(() => onSigned(), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to submit. Please try again.");
      setStep("fill");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Done step ─────────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-10 shadow-xl dark:bg-gray-dark">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-black dark:text-white">Document Signed!</h3>
          <p className="text-center text-sm text-body-color">The admin signature has been applied and saved.</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-full max-h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-dark">

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-stroke px-6 py-4 dark:border-gray-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-body-color">
              {step === "fill" ? "Admin Sign / Stamp" : "Preview"}
            </p>
            <h3 className="mt-0.5 font-bold text-black dark:text-white">{doc.title}</h3>
            {doc.signedDocumentUrl && (
              <p className="text-xs text-green-600">Based on user-signed version</p>
            )}
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">✕</button>
        </div>

        {/* ── Fill step ─────────────────────────────────────────────────── */}
        {step === "fill" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4">

            {/* Fetching spinner */}
            {docBlobFetching && (
              <div className="flex flex-1 items-center justify-center gap-3 text-body-color py-20">
                <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm">Loading document…</span>
              </div>
            )}

            {blobError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
                Could not load the PDF. Please close and try again.
              </div>
            )}

            {!docBlobFetching && !blobError && (
              <>
                {/* Toolbar row 1: admin guided fields */}
                {adminFields.length > 0 && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-body-color">Admin fields:</span>
                    {adminFields.map((f) => {
                      const filled = adminFieldValues.some((fv) => fv.fieldId === f.id && fv.value);
                      return (
                        <button
                          key={f.id}
                          onClick={() => onAdminFieldClick(f)}
                          className={`rounded-lg border-2 px-3 py-1 text-xs font-medium transition ${
                            filled
                              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                              : "border-purple-400 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300"
                          }`}
                        >
                          {FIELD_ICONS[f.type]} {f.type} {filled ? "✓" : ""}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Toolbar row 2: free placement tools */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-body-color">Free place:</span>
                  {(["signature", "stamp", "name", "date"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveFreeType(activeFreeType === t ? null : t)}
                      className={`rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition ${
                        activeFreeType === t
                          ? "border-primary bg-primary text-white"
                          : "border-stroke text-body-color hover:border-primary hover:text-primary dark:border-gray-600"
                      }`}
                    >
                      {t === "signature" ? "✍ Signature" : t === "stamp" ? "🔏 Stamp" : t === "name" ? "A Name" : "📅 Date"}
                    </button>
                  ))}
                  {activeFreeType && (
                    <span className="rounded-lg bg-yellow-50 px-2 py-1 text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                      Click on the document to place {activeFreeType}
                    </span>
                  )}
                </div>

                {/* Page navigation */}
                {totalPages > 1 && (
                  <div className="mb-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); if (containerRef.current) containerRef.current.scrollTop = 0; }}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-stroke px-3 py-1 text-xs font-medium disabled:opacity-40 dark:border-gray-700"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm font-semibold text-black dark:text-white">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); if (containerRef.current) containerRef.current.scrollTop = 0; }}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-stroke px-3 py-1 text-xs font-medium disabled:opacity-40 dark:border-gray-700"
                    >
                      Next →
                    </button>
                  </div>
                )}

                {/* PDF canvas */}
                <div
                  ref={containerRef}
                  className="relative mb-3 overflow-hidden rounded-xl border border-stroke bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  style={{ userSelect: "none", touchAction: "none", cursor: activeFreeType ? "crosshair" : "default", maxHeight: "60vh", overflowY: "auto" }}
                  onClick={onCanvasClick}
                  onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
                  onTouchMove={onMove} onTouchEnd={onEnd}
                >
                  <canvas ref={pageCanvasRef} style={{ display: pageDims ? "block" : "none" }} />

                  {!pageDims && !pageRenderError && (
                    <div className="flex h-64 items-center justify-center gap-3 text-body-color">
                      <svg className="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span className="text-sm">Rendering page…</span>
                    </div>
                  )}
                  {pageRenderError && (
                    <div className="flex h-64 items-center justify-center text-sm text-body-color">Could not render page.</div>
                  )}

                  {/* Admin guided field overlays */}
                  {pageDims && adminFields.filter((f) => (f.pageNum ?? 1) === currentPage).map((f) => {
                    const filled = adminFieldValues.some((fv) => fv.fieldId === f.id && fv.value);
                    const fv     = adminFieldValues.find((v) => v.fieldId === f.id);
                    const fw     = f.wPct * pageDims.w;
                    const fh     = f.hPct * pageDims.h;
                    return (
                      <div
                        key={f.id}
                        style={{
                          position: "absolute",
                          left: f.xPct * pageDims.w, top: f.yPct * pageDims.h,
                          width: fw, height: fh,
                          border: `2px ${filled ? "solid" : "dashed"} #8b5cf6`,
                          background: filled ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.12)",
                          borderRadius: 4, cursor: "pointer", touchAction: "none",
                        }}
                        onClick={(e) => { e.stopPropagation(); onAdminFieldClick(f); }}
                      >
                        {filled && fv?.value ? (
                          <img src={fv.value} alt="preview" className="h-full w-full object-contain p-0.5" draggable={false} />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span style={{ fontSize: Math.max(8, fh * 0.38), color: "#8b5cf6", fontWeight: 600 }}>
                              {FIELD_ICONS[f.type]} {f.type}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Free placement overlays */}
                  {pageDims && freePlacements.filter((fp) => fp.pageNum === currentPage && fp.value).map((fp) => {
                    const fw = fp.wPct * pageDims.w;
                    const fh = fp.hPct * pageDims.h;
                    return (
                      <div
                        key={fp.id}
                        style={{
                          position: "absolute",
                          left: fp.xPct * pageDims.w, top: fp.yPct * pageDims.h,
                          width: fw, height: fh,
                          transform: `rotate(${fp.rotation}deg)`,
                          transformOrigin: "center center",
                          cursor: "grab", touchAction: "none",
                        }}
                        onMouseDown={(e) => onFpMouseDown(fp.id, e)}
                        onTouchStart={(e) => onFpMouseDown(fp.id, e)}
                      >
                        {/* Content: image for sig/stamp, text for name/date */}
                        {fp.type === "name" || fp.type === "date" ? (
                          <div className="flex h-full w-full items-center rounded border-2 border-blue-400 bg-blue-50/90 px-1 shadow-sm dark:bg-blue-900/30">
                            <span style={{ fontSize: Math.max(9, fh * 0.42), fontFamily: "Helvetica, sans-serif", color: "#1e3a5f", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {fp.type === "date" && fp.value
                                ? (() => { const d = new Date(fp.value + "T00:00:00"); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; })()
                                : fp.value || "…"}
                            </span>
                          </div>
                        ) : (
                          <div className="h-full w-full rounded border-2 border-purple-500 p-0.5 shadow-lg">
                            <img src={fp.value} alt={fp.type} className="h-full w-full object-contain" draggable={false} />
                          </div>
                        )}
                        {/* Rotation handle — only for sig/stamp, rotates with element */}
                        {(fp.type === "signature" || fp.type === "stamp") && (
                          <div
                            style={{ position: "absolute", top: -34, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", cursor: "grab", touchAction: "none", zIndex: 20 }}
                            onMouseDown={(e) => onRotateStart(fp.id, e)}
                            onTouchStart={(e) => onRotateStart(fp.id, e)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#8b5cf6", border: "2px solid white", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M21 12a9 9 0 11-9-9" />
                                <polyline points="21 3 21 9 15 9" />
                              </svg>
                            </div>
                            <div style={{ width: 1, height: 10, background: "#8b5cf6", opacity: 0.6 }} />
                          </div>
                        )}
                        {/* Delete button */}
                        <button
                          style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", color: "white", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); setFreePlacements((prev) => prev.filter((f) => f.id !== fp.id)); }}
                        >✕</button>
                        {/* Resize handles */}
                        {RH.map((h) => (
                          <div
                            key={h.id}
                            style={{ position: "absolute", width: 8, height: 8, background: "white", border: "1.5px solid #8b5cf6", borderRadius: 2, cursor: h.cursor, ...h.style }}
                            onMouseDown={(e) => onResizeStart(fp.id, h.id, e)}
                            onTouchStart={(e) => onResizeStart(fp.id, h.id, e)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>

                {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

                <div className="flex flex-shrink-0 justify-end gap-3 pt-2">
                  <button onClick={onClose} className="rounded-xl border border-stroke px-5 py-2 text-sm dark:border-gray-700">
                    Cancel
                  </button>
                  <button
                    onClick={goToPreview}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                  >
                    Preview
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Preview step ──────────────────────────────────────────────── */}
        {step === "preview" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-hidden">
              {previewLoading ? (
                <div className="flex h-full items-center justify-center gap-3 text-body-color">
                  <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-sm">Generating preview…</span>
                </div>
              ) : previewUrl ? (
                <iframe src={previewUrl} className="h-full w-full" title="Signed preview" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-body-color">
                  Preview unavailable — you can still submit.
                </div>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center justify-between border-t border-stroke px-6 py-4 dark:border-gray-700">
              <p className="text-xs text-body-color">Review the preview above, then submit to save.</p>
              <div className="flex gap-3">
                {error && <p className="mr-2 text-sm text-red-500">{error}</p>}
                <button
                  onClick={() => {
                    setPageDims(null);
                    setPdfRenderCount((c) => c + 1);
                    setStep("fill");
                  }}
                  className="rounded-xl border border-stroke px-5 py-2 text-sm dark:border-gray-700"
                >
                  ← Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || previewLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Submit &amp; Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Draw/Upload panel modal ───────────────────────────────────── */}
        {openPanel && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 p-4 sm:justify-center"
            onClick={closePanel}
          >
            <div
              className="w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-dark"
              style={{ maxHeight: "90dvh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-gray-700">
                <h4 className="font-bold text-black dark:text-white">
                  {openPanel === "stamp" ? "🔏 Add Stamp" : openPanel === "name" ? "A Add Name" : openPanel === "date" ? "📅 Add Date" : "✍ Add Signature"}
                </h4>
                <button onClick={closePanel} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700">✕</button>
              </div>

              <div className="px-5 pb-6 pt-4">

                {/* ── Text panel (name / date) ── */}
                {(openPanel === "name" || openPanel === "date") && (
                  <>
                    <p className="mb-3 text-sm text-body-color">
                      {openPanel === "name" ? "Enter the name to place on the document." : "Enter or adjust the date."}
                    </p>
                    {openPanel === "name" ? (
                      <input
                        autoFocus
                        type="text"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") confirmText(); }}
                        placeholder="e.g. John M. Smith"
                        className="w-full rounded-xl border border-stroke bg-transparent px-4 py-3 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
                      />
                    ) : (
                      <input
                        autoFocus
                        type="date"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        className="w-full rounded-xl border border-stroke bg-transparent px-4 py-3 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
                      />
                    )}
                    {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                    <div className="mt-5 flex gap-3">
                      <button onClick={closePanel} className="flex h-12 items-center justify-center rounded-xl border border-stroke px-5 text-sm font-medium text-black hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800">
                        Cancel
                      </button>
                      <button onClick={confirmText} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90">
                        Place {openPanel === "name" ? "Name" : "Date"}
                      </button>
                    </div>
                  </>
                )}

                {/* ── Image panel (signature / stamp) ── */}
                {(openPanel === "signature" || openPanel === "stamp") && (
                  <>
                    {/* Draw / Upload tabs */}
                    <div className="mb-4 flex overflow-hidden rounded-xl border border-stroke dark:border-gray-700">
                      <button
                        onClick={() => setSigInputMode("draw")}
                        className={`flex-1 py-2.5 text-sm font-medium transition ${sigInputMode === "draw" ? "bg-primary text-white" : "text-body-color hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                      >
                        ✏ Draw
                      </button>
                      <button
                        onClick={() => setSigInputMode("upload")}
                        className={`flex-1 border-l border-stroke py-2.5 text-sm font-medium transition dark:border-gray-700 ${sigInputMode === "upload" ? "bg-primary text-white" : "text-body-color hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                      >
                        📷 Upload Image
                      </button>
                    </div>

                    {/* Draw pad */}
                    {sigInputMode === "draw" && (
                      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-white">
                        <canvas
                          ref={sigCanvasRef}
                          className="block w-full cursor-crosshair bg-white"
                          style={{ touchAction: "none", height: "clamp(140px, 36vw, 200px)" }}
                        />
                        <p className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3 text-sm text-gray-300 select-none">
                          Sign here with your finger or mouse
                        </p>
                      </div>
                    )}

                    {/* Upload zone */}
                    {sigInputMode === "upload" && (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault(); setIsDragOver(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith("image/")) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setUploadedPreview((ev.target?.result as string) ?? null);
                            reader.readAsDataURL(file);
                          }
                        }}
                        onClick={() => uploadInputRef.current?.click()}
                        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition ${
                          isDragOver ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50 hover:border-primary/50 dark:bg-gray-800"
                        }`}
                        style={{ minHeight: "clamp(140px, 36vw, 200px)" }}
                      >
                        {uploadedPreview ? (
                          <>
                            <img src={uploadedPreview} alt="preview" className="max-h-32 max-w-full object-contain px-4" draggable={false} />
                            <p className="text-xs text-body-color">Tap to change image</p>
                          </>
                        ) : (
                          <>
                            <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div className="px-4 text-center">
                              <p className="text-sm font-medium text-body-color">Drag &amp; drop image here</p>
                              <p className="mt-0.5 text-xs text-gray-400">or tap to browse · PNG, JPG, GIF, WebP</p>
                            </div>
                          </>
                        )}
                        <input ref={uploadInputRef} type="file" accept="image/*" className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) { const reader = new FileReader(); reader.onload = (ev) => setUploadedPreview((ev.target?.result as string) ?? null); reader.readAsDataURL(file); }
                            e.target.value = "";
                          }} />
                      </div>
                    )}

                    {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

                    <div className="mt-5 flex gap-3">
                      {sigInputMode === "draw" ? (
                        <button onClick={() => padRef.current?.clear()}
                          className="flex h-12 items-center justify-center rounded-xl border border-stroke px-5 text-sm font-medium text-black hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800">
                          Clear
                        </button>
                      ) : uploadedPreview ? (
                        <button onClick={(e) => { e.stopPropagation(); setUploadedPreview(null); }}
                          className="flex h-12 items-center justify-center rounded-xl border border-stroke px-5 text-sm font-medium text-black hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800">
                          Remove
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          if (sigInputMode === "upload") {
                            if (!uploadedPreview) { setError("Please upload an image."); return; }
                            confirmImage(uploadedPreview);
                          } else {
                            if (!padRef.current || padRef.current.isEmpty()) { setError("Please draw first."); return; }
                            confirmImage(padRef.current.toDataURL("image/png"));
                          }
                        }}
                        className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90"
                      >
                        {sigInputMode === "draw" ? "Use Signature" : "Use This Image"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
