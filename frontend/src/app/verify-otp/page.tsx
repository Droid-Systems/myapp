"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Toast from "@/components/Toast";

function VerifyOTPContent() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email) {
      setError("Email is missing. Please try signing up again.");
      setIsLoading(false);
      return;
    }

    try {
      // Call backend verify-otp API using axios
      const response = await axios.post(
        `${API_URL}/api/auth/verify-otp`,
        {
          email,
          code: otp,
        }
      );

      if (response.data.success) {
        setToast({ message: "Email verified successfully! You can now sign in.", type: "success" });
        setTimeout(() => router.push("/signin?verified=true"), 1500);
      } else {
        setError("Verification failed. Please try again.");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      const errorMessage =
        error.response?.data?.message || "Invalid OTP code. Please try again.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email is missing. Cannot resend OTP.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/resend-otp`,
        { email }
      );

      if (response.data.success) {
        setToast({ message: "A new verification code has been sent to your email.", type: "success" });
        setError("");
      } else {
        setError("Failed to resend verification code. Please try again.");
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to resend verification code.";
      setError(errorMessage);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    <section className="relative z-10 overflow-hidden pb-16 pt-36 md:pb-20 lg:pb-28 lg:pt-[180px]">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="shadow-three mx-auto max-w-[500px] rounded bg-white px-6 py-10 dark:bg-dark sm:p-[60px]">
              <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                Enter the OTP code
              </h3>
              <p className="mb-11 text-center text-base font-medium text-body-color">
                We sent an OTP code to {email ? `${email}` : "your email"}. Enter the code to continue.{" "}
                <button
                  onClick={handleResend}
                  className="text-primary hover:underline"
                >
                  Resend
                </button>
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-8">
                  <label
                    htmlFor="otp"
                    className="mb-3 block text-sm text-dark dark:text-white"
                  >
                    Enter code
                  </label>
                  <input
                    type="text"
                    name="otp"
                    placeholder="e.g 007y4y"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="border-stroke dark:text-body-color-dark dark:shadow-two w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:focus:border-primary dark:focus:shadow-none"
                    required
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>

                <div className="mb-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="shadow-submit dark:shadow-submit-dark flex w-full items-center justify-center rounded-sm bg-primary px-9 py-4 text-base font-medium text-white duration-300 hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </form>

              <p className="text-center text-base font-medium text-body-color">
                Remember your password?{" "}
                <Link href="/signin" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-0 z-[-1]">
        <svg
          width="1440"
          height="969"
          viewBox="0 0 1440 969"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <mask
            id="mask0_95:1005"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1440"
            height="969"
          >
            <rect width="1440" height="969" fill="#090E34" />
          </mask>
          <g mask="url(#mask0_95:1005)">
            <path
              opacity="0.1"
              d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
              fill="url(#paint0_linear_95:1005)"
            />
            <path
              opacity="0.1"
              d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
              fill="url(#paint1_linear_95:1005)"
            />
          </g>
          <defs>
            <linearGradient
              id="paint0_linear_95:1005"
              x1="1178.4"
              y1="151.853"
              x2="780.959"
              y2="453.581"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_95:1005"
              x1="160.5"
              y1="220"
              x2="1099.45"
              y2="1192.04"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
    </>
  );
}

export default function VerifyOTP() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}
