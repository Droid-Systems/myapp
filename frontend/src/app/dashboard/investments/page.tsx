"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Investment } from "@/types/investment";
import Link from "next/link";
import { api } from "@/lib/api";

interface EnrichedInvestment extends Investment {
  propertyDetails?: {
    title: string;
    images: string[];
    location: string;
    investmentType?: "individual" | "pooled";
    targetAmount?: number;
    currentFunded?: number;
    investorCount?: number;
  };
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<EnrichedInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchInvestmentsWithDetails = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch investments
      const result = await api.getInvestments();
      if (!result.success || !result.data) {
        setError("Failed to load investments");
        if (!isRefresh) setLoading(false);
        return;
      }

      const investmentData = result.data as Investment[];

      // Enrich investments with property details to ensure correct investmentType
      const enrichedInvestments = await Promise.all(
        investmentData.map(async (investment) => {
          // Always fetch property details to get the correct investmentType
          try {
            const propertyResult = await api.getProperty(investment.propertyId);
            if (propertyResult.success && propertyResult.data) {
              const property = propertyResult.data;
              return {
                ...investment,
                propertyTitle: property.title || investment.propertyTitle || "Untitled Property",
                propertyImage: property.images?.[0] || investment.propertyImage || "",
                investmentType: property.investmentType || investment.investmentType, // Use property's type
                propertyDetails: {
                  title: property.title,
                  images: property.images || [],
                  location: property.location || "",
                  investmentType: property.investmentType,
                  targetAmount: property.targetAmount,
                  currentFunded: property.currentFunded,
                  investorCount: property.investorCount,
                },
              };
            }
          } catch (err) {
            console.error(`Failed to fetch property ${investment.propertyId}:`, err);
          }

          // Return investment with fallback values if fetch failed
          return {
            ...investment,
            propertyTitle: investment.propertyTitle || "Property Investment",
            propertyImage: investment.propertyImage || "",
          };
        })
      );

      setInvestments(enrichedInvestments);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to fetch investments:", err);
      setError("Failed to load investments. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchInvestmentsWithDetails();
  }, [fetchInvestmentsWithDetails]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInvestmentsWithDetails(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchInvestmentsWithDetails]);

  const handleManualRefresh = () => {
    fetchInvestmentsWithDetails(true);
  };

  const stats = useMemo(() => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpectedReturns = investments.reduce((sum, inv) => sum + (inv.expectedReturn ?? 0), 0);
    const monthlyIncome = investments.reduce((sum, inv) => sum + inv.monthlyReturn, 0);
    const activeCount = investments.filter((inv) => inv.status === "active").length;

    return {
      totalInvested,
      totalExpectedReturns,
      activeCount,
      monthlyIncome,
    };
  }, [investments]);

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getStatusText = (status: string) => {
    const text = {
      active: "Active",
      completed: "Completed",
      pending: "Pending",
    };
    return text[status as keyof typeof text] || status;
  };

  const formatInvestorCount = (count: number) => {
    return count === 1 ? "1 investor" : `${count} investors`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-body-color dark:text-body-color-dark">Loading investments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mx-auto">
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="mb-4 text-lg font-semibold text-black dark:text-white">{error}</p>
          <button
            onClick={() => fetchInvestmentsWithDetails()}
            className="rounded-lg bg-primary px-6 py-2 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6 md:mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">
              My Investments
            </h1>
            <p className="mt-2 text-sm text-body-color dark:text-body-color-dark md:text-base">
              Track and manage your property investments
            </p>
            {lastUpdate && (
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-dark dark:text-white dark:hover:bg-gray-800"
            title="Refresh investments data"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
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
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {investments.length > 0 ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                Total Invested
              </p>
              <p className="text-3xl font-bold text-black dark:text-white">
                ${stats.totalInvested.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                Expected Returns
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${stats.totalExpectedReturns.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                Active Investments
              </p>
              <p className="text-3xl font-bold text-black dark:text-white">
                {stats.activeCount}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                Monthly Income
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${stats.monthlyIncome.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-gray-dark md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-white">Property</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-white">Type</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-black dark:text-white">Amount</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-black dark:text-white">Monthly Return</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-black dark:text-white">Expected Total</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-black dark:text-white">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-white">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((investment, index) => (
                    <tr
                      key={investment.id}
                      className={`border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 ${
                        index === investments.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {investment.propertyImage || investment.propertyDetails?.images?.[0] ? (
                            <img
                              src={investment.propertyImage || investment.propertyDetails?.images?.[0]}
                              alt={investment.propertyTitle || investment.propertyDetails?.title || "Property"}
                              className="mr-3 h-12 w-12 rounded-lg object-cover"
                              onError={(e) => {
                                // Fallback to placeholder on image error
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`mr-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 ${investment.propertyImage || investment.propertyDetails?.images?.[0] ? 'hidden' : ''}`}>
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/property-market/properties/${investment.propertyId}`}
                              className="font-semibold text-black hover:text-primary dark:text-white dark:hover:text-primary"
                            >
                              {investment.propertyTitle || investment.propertyDetails?.title || "Property Investment"}
                            </Link>
                            {investment.propertyDetails?.location && (
                              <p className="text-xs text-body-color dark:text-body-color-dark">
                                {investment.propertyDetails.location}
                              </p>
                            )}
                            {(investment.propertyDetails?.investmentType || investment.investmentType) === "pooled" &&
                             investment.propertyDetails?.targetAmount &&
                             investment.propertyDetails?.currentFunded !== undefined && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-body-color dark:text-body-color-dark mb-1">
                                  <span>Funded: ${investment.propertyDetails.currentFunded.toLocaleString()}</span>
                                  <span>{((investment.propertyDetails.currentFunded / investment.propertyDetails.targetAmount) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                  <div
                                    className="h-1.5 rounded-full bg-primary"
                                    style={{ width: `${Math.min((investment.propertyDetails.currentFunded / investment.propertyDetails.targetAmount) * 100, 100)}%` }}
                                  />
                                </div>
                                <div className="mt-1 flex items-center justify-between text-xs text-body-color dark:text-body-color-dark">
                                  <span>{investment.propertyDetails.investorCount !== undefined && formatInvestorCount(investment.propertyDetails.investorCount)}</span>
                                  <span>${(investment.propertyDetails.targetAmount - investment.propertyDetails.currentFunded).toLocaleString()} remaining</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${(investment.propertyDetails?.investmentType || investment.investmentType) === "individual" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"}`}>
                          {(investment.propertyDetails?.investmentType || investment.investmentType) === "individual" ? "Individual" : "Pooled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-black dark:text-white">
                        ${investment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                        ${investment.monthlyReturn.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                        ${investment.expectedTotal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(investment.status)}`}>
                          {getStatusText(investment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-body-color dark:text-body-color-dark">
                        {new Date(investment.investmentDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {investments.map((investment) => (
              <div
                key={investment.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark"
              >
                <div className="mb-3 flex items-start">
                  {investment.propertyImage || investment.propertyDetails?.images?.[0] ? (
                    <img
                      src={investment.propertyImage || investment.propertyDetails?.images?.[0]}
                      alt={investment.propertyTitle || investment.propertyDetails?.title || "Property"}
                      className="mr-3 h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`mr-3 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 ${investment.propertyImage || investment.propertyDetails?.images?.[0] ? 'hidden' : ''}`}>
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/property-market/properties/${investment.propertyId}`}
                      className="block font-semibold text-black hover:text-primary dark:text-white"
                    >
                      {investment.propertyTitle || investment.propertyDetails?.title || "Property Investment"}
                    </Link>
                    {investment.propertyDetails?.location && (
                      <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                        {investment.propertyDetails.location}
                      </p>
                    )}
                  </div>
                </div>

                {(investment.propertyDetails?.investmentType || investment.investmentType) === "pooled" &&
                 investment.propertyDetails?.targetAmount &&
                 investment.propertyDetails?.currentFunded !== undefined && (
                  <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="mb-2 flex items-center justify-between text-xs text-body-color dark:text-body-color-dark">
                      <span className="font-medium">Pool Progress</span>
                      <span className="font-semibold">{((investment.propertyDetails.currentFunded / investment.propertyDetails.targetAmount) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.min((investment.propertyDetails.currentFunded / investment.propertyDetails.targetAmount) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-body-color dark:text-body-color-dark">Funded:</span>
                        <span className="ml-1 font-semibold text-black dark:text-white">${investment.propertyDetails.currentFunded.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-body-color dark:text-body-color-dark">Target:</span>
                        <span className="ml-1 font-semibold text-black dark:text-white">${investment.propertyDetails.targetAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        {investment.propertyDetails.investorCount !== undefined && (
                          <span className="text-body-color dark:text-body-color-dark">{formatInvestorCount(investment.propertyDetails.investorCount)}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-body-color dark:text-body-color-dark">${(investment.propertyDetails.targetAmount - investment.propertyDetails.currentFunded).toLocaleString()} remaining</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Type</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${(investment.propertyDetails?.investmentType || investment.investmentType) === "individual" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"}`}>
                      {(investment.propertyDetails?.investmentType || investment.investmentType) === "individual" ? "Individual" : "Pooled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Amount</span>
                    <span className="font-semibold text-black dark:text-white">${investment.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Monthly Return</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">${investment.monthlyReturn.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Expected Total</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">${investment.expectedTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Status</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadge(investment.status)}`}>
                      {getStatusText(investment.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Date</span>
                    <span className="text-sm text-body-color dark:text-body-color-dark">
                      {new Date(investment.investmentDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow dark:border-gray-800 dark:bg-gray-dark">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="mb-2 text-lg font-semibold text-black dark:text-white">
            No Investments Yet
          </p>
          <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
            Start your investment journey by browsing our curated property listings
          </p>
          <Link
            href="/dashboard/property-market/properties"
            className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Browse Properties
          </Link>
        </div>
      )}
    </div>
  );
}
