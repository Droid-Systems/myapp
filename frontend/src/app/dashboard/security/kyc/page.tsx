"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface KYCData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  documentType: string;
  documentNumber: string;
  idFrontUrl: string;
  idBackUrl: string;
  proofOfAddressUrl: string;
  selfieUrl: string;
}

interface KYCStatus {
  id: string;
  status: "not_submitted" | "pending" | "approved" | "rejected";
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string;
}

export default function KYCPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);

  const [kycData, setKycData] = useState<KYCData>({
    fullName: "",
    dateOfBirth: "",
    nationality: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    documentType: "",
    documentNumber: "",
    idFrontUrl: "",
    idBackUrl: "",
    proofOfAddressUrl: "",
    selfieUrl: "",
  });

  const [uploadProgress, setUploadProgress] = useState({
    idFront: false,
    idBack: false,
    proofOfAddress: false,
    selfie: false,
  });

  // Load KYC status on mount
  useEffect(() => {
    loadKYCStatus();
  }, []);

  const loadKYCStatus = async () => {
    try {
      const response = await api.getKYCStatus();
      if (response.success && response.data?.kyc) {
        const kyc = response.data.kyc;

        setKycStatus({
          id: kyc.id,
          status: kyc.status,
          submittedAt: kyc.submittedAt,
          reviewedAt: kyc.reviewedAt,
          rejectionReason: kyc.rejectionReason,
        });

        // Populate form with existing data
        setKycData({
          fullName: kyc.fullName || "",
          dateOfBirth: kyc.dateOfBirth || "",
          nationality: kyc.nationality || "",
          address: kyc.address || "",
          city: kyc.city || "",
          state: kyc.state || "",
          postalCode: kyc.postalCode || "",
          country: kyc.country || "",
          documentType: kyc.documentType || "",
          documentNumber: kyc.documentNumber || "",
          idFrontUrl: kyc.idFrontUrl || "",
          idBackUrl: kyc.idBackUrl || "",
          proofOfAddressUrl: kyc.proofOfAddressUrl || "",
          selfieUrl: kyc.selfieUrl || "",
        });

        // Set step based on status
        if (kyc.status === "pending" || kyc.status === "approved") {
          setStep(5);
        } else if (kyc.status === "rejected") {
          setStep(1); // Allow resubmission
        }
      }
    } catch (error) {
      console.error("Failed to load KYC status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof KYCData, value: string) => {
    setKycData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, field: keyof typeof uploadProgress) => {
    try {
      setUploading(true);
      setUploadProgress((prev) => ({ ...prev, [field]: true }));

      const response = await api.uploadKYCDocument(file, field);

      if (response.success && response.data?.fileUrl) {
        // Map upload progress field to KYC data field
        const urlField = field === "idFront" ? "idFrontUrl" :
                        field === "idBack" ? "idBackUrl" :
                        field === "proofOfAddress" ? "proofOfAddressUrl" :
                        "selfieUrl";

        setKycData((prev) => ({ ...prev, [urlField]: response.data!.fileUrl }));
      }
    } catch (error: any) {
      console.error(`Failed to upload ${field}:`, error);
      alert(`Failed to upload document: ${error.response?.data?.message || "Unknown error"}`);
    } finally {
      setUploading(false);
      setUploadProgress((prev) => ({ ...prev, [field]: false }));
    }
  };

  const isStep1Valid = () => {
    return (
      kycData.fullName &&
      kycData.dateOfBirth &&
      kycData.nationality &&
      kycData.address &&
      kycData.city &&
      kycData.postalCode &&
      kycData.country
    );
  };

  const isStep2Valid = () => {
    const baseValid = kycData.documentType && kycData.documentNumber && kycData.idFrontUrl;
    if (kycData.documentType === "drivers_license") {
      return baseValid && kycData.idBackUrl;
    }
    return baseValid;
  };

  const isStep3Valid = () => {
    return kycData.proofOfAddressUrl !== "";
  };

  const isStep4Valid = () => {
    return kycData.selfieUrl !== "";
  };

  const handleSubmit = async () => {
    if (!isStep1Valid() || !isStep2Valid() || !isStep3Valid() || !isStep4Valid()) {
      alert("Please complete all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.submitKYC(kycData);

      if (response.success) {
        setKycStatus({
          id: response.data!.kyc.id,
          status: "pending",
          submittedAt: response.data!.kyc.submittedAt,
          reviewedAt: null,
          rejectionReason: "",
        });
        setStep(5);
      }
    } catch (error: any) {
      console.error("KYC submission error:", error);
      alert(`Failed to submit KYC: ${error.response?.data?.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-body-color dark:text-body-color-dark">Loading KYC status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-bold text-black dark:text-white">
        KYC Verification
      </h1>
      <p className="mb-8 text-body-color dark:text-body-color-dark">
        Complete your identity verification to unlock all features
      </p>

      {/* Show rejection message if rejected */}
      {kycStatus?.status === "rejected" && kycStatus.rejectionReason && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">KYC Rejected</p>
              <p className="text-sm text-red-700 dark:text-red-400">{kycStatus.rejectionReason}</p>
              <p className="mt-2 text-sm text-red-700 dark:text-red-400">Please correct the issues and resubmit.</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8 flex justify-center px-4">
        <div className="flex items-center justify-center">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full ${
                  step >= num
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-800"
                }`}
              >
                {step > num ? (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold">{num}</span>
                )}
              </div>
              {num < 5 && (
                <div className={`mx-2 sm:mx-3 h-1 w-8 sm:w-12 ${step > num ? "bg-primary" : "bg-gray-200 dark:bg-gray-800"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Personal Information */}
      {step === 1 && (
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-dark">
          <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">Personal Information</h2>
          <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
            Please provide your personal details exactly as they appear on your government-issued ID.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Full Name *</label>
              <input
                type="text"
                value={kycData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                placeholder="John Doe"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Date of Birth *</label>
                <input
                  type="date"
                  value={kycData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Nationality *</label>
                <input
                  type="text"
                  value={kycData.nationality}
                  onChange={(e) => handleInputChange("nationality", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  placeholder="United States"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Street Address *</label>
              <input
                type="text"
                value={kycData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                placeholder="123 Main Street, Apt 4B"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">City *</label>
                <input
                  type="text"
                  value={kycData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">State</label>
                <input
                  type="text"
                  value={kycData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  placeholder="NY"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Postal Code *</label>
                <input
                  type="text"
                  value={kycData.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  placeholder="10001"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Country *</label>
              <input
                type="text"
                value={kycData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                placeholder="USA"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!isStep1Valid()}
            className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Identity Document */}
      {step === 2 && (
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-dark">
          <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">Identity Document</h2>
          <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
            Upload a clear photo of your government-issued ID. Ensure all details are visible.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Document Type *</label>
              <select
                value={kycData.documentType}
                onChange={(e) => handleInputChange("documentType", e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select document type</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver&apos;s License</option>
                <option value="national_id">National ID Card</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Document Number *</label>
              <input
                type="text"
                value={kycData.documentNumber}
                onChange={(e) => handleInputChange("documentNumber", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                placeholder="Enter document number"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                Upload Document {kycData.documentType === "drivers_license" ? "(Front) " : ""}*
              </label>
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "idFront");
                  }}
                  disabled={uploading}
                  className="hidden"
                  id="id-front-upload"
                />
                <label htmlFor="id-front-upload" className="cursor-pointer">
                  {uploadProgress.idFront ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-3 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <p className="text-sm text-body-color dark:text-body-color-dark">Uploading...</p>
                    </div>
                  ) : kycData.idFrontUrl ? (
                    <div className="flex flex-col items-center">
                      <svg className="mx-auto mb-3 h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Document uploaded</p>
                      <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">Click to replace</p>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto mb-3 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm font-medium text-black dark:text-white">Click to upload or drag and drop</p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">PNG, JPG or PDF (max. 10MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Back of Driver's License */}
            {kycData.documentType === "drivers_license" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Upload Document (Back) *</label>
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "idBack");
                    }}
                    disabled={uploading}
                    className="hidden"
                    id="id-back-upload"
                  />
                  <label htmlFor="id-back-upload" className="cursor-pointer">
                    {uploadProgress.idBack ? (
                      <div className="flex flex-col items-center">
                        <div className="mb-3 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <p className="text-sm text-body-color dark:text-body-color-dark">Uploading...</p>
                      </div>
                    ) : kycData.idBackUrl ? (
                      <div className="flex flex-col items-center">
                        <svg className="mx-auto mb-3 h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Document uploaded</p>
                        <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">Click to replace</p>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto mb-3 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm font-medium text-black dark:text-white">Click to upload or drag and drop</p>
                        <p className="text-xs text-body-color dark:text-body-color-dark">PNG, JPG or PDF (max. 10MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!isStep2Valid()}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Proof of Address */}
      {step === 3 && (
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-dark">
          <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">Proof of Address</h2>
          <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
            Upload a document that verifies your residential address. Must be dated within the last 3 months.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Upload Proof of Address *</label>
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "proofOfAddress");
                  }}
                  disabled={uploading}
                  className="hidden"
                  id="address-upload"
                />
                <label htmlFor="address-upload" className="cursor-pointer">
                  {uploadProgress.proofOfAddress ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-3 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <p className="text-sm text-body-color dark:text-body-color-dark">Uploading...</p>
                    </div>
                  ) : kycData.proofOfAddressUrl ? (
                    <div className="flex flex-col items-center">
                      <svg className="mx-auto mb-3 h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Document uploaded</p>
                      <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">Click to replace</p>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto mb-3 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm font-medium text-black dark:text-white">Click to upload or drag and drop</p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">PNG, JPG or PDF (max. 10MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-black/20">
              <p className="text-sm font-semibold text-black dark:text-white">Acceptable documents:</p>
              <ul className="space-y-1 text-sm text-body-color dark:text-body-color-dark">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Utility bill (electricity, water, gas)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Bank statement
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Government-issued letter or tax document
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!isStep3Valid()}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Selfie Verification */}
      {step === 4 && (
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-dark">
          <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">Selfie Verification</h2>
          <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
            Upload a selfie holding your ID next to your face for verification.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Upload Selfie with ID *</label>
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "selfie");
                  }}
                  disabled={uploading}
                  className="hidden"
                  id="selfie-upload"
                />
                <label htmlFor="selfie-upload" className="cursor-pointer">
                  {uploadProgress.selfie ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-3 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <p className="text-sm text-body-color dark:text-body-color-dark">Uploading...</p>
                    </div>
                  ) : kycData.selfieUrl ? (
                    <div className="flex flex-col items-center">
                      <svg className="mx-auto mb-3 h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Selfie uploaded</p>
                      <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">Click to replace</p>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto mb-3 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm font-medium text-black dark:text-white">Click to upload</p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">PNG or JPG (max. 10MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Requirements:</strong> Your face and ID must be clearly visible in the same photo. Make sure the photo is well-lit and in focus.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isStep4Valid() || submitting}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Verification"}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Status Screen */}
      {step === 5 && kycStatus && (
        <div className="rounded-xl bg-white p-8 text-center shadow-lg dark:bg-gray-dark">
          {kycStatus.status === "pending" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                  <svg className="h-10 w-10 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">Under Review</h2>
              <p className="mb-8 text-body-color dark:text-body-color-dark">
                Your KYC verification is currently being reviewed by our team.
              </p>
              <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>What happens next?</strong><br />
                  Our team will review your documents within 24-48 hours. You'll receive an email notification once your verification is complete.
                </p>
              </div>
            </>
          )}

          {kycStatus.status === "approved" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">Verified!</h2>
              <p className="mb-8 text-body-color dark:text-body-color-dark">
                Your identity has been successfully verified. You now have full access to all features.
              </p>
            </>
          )}

          <button
            onClick={() => window.location.href = "/dashboard/security"}
            className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Back to Security Settings
          </button>
        </div>
      )}
    </div>
  );
}
