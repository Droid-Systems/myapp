"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: { id: string; title: string; location: string; price: number };
}

export default function BuyNowModal({ isOpen, onClose, property }: BuyNowModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const result = await api.submitBuyNow(property.id);
      if (result.success) {
        setSuccess(true);
      } else {
        setErrorMsg(result.message || "Failed to send purchase request. Please try again.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setErrorMsg("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-dark">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-black dark:text-white">Buy Now</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-body-color transition-colors hover:bg-gray-100 dark:text-body-color-dark dark:hover:bg-gray-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {success ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-black dark:text-white">Request Sent!</h3>
              <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">
                Your purchase request for <strong>{property.title}</strong> has been received.
              </p>
              <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
                A property manager will reach out to you via email shortly to guide you through the next steps.
              </p>
              <button
                onClick={handleClose}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          ) : (
            /* Confirmation */
            <div>
              <div className="mb-5 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs text-body-color dark:text-body-color-dark mb-1">Property</p>
                <p className="font-semibold text-black dark:text-white">{property.title}</p>
                <p className="text-xs text-body-color dark:text-body-color-dark">{property.location}</p>
                <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                  <p className="text-xs text-body-color dark:text-body-color-dark">Listed Price</p>
                  <p className="text-xl font-bold text-black dark:text-white">
                    ${property.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <p className="text-xs text-green-800 dark:text-green-300">
                  🏠 Submitting this request will notify our team. A dedicated property manager will contact you via email to complete the purchase.
                </p>
              </div>

              {errorMsg && (
                <p className="mb-4 text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Confirm Purchase Request"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
