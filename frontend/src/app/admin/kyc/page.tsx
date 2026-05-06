"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

interface KYCSubmission {
  id: string;
  userId: string;
  status: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  documentType: string;
  documentNumber: string;
  idFrontUrl: string | null;
  idBackUrl: string | null;
  proofOfAddressUrl: string | null;
  selfieUrl: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string;
  adminNotes: string;
  user: { id: string; email: string; firstName: string; lastName: string; profilePhoto?: string; createdAt: string };
}

interface KYCStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  notSubmitted: number;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    not_submitted: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  };
  return map[status] ?? map.not_submitted;
}

function DocImage({ url, label }: { url: string | null; label: string }) {
  const [lightbox, setLightbox] = useState(false);
  if (!url) return null;
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-body-color dark:text-gray-400">{label}</p>
        <button
          onClick={() => setLightbox(true)}
          className="group relative overflow-hidden rounded-lg border border-stroke dark:border-gray-700"
        >
          <img
            src={url}
            alt={label}
            className="h-40 w-full object-cover transition group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
            <svg className="h-8 w-8 text-white opacity-0 transition group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-xs text-primary hover:underline"
        >
          Open full size ↗
        </a>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={url}
            alt={label}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">{label}</p>
        </div>
      )}
    </>
  );
}

export default function AdminKYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [stats, setStats] = useState<KYCStats | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);

  // Detail + action modal
  const [detailSub, setDetailSub] = useState<KYCSubmission | null>(null);
  const [actionMode, setActionMode] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminGetKYCSubmissions({ status: statusFilter || undefined, page, limit: 20 });
      setSubmissions((res.data?.submissions as unknown as KYCSubmission[]) ?? []);
      setPagination(res.data?.pagination ?? { total: 0, page: 1, totalPages: 1 });
    } catch {
      setError("Failed to load KYC submissions.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  useEffect(() => {
    api.adminGetKYCStats().then((res) => setStats(res.data?.stats ?? null)).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [statusFilter]);

  const openDetail = (sub: KYCSubmission) => {
    setDetailSub(sub);
    setActionMode(null);
    setReason("");
    setNotes("");
    setModalError("");
  };

  const handleAction = async () => {
    if (!detailSub || !actionMode) return;
    if (actionMode === "reject" && !reason.trim()) {
      setModalError("Rejection reason is required.");
      return;
    }
    setModalError("");
    setActionLoading(true);
    try {
      if (actionMode === "approve") {
        await api.adminApproveKYC(detailSub.id, notes || undefined);
      } else {
        await api.adminRejectKYC(detailSub.id, reason, notes || undefined);
      }
      setDetailSub(null);
      setActionMode(null);
      fetchSubmissions();
      api.adminGetKYCStats().then((res) => setStats(res.data?.stats ?? null)).catch(() => {});
    } catch (err: any) {
      setModalError(err?.response?.data?.message ?? "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-black dark:text-white">KYC Review</h1>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Total", value: stats.total },
            { label: "Pending", value: stats.pending, color: "text-yellow-600" },
            { label: "Approved", value: stats.approved, color: "text-green-600" },
            { label: "Rejected", value: stats.rejected, color: "text-red-500" },
            { label: "Not Submitted", value: stats.notSubmitted },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-dark">
              <p className="text-xs text-body-color dark:text-gray-400">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color ?? "text-black dark:text-white"}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", ""] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg border border-stroke px-4 py-2 text-sm font-medium transition dark:border-gray-700 ${
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-white text-black hover:bg-gray-50 dark:bg-gray-dark dark:text-white dark:hover:bg-gray-800"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-gray-dark">
        {error ? (
          <p className="p-6 text-sm text-red-500">{error}</p>
        ) : loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : submissions.length === 0 ? (
          <p className="p-6 text-sm text-body-color dark:text-gray-400">No KYC submissions found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke dark:border-gray-700">
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">User</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Document</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Submitted</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Reviewed</th>
                <th className="px-4 py-3 text-center font-semibold text-black dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className="border-b border-stroke transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-black dark:text-white">{sub.user.firstName} {sub.user.lastName}</p>
                    <p className="text-xs text-body-color dark:text-gray-400">{sub.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-body-color dark:text-gray-400">
                    {sub.documentType ? (
                      <span className="capitalize">{sub.documentType.replace(/_/g, " ")}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(sub.status)}`}>
                      {sub.status.replace("_", " ")}
                    </span>
                    {sub.rejectionReason && (
                      <p className="mt-0.5 max-w-[160px] truncate text-xs text-red-400" title={sub.rejectionReason}>
                        {sub.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-body-color dark:text-gray-400">
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-body-color dark:text-gray-400">
                    {sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openDetail(sub)}
                      className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-primary/80"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-body-color dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-black transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800">
              Prev
            </button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-black transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail / Review modal */}
      {detailSub && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl dark:bg-gray-dark">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white">
                  KYC Submission — {detailSub.user.firstName} {detailSub.user.lastName}
                </h3>
                <p className="text-xs text-body-color dark:text-gray-400">{detailSub.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(detailSub.status)}`}>
                  {detailSub.status.replace("_", " ")}
                </span>
                <button onClick={() => setDetailSub(null)}
                  className="rounded-lg p-1.5 text-body-color transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal info */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-black dark:text-white">Personal Information</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "Full Name", value: detailSub.fullName },
                    { label: "Date of Birth", value: detailSub.dateOfBirth },
                    { label: "Nationality", value: detailSub.nationality },
                    { label: "Document Type", value: detailSub.documentType?.replace(/_/g, " ") },
                    { label: "Document Number", value: detailSub.documentNumber },
                    { label: "Submitted", value: detailSub.submittedAt ? new Date(detailSub.submittedAt).toLocaleString() : null },
                  ].map((f) =>
                    f.value ? (
                      <div key={f.label}>
                        <p className="text-xs text-body-color dark:text-gray-400">{f.label}</p>
                        <p className="text-sm font-medium capitalize text-black dark:text-white">{f.value}</p>
                      </div>
                    ) : null
                  )}
                </div>
                {(detailSub.address || detailSub.city || detailSub.country) && (
                  <div className="mt-3">
                    <p className="text-xs text-body-color dark:text-gray-400">Address</p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {[detailSub.address, detailSub.city, detailSub.state, detailSub.postalCode, detailSub.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-black dark:text-white">Submitted Documents</h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <DocImage url={detailSub.idFrontUrl} label="ID Front" />
                  <DocImage url={detailSub.idBackUrl} label="ID Back" />
                  <DocImage url={detailSub.proofOfAddressUrl} label="Proof of Address" />
                  <DocImage url={detailSub.selfieUrl} label="Selfie" />
                </div>
                {!detailSub.idFrontUrl && !detailSub.proofOfAddressUrl && !detailSub.selfieUrl && (
                  <p className="text-sm text-body-color dark:text-gray-400">No documents uploaded yet.</p>
                )}
              </div>

              {/* Previous rejection reason */}
              {detailSub.rejectionReason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800/30 dark:bg-red-900/10">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">Rejection Reason</p>
                  <p className="mt-0.5 text-sm text-red-700 dark:text-red-300">{detailSub.rejectionReason}</p>
                </div>
              )}

              {/* Action section (only for pending) */}
              {detailSub.status === "pending" && (
                <div className="border-t border-stroke pt-4 dark:border-gray-700">
                  {!actionMode ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setActionMode("approve"); setModalError(""); }}
                        className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                      >
                        Approve KYC
                      </button>
                      <button
                        onClick={() => { setActionMode("reject"); setModalError(""); }}
                        className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white transition hover:bg-red-600"
                      >
                        Reject KYC
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-3 text-sm font-semibold capitalize text-black dark:text-white">
                        {actionMode === "approve" ? "Approving KYC" : "Rejecting KYC"}
                      </p>

                      {actionMode === "reject" && (
                        <>
                          <label className="mb-1 block text-xs font-medium text-black dark:text-white">
                            Rejection Reason <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Explain why this KYC is being rejected…"
                            className="mb-3 w-full rounded-lg border border-stroke bg-gray-50 px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </>
                      )}

                      <label className="mb-1 block text-xs font-medium text-black dark:text-white">
                        Admin Notes <span className="text-body-color">(optional, not shown to user)</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Internal notes…"
                        className="mb-3 w-full rounded-lg border border-stroke bg-gray-50 px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />

                      {modalError && <p className="mb-3 text-xs text-red-500">{modalError}</p>}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setActionMode(null)}
                          className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleAction}
                          disabled={actionLoading}
                          className={`flex-1 rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50 ${actionMode === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}
                        >
                          {actionLoading ? "Processing…" : `Confirm ${actionMode === "approve" ? "Approval" : "Rejection"}`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
