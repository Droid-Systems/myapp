"use client";

import { useState, useEffect } from "react";
import Popup from "@/components/Popup";

interface TransferDetails {
  email: string;
  amount: string;
  note: string;
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

const TransferPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([]);
  const [transferDetails, setTransferDetails] = useState<TransferDetails>({
    email: "",
    amount: "",
    note: "",
  });

  // Fetch balance and transfer history on mount
  useEffect(() => {
    fetchTransferData();
  }, []);

  const fetchTransferData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/transfer");
      const data = await response.json();

      if (data.success) {
        setAvailableBalance(data.data.balance);
        setRecentTransfers(data.data.transfers);
      } else {
        setToastMessage(data.message || "Failed to load transfer data");
        setToastType("error");
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage("Failed to connect to server");
      setToastType("error");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!transferDetails.email || !transferDetails.amount) {
      setToastMessage("Please fill in all required fields");
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
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail: transferDetails.email,
          amount: amount,
          note: transferDetails.note,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update balance and transfers
        setAvailableBalance(data.data.newBalance);
        setRecentTransfers((prev) => [data.data.transfer, ...prev]);

        // Show success toast
        setToastMessage(data.message);
        setToastType("success");
        setShowToast(true);

        // Reset form
        setTransferDetails({
          email: "",
          amount: "",
          note: "",
        });
      } else {
        setToastMessage(data.message || "Transfer failed");
        setToastType("error");
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage("Failed to process transfer");
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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-body-color dark:text-body-color-dark">Loading transfer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">
          New Transfer
        </h1>
        <p className="mt-2 text-sm text-body-color dark:text-body-color-dark md:text-base">
          Send money to other users instantly via email
        </p>
      </div>

      {/* Available Balance */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-gradient-to-br from-primary/5 to-primary/10 p-4 dark:border-gray-800 dark:from-primary/10 dark:to-primary/20 md:mb-8 md:p-6">
        <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">
          Available Balance
        </p>
        <p className="text-3xl font-bold text-black dark:text-white md:text-4xl">
          ${availableBalance.toLocaleString()}
        </p>
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
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
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
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
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
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Add an optional message for the recipient
              </p>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
                Transfer Information:
              </h3>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Instant transfer - funds available immediately
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  No transfer fees
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Recipient will be notified via email
                </li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
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
            onClick={fetchTransferData}
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
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
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
                    <div>
                      <p className="font-semibold text-black dark:text-white">
                        {transfer.recipientName}
                      </p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">
                        {transfer.recipientEmail}
                      </p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">
                        {formatDate(transfer.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      -${transfer.amount.toLocaleString()}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(transfer.status)}`}
                    >
                      {transfer.status}
                    </span>
                    {transfer.note && (
                      <p className="mt-1 max-w-[150px] truncate text-xs text-body-color dark:text-body-color-dark">
                        {transfer.note}
                      </p>
                    )}
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

export default TransferPage;
