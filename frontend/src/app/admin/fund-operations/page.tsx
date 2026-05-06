"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

interface FundOp {
  id: string;
  type: string;
  status: string;
  amount: number;
  reference: string;
  createdAt: string;
  completedAt?: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
}

function typeBadge(type: string) {
  return type === "deposit"
    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
}

export default function AdminFundOperationsPage() {
  const [ops, setOps] = useState<FundOp[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState(""); // "" | "deposit" | "withdrawal"
  const [statusFilter, setStatusFilter] = useState("pending");

  // Action modal
  const [modal, setModal] = useState<{ op: FundOp; action: "approve" | "reject" } | null>(null);
  const [modalNote, setModalNote] = useState("");
  const [modalError, setModalError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminGetFundOperations({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      setOps(res.data?.operations ?? []);
      setTotal(res.data?.total ?? 0);
    } catch {
      setError("Failed to load fund operations.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => { fetchOps(); }, [fetchOps]);

  const openModal = (op: FundOp, action: "approve" | "reject") => {
    setModal({ op, action });
    setModalNote("");
    setModalError("");
  };

  const handleAction = async () => {
    if (!modal) return;
    if (modal.action === "reject" && !modalNote.trim()) {
      setModalError("Please provide a rejection reason.");
      return;
    }
    setModalError("");
    setActionLoading(true);
    try {
      if (modal.action === "approve") {
        await api.adminApproveFundOperation(modal.op.id, modalNote || undefined);
      } else {
        await api.adminRejectFundOperation(modal.op.id, modalNote || undefined);
      }
      setModal(null);
      fetchOps();
    } catch (err: any) {
      setModalError(err?.response?.data?.message ?? "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-black dark:text-white">Fund Operations</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none dark:border-gray-700 dark:bg-gray-dark dark:text-white"
        >
          <option value="">All Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
        <div className="flex rounded-lg border border-stroke overflow-hidden dark:border-gray-700">
          {(["", "pending", "completed", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-sm font-medium transition ${
                statusFilter === s
                  ? "bg-primary text-white"
                  : "bg-white text-black hover:bg-gray-50 dark:bg-gray-dark dark:text-white dark:hover:bg-gray-800"
              }`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <span className="flex items-center text-sm text-body-color dark:text-gray-400">{total} result{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-gray-dark">
        {error ? (
          <p className="p-6 text-sm text-red-500">{error}</p>
        ) : loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : ops.length === 0 ? (
          <p className="p-6 text-sm text-body-color dark:text-gray-400">No fund operations found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke dark:border-gray-700">
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">User</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Type</th>
                <th className="px-4 py-3 text-right font-semibold text-black dark:text-white">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Reference</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Date</th>
                <th className="px-4 py-3 text-center font-semibold text-black dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ops.map((op) => (
                <tr key={op.id} className="border-b border-stroke transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-black dark:text-white">{op.user.firstName} {op.user.lastName}</p>
                    <p className="text-xs text-body-color dark:text-gray-400">{op.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeBadge(op.type)}`}>
                      {op.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-black dark:text-white">
                    ${Number(op.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-body-color dark:text-gray-400 max-w-[140px] truncate">
                    {op.reference}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(op.status)}`}>
                      {op.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-body-color dark:text-gray-400">
                    {new Date(op.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {op.status === "pending" ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal(op, "approve")}
                          className="rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openModal(op, "reject")}
                          className="rounded-md bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-body-color dark:text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Action modal */}
      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h3 className="mb-1 text-lg font-bold text-black dark:text-white capitalize">
              {modal.action} {modal.op.type}
            </h3>
            <p className="mb-4 text-sm text-body-color dark:text-gray-400">
              <span className="font-medium text-black dark:text-white">{modal.op.user.firstName} {modal.op.user.lastName}</span>
              {" — "}
              ${Number(modal.op.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>

            <label className="mb-1 block text-xs font-medium text-black dark:text-white">
              {modal.action === "reject" ? "Rejection Reason (required)" : "Note (optional)"}
            </label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              rows={3}
              placeholder={modal.action === "reject" ? "Explain why this is being rejected…" : "Optional admin note…"}
              className="mb-4 w-full rounded-lg border border-stroke bg-gray-50 px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {modalError && <p className="mb-3 text-xs text-red-500">{modalError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-lg border border-stroke py-2 text-sm font-medium text-black transition hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex-1 rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50 ${modal.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}
              >
                {actionLoading ? "Processing…" : modal.action === "approve" ? "Confirm Approve" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
