"use client";

import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { SearchParamsWrapper } from "./SearchParamsWrapper";

const PAGE_SIZE = 15;

interface TxRow {
  id: string;
  type: string;
  method?: string;
  amount: number;
  status: string;
  date: string;
  description: string;
  reference: string;
  source: "transaction" | "fund_operation";
}

function CustomSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const displayLabel = value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <div ref={ref} className="min-w-0 flex-1">
      <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-black outline-none transition-all hover:border-gray-300 hover:bg-gray-100 focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-700/60"
        >
          <span className="truncate">{displayLabel}</span>
          <svg
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[100] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <ul className="max-h-52 overflow-y-auto py-1">
              {options.map((opt) => {
                const isSelected = value === opt;
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => { onChange(opt); setOpen(false); }}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-primary/8 font-semibold text-primary dark:bg-primary/15 dark:text-primary"
                          : "text-black hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700/50"
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className={isSelected ? "" : "pl-5"}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const FilterSkeleton = () => (
  <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-dark sm:mb-6">
    <div className="p-4 sm:p-5">
      <div className="mb-4 h-11 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 min-w-0">
          <div className="mb-1.5 h-3 w-28 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1.5 h-3 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  </div>
);

const TableRowSkeleton = () => (
  <tr className="border-b border-gray-200 dark:border-gray-800">
    <td className="px-6 py-4"><div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
    <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" /><div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></div></td>
    <td className="px-6 py-4"><div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
    <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
    <td className="px-6 py-4"><div className="ml-auto h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
    <td className="px-6 py-4"><div className="mx-auto h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" /></td>
  </tr>
);

const MobileCardSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-black/20">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div><div className="mb-1 h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /><div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></div>
      </div>
      <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="p-4">
      <div className="mb-3 h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex items-center justify-between">
        <div><div className="mb-1 h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /><div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></div>
        <div className="text-right"><div className="mb-1 h-3 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /><div className="h-6 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></div>
      </div>
    </div>
  </div>
);

function normalizeRows(txList: any[], fundOps: any[]): TxRow[] {
  const rows: TxRow[] = [];

  // Track references already covered by a real transaction record
  const txReferences = new Set<string>();

  for (const tx of txList) {
    const ref = tx.reference || tx.id;
    txReferences.add(ref);
    rows.push({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      status: tx.status || "completed",
      date: tx.createdAt,
      description: tx.description || tx.type.replace(/_/g, " "),
      reference: ref,
      source: "transaction",
    });
  }

  for (const op of fundOps) {
    // Skip fund operations that already have a matching transaction (approved/rejected
    // creates a transaction with the same reference — avoid duplicates)
    if (op.reference && txReferences.has(op.reference)) continue;

    const label = op.type === "deposit" ? "Deposit" : "Withdrawal";
    const methodLabel = op.method ? ` (${op.method.charAt(0).toUpperCase() + op.method.slice(1)})` : "";
    rows.push({
      id: `fo-${op.id}`,
      type: op.type,
      method: op.method,
      amount: op.amount,
      status: op.status,
      date: op.createdAt,
      description: `${label}${methodLabel}`,
      reference: op.reference,
      source: "fund_operation",
    });
  }

  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const VALID_TYPES = ["all", "deposit", "withdrawal", "investment", "transfer", "referral", "profit"];
const VALID_STATUSES = ["all", "completed", "pending", "failed", "processing"];

function TransactionContent() {
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const updateFilters = useCallback((type: string, status: string, q: string) => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      const [txRes, foRes] = await Promise.all([api.getTransactions(), api.getFundOperations()]);
      const txList = txRes.success && txRes.data ? txRes.data : [];
      const foList = foRes.success && foRes.data ? foRes.data : [];
      setRows(normalizeRows(txList, foList));
      setFetchError(null);
    } catch {
      setFetchError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setLoading(true);
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    let list = rows;
    if (selectedFilter !== "all") {
      list = selectedFilter === "transfer"
        ? list.filter((r) => r.type.startsWith("transfer"))
        : list.filter((r) => r.type === selectedFilter);
    }
    if (selectedStatus !== "all") list = list.filter((r) => r.status === selectedStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => r.reference.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.amount.toString().includes(q));
    }
    return list;
  }, [rows, selectedFilter, selectedStatus, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));
  useEffect(() => { setCurrentPage(1); }, [selectedFilter, selectedStatus, searchQuery]);

  const isCredit = (type: string, amount: number) =>
    type.startsWith("admin_")
      ? amount > 0
      : ["deposit", "referral", "profit", "transfer_received"].includes(type);

  const getTypeIcon = (type: string) => {
    if (type === "deposit") return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />;
    if (type === "withdrawal") return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />;
    if (type === "investment") return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />;
    if (type.startsWith("transfer")) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />;
    if (type === "referral") return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />;
    return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
  };

  const getTypeColor = (type: string) => {
    if (type === "deposit") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (type === "withdrawal") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (type === "investment") return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (type.startsWith("transfer")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    if (type === "referral") return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    const dotMap: Record<string, string> = { completed: "bg-green-600", pending: "bg-yellow-600", processing: "bg-blue-600", failed: "bg-red-600" };
    const cls = map[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotMap[status] || "bg-gray-600"}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const formatType = (type: string) => type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (fetchError && !loading && rows.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mb-4 text-lg font-medium text-black dark:text-white">{fetchError}</p>
          <button onClick={handleRefresh} className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Search params synchronization */}
      <Suspense fallback={null}>
        <SearchParamsWrapper
          onParamsChange={(type, status, query) => {
            setSelectedFilter(type);
            setSelectedStatus(status);
            setSearchQuery(query);
          }}
        />
      </Suspense>

      <div className="mb-4 flex items-center justify-between gap-3 md:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-black dark:text-white sm:text-2xl md:text-3xl">Transactions</h1>
          <p className="mt-1 text-xs text-body-color dark:text-body-color-dark sm:text-sm md:text-base">View and manage your transaction history</p>
        </div>
        <button onClick={handleRefresh} disabled={isRefreshing || loading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-black transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 sm:h-10 sm:w-10"
          aria-label="Refresh">
          <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-3 sm:gap-4">
          <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-dark sm:col-span-1 sm:p-4">
            <p className="text-xs text-body-color dark:text-body-color-dark">Total</p>
            <p className="mt-0.5 text-lg font-bold text-black dark:text-white sm:text-2xl">{filtered.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-dark sm:p-4">
            <p className="text-xs text-body-color dark:text-body-color-dark">Credits</p>
            <p className="mt-0.5 text-lg font-bold leading-tight text-green-600 dark:text-green-400 sm:text-2xl">
              ${filtered.filter((r) => isCredit(r.type, r.amount) && ["completed", "approved"].includes(r.status)).reduce((s, r) => s + Math.abs(r.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-dark sm:p-4">
            <p className="text-xs text-body-color dark:text-body-color-dark">Debits</p>
            <p className="mt-0.5 text-lg font-bold leading-tight text-red-600 dark:text-red-400 sm:text-2xl">
              ${filtered.filter((r) => !isCredit(r.type, r.amount) && ["completed", "approved"].includes(r.status)).reduce((s, r) => s + Math.abs(r.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {loading ? <FilterSkeleton /> : (
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-dark sm:mb-6">
          <div className="p-4 sm:p-5">
            {/* Search input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search by reference, description or amount…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); updateFilters(selectedFilter, selectedStatus, e.target.value); }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-black placeholder-gray-400 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-primary dark:focus:bg-gray-800/80"
              />
              <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Dropdowns */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <CustomSelect
                label="Transaction Type"
                value={selectedFilter}
                onChange={(v) => { setSelectedFilter(v); updateFilters(v, selectedStatus, searchQuery); }}
                options={VALID_TYPES}
              />
              <CustomSelect
                label="Status"
                value={selectedStatus}
                onChange={(v) => { setSelectedStatus(v); updateFilters(selectedFilter, v, searchQuery); }}
                options={VALID_STATUSES}
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-black/20">
                    {["Reference", "Type", "Description", "Date", "Amount", "Status"].map((h) => (
                      <th key={h} className={`px-6 py-4 text-xs font-semibold text-black dark:text-white ${h === "Amount" ? "text-right" : h === "Status" ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{[1, 2, 3, 4, 5, 6].map((i) => <TableRowSkeleton key={i} />)}</tbody>
              </table>
            </div>
          </div>
          <div className="space-y-4 lg:hidden">{[1, 2, 3, 4].map((i) => <MobileCardSkeleton key={i} />)}</div>
        </>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-dark">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-semibold text-black dark:text-white">No transactions found</p>
          <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-black/20">
                    {["Reference", "Type", "Description", "Date", "Amount", "Status"].map((h) => (
                      <th key={h} className={`px-6 py-4 text-xs font-semibold text-black dark:text-white ${h === "Amount" ? "text-right" : h === "Status" ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {paginated.map((row) => (
                    <tr key={row.id} onClick={() => { try { sessionStorage.setItem(`tx_${row.id}`, JSON.stringify(row)); } catch {} router.push(`/dashboard/transaction/${row.id}?source=${row.source}`); }} className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4"><span className="font-mono text-sm text-black dark:text-white">{row.reference}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${getTypeColor(row.type)}`}>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{getTypeIcon(row.type)}</svg>
                          </div>
                          <span className="text-sm font-medium text-black dark:text-white">{formatType(row.type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm text-body-color dark:text-body-color-dark">{row.description}</span></td>
                      <td className="px-6 py-4"><span className="text-sm text-body-color dark:text-body-color-dark">{formatDate(row.date)}</span></td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-semibold ${isCredit(row.type, row.amount) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {isCredit(row.type, row.amount) ? "+" : "-"}${Math.abs(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 lg:hidden">
            {paginated.map((row) => (
              <div key={row.id} onClick={() => { try { sessionStorage.setItem(`tx_${row.id}`, JSON.stringify(row)); } catch {} router.push(`/dashboard/transaction/${row.id}?source=${row.source}`); }} className="cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
                {/* Card header: icon + type/date + status badge */}
                <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-black/20 sm:px-4">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${getTypeColor(row.type)}`}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{getTypeIcon(row.type)}</svg>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-black dark:text-white">{formatType(row.type)}</p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">{formatDate(row.date)}</p>
                    </div>
                  </div>
                  <div className="shrink-0">{getStatusBadge(row.status)}</div>
                </div>
                {/* Card body: description + reference + amount */}
                <div className="px-3 py-3 sm:px-4">
                  <p className="mb-3 text-sm text-body-color dark:text-body-color-dark">{row.description}</p>
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-body-color dark:text-body-color-dark">Reference</p>
                      <p className="break-all font-mono text-xs font-medium text-black dark:text-white">{row.reference}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-body-color dark:text-body-color-dark">Amount</p>
                      <p className={`text-base font-bold sm:text-lg ${isCredit(row.type, row.amount) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {isCredit(row.type, row.amount) ? "+" : "-"}${Math.abs(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-body-color dark:text-body-color-dark">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => goToPage(safePage - 1)} disabled={safePage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-black transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (arr[idx - 1] as number) !== p - 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`e-${idx}`} className="flex h-9 w-9 items-center justify-center text-sm text-body-color">…</span>
                    ) : (
                      <button key={item} onClick={() => goToPage(item as number)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${safePage === item ? "bg-primary text-white" : "border border-gray-200 bg-white text-black hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"}`}>
                        {item}
                      </button>
                    )
                  )}
                <button onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-black transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}

export default function TransactionPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-body-color dark:text-body-color-dark">Loading transactions...</p>
        </div>
      </div>
    }>
      <TransactionContent />
    </Suspense>
  );
}
