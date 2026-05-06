"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: { id: string; title: string; location: string };
  initialAmount?: string;
  onSuccess?: (amount: number) => void;
}

export default function BidModal({ isOpen, onClose, property, initialAmount = "", onSuccess }: BidModalProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount);
      setSuccess(false);
      setErrorMsg("");
    }
  }, [isOpen, initialAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bidAmount = Number(amount);
    if (!bidAmount || bidAmount <= 0) {
      setErrorMsg("Please enter a valid bid amount.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const result = await api.submitBid(property.id, bidAmount);
      if (result.success) {
        setSuccess(true);
        onSuccess?.(bidAmount);
      } else {
        setErrorMsg(result.message || "Failed to submit bid. Please try again.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount(initialAmount);
    setSuccess(false);
    setErrorMsg("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-dark">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-black dark:text-white">Place a Bid</h2>
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
              <h3 className="mb-2 text-xl font-bold text-black dark:text-white">Bid Submitted!</h3>
              <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">
                Your bid on <strong>{property.title}</strong> has been received.
              </p>
              <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
                Keep an eye on your email — our team will reach out with next steps for the purchase.
              </p>
              <button
                onClick={handleClose}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          ) : (
            /* Bid form */
            <form onSubmit={handleSubmit}>
              <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-body-color dark:text-body-color-dark">Property</p>
                <p className="font-semibold text-black dark:text-white">{property.title}</p>
                <p className="text-xs text-body-color dark:text-body-color-dark">{property.location}</p>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  Bid Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body-color dark:text-body-color-dark font-medium">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d*$/.test(val)) {
                        setAmount(val);
                        setErrorMsg("");
                      }
                    }}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-7 pr-4 text-black focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                {errorMsg && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
                )}
              </div>

              <div className="mb-5 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  📧 After submitting, our team will contact you via email to proceed with the purchase process.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !amount}
                  className="flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Bid"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
