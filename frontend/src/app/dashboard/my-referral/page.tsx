"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// Types
interface Referral {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  status: "completed" | "pending";
  reward: number;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  completedEarnings: number;
  pendingEarnings: number;
}

interface UserReferralInfo {
  referralCode: string;
  referralLink: string;
}

interface CommissionTx {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
  type: string;
}

// Skeleton Components
const StatCardSkeleton = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-dark">
    <div className="mb-4 h-12 w-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
    <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

const ReferralLinkSkeleton = () => (
  <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:mb-8 md:p-6">
    <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    <div className="mb-4 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    <div className="mb-4 h-12 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
    <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
  </div>
);

const ReferralRowSkeleton = () => (
  <div className="border-b border-stroke p-4 last:border-b-0 dark:border-gray-800">
    <div className="mb-3 flex items-start justify-between">
      <div className="flex-1">
        <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="flex items-center justify-between">
      <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

const MyReferralPage = () => {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Data states
  const [userInfo, setUserInfo] = useState<UserReferralInfo | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Commission history
  const [commissions, setCommissions] = useState<CommissionTx[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(true);

  // Loading states
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  // Error states
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch data in parallel for better performance
        const [userInfoRes, statsRes, referralsRes, commissionsRes] = await Promise.all([
          api.getReferralInfo().finally(() => setLoadingUserInfo(false)),
          api.getReferralStats().finally(() => setLoadingStats(false)),
          api.getReferralList().finally(() => setLoadingReferrals(false)),
          api.getTransactions(50, "referral").finally(() => setLoadingCommissions(false)),
        ]);

        if (userInfoRes.success && userInfoRes.data) {
          setUserInfo(userInfoRes.data);
        }
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        if (referralsRes.success && referralsRes.data) {
          // Ensure data is an array before setting
          const referralData = Array.isArray(referralsRes.data) ? referralsRes.data : [];
          setReferrals(referralData as Referral[]);
        }
        if (commissionsRes.success && Array.isArray(commissionsRes.data)) {
          setCommissions(commissionsRes.data as CommissionTx[]);
        }
      } catch (err) {
        setError("Failed to load referral data. Please try again.");
        setLoadingUserInfo(false);
        setLoadingStats(false);
        setLoadingReferrals(false);
        setLoadingCommissions(false);
      }
    };

    loadData();
  }, []);

  // Refresh data function
  const refreshData = useCallback(async () => {
    setLoadingUserInfo(true);
    setLoadingStats(true);
    setLoadingReferrals(true);
    setLoadingCommissions(true);
    setError(null);
    try {
      const [userInfoRes, statsRes, referralsRes, commissionsRes] = await Promise.all([
        api.getReferralInfo(),
        api.getReferralStats(),
        api.getReferralList(),
        api.getTransactions(50, "referral"),
      ]);
      if (userInfoRes.success && userInfoRes.data) {
        setUserInfo(userInfoRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (referralsRes.success && referralsRes.data) {
        setReferrals(referralsRes.data as Referral[]);
      }
      if (commissionsRes.success && Array.isArray(commissionsRes.data)) {
        setCommissions(commissionsRes.data as CommissionTx[]);
      }
    } catch (err) {
      setError("Failed to refresh data.");
    } finally {
      setLoadingUserInfo(false);
      setLoadingStats(false);
      setLoadingReferrals(false);
      setLoadingCommissions(false);
    }
  }, []);

  const handleCopyLink = async () => {
    if (!userInfo) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(userInfo.referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = userInfo.referralLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          alert("Failed to copy. Please copy manually: " + userInfo.referralLink);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      alert("Failed to copy to clipboard. Please copy the link manually.");
    }
  };

  const handleCopyCode = async () => {
    if (!userInfo) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(userInfo.referralCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = userInfo.referralCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setCodeCopied(true);
          setTimeout(() => setCodeCopied(false), 2000);
        } catch (err) {
          alert("Failed to copy. Please copy manually: " + userInfo.referralCode);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      alert("Failed to copy to clipboard. Please copy the code manually.");
    }
  };

  const handleShare = (platform: string) => {
    if (!userInfo) return;
    const text = "Join Alvarado Associates and start investing today!";
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(userInfo.referralLink);

    const urls: { [key: string]: string } = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      email: `mailto:?subject=${encodedText}&body=Check out this link: ${userInfo.referralLink}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    return status === "completed" ? "active" : status;
  };

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-red-500"
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
          <p className="mb-4 text-lg font-medium text-black dark:text-white">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between md:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">
            My Referrals
          </h1>
          <p className="mt-2 text-sm text-body-color dark:text-body-color-dark md:text-base">
            Invite friends and earn rewards together
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={loadingStats || loadingReferrals}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-black transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          aria-label="Refresh"
        >
          <svg
            className={`h-5 w-5 ${loadingStats || loadingReferrals ? "animate-spin" : ""}`}
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

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 md:mb-8 md:gap-6 lg:grid-cols-3">
        {loadingStats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-dark">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/20">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-1 text-sm font-medium text-body-color dark:text-body-color-dark">
                Total Referrals
              </h3>
              <p className="text-3xl font-bold text-black dark:text-white">
                {stats.totalReferrals ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-dark">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/20">
                <svg
                  className="h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-1 text-sm font-medium text-body-color dark:text-body-color-dark">
                Completed Referrals
              </h3>
              <p className="text-3xl font-bold text-black dark:text-white">
                {stats.completedReferrals ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-dark">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/20">
                <svg
                  className="h-6 w-6 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-1 text-sm font-medium text-body-color dark:text-body-color-dark">
                Total Earnings
              </h3>
              <p className="text-3xl font-bold text-black dark:text-white">
                ${(stats.totalEarnings ?? 0).toLocaleString()}
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* Referral Link Section */}
      {loadingUserInfo ? (
        <ReferralLinkSkeleton />
      ) : userInfo ? (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:mb-8 md:p-6">
          <h3 className="mb-3 text-base font-semibold text-black dark:text-white md:mb-4 md:text-lg">
            Your Referral Link
          </h3>
          <p className="mb-4 text-xs text-body-color dark:text-body-color-dark md:text-sm">
            Share your unique referral link with friends and family to earn rewards
          </p>

          <div className="mb-4 flex flex-col gap-3">
            <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-black/20 md:px-4 md:py-3">
              <p className="overflow-x-auto whitespace-nowrap font-mono text-xs text-black scrollbar-thin dark:text-white md:text-sm">
                {userInfo.referralLink}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 md:text-base"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-black dark:text-white">
              Your Referral Code
            </p>
            <div className="inline-flex flex-col items-start gap-3">
              <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 px-4 py-2">
                <span className="text-lg font-bold text-primary">{userInfo.referralCode}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="rounded-lg border border-primary bg-white px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 dark:bg-gray-800 dark:hover:bg-gray-700 md:text-base"
              >
                {codeCopied ? "Copied!" : "Copy Code"}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <p className="mb-2 text-xs font-semibold text-black dark:text-white md:mb-3 md:text-sm">
              Share via
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleShare("facebook")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 md:gap-2 md:px-4 md:text-sm"
              >
                <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="hidden sm:inline">Facebook</span>
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 md:gap-2 md:px-4 md:text-sm"
              >
                <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                <span className="hidden sm:inline">Twitter</span>
              </button>
              <button
                onClick={() => handleShare("linkedin")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 md:gap-2 md:px-4 md:text-sm"
              >
                <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="hidden sm:inline">LinkedIn</span>
              </button>
              <button
                onClick={() => handleShare("whatsapp")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 md:gap-2 md:px-4 md:text-sm"
              >
                <svg className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              <button
                onClick={() => handleShare("email")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 md:gap-2 md:px-4 md:text-sm"
              >
                <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Email</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* How It Works */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:mb-8 md:p-6">
        <h3 className="mb-3 text-base font-semibold text-black dark:text-white md:mb-4 md:text-lg">
          How It Works
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-bold text-primary">1</span>
            </div>
            <div>
              <h4 className="mb-1 font-semibold text-black dark:text-white">
                Share Your Link
              </h4>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                Share your unique referral link with friends and family
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-bold text-primary">2</span>
            </div>
            <div>
              <h4 className="mb-1 font-semibold text-black dark:text-white">
                They Sign Up
              </h4>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                Your referrals create an account and start investing
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-bold text-primary">3</span>
            </div>
            <div>
              <h4 className="mb-1 font-semibold text-black dark:text-white">
                Earn Rewards
              </h4>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                You both receive rewards when they make their first investment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-dark">
        <div className="border-b border-stroke p-4 dark:border-gray-800 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-black dark:text-white md:text-lg">
              Your Referrals
            </h3>
            {referrals.length > 0 && (
              <span className="text-xs text-body-color dark:text-body-color-dark">
                {referrals.length} total
              </span>
            )}
          </div>
        </div>

        {loadingReferrals ? (
          <div className="block md:hidden">
            <ReferralRowSkeleton />
            <ReferralRowSkeleton />
            <ReferralRowSkeleton />
          </div>
        ) : referrals.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden">
              {referrals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((referral) => (
                <div
                  key={referral.id}
                  className="border-b border-stroke p-4 last:border-b-0 dark:border-gray-800"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="mb-1 font-semibold text-black dark:text-white">
                        {referral.name}
                      </p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">
                        {referral.email}
                      </p>
                    </div>
                    <span
                      className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${getStatusColor(
                        referral.status
                      )}`}
                    >
                      {getStatusLabel(referral.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-body-color dark:text-body-color-dark">
                      {referral.joinedAt
                        ? new Date(referral.joinedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </span>
                    <span className="font-semibold text-black dark:text-white">
                      ${(referral.reward ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              {loadingReferrals ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    ))}
                  </div>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stroke bg-gray-50 dark:border-gray-800 dark:bg-black/20">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-white">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-white">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-white">
                        Joined Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-black dark:text-white">
                        Earnings
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {referrals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((referral) => (
                      <tr
                        key={referral.id}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-black dark:text-white">
                            {referral.name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-body-color dark:text-body-color-dark">
                            {referral.email}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-body-color dark:text-body-color-dark">
                            {referral.joinedAt
                              ? new Date(referral.joinedAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "N/A"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusColor(
                              referral.status
                            )}`}
                          >
                            {getStatusLabel(referral.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-semibold text-black dark:text-white">
                            ${(referral.reward ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {referrals.length > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-stroke px-4 py-4 dark:border-gray-800 md:px-6">
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, referrals.length)} of {referrals.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-black transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-medium text-black dark:text-white">
                    {currentPage} / {Math.ceil(referrals.length / PAGE_SIZE)}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(referrals.length / PAGE_SIZE), p + 1))}
                    disabled={currentPage === Math.ceil(referrals.length / PAGE_SIZE)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-black transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center">
              <svg
                className="mb-3 h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-sm font-medium text-black dark:text-white">
                No referrals yet
              </p>
              <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
                Start sharing your referral link to earn rewards
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Commission History */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-dark md:mt-8">
        <div className="border-b border-stroke p-4 dark:border-gray-800 md:p-6">
          <h3 className="text-base font-semibold text-black dark:text-white md:text-lg">
            Commission History
          </h3>
        </div>

        {loadingCommissions ? (
          <div className="space-y-3 p-4 md:p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : commissions.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {commissions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-4 md:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white line-clamp-1">
                      {tx.description || "Referral commission"}
                    </p>
                    <p className="text-xs text-body-color dark:text-body-color-dark">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className="ml-4 text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                  +${(tx.amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-body-color dark:text-body-color-dark">No commission transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReferralPage;
