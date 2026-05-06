"use client";

import Link from "next/link";

const AddFundPage = () => {
  // Minimum and maximum deposit limits
  const minDeposit = 100;
  const maxDeposit = 10000000;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">
          Add Funds
        </h1>
        <p className="mt-2 text-sm text-body-color dark:text-body-color-dark md:text-base">
          Choose your preferred payment method to add funds to your account
        </p>
      </div>

      {/* Deposit Limits Info */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-gradient-to-br from-primary/5 to-primary/10 p-4 dark:border-gray-800 dark:from-primary/10 dark:to-primary/20 md:mb-8 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">
              Minimum Deposit
            </p>
            <p className="text-2xl font-bold text-black dark:text-white md:text-3xl">
              ${minDeposit.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">
              Maximum Deposit
            </p>
            <p className="text-2xl font-bold text-black dark:text-white md:text-3xl">
              ${maxDeposit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Bank Transfer */}
        <Link
          href="/dashboard/add-fund/bank"
          className="group rounded-xl border border-gray-200 bg-white p-6 text-left shadow-lg transition-all hover:border-primary hover:shadow-xl dark:border-gray-800 dark:bg-gray-dark"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/20 transition-colors group-hover:from-primary/10 group-hover:to-primary/20">
            <svg
              className="h-7 w-7 text-blue-500 group-hover:text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
            Bank Transfer
          </h3>
          <p className="mb-3 text-sm text-body-color dark:text-body-color-dark">
            Transfer funds directly from your bank account. Processing time: 1-3 business days.
          </p>
          <div className="flex items-center gap-2 text-xs text-body-color dark:text-body-color-dark">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>No fees</span>
          </div>
        </Link>


        {/* Cryptocurrency */}
        <Link
          href="/dashboard/add-fund/crypto"
          className="group rounded-xl border border-gray-200 bg-white p-6 text-left shadow-lg transition-all hover:border-primary hover:shadow-xl dark:border-gray-800 dark:bg-gray-dark"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/20 transition-colors group-hover:from-primary/10 group-hover:to-primary/20">
            <svg
              className="h-7 w-7 text-orange-500 group-hover:text-primary"
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
          <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
            Cryptocurrency
          </h3>
          <p className="mb-3 text-sm text-body-color dark:text-body-color-dark">
            Deposit using Bitcoin, Ethereum, or stablecoins. Processing: 10-30 minutes.
          </p>
          <div className="flex items-center gap-2 text-xs text-body-color dark:text-body-color-dark">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Low network fees</span>
          </div>
        </Link>
      </div>

      {/* Security Notice */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-dark md:mt-8 md:p-6">
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
          Security & Compliance
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
            <div>
              <p className="text-sm font-semibold text-black dark:text-white">
                256-bit SSL Encryption
              </p>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                All transactions are secured with bank-level encryption
              </p>
            </div>
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
            <div>
              <p className="text-sm font-semibold text-black dark:text-white">
                PCI DSS Compliant
              </p>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                We meet the highest standards for payment security
              </p>
            </div>
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
            <div>
              <p className="text-sm font-semibold text-black dark:text-white">
                24/7 Fraud Monitoring
              </p>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                Our systems actively monitor and prevent fraudulent activity
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AddFundPage;
