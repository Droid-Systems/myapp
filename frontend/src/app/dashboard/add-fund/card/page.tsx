"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CardDetails {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  amount: string;
}

const CardPaymentPage = () => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    amount: "",
  });

  const minDeposit = 100;
  const maxDeposit = 10000000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Navigate to success page with method parameter
    router.push("/dashboard/add-fund/success?method=card");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 md:mb-8">
        <Link
          href="/dashboard/add-fund"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800"
        >
          <svg
            className="h-5 w-5 text-black dark:text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">
            Card Payment
          </h1>
          <p className="mt-1 text-sm text-body-color dark:text-body-color-dark md:text-base">
            Enter your card details for instant deposit
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:p-6">
          <div className="space-y-4">
            {/* Card Number */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Card Number
              </label>
              <input
                type="text"
                required
                value={cardDetails.cardNumber}
                onChange={(e) => {
                  // Format card number with spaces
                  const value = e.target.value.replace(/\s/g, "");
                  const formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
                  setCardDetails({ ...cardDetails, cardNumber: formattedValue });
                }}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Card Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Cardholder Name
              </label>
              <input
                type="text"
                required
                value={cardDetails.cardName}
                onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                placeholder="John Doe"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Expiry and CVV */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  Expiry Date
                </label>
                <input
                  type="text"
                  required
                  value={cardDetails.expiryDate}
                  onChange={(e) => {
                    // Format MM/YY
                    const value = e.target.value.replace(/\D/g, "");
                    const formattedValue = value.length >= 2 ? `${value.slice(0, 2)}/${value.slice(2, 4)}` : value;
                    setCardDetails({ ...cardDetails, expiryDate: formattedValue });
                  }}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  CVV
                </label>
                <input
                  type="text"
                  required
                  value={cardDetails.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setCardDetails({ ...cardDetails, cvv: value });
                  }}
                  placeholder="123"
                  maxLength={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Deposit Amount ($)
              </label>
              <input
                type="number"
                required
                min={minDeposit}
                max={maxDeposit}
                step="0.01"
                value={cardDetails.amount}
                onChange={(e) => setCardDetails({ ...cardDetails, amount: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Min: ${minDeposit.toLocaleString()} | Max: ${maxDeposit.toLocaleString()}
              </p>
            </div>

            {/* Fee Notice */}
            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                    Processing Fee: 2.5%
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    A 2.5% processing fee will be added to your deposit amount for card payments.
                    {cardDetails.amount && parseFloat(cardDetails.amount) > 0 && (
                      <span className="mt-1 block font-semibold">
                        Total charge: ${(parseFloat(cardDetails.amount) * 1.025).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-black/20">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-black dark:text-white">
                    Secure Payment
                  </p>
                  <p className="text-sm text-body-color dark:text-body-color-dark">
                    Your card information is encrypted and processed securely. We are PCI DSS Level 1 compliant.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? "Processing Payment..." : "Pay Now"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CardPaymentPage;
