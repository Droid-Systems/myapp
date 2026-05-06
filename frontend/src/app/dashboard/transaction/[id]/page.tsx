"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "investment" | "transfer" | "referral" | "profit" | "admin_bonus" | "transfer_received" | "transfer_sent";
  amount: number;
  status: "completed" | "pending" | "failed";
  date: string;
  description: string;
  reference: string;
}

interface TimelineEvent {
  label: string;
  time: string;
  completed: boolean;
}

// --- Fetch with sessionStorage primary, API fallback ---

const fetchTransactionById = async (id: string, source: string): Promise<Transaction | null> => {
  // Primary: read from sessionStorage (set by list page on click)
  try {
    const cached = sessionStorage.getItem(`tx_${id}`);
    if (cached) {
      const row = JSON.parse(cached);
      return {
        id: row.id,
        type: row.type,
        amount: row.amount,
        status: row.status,
        date: row.date,
        description: row.description || "",
        reference: row.reference || row.id,
      };
    }
  } catch {}

  // Fallback: API call (strip fo- prefix for fund operations)
  try {
    const rawId = source === "fund_operation" && id.startsWith("fo-") ? id.slice(3) : id;
    let result;
    if (source === "fund_operation") {
      result = await api.getFundOperationById(rawId);
    } else {
      result = await api.getTransactionById(rawId);
    }
    if (!result.success || !result.data) return null;
    const d = result.data;
    return {
      id: d.id || id,
      type: d.type,
      amount: d.amount,
      status: d.status,
      date: d.createdAt || d.date,
      description: d.description || d.notes || "",
      reference: d.reference || d.id || id,
    };
  } catch {
    return null;
  }
};

// --- Skeleton ---

const DetailSkeleton = () => (
  <div className="min-h-screen">
    {/* Back button skeleton */}
    <div className="mb-6 h-10 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />

    {/* Header skeleton */}
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark md:p-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div>
            <div className="mb-2 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="h-8 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mt-6 h-12 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>

    {/* Details skeleton */}
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark md:p-8">
      <div className="mb-6 h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="grid gap-6 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i}>
            <div className="mb-2 h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>

    {/* Timeline skeleton */}
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark md:p-8">
      <div className="mb-6 h-6 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div>
              <div className="mb-1 h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- Helpers ---

const getTypeIcon = (type: string) => {
  switch (type) {
    case "deposit":
      return (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    case "withdrawal":
      return (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "investment":
      return (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case "transfer":
      return (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case "referral":
      return (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    default:
      return null;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "deposit":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "withdrawal":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "investment":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "transfer":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "referral":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
          <span className="h-2 w-2 rounded-full bg-green-600"></span>
          Completed
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-semibold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <span className="h-2 w-2 rounded-full bg-yellow-600"></span>
          Pending
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-800 dark:bg-red-900 dark:text-red-200">
          <span className="h-2 w-2 rounded-full bg-red-600"></span>
          Failed
        </span>
      );
    default:
      return null;
  }
};

const getTimeline = (transaction: Transaction): TimelineEvent[] => {
  const createdDate = new Date(transaction.date);
  const formatTime = (d: Date) =>
    d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const processingDate = new Date(createdDate.getTime() + 5 * 60 * 1000);
  const completedDate = new Date(createdDate.getTime() + 30 * 60 * 1000);

  if (transaction.status === "failed") {
    return [
      { label: "Transaction created", time: formatTime(createdDate), completed: true },
      { label: "Processing", time: formatTime(processingDate), completed: true },
      { label: "Transaction failed", time: formatTime(completedDate), completed: true },
    ];
  }

  if (transaction.status === "pending") {
    return [
      { label: "Transaction created", time: formatTime(createdDate), completed: true },
      { label: "Processing", time: "In progress...", completed: false },
      { label: "Awaiting confirmation", time: "Pending", completed: false },
    ];
  }

  return [
    { label: "Transaction created", time: formatTime(createdDate), completed: true },
    { label: "Processing", time: formatTime(processingDate), completed: true },
    { label: "Transaction completed", time: formatTime(completedDate), completed: true },
  ];
};

// --- Page ---

export default function TransactionDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <TransactionDetailInner />
    </Suspense>
  );
}

function TransactionDetailInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "transaction";
  const from = searchParams.get("from");

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransaction = useCallback(async () => {
    try {
      const data = await fetchTransactionById(params.id as string, source);
      if (!data) {
        setError("Transaction not found.");
      } else {
        setTransaction(data);
        setError(null);
      }
    } catch {
      setError("Failed to load transaction details.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [params.id, source]);

  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setLoading(true);
    loadTransaction();
  }, [loadTransaction]);

  const backHref = from === "dashboard" ? "/dashboard/overview" : "/dashboard/transaction";
  const backLabel = from === "dashboard" ? "Back to Dashboard" : "Back to Transactions";

  const handleBack = useCallback(() => {
    router.push(backHref);
  }, [router, backHref]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen">
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-body-color transition-colors hover:text-primary dark:text-body-color-dark"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </button>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto mb-4 h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="mb-4 text-lg font-medium text-black dark:text-white">
              {error || "Transaction not found"}
            </p>
            <button
              onClick={handleBack}
              className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90"
            >
              {backLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timeline = getTimeline(transaction);
  const isCredit = transaction.type === "admin_bonus"
    ? transaction.amount > 0
    : ["deposit", "referral", "profit", "transfer_received"].includes(transaction.type);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="min-h-screen">
      {/* Header Row */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-medium text-body-color transition-colors hover:text-primary dark:text-body-color-dark"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </button>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-black transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          aria-label="Refresh"
        >
          <svg
            className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Header Card */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${getTypeColor(transaction.type)}`}>
              {getTypeIcon(transaction.type)}
            </div>
            <div>
              <h1 className="text-xl font-bold capitalize text-black dark:text-white md:text-2xl">
                {transaction.type}
              </h1>
              <p className="mt-0.5 font-mono text-sm text-body-color dark:text-body-color-dark">
                {transaction.reference}
              </p>
            </div>
          </div>
          {getStatusBadge(transaction.status)}
        </div>

        {/* Amount */}
        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
          <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">Amount</p>
          <p className={`text-4xl font-bold ${isCredit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {isCredit ? "+" : "-"}${Math.abs(transaction.amount).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Details Card */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:p-8">
        <h2 className="mb-6 text-lg font-semibold text-black dark:text-white">
          Transaction Details
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">
              Description
            </p>
            <p className="text-sm font-medium text-black dark:text-white">
              {transaction.description}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">
              Date
            </p>
            <p className="text-sm font-medium text-black dark:text-white">
              {formatDate(transaction.date)}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">
              Reference
            </p>
            <p className="font-mono text-sm font-medium text-black dark:text-white">
              {transaction.reference}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">
              Type
            </p>
            <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold capitalize ${getTypeColor(transaction.type)}`}>
              {transaction.type}
            </span>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">
              Status
            </p>
            {getStatusBadge(transaction.status)}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-body-color dark:text-body-color-dark">
              Transaction ID
            </p>
            <p className="font-mono text-sm font-medium text-black dark:text-white">
              {transaction.id}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:p-8">
        <h2 className="mb-6 text-lg font-semibold text-black dark:text-white">
          Activity
        </h2>
        <div className="space-y-0">
          {timeline.map((event, index) => {
            const isLast = index === timeline.length - 1;
            const isFailed = transaction.status === "failed" && isLast;

            return (
              <div key={index} className="flex gap-4">
                {/* Dot + Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      isFailed
                        ? "bg-red-100 dark:bg-red-900/30"
                        : event.completed
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    {isFailed ? (
                      <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : event.completed ? (
                      <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`h-8 w-0.5 ${event.completed ? "bg-green-200 dark:bg-green-800" : "bg-gray-200 dark:bg-gray-700"}`} />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                  <p className={`text-sm font-medium ${isFailed ? "text-red-600 dark:text-red-400" : "text-black dark:text-white"}`}>
                    {event.label}
                  </p>
                  <p className="text-xs text-body-color dark:text-body-color-dark">
                    {event.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
