"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { InvestmentProperty } from "@/types/investment";
import PropertyCard from "@/components/PropertyCard";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import StatCardSkeleton from "@/components/StatCardSkeleton";
import { api } from "@/lib/api";

function CustomSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-left text-sm text-black transition-colors hover:border-gray-300 focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      >
        <span>{selected?.label}</span>
        <svg className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="absolute left-0 right-0 z-[100] mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  value === opt.value ? "font-medium text-primary" : "text-black dark:text-white"
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && (
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<InvestmentProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({ totalInvested: 0, activeInvestments: 0 });
  const [filters, setFilters] = useState({
    category: "all",
    type: "all",
    status: "all",
    search: "",
  });

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      try {
        const result = await api.getProperties({
          category: filters.category !== "all" ? filters.category : undefined,
          investmentType: filters.type !== "all" ? filters.type : undefined,
          status: filters.status !== "all" ? filters.status : undefined,
          search: filters.search || undefined,
        });
        if (result.success && result.data) {
          setProperties(result.data as InvestmentProperty[]);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
  }, [filters]);

  useEffect(() => {
    api.getInvestments().then((result) => {
      if (result.success && result.data) {
        const invested = result.data.reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const active = result.data.filter((inv: any) => inv.status === "active").length;
        setUserStats({ totalInvested: invested, activeInvestments: active });
      }
    }).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const available = properties.filter((p) => p.status === "available");
    const avgROI =
      available.length > 0
        ? available.reduce((sum, p) => sum + p.expectedROI, 0) / available.length
        : 0;
    return {
      totalProperties: properties.length,
      avgROI: avgROI.toFixed(1),
      totalInvested: userStats.totalInvested,
      activeInvestments: userStats.activeInvestments,
    };
  }, [properties, userStats]);

  return (
    <div className="min-h-screen">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">
          Investment Properties
        </h1>
        <p className="mt-2 text-sm text-body-color dark:text-body-color-dark md:text-base">
          Browse our curated selection of high-yield investment opportunities
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">Total Properties</p>
              <p className="text-3xl font-bold text-black dark:text-white">{stats.totalProperties}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">Average ROI</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.avgROI}%</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">Total Invested</p>
              <p className="text-3xl font-bold text-black dark:text-white">${stats.totalInvested.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">Active Investments</p>
              <p className="text-3xl font-bold text-black dark:text-white">{stats.activeInvestments}</p>
            </div>
          </>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-dark">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Category</label>
            <CustomSelect
              value={filters.category}
              onChange={(v) => setFilters({ ...filters, category: v })}
              options={[
                { value: "all", label: "All Categories" },
                { value: "airbnb_arbitrage", label: "Airbnb Arbitrage" },
                { value: "airbnb_mortgage", label: "Airbnb Mortgage" },
                { value: "for_sale", label: "For Sale" },
              ]}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Investment Type</label>
            <CustomSelect
              value={filters.type}
              onChange={(v) => setFilters({ ...filters, type: v })}
              options={[
                { value: "all", label: "All Types" },
                { value: "individual", label: "Individual" },
                { value: "pooled", label: "Pooled" },
              ]}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Status</label>
            <CustomSelect
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
              options={[
                { value: "all", label: "All Status" },
                { value: "available", label: "Available" },
                { value: "fully-funded", label: "Fully Funded" },
                { value: "coming-soon", label: "Coming Soon" },
              ]}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search properties..."
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-black outline-none transition-colors hover:border-gray-300 focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </div>
      ) : properties.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow dark:border-gray-800 dark:bg-gray-dark">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-lg font-semibold text-black dark:text-white">No properties found</p>
          <p className="mt-2 text-sm text-body-color dark:text-body-color-dark">
            Try adjusting your filters or search criteria
          </p>
        </div>
      )}
    </div>
  );
}
