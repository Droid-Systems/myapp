"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Manage2FAPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [backupCodesCount, setBackupCodesCount] = useState(0);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Disable 2FA state
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableError, setDisableError] = useState("");

  // Regenerate backup codes state
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);

  // Notifications
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    setIsLoading(true);
    try {
      const result = await api.get2FAStatus();
      if (result.success && result.data) {
        setTwoFactorEnabled(result.data.enabled);
        setBackupCodesCount(result.data.backupCodesCount || 0);

        // If 2FA is not enabled, redirect to setup
        if (!result.data.enabled) {
          router.push("/dashboard/security/setup-2fa");
        }
      }
    } catch (error) {
      console.error("Failed to check 2FA status:", error);
      showNotification("Failed to load 2FA status", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccessMessage(message);
      setErrorMessage("");
    } else {
      setErrorMessage(message);
      setSuccessMessage("");
    }
    setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);
  };

  const handleDisable2FA = async () => {
    if (!disableCode) {
      setDisableError("2FA code is required");
      return;
    }

    if (disableCode.length !== 6) {
      setDisableError("Please enter a valid 6-digit code");
      return;
    }

    setIsDisabling(true);
    setDisableError("");

    try {
      const result = await api.disable2FA(disableCode);

      if (result.success) {
        showNotification("2FA has been disabled successfully", "success");
        setShowDisableModal(false);
        setDisableCode("");

        // Redirect to settings after 1 second
        setTimeout(() => {
          router.push("/dashboard/settings?tab=privacy");
        }, 1000);
      } else {
        setDisableError(result.message || "Failed to disable 2FA");
      }
    } catch (error: any) {
      console.error("Disable 2FA error:", error);
      setDisableError(
        error.response?.data?.message || "Invalid 2FA code. Please try again."
      );
    } finally {
      setIsDisabling(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!regenerateCode) {
      setRegenerateError("2FA code is required");
      return;
    }

    if (regenerateCode.length !== 6) {
      setRegenerateError("Please enter a valid 6-digit code");
      return;
    }

    setIsRegenerating(true);
    setRegenerateError("");

    try {
      const result = await api.regenerateBackupCodes(regenerateCode);

      if (result.success && result.data?.backupCodes) {
        setNewBackupCodes(result.data.backupCodes);
        setShowRegenerateModal(false);
        setRegenerateCode("");
        setShowBackupCodesModal(true);
        setBackupCodesCount(result.data.backupCodes.length);
        showNotification("Backup codes regenerated successfully!", "success");
      } else {
        setRegenerateError(result.message || "Failed to regenerate backup codes");
      }
    } catch (error: any) {
      console.error("Regenerate backup codes error:", error);
      setRegenerateError(
        error.response?.data?.message || "Invalid 2FA code. Please try again."
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    const codesText = newBackupCodes.join("\n");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codesText);
        showNotification("Backup codes copied to clipboard!", "success");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = codesText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showNotification("Backup codes copied to clipboard!", "success");
      }
    } catch (err) {
      showNotification("Failed to copy backup codes", "error");
    }
  };

  const handleDownloadBackupCodes = () => {
    const codesText = newBackupCodes.join("\n");
    const blob = new Blob(
      [`Alvarado Investment - Backup Codes\n\n${codesText}\n\nIMPORTANT: Keep these codes safe. Each code can only be used once.`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-codes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("Backup codes downloaded!", "success");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-body-color dark:text-body-color-dark">Loading 2FA settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Notifications */}
      {successMessage && (
        <div className="fixed left-4 right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg sm:left-auto sm:right-4 sm:w-auto">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="fixed left-4 right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white shadow-lg sm:left-auto sm:right-4 sm:w-auto">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/settings?tab=privacy")}
          className="mb-4 flex items-center gap-2 text-sm text-body-color hover:text-primary dark:text-body-color-dark"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Settings
        </button>
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Manage Two-Factor Authentication
        </h1>
        <p className="mt-2 text-body-color dark:text-body-color-dark">
          Manage your 2FA settings and backup codes
        </p>
      </div>

      {/* Status Card */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-lg dark:bg-gray-dark">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-black dark:text-white">
              2FA Enabled
            </h2>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              Your account is protected with two-factor authentication
            </p>
          </div>
          <div className="rounded-full bg-green-100 px-4 py-2 dark:bg-green-900/30">
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Backup Codes Card */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-lg dark:bg-gray-dark">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-black dark:text-white">
              Backup Codes
            </h3>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              Use backup codes if you lose access to your authenticator app
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-black/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
                Available Codes
              </p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {backupCodesCount} {backupCodesCount === 1 ? "code" : "codes"}
              </p>
            </div>
            {backupCodesCount <= 3 && backupCodesCount > 0 && (
              <div className="rounded-full bg-yellow-100 px-3 py-1 dark:bg-yellow-900/30">
                <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                  ⚠️ Low
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowRegenerateModal(true)}
          className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Regenerate Backup Codes
        </button>

        {backupCodesCount <= 3 && backupCodesCount > 0 && (
          <p className="mt-3 text-sm text-yellow-600 dark:text-yellow-400">
            You're running low on backup codes. Consider regenerating them.
          </p>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border-2 border-red-200 bg-white p-6 shadow-lg dark:border-red-900 dark:bg-gray-dark">
        <h3 className="mb-2 text-lg font-bold text-red-600 dark:text-red-400">
          Danger Zone
        </h3>
        <p className="mb-4 text-sm text-body-color dark:text-body-color-dark">
          Disabling 2FA will make your account less secure. You'll only need your password to log in.
        </p>
        <button
          onClick={() => setShowDisableModal(true)}
          className="w-full rounded-lg border-2 border-red-600 bg-white px-4 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 dark:bg-gray-dark dark:hover:bg-red-900/20"
        >
          Disable Two-Factor Authentication
        </button>
      </div>

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-dark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black dark:text-white">
                Disable 2FA
              </h3>
              <button
                onClick={() => {
                  setShowDisableModal(false);
                  setDisableCode("");
                  setDisableError("");
                }}
                className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong>⚠️ Warning:</strong> This will remove all 2FA protection from your account.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Enter the 6-digit code from your authenticator app
              </label>
              <input
                type="text"
                maxLength={6}
                value={disableCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // Only digits
                  setDisableCode(value);
                  setDisableError("");
                }}
                placeholder="000000"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-center text-2xl font-bold tracking-widest text-black outline-none focus:border-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && disableCode.length === 6) {
                    handleDisable2FA();
                  }
                }}
              />
              {disableError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {disableError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisableModal(false);
                  setDisableCode("");
                  setDisableError("");
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-black transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable2FA}
                disabled={disableCode.length !== 6 || isDisabling}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDisabling ? "Disabling..." : "Disable 2FA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Verification Modal for Regenerate */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-dark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black dark:text-white">
                Verify 2FA Code
              </h3>
              <button
                onClick={() => {
                  setShowRegenerateModal(false);
                  setRegenerateCode("");
                  setRegenerateError("");
                }}
                className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>⚠️ Warning:</strong> This will invalidate all existing backup codes and generate 10 new ones.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Enter the 6-digit code from your authenticator app
              </label>
              <input
                type="text"
                maxLength={6}
                value={regenerateCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setRegenerateCode(value);
                  setRegenerateError("");
                }}
                placeholder="000000"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-center text-2xl font-bold tracking-widest text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && regenerateCode.length === 6) {
                    handleRegenerateBackupCodes();
                  }
                }}
              />
              {regenerateError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {regenerateError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRegenerateModal(false);
                  setRegenerateCode("");
                  setRegenerateError("");
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-black transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateBackupCodes}
                disabled={regenerateCode.length !== 6 || isRegenerating}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRegenerating ? "Regenerating..." : "Regenerate Codes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Backup Codes Display Modal */}
      {showBackupCodesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-dark">
            <div className="mb-4">
              <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
                Your New Backup Codes
              </h3>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                Save these codes in a secure location. Each code can only be used once.
              </p>
            </div>

            <div className="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex gap-2">
                <svg className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300">
                    Important: Save these codes now!
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    You won't be able to see these codes again. Your old backup codes have been invalidated.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-4 dark:bg-black/20">
              {newBackupCodes.map((code, index) => (
                <div
                  key={index}
                  className="rounded-md bg-white p-3 text-center font-mono text-sm font-bold text-black shadow-sm dark:bg-gray-800 dark:text-white"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleCopyBackupCodes}
                className="flex-1 rounded-lg border border-primary bg-white px-4 py-2.5 font-medium text-primary transition-colors hover:bg-primary/10 dark:bg-gray-800 dark:hover:bg-primary/20"
              >
                📋 Copy All Codes
              </button>
              <button
                onClick={handleDownloadBackupCodes}
                className="flex-1 rounded-lg border border-primary bg-white px-4 py-2.5 font-medium text-primary transition-colors hover:bg-primary/10 dark:bg-gray-800 dark:hover:bg-primary/20"
              >
                💾 Download as Text
              </button>
              <button
                onClick={() => {
                  setShowBackupCodesModal(false);
                  setNewBackupCodes([]);
                }}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary/90"
              >
                ✓ I've Saved Them
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
