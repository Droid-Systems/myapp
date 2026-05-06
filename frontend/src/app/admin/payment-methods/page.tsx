"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaymentWallet {
  id: string;
  type: "bank" | "crypto";
  method: string;
  name: string;
  address: string;
  network: string;
  bankName: string;
  accountName: string;
  swiftCode: string;
  routingNumber: string;
  instructions: string;
  qrCodeData: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const BLANK: Omit<PaymentWallet, "id" | "createdAt" | "updatedAt"> = {
  type: "crypto",
  method: "",
  name: "",
  address: "",
  network: "",
  bankName: "",
  accountName: "",
  swiftCode: "",
  routingNumber: "",
  instructions: "",
  qrCodeData: "",
  isActive: true,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function TypeBadge({ type }: { type: "bank" | "crypto" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        type === "bank"
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      }`}
    >
      {type === "bank" ? "Bank" : "Crypto"}
    </span>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  form: typeof BLANK;
  setForm: React.Dispatch<React.SetStateAction<typeof BLANK>>;
}

function WalletModal({ title, onClose, onSubmit, submitting, form, setForm }: ModalProps) {
  const isCrypto = form.type === "crypto";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Type *
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "bank" | "crypto" }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="crypto">Crypto</option>
              <option value="bank">Bank</option>
            </select>
          </div>

          {/* Method */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Method * (e.g. BTC, ETH, USDT, bank_transfer)
            </label>
            <input
              type="text"
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
              placeholder="USDT"
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Display Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="USDT (TRC-20)"
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {isCrypto ? (
            <>
              {/* Wallet Address */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="T..."
                  className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Network */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Network (e.g. TRC-20, ERC-20)
                </label>
                <input
                  type="text"
                  value={form.network}
                  onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}
                  placeholder="TRC-20"
                  className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* QR Code Data */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  QR Code Data (optional)
                </label>
                <input
                  type="text"
                  value={form.qrCodeData}
                  onChange={(e) => setForm((f) => ({ ...f, qrCodeData: e.target.value }))}
                  placeholder="Wallet address or payment URI"
                  className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </>
          ) : (
            <>
              {/* Bank Name */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                  placeholder="Chase Bank"
                  className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Account Name */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Account Name
                </label>
                <input
                  type="text"
                  value={form.accountName}
                  onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                  placeholder="Alvarado Associates LLC"
                  className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Address / Account Number */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Account Number
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="000123456789"
                  className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Routing Number */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Routing Number
                </label>
                <input
                  type="text"
                  value={form.routingNumber}
                  onChange={(e) => setForm((f) => ({ ...f, routingNumber: e.target.value }))}
                  placeholder="021000021"
                  className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* SWIFT */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  SWIFT / BIC Code
                </label>
                <input
                  type="text"
                  value={form.swiftCode}
                  onChange={(e) => setForm((f) => ({ ...f, swiftCode: e.target.value }))}
                  placeholder="CHASUS33"
                  className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Instructions */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Instructions (shown to user)
            </label>
            <textarea
              rows={3}
              value={form.instructions}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              placeholder="e.g. Send exact amount and include your reference code in the memo field."
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-stroke accent-primary"
            />
            <label htmlFor="isActive" className="text-sm text-black dark:text-white">
              Active (visible to users)
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
  wallet,
  onClose,
  onConfirm,
  submitting,
}: {
  wallet: PaymentWallet;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
        <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">Delete Payment Method</h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Are you sure you want to permanently delete{" "}
          <strong className="text-black dark:text-white">{wallet.name}</strong>? This cannot be
          undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
          >
            {submitting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPaymentMethodsPage() {
  const [wallets, setWallets] = useState<PaymentWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "bank" | "crypto">("all");

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof BLANK>({ ...BLANK });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<PaymentWallet | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toggle loading state per wallet
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminGetPaymentWallets(
        filter !== "all" ? { type: filter } : undefined
      );
      setWallets((res.data as PaymentWallet[]) ?? []);
    } catch {
      setError("Failed to load payment wallets.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  // ── Open create modal ──
  function openCreate() {
    setEditingId(null);
    setForm({ ...BLANK });
    setFormError(null);
    setModalOpen(true);
  }

  // ── Open edit modal ──
  function openEdit(w: PaymentWallet) {
    setEditingId(w.id);
    setForm({
      type: w.type,
      method: w.method,
      name: w.name,
      address: w.address,
      network: w.network,
      bankName: w.bankName,
      accountName: w.accountName,
      swiftCode: w.swiftCode,
      routingNumber: w.routingNumber,
      instructions: w.instructions,
      qrCodeData: w.qrCodeData,
      isActive: w.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  }

  // ── Submit create/edit ──
  async function handleSubmit() {
    if (!form.type || !form.method.trim() || !form.name.trim()) {
      setFormError("Type, method and name are required.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await api.adminUpdatePaymentWallet(editingId, form as Record<string, unknown>);
      } else {
        await api.adminCreatePaymentWallet(form);
      }
      setModalOpen(false);
      fetchWallets();
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? "Failed to save wallet.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Toggle active ──
  async function handleToggle(w: PaymentWallet) {
    setTogglingId(w.id);
    try {
      await api.adminTogglePaymentWallet(w.id);
      setWallets((prev) =>
        prev.map((x) => (x.id === w.id ? { ...x, isActive: !x.isActive } : x))
      );
    } catch {
      // silently ignore; re-fetch for accuracy
      fetchWallets();
    } finally {
      setTogglingId(null);
    }
  }

  // ── Delete ──
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.adminDeletePaymentWallet(deleteTarget.id);
      setDeleteTarget(null);
      fetchWallets();
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const displayed = wallets;

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Payment Methods</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage bank and crypto payment options shown to users
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Payment Method
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {(["all", "crypto", "bank"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === t
                ? "bg-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-dark dark:text-gray-400 dark:hover:bg-gray-800 border border-stroke dark:border-gray-700"
            }`}
          >
            {t === "all" ? "All" : t === "crypto" ? "Crypto" : "Bank"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button onClick={fetchWallets} className="ml-2 underline">
            Retry
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-stroke bg-white py-16 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-400">
          No payment methods found.{" "}
          <button onClick={openCreate} className="text-primary underline">
            Add one
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stroke bg-white dark:border-gray-700 dark:bg-gray-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Name / Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Type
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                    Address / Account
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 lg:table-cell">
                    Network / Bank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-gray-700">
                {displayed.map((w) => (
                  <tr
                    key={w.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-black dark:text-white">{w.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{w.method}</p>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={w.type} />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {w.type === "crypto" ? (
                        <span className="block max-w-[200px] truncate font-mono text-xs text-gray-700 dark:text-gray-300">
                          {w.address || "—"}
                        </span>
                      ) : (
                        <div>
                          <p className="text-xs text-black dark:text-white">
                            {w.accountName || "—"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{w.address}</p>
                        </div>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {w.type === "crypto" ? w.network || "—" : w.bankName || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge active={w.isActive} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle */}
                        <button
                          onClick={() => handleToggle(w)}
                          disabled={togglingId === w.id}
                          title={w.isActive ? "Deactivate" : "Activate"}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            w.isActive
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                          } disabled:opacity-50`}
                        >
                          {togglingId === w.id
                            ? "..."
                            : w.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEdit(w)}
                          title="Edit"
                          className="rounded px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(w)}
                          title="Delete"
                          className="rounded px-2 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
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
        </div>
      )}

      {/* Summary count */}
      {!loading && !error && displayed.length > 0 && (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          {displayed.length} method{displayed.length !== 1 ? "s" : ""} •{" "}
          {displayed.filter((w) => w.isActive).length} active
        </p>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <WalletModal
          title={editingId ? "Edit Payment Method" : "Add Payment Method"}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
          form={form}
          setForm={setForm}
        />
      )}
      {modalOpen && formError && (
        <div className="fixed bottom-4 right-4 z-[60] rounded-lg bg-red-500 px-4 py-2 text-sm text-white shadow-lg">
          {formError}
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          wallet={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          submitting={deleting}
        />
      )}
    </div>
  );
}
