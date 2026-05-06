"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  profilePhoto?: string;
  bio?: string;
  occupation?: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  kycStatus: string;
  balance: number;
  profits: number;
  referralCommissions: number;
  bonus: number;
  referralCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  lastLoginDevice: string | null;
  lastLoginBrowser: string | null;
  lastLoginOs: string | null;
  lastLoginLocation: string | null;
  lastLoginIp: string | null;
  recentSessions: Array<{
    loginAt: string;
    lastActive: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    location: string | null;
    ipAddress: string | null;
  }>;
  _count: { transactions: number; investments: number; referrals: number; sessions: number };
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${color}`}>{label}</span>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Balance modal state
  const [balanceModal, setBalanceModal] = useState<"add" | "deduct" | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceNote, setBalanceNote] = useState("");
  const [balanceError, setBalanceError] = useState("");
  const [balanceCategory, setBalanceCategory] = useState("balance");

  // Reset user state
  const [resetModal, setResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  // Assign Referral modal state
  const [referralModal, setReferralModal] = useState(false);
  const [referrerIdentifier, setReferrerIdentifier] = useState("");
  const [referralReward, setReferralReward] = useState("10");
  const [referralError, setReferralError] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminGetUser(id);
      setUser(res.data ?? null);
    } catch {
      setError("Failed to load user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [id]);

  const handleToggleStatus = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.adminUpdateUserStatus(id, !user.isActive);
      await fetchUser();
    } catch {
      alert("Failed to update user status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBalanceSubmit = async () => {
    const amount = parseFloat(balanceAmount);
    if (!amount || amount <= 0) {
      setBalanceError("Enter a valid positive amount.");
      return;
    }
    setBalanceError("");
    setActionLoading(true);
    try {
      const finalAmount = balanceModal === "deduct" ? -amount : amount;
      await api.adminUpdateUserBalance(id, finalAmount, balanceNote || undefined, balanceCategory);
      setBalanceModal(null);
      setBalanceAmount("");
      setBalanceNote("");
      await fetchUser();
    } catch (err: any) {
      setBalanceError(err?.response?.data?.message ?? "Failed to update balance.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetUser = async () => {
    setResetLoading(true);
    setResetResult(null);
    try {
      const res = await api.adminResetUser(id);
      const d = res.data?.deleted;
      setResetResult(
        `Done. Deleted: ${d?.transactions ?? 0} transactions, ${d?.fundOperations ?? 0} fund ops, ${d?.referrals ?? 0} referrals, ${d?.investments ?? 0} investments. Balance reset to $0.`
      );
      await fetchUser();
    } catch (err: any) {
      setResetResult(err?.response?.data?.message ?? "Failed to reset user.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleAssignReferral = async () => {
    if (!referrerIdentifier.trim()) { setReferralError("Enter referrer email or referral code"); return; }
    const reward = parseFloat(referralReward);
    if (isNaN(reward) || reward < 0) { setReferralError("Enter a valid reward amount (0 or more)"); return; }
    setReferralError(""); setReferralLoading(true);
    try {
      await api.adminAssignReferral(id, referrerIdentifier.trim(), reward);
      setReferralModal(false); setReferrerIdentifier(""); setReferralReward("10");
      await fetchUser();
    } catch (err: any) {
      setReferralError(err?.response?.data?.message ?? "Failed to assign referral.");
    } finally { setReferralLoading(false); }
  };

    if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow dark:bg-gray-dark">
        <p className="text-red-500">{error ?? "User not found."}</p>
        <Link href="/admin/users" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  const roleBg: Record<string, string> = {
    superadmin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    user: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };
  const kycBg: Record<string, string> = {
    verified: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    none: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/users" className="flex items-center gap-1 text-sm text-body-color transition hover:text-primary dark:text-gray-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Users
      </Link>

      {/* Profile card */}
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-dark sm:p-6">
        {/* Avatar + info */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt="Avatar" className="h-14 w-14 shrink-0 rounded-full object-cover sm:h-16 sm:w-16" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary sm:h-16 sm:w-16 sm:text-xl">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-black dark:text-white sm:text-xl">{user.firstName} {user.lastName}</h2>
            <p className="truncate text-xs text-body-color dark:text-gray-400 sm:text-sm">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge label={user.role} color={roleBg[user.role] ?? roleBg.user} />
              <Badge label={`KYC: ${user.kycStatus}`} color={kycBg[user.kycStatus] ?? kycBg.none} />
              <Badge
                label={user.isActive ? "Active" : "Inactive"}
                color={user.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}
              />
            </div>
          </div>
        </div>

        {/* Action buttons — stack on mobile, flex-wrap on sm+ */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 sm:w-auto ${user.isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"}`}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => { setBalanceModal("add"); setBalanceAmount(""); setBalanceNote(""); setBalanceError(""); setBalanceCategory("balance"); }}
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 sm:w-auto"
          >
            Add Balance
          </button>
          <button
            onClick={() => { setBalanceModal("deduct"); setBalanceAmount(""); setBalanceNote(""); setBalanceError(""); setBalanceCategory("balance"); }}
            className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 sm:w-auto"
          >
            Deduct Balance
          </button>
          <button
            onClick={() => { setReferralModal(true); setReferrerIdentifier(""); setReferralReward("10"); setReferralError(""); }}
            className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 sm:w-auto"
          >
            Assign Referral
          </button>
          <button
            onClick={() => { setResetModal(true); setResetResult(null); }}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 sm:w-auto"
          >
            Reset User
          </button>
        </div>

        {/* Balances */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {([
            { label: "Balance", value: user.balance, color: "text-black dark:text-white" },
            { label: "Profits", value: user.profits, color: "text-green-600 dark:text-green-400" },
            { label: "Referral Commissions", value: user.referralCommissions, color: "text-blue-600 dark:text-blue-400" },
            { label: "Bonus", value: user.bonus, color: "text-purple-600 dark:text-purple-400" },
          ] as { label: string; value: number; color: string }[]).map((b) => (
            <div key={b.label} className="rounded-xl border border-stroke bg-gray-50 px-3 py-3 dark:border-gray-700 dark:bg-gray-800/50 sm:px-4">
              <p className="text-xs text-body-color dark:text-gray-400">{b.label}</p>
              <p className={`mt-0.5 text-base font-bold sm:text-lg ${b.color}`}>
                ${Number(b.value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Transactions", value: user._count.transactions },
          { label: "Investments", value: user._count.investments },
          { label: "Referrals", value: user._count.referrals },
          { label: "Sessions", value: user._count.sessions },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-dark">
            <p className="text-xs text-body-color dark:text-gray-400">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-black dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Personal info */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
        <h3 className="mb-4 text-base font-semibold text-black dark:text-white">Personal Information</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Phone", value: user.phone },
            { label: "Date of Birth", value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : null },
            { label: "Nationality", value: user.nationality },
            { label: "Occupation", value: user.occupation },
            { label: "Referral Code", value: user.referralCode },
            { label: "Email Verified", value: user.emailVerified ? "Yes" : "No" },
            { label: "2FA Enabled", value: user.twoFactorEnabled ? "Yes" : "No" },
            { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString() },
            { label: "Last Updated", value: new Date(user.updatedAt).toLocaleDateString() },
          ].map((f) =>
            f.value ? (
              <div key={f.label}>
                <p className="text-xs text-body-color dark:text-gray-400">{f.label}</p>
                <p className="text-sm font-medium text-black dark:text-white">{f.value}</p>
              </div>
            ) : null
          )}
        </div>

        {(user.address || user.city || user.country) && (
          <div className="mt-4 border-t border-stroke pt-4 dark:border-gray-700">
            <p className="mb-1 text-xs text-body-color dark:text-gray-400">Address</p>
            <p className="text-sm text-black dark:text-white">
              {[user.address, user.city, user.state, user.postalCode, user.country].filter(Boolean).join(", ")}
            </p>
          </div>
        )}

        {user.bio && (
          <div className="mt-4 border-t border-stroke pt-4 dark:border-gray-700">
            <p className="mb-1 text-xs text-body-color dark:text-gray-400">Bio</p>
            <p className="text-sm text-black dark:text-white">{user.bio}</p>
          </div>
        )}
      </div>

      {/* Recent login sessions */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
        <h3 className="mb-4 text-base font-semibold text-black dark:text-white">
          Recent Logins
          {user.recentSessions.length > 0 && (
            <span className="ml-2 text-xs font-normal text-body-color dark:text-gray-400">
              (last {user.recentSessions.length})
            </span>
          )}
        </h3>
        {user.recentSessions.length > 0 ? (
          <div className="space-y-4">
            {user.recentSessions.map((s, i) => (
              <div
                key={i}
                className={`rounded-xl border border-stroke p-4 dark:border-gray-700 ${i === 0 ? "bg-primary/5 dark:bg-primary/10" : "bg-gray-50 dark:bg-gray-800/40"}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-black dark:text-white">
                    {i === 0 ? "Most Recent" : `Login #${i + 1}`}
                  </span>
                  <span className="text-xs text-body-color dark:text-gray-400">
                    {new Date(s.loginAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "Last Active", value: s.lastActive ? new Date(s.lastActive).toLocaleString() : null },
                    { label: "Device", value: s.device },
                    { label: "Browser", value: s.browser },
                    { label: "OS", value: s.os },
                    { label: "Location", value: s.location },
                    { label: "IP Address", value: s.ipAddress },
                  ].map((f) =>
                    f.value ? (
                      <div key={f.label}>
                        <p className="text-xs text-body-color dark:text-gray-400">{f.label}</p>
                        <p className="text-sm font-medium text-black dark:text-white">{f.value}</p>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-body-color dark:text-gray-400">This user has never logged in.</p>
        )}
      </div>

      {/* Balance modal */}
      {balanceModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h3 className="mb-4 text-lg font-bold text-black dark:text-white">
              {balanceModal === "add" ? "Add Balance" : "Deduct Balance"}
            </h3>
            <p className="mb-4 text-sm text-body-color dark:text-gray-400">
              User: <span className="font-medium text-black dark:text-white">{user.firstName} {user.lastName}</span>
            </p>
            <label className="mb-1 block text-xs font-medium text-black dark:text-white">Amount (USD)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              placeholder="0.00"
              className="mb-3 w-full rounded-lg border border-stroke bg-gray-50 px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <label className="mb-1 block text-xs font-medium text-black dark:text-white">Category</label>
            <select
              value={balanceCategory}
              onChange={(e) => setBalanceCategory(e.target.value)}
              className="mb-3 w-full rounded-lg border border-stroke bg-gray-50 px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="balance">Balance</option>
              <option value="profits">Profits</option>
              <option value="referralCommissions">Referral Commissions</option>
              <option value="bonus">Bonus</option>
            </select>
            <label className="mb-1 block text-xs font-medium text-black dark:text-white">Note (optional)</label>
            <input
              type="text"
              value={balanceNote}
              onChange={(e) => setBalanceNote(e.target.value)}
              placeholder="Reason or description…"
              className="mb-4 w-full rounded-lg border border-stroke bg-gray-50 px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {balanceError && <p className="mb-3 text-xs text-red-500">{balanceError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setBalanceModal(null)}
                className="flex-1 rounded-lg border border-stroke py-2 text-sm font-medium text-black transition hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBalanceSubmit}
                disabled={actionLoading}
                className={`flex-1 rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50 ${balanceModal === "add" ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"}`}
              >
                {actionLoading ? "Processing…" : balanceModal === "add" ? "Add" : "Deduct"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reset User Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-black dark:text-white">Reset User Account</h2>
            </div>
            {!resetResult ? (
              <>
                <p className="mb-2 text-sm text-body-color dark:text-gray-400">
                  This will permanently delete all data for <span className="font-semibold text-black dark:text-white">{user.firstName} {user.lastName}</span>:
                </p>
                <ul className="mb-4 ml-4 list-disc space-y-1 text-sm text-red-600 dark:text-red-400">
                  <li>All transactions</li>
                  <li>All deposit &amp; withdrawal requests</li>
                  <li>All referral relationships</li>
                  <li>All investments in properties</li>
                  <li>Balance reset to $0</li>
                </ul>
                <p className="mb-5 text-xs font-semibold text-red-500">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setResetModal(false)}
                    className="flex-1 rounded-lg border border-stroke py-2 text-sm font-medium text-black transition hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetUser}
                    disabled={resetLoading}
                    className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {resetLoading ? "Resetting…" : "Yes, Reset"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-5 text-sm text-body-color dark:text-gray-400">{resetResult}</p>
                <button
                  onClick={() => setResetModal(false)}
                  className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Assign Referral Modal */}
      {referralModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h2 className="mb-4 text-lg font-bold text-black dark:text-white">Assign Referral</h2>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-black dark:text-white">Referrer Email or Referral Code</label>
              <input
                type="text"
                value={referrerIdentifier}
                onChange={(e) => setReferrerIdentifier(e.target.value)}
                placeholder="e.g. user@example.com or a1b2c3d4"
                className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-black dark:text-white">Reward Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={referralReward}
                onChange={(e) => setReferralReward(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Set to 0 to create the relationship without awarding any bonus.</p>
            </div>
            {referralError && <p className="mb-3 text-sm text-red-500">{referralError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setReferralModal(false)}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-black transition hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignReferral}
                disabled={referralLoading}
                className="flex-1 rounded-lg bg-purple-600 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-60"
              >
                {referralLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
