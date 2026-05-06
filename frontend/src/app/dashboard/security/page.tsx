"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const SecuritySettingsPage = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [require2FALogin, setRequire2FALogin] = useState(false);
  const [require2FALoading, setRequire2FALoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<"not_started" | "in_progress" | "documents_uploaded" | "pending_review" | "verified" | "rejected" | null>(null);
  const [kycCurrentStep, setKycCurrentStep] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user profile for 2FA status
        const profileResponse = await api.getProfile();
        if (profileResponse.success && profileResponse.data) {
          setTwoFactorEnabled(profileResponse.data.twoFactorEnabled || false);
          setRequire2FALogin(profileResponse.data.requireTwoFactorLogin || false);
          // Use KYC status from profile as fallback
          if (profileResponse.data.kycStatus) {
            setKycStatus(profileResponse.data.kycStatus);
          }
        }

        // Fetch detailed KYC status
        try {
          const kycResponse = await api.getKYCStatus();
          if (kycResponse.success && kycResponse.data && kycResponse.data.kyc) {
            // Map backend status to frontend status
            const backendStatus = kycResponse.data.kyc.status;
            const statusMap: Record<string, typeof kycStatus> = {
              "not_submitted": "not_started",
              "pending": "pending_review",
              "approved": "verified",
              "rejected": "rejected"
            };
            setKycStatus(statusMap[backendStatus] || "not_started");
          }
        } catch (kycError) {
          console.log("KYC API not available, checking localStorage");
          // Fallback to localStorage
          const savedProgress = localStorage.getItem("kycProgress");
          if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            setKycStatus(progress.status || "not_started");
            setKycCurrentStep(progress.step || null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Poll for KYC status updates every 5 seconds
  useEffect(() => {
    const pollKYCStatus = async () => {
      try {
        const kycResponse = await api.getKYCStatus();
        if (kycResponse.success && kycResponse.data && kycResponse.data.kyc) {
          // Map backend status to frontend status
          const backendStatus = kycResponse.data.kyc.status;
          const statusMap: Record<string, typeof kycStatus> = {
            "not_submitted": "not_started",
            "pending": "pending_review",
            "approved": "verified",
            "rejected": "rejected"
          };
          const newStatus = statusMap[backendStatus] || "not_started";

          if (newStatus !== kycStatus) {
            console.log("🔄 Security page KYC status updated:", kycStatus, "→", newStatus);
            setKycStatus(newStatus);
          }
        }
      } catch (error) {
        // Silently fail - polling will retry
      }
    };

    const pollInterval = setInterval(pollKYCStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [kycStatus]); // Re-run when KYC status changes

  const handleRequire2FAToggle = async () => {
    if (!twoFactorEnabled) return;
    setRequire2FALoading(true);
    try {
      const newValue = !require2FALogin;
      await api.setRequire2FALogin(newValue);
      setRequire2FALogin(newValue);
    } catch (error) {
      console.error("Failed to update require 2FA setting:", error);
    } finally {
      setRequire2FALoading(false);
    }
  };

  // Helper function to get KYC badge details
  const getKYCBadgeDetails = () => {
    switch (kycStatus) {
      case "verified":
        return {
          statusText: "✓ Verified",
          statusColor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          buttonText: "View KYC Details",
        };
      case "rejected":
        return {
          statusText: "✗ Rejected",
          statusColor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          buttonText: "Resubmit KYC",
        };
      case "pending_review":
        return {
          statusText: "⏳ Pending Review",
          statusColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
          buttonText: "Check Status",
        };
      case "documents_uploaded":
        return {
          statusText: "📄 Documents Ready",
          statusColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
          buttonText: "Review & Submit",
        };
      case "in_progress":
        const stepText = kycCurrentStep ? ` (Step ${kycCurrentStep}/5)` : "";
        return {
          statusText: `⚡ In Progress${stepText}`,
          statusColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
          buttonText: "Continue KYC",
        };
      case "not_started":
      default:
        return {
          statusText: "Not Started",
          statusColor: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
          buttonText: "Start KYC Verification",
        };
    }
  };

  const kycBadge = getKYCBadgeDetails();

  const securityFeatures = [
    {
      title: "Two-Factor Authentication (2FA)",
      description: "Add an extra layer of security to your account by enabling two-factor authentication.",
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      status: twoFactorEnabled ? "enabled" : "disabled",
      statusText: twoFactorEnabled ? "Enabled" : "Disabled",
      statusColor: twoFactorEnabled
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      link: twoFactorEnabled ? "/dashboard/security/manage-2fa" : "/dashboard/security/setup-2fa",
      buttonText: twoFactorEnabled ? "Manage 2FA" : "Setup 2FA",
    },
    {
      title: "KYC Verification",
      description: "Complete your Know Your Customer (KYC) verification to unlock all features and increase your account limits.",
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      status: kycStatus,
      statusText: kycBadge.statusText,
      statusColor: kycBadge.statusColor,
      link: "/dashboard/security/kyc",
      buttonText: kycBadge.buttonText,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Security Settings
        </h1>
        <p className="mt-2 text-body-color dark:text-body-color-dark">
          Manage your account security and verification settings
        </p>
      </div>

      {/* Security Overview Cards */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        {securityFeatures.map((feature, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-dark"
          >
            <div className="p-6">
              {/* Icon and Status */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
                  {feature.icon}
                </div>
                {loading ? (
                  <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                ) : (
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${feature.statusColor}`}
                  >
                    {feature.statusText}
                  </span>
                )}
              </div>

              {/* Title and Description */}
              <h3 className="mb-2 text-xl font-semibold text-black dark:text-white">
                {feature.title}
              </h3>
              <p className="mb-4 text-sm text-body-color dark:text-body-color-dark">
                {feature.description}
              </p>

              {/* KYC Progress Bar (only for KYC when in progress) */}
              {feature.title === "KYC Verification" && kycStatus === "in_progress" && kycCurrentStep && (
                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-body-color dark:text-body-color-dark">Progress</span>
                    <span className="font-semibold text-primary">{Math.round((kycCurrentStep / 5) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                      style={{ width: `${(kycCurrentStep / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Link
                href={feature.link}
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-primary/90"
              >
                {feature.buttonText}
                <svg
                  className="ml-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Require 2FA to Login Toggle */}
      <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-dark">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white">
                  Require 2FA to Login
                </h3>
                <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
                  {twoFactorEnabled
                    ? "Require two-factor authentication every time you sign in."
                    : "You must enable 2FA before turning on this setting."}
                </p>
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={handleRequire2FAToggle}
              disabled={!twoFactorEnabled || require2FALoading}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
                require2FALogin ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
              }`}
              aria-label="Toggle require 2FA to login"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  require2FALogin ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security Tips */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
          Security Tips
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-3 w-3 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              <strong className="text-black dark:text-white">Enable 2FA:</strong> Two-factor authentication significantly increases your account security by requiring a second verification step.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-3 w-3 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              <strong className="text-black dark:text-white">Complete KYC:</strong> Verify your identity to access all platform features and increase your transaction limits.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-3 w-3 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              <strong className="text-black dark:text-white">Use Strong Passwords:</strong> Create a unique, strong password and change it regularly to protect your account.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-3 w-3 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              <strong className="text-black dark:text-white">Stay Alert:</strong> Never share your password or 2FA codes with anyone. Alvarado Associates will never ask for this information.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;
