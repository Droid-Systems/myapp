"use client";

import { useState, useEffect } from "react";
import { verifyPasscode, storeVerifiedAccess } from "@/utils/passcode";

const SUPPORT_INFO = {
  email: "info@alvaradoassociatepartners.com",
  phone: "(424) 519-5003",
  message: "Please contact our support team to obtain an access code for our documents.",
};

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  documentTitle: string;
}

const PasscodeModal = ({
  isOpen,
  onClose,
  onSuccess,
  documentTitle,
}: PasscodeModalProps) => {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPasscode("");
      setError("");
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Verify the passcode via backend API and get JWT token
      const response = await verifyPasscode(passcode);

      if (response && response.data) {
        // Store JWT token and expiry in session
        storeVerifiedAccess(response.data.token, response.data.expiresAt);

        // Call success callback with the token
        onSuccess(response.data.token);

        // Close modal
        onClose();
      } else {
        setError("Invalid access code. Please try again or contact support.");
      }
    } catch (error) {
      console.error("Error verifying passcode:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-2xl dark:bg-gray-dark sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Lock Icon */}
        <div className="mb-3 flex justify-center sm:mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 sm:h-16 sm:w-16">
            <svg
              className="h-6 w-6 text-primary sm:h-8 sm:w-8"
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
        </div>

        {/* Title */}
        <h3 className="mb-1 text-center text-xl font-bold text-black dark:text-white sm:mb-2 sm:text-2xl">
          Document Access Required
        </h3>

        {/* Document Name */}
        <p className="mb-3 text-center text-sm text-body-color dark:text-body-color-dark sm:mb-6">
          {documentTitle}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4 sm:mb-6">
            <label
              htmlFor="passcode"
              className="mb-2 block text-sm font-medium text-black dark:text-white sm:mb-3"
            >
              Enter Access Code
            </label>
            <input
              type="text"
              id="passcode"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError("");
              }}
              placeholder="Enter your access code"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              required
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !passcode.trim()}
            className="mb-3 w-full rounded-lg bg-primary px-6 py-2.5 text-base font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:mb-4 sm:py-3"
          >
            {isLoading ? "Verifying..." : "Access Document"}
          </button>
        </form>

        {/* Support Info */}
        <div className="rounded-lg bg-gray-2 p-3 dark:bg-black sm:p-4">
          <p className="mb-1 text-center text-sm font-medium text-black dark:text-white sm:mb-2">
            Don't have an access code?
          </p>
          <p className="mb-2 text-center text-xs text-body-color dark:text-body-color-dark sm:mb-3">
            {SUPPORT_INFO.message}
          </p>
          <div className="flex flex-col items-center gap-2 text-xs">
            <a
              href={`mailto:${SUPPORT_INFO.email}`}
              className="text-primary transition hover:underline"
            >
              {SUPPORT_INFO.email}
            </a>
            <a
              href={`tel:${SUPPORT_INFO.phone.replace(/\D/g, "")}`}
              className="text-primary transition hover:underline"
            >
              {SUPPORT_INFO.phone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasscodeModal;
