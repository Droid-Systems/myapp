"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function Setup2FAPage() {
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Real data from backend
  const [secretKey, setSecretKey] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // Check if 2FA is already enabled
  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const result = await api.get2FAStatus();
      if (result.success && result.data?.enabled) {
        // Already enabled, redirect to settings
        window.location.href = "/dashboard/settings?tab=privacy";
      }
    } catch (err) {
      console.error("Failed to check 2FA status:", err);
    }
  };

  const initiate2FASetup = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await api.setup2FA();
      if (result.success && result.data) {
        setSecretKey(result.data.secret);
        setQrCodeUrl(result.data.qrCode);
        setStep(2);
      } else {
        setError(result.message || "Failed to setup 2FA");
      }
    } catch (err: any) {
      console.error("2FA setup error:", err);
      setError(err.response?.data?.message || "Failed to setup 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await api.enable2FA(verificationCode);
      if (result.success && result.data) {
        setBackupCodes(result.data.backupCodes);
        setIsEnabled(true);
        setStep(3);
      } else {
        setError(result.message || "Invalid verification code");
      }
    } catch (err: any) {
      console.error("2FA enable error:", err);
      setError(err.response?.data?.message || "Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    setStep(4);
  };

  const handleCopySecret = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(secretKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = secretKey;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error("Fallback copy failed:", err);
          alert("Failed to copy. Please copy manually: " + secretKey);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      // Show error to user
      alert("Failed to copy to clipboard. Please copy the key manually.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-bold text-black dark:text-white">
        Two-Factor Authentication
      </h1>
      <p className="mb-8 text-body-color dark:text-body-color-dark">
        Add an extra layer of security to your account
      </p>

      {/* Progress Steps */}
      <div className="mb-8 flex justify-center overflow-x-auto px-4">
        <div className="flex items-center justify-center">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full ${
                  step >= num
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-800"
                }`}
              >
                {step > num ? (
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5"
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
                ) : (
                  <span className="text-xs sm:text-sm font-semibold">{num}</span>
                )}
              </div>
              {num < 4 && (
                <div
                  className={`mx-2 sm:mx-3 h-1 w-8 sm:w-12 ${
                    step > num
                      ? "bg-primary"
                      : "bg-gray-200 dark:bg-gray-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Introduction */}
      {step === 1 && (
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-dark">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-8 w-8 text-primary"
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
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white">
                What is Two-Factor Authentication?
              </h2>
              <p className="text-body-color dark:text-body-color-dark">
                Protect your account with an extra layer of security
              </p>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <svg
                    className="h-5 w-5 text-green-600 dark:text-green-400"
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
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-black dark:text-white">
                  Enhanced Security
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  Even if someone knows your password, they won't be able to access your account without the second factor
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <svg
                    className="h-5 w-5 text-green-600 dark:text-green-400"
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
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-black dark:text-white">
                  Industry Standard
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  Used by banks, tech companies, and security-conscious organizations worldwide
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <svg
                    className="h-5 w-5 text-green-600 dark:text-green-400"
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
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-black dark:text-white">
                  Easy to Use
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  Works with popular authenticator apps like Google Authenticator, Microsoft Authenticator, and Authy
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> You'll need an authenticator app installed on your phone to complete this setup. If you don't have one yet, download Google Authenticator or Microsoft Authenticator from your app store.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={initiate2FASetup}
            disabled={isLoading}
            className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Setting up..." : "Continue Setup"}
          </button>
        </div>
      )}

      {/* Step 2: Scan QR Code */}
      {step === 2 && (
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-dark">
          <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
            Scan QR Code
          </h2>

          <div className="mb-6">
            <p className="mb-4 text-body-color dark:text-body-color-dark">
              Open your authenticator app and scan this QR code:
            </p>

            <div className="flex flex-col items-center">
              <div className="mb-4 rounded-lg bg-white p-4 shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="h-48 w-48"
                />
              </div>

              <div className="w-full rounded-lg bg-gray-50 p-4 dark:bg-black/20">
                <p className="mb-2 text-sm font-semibold text-black dark:text-white">
                  Can't scan the code?
                </p>
                <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                  Enter this key manually in your authenticator app:
                </p>
                <div className="flex items-start gap-2">
                  <code className="flex-1 overflow-hidden break-all rounded bg-white px-3 py-2 text-xs sm:text-sm font-mono text-black dark:bg-gray-800 dark:text-white">
                    {secretKey}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="flex-shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
              Enter the 6-digit code from your authenticator app
            </label>
            <input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-2xl font-bold tracking-widest text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={verificationCode.length !== 6 || isLoading}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 3 && (
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-dark">
          <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">
            Save Your Backup Codes
          </h2>
          <p className="mb-6 text-body-color dark:text-body-color-dark">
            Store these codes in a safe place. Each code can only be used once.
          </p>

          <div className="mb-6 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <div className="flex gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400"
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
              <div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  Important: Keep these codes secure
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  If you lose access to your authenticator app, these codes are the only way to recover your account.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 mx-auto max-w-md grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4 dark:bg-black/20">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="rounded bg-white px-4 py-2 text-center font-mono text-sm font-semibold text-black dark:bg-gray-800 dark:text-white"
              >
                {code}
              </div>
            ))}
          </div>

          <div className="mb-6 flex gap-3">
            <button
              onClick={() => {
                const codesText = backupCodes.join("\n");
                navigator.clipboard.writeText(codesText);
              }}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Copy Codes
            </button>
            <button
              onClick={() => {
                const codesText = backupCodes.join("\n");
                const blob = new Blob([codesText], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "backup-codes.txt";
                a.click();
              }}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Download
            </button>
          </div>

          <button
            onClick={handleComplete}
            className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            I've Saved My Codes
          </button>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="rounded-xl bg-white p-8 text-center shadow-lg dark:bg-gray-dark">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg
                className="h-10 w-10 text-green-600 dark:text-green-400"
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
          </div>

          <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">
            Two-Factor Authentication Enabled!
          </h2>
          <p className="mb-8 text-body-color dark:text-body-color-dark">
            Your account is now protected with an extra layer of security.
          </p>

          <div className="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-800 dark:text-green-300">
              From now on, you'll need to enter a code from your authenticator app every time you sign in.
            </p>
          </div>

          <button
            onClick={() => window.location.href = "/dashboard/security"}
            className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Back to Security Settings
          </button>
        </div>
      )}
    </div>
  );
}
