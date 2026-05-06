"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Popup from "@/components/Popup";
import { api } from "@/lib/api";

interface TransferDetails {
  email: string;
  amount: string;
  note: string;
  twoFactorCode: string;
}

interface AuthorizationStatus {
  canTransfer: boolean;
  twoFactorEnabled: boolean;
  kycVerified: boolean;
  kycStatus: string;
  reasons: string[];
}

interface Transfer {
  id: string;
  recipientEmail: string;
  recipientName: string;
  amount: number;
  note: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
}

const MoneyTransferPage = () => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([]);
  const [authStatus, setAuthStatus] = useState<AuthorizationStatus | null>(null);
  const [transferDetails, setTransferDetails] = useState<TransferDetails>({
    email: "",
    amount: "",
    note: "",
    twoFactorCode: "",
  });

  // Fetch authorization status, balance, and transfer history on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Check authorization status (2FA + KYC)
      const authResult = await api.getTransferAuthorizationStatus();
      if (authResult.success && authResult.data) {
        setAuthStatus(authResult.data);
      }

      // Fetch balance from the balance summary endpoint
      const balanceResult = await api.getBalanceSummary();
      if (balanceResult.success && balanceResult.data) {
        setAvailableBalance(balanceResult.data.balance);
      }

      // Fetch transfer data
      const transferDataResult = await api.getTransferData();
      if (transferDataResult.success && transferDataResult.data) {
        setRecentTransfers(transferDataResult.data.transfers || []);
      }
    } catch (error: any) {
      console.error("Data fetch error:", error);
      setToastMessage(error.response?.data?.message || "Failed to load data");
      setToastType("error");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authorization first
    if (!authStatus?.canTransfer) {
      setToastMessage("You must enable 2FA and complete KYC verification to transfer money");
      setToastType("error");
      setShowToast(true);
      return;
    }

    // Validation
    if (!transferDetails.email || !transferDetails.amount || !transferDetails.twoFactorCode) {
      setToastMessage("Please fill in all required fields including 2FA code");
      setToastType("error");
      setShowToast(true);
      return;
    }

    const amount = parseFloat(transferDetails.amount);
    if (amount <= 0) {
      setToastMessage("Amount must be greater than 0");
      setToastType("error");
      setShowToast(true);
      return;
    }

    if (amount > availableBalance) {
      setToastMessage("Insufficient balance");
      setToastType("error");
      setShowToast(true);
      return;
    }

    setIsProcessing(true);

    try {
      const result = await api.createTransfer({
        recipientEmail: transferDetails.email,
        amount: amount,
        note: transferDetails.note,
        twoFactorCode: transferDetails.twoFactorCode,
      });

      if (result.success && result.data) {
        // Update balance and transfers
        setAvailableBalance(result.data.balance);

        // Refresh transfer list
        await fetchData();

        // Show success toast
        setToastMessage(
          result.data.recipientExists
            ? "Transfer completed successfully! Recipient has been notified."
            : "Transfer initiated. Recipient will receive funds when they create an account."
        );
        setToastType("success");
        setShowToast(true);

        // Reset form
        setTransferDetails({
          email: "",
          amount: "",
          note: "",
          twoFactorCode: "",
        });
      } else {
        setToastMessage(result.message || "Transfer failed");
        setToastType("error");
        setShowToast(true);
      }
    } catch (error: any) {
      console.error("Transfer error:", error);

      let errorMessage = "Failed to process transfer. Please try again later.";

      if (error.response?.status === 401) {
        errorMessage = "Invalid 2FA code. Please try again.";
      } else if (error.response?.status === 403) {
        errorMessage = error.response.data.message || "You are not authorized to make transfers. Please enable 2FA and complete KYC verification.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setToastMessage(errorMessage);
      setToastType("error");
      setShowToast(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
      case "pending":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
      case "failed":
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        {/* Header Skeleton */}
        <div className="mb-6 md:mb-8">
          <div className="mb-2 h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700 md:h-9"></div>
          <div className="h-4 w-72 animate-pulse rounded bg-gray-200 dark:bg-gray-700 md:h-5"></div>
        </div>

        {/* Balance and Statistics Skeleton */}
        <div className="mb-6 flex flex-col gap-6 md:mb-8 lg:flex-row lg:items-stretch">
          <div className="flex flex-1 flex-col gap-6">
            {/* Available Balance Skeleton */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-primary/5 to-primary/10 p-4 dark:border-gray-800 dark:from-primary/10 dark:to-primary/20 md:p-5">
              <div className="mb-2 h-3 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
              <div className="h-8 w-40 animate-pulse rounded bg-gray-300 dark:bg-gray-600 md:h-9"></div>
            </div>

            {/* Transfer Statistics Skeleton */}
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-dark md:p-4">
              <div className="mb-3 h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Form Skeleton */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:p-6">
            <div className="space-y-4">
              {/* Email Field Skeleton */}
              <div>
                <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* Amount Field Skeleton */}
              <div>
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* Note Field Skeleton */}
              <div>
                <div className="mb-2 h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-24 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* 2FA Field Skeleton */}
              <div>
                <div className="mb-2 h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* Button Skeleton */}
              <div className="h-12 w-full animate-pulse rounded-lg bg-gray-300 dark:bg-gray-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">
          Transfer Money
        </h1>
        <p className="mt-2 text-sm text-body-color dark:text-body-color-dark md:text-base">
          Send money to other users instantly via email
        </p>
      </div>

      {/* Grid Container for Warning and Balance/Statistics Column */}
      <div className="mb-6 flex flex-col gap-6 md:mb-8 lg:flex-row lg:items-stretch">
        {/* Authorization Warning */}
        {authStatus && !authStatus.canTransfer && (
          <div className="flex flex-col rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20 md:p-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="mb-2 font-semibold text-red-900 dark:text-red-300">
                  Transfer Access Restricted
                </h3>
                <p className="mb-3 text-sm text-red-800 dark:text-red-400">
                  You need to complete the following requirements before you can transfer money:
                </p>
                <ul className="mb-4 space-y-1 text-sm text-red-800 dark:text-red-400">
                  {authStatus.reasons.map((reason, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {reason}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push("/dashboard/security")}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  Go to Security Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Balance and Statistics Column */}
        <div className="flex flex-1 flex-col gap-6 lg:justify-between">
          {/* Available Balance */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-primary/5 to-primary/10 p-4 dark:border-gray-800 dark:from-primary/10 dark:to-primary/20 md:p-5">
            <p className="mb-1 text-xs text-body-color dark:text-body-color-dark">
              Available Balance
            </p>
            <p className="text-2xl font-bold text-black dark:text-white md:text-3xl">
              ${availableBalance.toLocaleString()}
            </p>
          </div>

          {/* Transfer Statistics */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-dark md:p-4">
            <p className="mb-2 text-xs font-medium text-body-color dark:text-body-color-dark">
              Transfer Statistics
            </p>
            <div className="space-y-1.5">
              {/* Total Sent */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <svg className="h-3 w-3 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="text-[11px] text-body-color dark:text-body-color-dark">Sent</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">
                    ${recentTransfers.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700"></div>

              {/* Total Received */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <svg className="h-3 w-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  <span className="text-[11px] text-body-color dark:text-body-color-dark">Received</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">
                    $0
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Form */}
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:p-6">
          <div className="space-y-4">
            {/* Recipient Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Recipient Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={transferDetails.email}
                onChange={(e) => setTransferDetails({ ...transferDetails, email: e.target.value })}
                placeholder="recipient@example.com"
                disabled={!authStatus?.canTransfer}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Enter the email address of the recipient
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Amount ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0.01"
                max={availableBalance}
                step="0.01"
                value={transferDetails.amount}
                onChange={(e) => setTransferDetails({ ...transferDetails, amount: e.target.value })}
                placeholder="0.00"
                disabled={!authStatus?.canTransfer}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Available: ${availableBalance.toLocaleString()}
              </p>
            </div>

            {/* Note (Optional) */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Note (Optional)
              </label>
              <textarea
                value={transferDetails.note}
                onChange={(e) => setTransferDetails({ ...transferDetails, note: e.target.value })}
                placeholder="Add a note for the recipient..."
                rows={3}
                disabled={!authStatus?.canTransfer}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Add an optional message for the recipient
              </p>
            </div>

            {/* 2FA Code */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Two-Factor Authentication Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="\d{6}"
                value={transferDetails.twoFactorCode}
                onChange={(e) => setTransferDetails({ ...transferDetails, twoFactorCode: e.target.value.replace(/\D/g, "") })}
                placeholder="000000"
                disabled={!authStatus?.canTransfer}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-2xl font-mono tracking-widest text-black outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {/* Security Info Box */}
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
                🔒 Secure Transfer
              </h3>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  2FA verification required for every transfer
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  KYC verification ensures compliance
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Instant transfer - no fees
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email notifications to both parties
                </li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || !authStatus?.canTransfer}
            className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? "Processing Transfer..." : "Transfer Money"}
          </button>
        </div>
      </form>

      {/* Recent Transfers */}
      <div className="mx-auto mt-8 max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black dark:text-white">
            Recent Transfers
          </h2>
          <button
            onClick={fetchData}
            className="text-sm text-primary hover:underline"
          >
            Refresh
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
          {recentTransfers.length === 0 ? (
            <div className="p-6 text-center">
              <svg
                className="mx-auto mb-3 h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                No recent transfers
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentTransfers.slice(0, 5).map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-black dark:text-white">
                        {transfer.recipientEmail}
                      </p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">
                        {formatDate(transfer.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start">
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        -${transfer.amount.toLocaleString()}
                      </p>
                      {transfer.note && (
                        <p className="mt-1 max-w-[200px] truncate text-xs text-body-color dark:text-body-color-dark sm:max-w-[150px]">
                          {transfer.note}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(transfer.status)}`}
                    >
                      {transfer.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popup Notification */}
      {showToast && (
        <Popup
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default MoneyTransferPage;
