"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  kycStatus: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  lastLoginDevice: string | null;
  lastLoginLocation: string | null;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  adminCount: number;
  superadminCount: number;
  regularUsers: number;
}

const LIMIT = 20;

function roleBadge(role: string) {
  const map: Record<string, string> = {
    superadmin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    user: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };
  return map[role] ?? map.user;
}

function kycBadge(status: string) {
  const map: Record<string, string> = {
    verified: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    none: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  };
  return map[status] ?? map.none;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminGetUsers({
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        kycStatus: kycFilter || undefined,
        isActive: activeFilter || undefined,
        limit: LIMIT,
        offset,
      });
      setUsers(res.data?.users ?? []);
      setTotal(res.data?.total ?? 0);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, kycFilter, activeFilter, offset]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    api.adminGetUserStats()
      .then((res) => setStats(res.data ?? null))
      .catch(() => {});
  }, []);

  // Reset to page 0 when filters change
  useEffect(() => { setOffset(0); }, [debouncedSearch, roleFilter, kycFilter, activeFilter]);

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-black dark:text-white">Users</h1>

      {/* Stats cards */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: "Total", value: stats.totalUsers },
            { label: "Active", value: stats.activeUsers, color: "text-green-600" },
            { label: "Inactive", value: stats.inactiveUsers, color: "text-red-500" },
            { label: "KYC Verified", value: stats.verifiedUsers, color: "text-blue-600" },
            { label: "Admins", value: stats.adminCount, color: "text-blue-500" },
            { label: "Superadmins", value: stats.superadminCount, color: "text-purple-600" },
            { label: "Regular", value: stats.regularUsers },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-dark">
              <p className="text-xs text-body-color dark:text-gray-400">{s.label}</p>
              <p className={`mt-1 text-xl font-bold ${s.color ?? "text-black dark:text-white"}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-dark dark:text-white sm:w-56"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none dark:border-gray-700 dark:bg-gray-dark dark:text-white"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <select
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value)}
          className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none dark:border-gray-700 dark:bg-gray-dark dark:text-white"
        >
          <option value="">All KYC</option>
          <option value="none">None</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-black outline-none dark:border-gray-700 dark:bg-gray-dark dark:text-white"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-gray-dark">
        {error ? (
          <p className="p-6 text-sm text-red-500">{error}</p>
        ) : loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-body-color dark:text-gray-400">No users found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke dark:border-gray-700">
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">User</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">KYC</th>
                <th className="px-4 py-3 text-right font-semibold text-black dark:text-white">Balance</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Joined</th>
                <th className="px-4 py-3 text-left font-semibold text-black dark:text-white">Last Login</th>
                <th className="px-4 py-3 text-center font-semibold text-black dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-stroke transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-black dark:text-white">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-body-color dark:text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${kycBadge(u.kycStatus)}`}>
                      {u.kycStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-black dark:text-white">
                    ${Number(u.balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-body-color dark:text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-body-color dark:text-gray-400">
                    {u.lastLoginAt ? (
                      <div>
                        <p>{new Date(u.lastLoginAt).toLocaleDateString()}</p>
                        {u.lastLoginDevice && (
                          <p className="truncate max-w-[120px] text-gray-400 dark:text-gray-500" title={u.lastLoginDevice}>
                            {u.lastLoginDevice}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary/80"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-body-color dark:text-gray-400">
            Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset((p) => Math.max(0, p - LIMIT))}
              className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-black transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
            >
              Prev
            </button>
            <span className="flex items-center px-2 text-xs text-body-color dark:text-gray-400">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={offset + LIMIT >= total}
              onClick={() => setOffset((p) => p + LIMIT)}
              className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-black transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
