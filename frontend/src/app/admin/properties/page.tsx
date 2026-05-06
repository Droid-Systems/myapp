"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface Property {
  id: string;
  title: string;
  location: string;
  category: string;
  investmentType: string;
  investmentStatus: string;
  type: string;
  price: number;
  minInvestment: number;
  targetAmount: number;
  currentFunded: number;
  monthlyReturn: number;
  expectedROI: number;
  duration: number;
  isFeatured: boolean;
  isActive: boolean;
  images: string[];
  investorCount: number;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  airbnb_arbitrage: "Airbnb Arbitrage",
  airbnb_mortgage: "Airbnb Mortgage",
  for_sale: "For Sale",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  funded: "Funded",
  closed: "Closed",
  coming_soon: "Coming Soon",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  funded: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-700",
  coming_soon: "bg-yellow-100 text-yellow-800",
};

function formatCurrency(val: number) {
  if (!val) return "$0";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

export default function AdminPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterInvestmentType, setFilterInvestmentType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [search, setSearch] = useState("");

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ property: Property; hard: boolean } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterCategory) params.category = filterCategory;
      if (filterInvestmentType) params.investmentType = filterInvestmentType;
      if (filterStatus) params.status = filterStatus;
      if (filterActive !== "") params.active = filterActive === "true";
      const res = await api.adminGetProperties(params);
      if (res.success && res.data) {
        setProperties(res.data as Property[]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterInvestmentType, filterStatus, filterActive]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filtered = properties.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
  });

  async function handleDelete() {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      if (deleteModal.hard) {
        await api.adminHardDeleteProperty(deleteModal.property.id);
      } else {
        await api.adminSoftDeleteProperty(deleteModal.property.id);
      }
      setDeleteModal(null);
      fetchProperties();
    } catch {
      // ignore
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleToggleActive(property: Property) {
    try {
      const formData = new FormData();
      formData.append("isActive", String(!property.isActive));
      await api.adminUpdateProperty(property.id, formData);
      fetchProperties();
    } catch {
      // ignore
    }
  }

  async function handleToggleFeatured(property: Property) {
    try {
      const formData = new FormData();
      formData.append("isFeatured", String(!property.isFeatured));
      await api.adminUpdateProperty(property.id, formData);
      fetchProperties();
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
            <p className="mt-1 text-sm text-gray-500">
              {filtered.length} propert{filtered.length === 1 ? "y" : "ies"}
            </p>
          </div>
          <Link
            href="/admin/properties/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Property
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <input
            type="text"
            placeholder="Search title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none sm:col-span-4 lg:col-span-1"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="airbnb_arbitrage">Airbnb Arbitrage</option>
            <option value="airbnb_mortgage">Airbnb Mortgage</option>
            <option value="for_sale">For Sale</option>
          </select>
          <select
            value={filterInvestmentType}
            onChange={(e) => setFilterInvestmentType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="pooled">Pooled</option>
            <option value="individual">Individual</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="funded">Funded</option>
            <option value="closed">Closed</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          >
            <option value="">Active &amp; Inactive</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
            <p className="text-gray-500">No properties found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Property</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Funding</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">ROI</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Flags</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((p) => {
                    const fundingPct = p.targetAmount > 0
                      ? Math.min(100, Math.round((p.currentFunded / p.targetAmount) * 100))
                      : 0;
                    return (
                      <tr key={p.id} className={`transition-colors hover:bg-gray-50 ${!p.isActive ? "opacity-60" : ""}`}>
                        {/* Property */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.images?.[0] ? (
                              <img
                                src={p.images[0]}
                                alt={p.title}
                                className="h-10 w-14 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-14 items-center justify-center rounded bg-gray-100">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <p className="max-w-[180px] truncate text-sm font-medium text-gray-900">{p.title}</p>
                              <p className="text-xs text-gray-500">{p.location}</p>
                            </div>
                          </div>
                        </td>
                        {/* Category */}
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">{CATEGORY_LABELS[p.category] ?? p.category}</p>
                          <p className="text-xs capitalize text-gray-400">{p.investmentType}</p>
                        </td>
                        {/* Price */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(p.price)}</p>
                          <p className="text-xs text-gray-400">Min {formatCurrency(p.minInvestment)}</p>
                        </td>
                        {/* Funding */}
                        <td className="px-4 py-3">
                          <div className="w-24">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>{fundingPct}%</span>
                              <span>{p.investorCount} inv.</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-black"
                                style={{ width: `${fundingPct}%` }}
                              />
                            </div>
                            <p className="mt-0.5 text-xs text-gray-400">{formatCurrency(p.currentFunded)} / {formatCurrency(p.targetAmount)}</p>
                          </div>
                        </td>
                        {/* ROI */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{p.monthlyReturn}%/mo</p>
                          <p className="text-xs text-gray-400">{p.expectedROI}% over {p.duration}mo</p>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.investmentStatus] ?? "bg-gray-100 text-gray-700"}`}>
                            {STATUS_LABELS[p.investmentStatus] ?? p.investmentStatus}
                          </span>
                        </td>
                        {/* Flags */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleToggleActive(p)}
                              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                                p.isActive
                                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                                  : "bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                            >
                              {p.isActive ? "Active" : "Inactive"}
                            </button>
                            <button
                              onClick={() => handleToggleFeatured(p)}
                              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                                p.isFeatured
                                  ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                              }`}
                            >
                              {p.isFeatured ? "Featured" : "Not Featured"}
                            </button>
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/properties/${p.id}/edit`}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => setDeleteModal({ property: p, hard: false })}
                              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Property</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <span className="font-medium">{deleteModal.property.title}</span>?
            </p>

            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                <input
                  type="radio"
                  checked={!deleteModal.hard}
                  onChange={() => setDeleteModal({ ...deleteModal, hard: false })}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Soft Delete (Deactivate)</p>
                  <p className="text-xs text-gray-500">Hides property from users but keeps data and investments.</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-red-100 p-3 hover:bg-red-50">
                <input
                  type="radio"
                  checked={deleteModal.hard}
                  onChange={() => setDeleteModal({ ...deleteModal, hard: true })}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-red-700">Permanent Delete</p>
                  <p className="text-xs text-red-500">Irreversible. Only works if no investments exist.</p>
                </div>
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
