"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Toast from "@/components/Toast";

type Step = "amount" | "bank-details" | "confirm";

interface BankDetails {
  id: string;
  name: string;
  bankName: string;
  accountName: string;
  address: string;
  swiftCode: string;
  routingNumber: string;
  instructions: string;
}

const BankTransferPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("amount");
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [submittedReference, setSubmittedReference] = useState("");
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const minDeposit = 100;
  const maxDeposit = 10000000;

  // Fetch bank details when moving to step 2
  useEffect(() => {
    if (currentStep === "bank-details" && !bankDetails) {
      fetchBankDetails();
    }
  }, [currentStep]);

  const fetchBankDetails = async () => {
    setLoading(true);
    try {
      const response = await api.getPaymentMethods("bank");
      if (response.success && response.data && response.data.length > 0) {
        setBankDetails(response.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch bank details:", err);
      setToast({ message: "Unable to load bank details. Manual processing available.", type: "info" });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount >= minDeposit && numAmount <= maxDeposit) {
      setCurrentStep("bank-details");
    }
  };

  const handleProceedToConfirm = () => {
    setCurrentStep("confirm");
  };

  const navigateToSuccess = (reference: string) => {
    const params = new URLSearchParams({ method: "bank", amount, reference });
    if (!bankDetails) {
      params.append("manual", "true");
      params.append("email", email);
    }
    router.push(`/dashboard/add-fund/success?${params.toString()}`);
  };

  const handleFinalSubmit = async () => {
    setIsProcessing(true);

    try {
      const response = await api.createDeposit({
        method: "bank",
        amount: parseFloat(amount),
        details: {
          bankAccountId: bankDetails?.id,
          email: bankDetails ? undefined : email,
          manualProcessing: !bankDetails,
        },
      });

      if (response.success && response.data) {
        setSubmittedReference(response.data.reference);
        setShowReceiptUpload(true);
      } else {
        setToast({ message: response.message || "Failed to submit deposit request. Please try again.", type: "error" });
      }
    } catch (err) {
      console.error("Failed to create deposit:", err);
      setToast({ message: "An error occurred. Please check your connection and try again.", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile) return;
    setUploadingReceipt(true);
    try {
      const res = await api.uploadPaymentReceipt(submittedReference, receiptFile);
      if (res.success) {
        setToast({ message: "Receipt submitted successfully!", type: "success" });
      } else {
        setToast({ message: res.message || "Failed to upload receipt.", type: "error" });
      }
    } catch {
      setToast({ message: "Failed to upload receipt. You can submit it later via support.", type: "error" });
    } finally {
      setUploadingReceipt(false);
      setTimeout(() => navigateToSuccess(submittedReference), 1000);
    }
  };

  const goBack = () => {
    if (currentStep === "bank-details") {
      setCurrentStep("amount");
    } else if (currentStep === "confirm") {
      setCurrentStep("bank-details");
    }
  };

  const steps = [
    { key: "amount", label: "Amount" },
    { key: "bank-details", label: "Bank Details" },
    { key: "confirm", label: "Confirm" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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
            Bank Transfer Deposit
          </h1>
          <p className="mt-1 text-sm text-body-color dark:text-body-color-dark md:text-base">
            {currentStep === "amount" && "Enter the amount you wish to deposit"}
            {currentStep === "bank-details" && "Transfer funds to this bank account"}
            {currentStep === "confirm" && "Review and confirm your deposit request"}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 flex justify-center">
        <div className="flex items-center">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors ${
                    index <= currentStepIndex
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-center text-xs font-medium ${
                    index <= currentStepIndex
                      ? "text-primary"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-1 w-20 rounded ${
                    index < currentStepIndex
                      ? "bg-primary"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:p-6">
          {/* Step 1: Amount */}
          {currentStep === "amount" && (
            <form onSubmit={handleAmountSubmit}>
              <div className="space-y-4">
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
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                    Min: ${minDeposit.toLocaleString()} | Max: ${maxDeposit.toLocaleString()}
                  </p>
                </div>

                {/* Info Box */}
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
                    How Bank Transfer Works:
                  </h3>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-blue-800 dark:text-blue-400">
                    <li>Enter your deposit amount</li>
                    <li>View our bank account details</li>
                    <li>Transfer the exact amount from your bank account</li>
                    <li>Funds will be credited within 1-3 business days after verification</li>
                  </ol>
                </div>

                {/* Benefits */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-black/20">
                  <h3 className="mb-2 text-sm font-semibold text-black dark:text-white">
                    Benefits:
                  </h3>
                  <ul className="space-y-1 text-sm text-body-color dark:text-body-color-dark">
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      No processing fees
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Secure and verified transactions
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Higher deposit limits
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2: Bank Details */}
          {currentStep === "bank-details" && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : bankDetails ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">
                          Transfer ${parseFloat(amount).toLocaleString()} to:
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details Card */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-black/20">
                    <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                      {bankDetails.bankName}
                    </h3>

                    <div className="space-y-3">
                      {/* Account Name */}
                      <div>
                        <label className="text-xs font-medium text-body-color dark:text-body-color-dark">
                          Account Name
                        </label>
                        <div className="mt-1 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                          <span className="font-mono text-sm font-semibold text-black dark:text-white">
                            {bankDetails.accountName}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(bankDetails.accountName)}
                            className="text-primary hover:text-primary/80"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Account Number */}
                      <div>
                        <label className="text-xs font-medium text-body-color dark:text-body-color-dark">
                          Account Number
                        </label>
                        <div className="mt-1 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                          <span className="font-mono text-sm font-semibold text-black dark:text-white">
                            {bankDetails.address}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(bankDetails.address)}
                            className="text-primary hover:text-primary/80"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {bankDetails.swiftCode && (
                        <div>
                          <label className="text-xs font-medium text-body-color dark:text-body-color-dark">
                            SWIFT Code
                          </label>
                          <div className="mt-1 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                            <span className="font-mono text-sm font-semibold text-black dark:text-white">
                              {bankDetails.swiftCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(bankDetails.swiftCode)}
                              className="text-primary hover:text-primary/80"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      {bankDetails.routingNumber && (
                        <div>
                          <label className="text-xs font-medium text-body-color dark:text-body-color-dark">
                            Routing Number
                          </label>
                          <div className="mt-1 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                            <span className="font-mono text-sm font-semibold text-black dark:text-white">
                              {bankDetails.routingNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(bankDetails.routingNumber)}
                              className="text-primary hover:text-primary/80"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {bankDetails.instructions && (
                      <div className="mt-4 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                        <p className="text-sm text-yellow-800 dark:text-yellow-400">
                          <strong>Note:</strong> {bankDetails.instructions}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Warning */}
                  <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                    <div className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                          Important
                        </h4>
                        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                          Please transfer exactly ${parseFloat(amount).toLocaleString()}. After completing the transfer, click "Confirm Transfer" to submit your deposit request.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                          Manual Processing Required
                        </h4>
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                          No automated bank account is currently available. We'll send you bank details via email and process your deposit manually.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                      Email Address for Invoice
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                      We'll send bank account details and deposit instructions to this email
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-black/20">
                    <h4 className="mb-2 text-sm font-semibold text-black dark:text-white">
                      What happens next:
                    </h4>
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-body-color dark:text-body-color-dark">
                      <li>You'll receive an email with our bank account details</li>
                      <li>Transfer the exact amount to the provided account</li>
                      <li>Our team will verify and credit your account within 1-3 business days</li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedToConfirm}
                  disabled={!bankDetails && !email.includes("@")}
                  className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bankDetails ? "Confirm Transfer" : "Submit Request"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm / Receipt Upload */}
          {currentStep === "confirm" && (
            <div>
              {showReceiptUpload ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-black dark:text-white">Deposit Request Submitted!</h3>
                      <p className="text-sm text-body-color dark:text-body-color-dark">Ref: {submittedReference}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 dark:border-gray-700 dark:bg-black/20">
                    <h4 className="mb-1 text-sm font-semibold text-black dark:text-white">Upload Payment Receipt (Optional)</h4>
                    <p className="mb-4 text-sm text-body-color dark:text-body-color-dark">
                      Upload proof of your bank transfer to speed up verification.
                    </p>
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-medium text-black dark:text-white">
                        {receiptFile ? receiptFile.name : "Choose file"}
                      </span>
                      <span className="text-xs text-body-color dark:text-body-color-dark">JPG, PNG, PDF up to 10MB</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => navigateToSuccess(submittedReference)}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    >
                      Skip for now
                    </button>
                    <button
                      type="button"
                      onClick={handleReceiptUpload}
                      disabled={!receiptFile || uploadingReceipt}
                      className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingReceipt ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Uploading...
                        </span>
                      ) : (
                        "Upload Receipt"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-black dark:text-white">
                      Review Your Deposit Request
                    </h3>

                    {/* Summary */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-black/20">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-body-color dark:text-body-color-dark">Deposit Amount</span>
                          <span className="text-lg font-bold text-black dark:text-white">
                            ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-body-color dark:text-body-color-dark">Payment Method</span>
                          <span className="font-medium text-black dark:text-white">Bank Transfer</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-body-color dark:text-body-color-dark">Processing Fee</span>
                          <span className="font-medium text-green-600 dark:text-green-400">Free</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-body-color dark:text-body-color-dark">Processing Time</span>
                          <span className="font-medium text-black dark:text-white">1-3 Business Days</span>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                      <div className="flex items-start gap-3">
                        <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Next Steps</h4>
                          <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                            After submitting this request, you'll receive a reference number. Your deposit will be credited once we verify the bank transfer.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={isProcessing}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={isProcessing}
                      className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        "Submit Request"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankTransferPage;
