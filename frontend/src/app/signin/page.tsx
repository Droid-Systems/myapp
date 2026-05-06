
"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SignInSkeleton from "@/components/SignInSkeleton";
import axios from "axios";
import { api } from "@/lib/api";

/** Returns the correct home route based on the user's role. */
function getHomeRoute(user: any): string {
  const role = user?.role;
  return role === "admin" || role === "superadmin" ? "/admin/users" : "/dashboard";
}

function SigninContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);
  const [sessionReason, setSessionReason] = useState<string | null>(null);
  const [showExistingSessionModal, setShowExistingSessionModal] = useState(false);
  const [existingSessionData, setExistingSessionData] = useState<any>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // Redirect if already logged in (unless coming from logout/timeout)
  useEffect(() => {
    const reason = searchParams.get('reason');
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    // Show warning for session timeout, expiration, revocation, or account deletion
    if (reason === 'session_timeout' || reason === 'session_expired' || reason === 'session_revoked' || reason === 'account_deleted') {
      setSessionReason(reason);
      setSessionTimeoutWarning(true);
      setTimeout(() => setSessionTimeoutWarning(false), 10000);

      // Remove the reason parameter from URL to prevent showing warning on refresh
      router.replace("/signin", { scroll: false });
      return;
    }

    // Redirect to correct home based on role if already logged in
    // Note: Actual auth is in httpOnly cookies, isLoggedIn is just a flag
    if (isLoggedIn === "true" && !reason) {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      router.replace(getHomeRoute(storedUser));
    }
  }, [searchParams, router]);

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const storeSessionAndRedirect = async (data: { user: any; accessToken?: string; refreshToken?: string }) => {
    // Store tokens in API client for Bearer header auth
    if (data.accessToken && data.refreshToken) {
      api.setTokens(data.accessToken, data.refreshToken);
    }
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("rememberMe", String(rememberMe));
    localStorage.setItem("user", JSON.stringify(data.user));

    // Store user data from response
    if (data.user.email) {
      localStorage.setItem("userEmail", data.user.email);
    }

    if (data.user.firstName || data.user.lastName) {
      const userName = `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim();
      localStorage.setItem("userName", userName);
    }

    if (data.user.profilePhoto) {
      localStorage.setItem("userProfilePicture", data.user.profilePhoto);
    }

    // Dispatch custom event to notify Header of auth state change
    window.dispatchEvent(new Event("authStateChanged"));

    // Wait briefly for cookies to be fully stored by the browser before navigating
    await new Promise(resolve => setTimeout(resolve, 200));

    const redirectTo = searchParams.get("redirect");
    window.location.href = redirectTo || getHomeRoute(data.user);
  };

  const handleForceLogin = async () => {
    setIsLoading(true);
    setShowExistingSessionModal(false);
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/force-login`,
        { email, password, rememberMe },
        { withCredentials: true } // Send and receive httpOnly cookies
      );
      if (response.data.success) {
        storeSessionAndRedirect(response.data.data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handle2FAVerification = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    setIsLoading(true);

    console.log("Sending 2FA verification with code:", twoFactorCode);

    try {
      // Backend requires email, password, AND 2FA code for verification
      const payload = {
        email,
        password,
        code: twoFactorCode,  // Backend expects 'code' as the field name
        rememberMe,
      };

      console.log("2FA verification payload:", payload);

      const response = await axios.post(
        `${API_URL}/api/auth/verify-2fa-login`,
        payload,
        { withCredentials: true }
      );

      console.log("2FA verification response:", response.data);

      if (response.data.success) {
        // Handle both possible response structures:
        // 1. { success: true, data: { user: {...} } } - nested structure
        // 2. { success: true, user: {...} } - direct structure
        const userData = response.data.data || response.data;

        console.log("User data extracted:", userData);

        if (userData && userData.user) {
          storeSessionAndRedirect(userData);
        } else {
          console.error("No user data in response:", response.data);
          setError("Login successful but user data is missing. Please try again.");
          setIsLoading(false);
        }
      } else {
        setError("2FA verification failed. Please try again.");
        setIsLoading(false);
        setTwoFactorCode(""); // Clear the code for retry
      }
    } catch (err: any) {
      console.error("2FA verification error:", err);
      console.log("Error response status:", err.response?.status);
      console.log("Error response data:", err.response?.data);
      console.log("Error message:", err.message);

      const errorMessage =
        err.response?.data?.message || "Invalid 2FA code. Please try again.";
      setError(errorMessage);
      setIsLoading(false);
      setTwoFactorCode(""); // Clear the code for retry

      // Important: Keep requires2FA true so we stay on the 2FA form
      // Do NOT redirect or change the form state
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setRequiresVerification(false);

    setIsLoading(true);

    try {
      // Call backend login API using axios
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password, rememberMe },
        { withCredentials: true } // Send and receive httpOnly cookies
      );

      console.log("Login response:", response.data);

      // Check if 2FA is required in the response (even on success)
      const responseData = response.data;
      const requires2FACheck =
        responseData?.requires2FA ||
        responseData?.requiresTwoFactor ||
        responseData?.require2FA ||
        responseData?.code === "REQUIRE_2FA" ||
        responseData?.code === "TWO_FACTOR_REQUIRED" ||
        responseData?.data?.requires2FA ||
        responseData?.data?.requiresTwoFactor ||
        responseData?.message?.toLowerCase().includes("2fa") ||
        responseData?.message?.toLowerCase().includes("two-factor");

      if (requires2FACheck) {
        console.log("2FA is required (from success response), showing 2FA input");
        setRequires2FA(true);
        setError("");
        setIsLoading(false);
        return;
      }

      if (response.data.success) {
        storeSessionAndRedirect(response.data.data);
      } else {
        setError("Login failed. Please try again.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      console.log("Error response data:", err.response?.data);
      console.log("Error response status:", err.response?.status);

      // Save to localStorage for debugging (persists across refresh)
      localStorage.setItem("lastLoginError", JSON.stringify({
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        timestamp: new Date().toISOString()
      }));

      // Another admin account is already logged in — hard block
      if (err.response?.status === 409 && err.response?.data?.adminConflict) {
        setError(err.response.data.message);
        setIsLoading(false);
        return;
      }

      // Same admin already on another device — hard block, must log out first
      if (err.response?.status === 409 && err.response?.data?.adminDeviceConflict) {
        setError(err.response.data.message);
        setIsLoading(false);
        return;
      }

      // Active session on another device - show warning modal
      if (err.response?.status === 409 && err.response?.data?.requiresForceLogin) {
        setExistingSessionData(err.response.data);
        setShowExistingSessionModal(true);
        setIsLoading(false);
        return;
      }

      // Check if 2FA is required - handle multiple possible response formats
      const responseData = err.response?.data;
      const requires2FACheck =
        responseData?.requires2FA ||
        responseData?.requiresTwoFactor ||
        responseData?.require2FA ||
        responseData?.code === "REQUIRE_2FA" ||
        responseData?.code === "TWO_FACTOR_REQUIRED" ||
        (err.response?.status === 403 && responseData?.message?.toLowerCase().includes("2fa"));

      if (requires2FACheck) {
        console.log("2FA is required, showing 2FA input");
        setRequires2FA(true);
        setError("");
        setIsLoading(false);
        return;
      }

      // Check if email verification is required
      if (err.response?.data?.requiresVerification) {
        setRequiresVerification(true);
        setUnverifiedEmail(err.response.data.email || email);
        setError(err.response.data.message);
      } else {
        const errorMessage =
          err.response?.data?.message || "Invalid email or password. Please try again.";
        setError(errorMessage);
      }
      setIsLoading(false);
    }
  };
  const formatLastActive = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <>
      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-black">
          <div className="relative flex flex-col items-center justify-center px-4">
            {/* Animated gradient spinner with flowing particle spiral */}
            <div className="relative">
              {/* Outer ring with gradient */}
              <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full bg-gradient-to-tr from-primary via-blue-500 to-primary opacity-75 blur-sm sm:h-24 sm:w-24"></div>

              {/* Middle ring */}
              <div className="absolute inset-2 h-16 w-16 animate-spin rounded-full bg-gradient-to-br from-primary/50 to-transparent sm:h-20 sm:w-20" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>

              {/* Flowing particle spiral - neon colors */}
              <div className="absolute inset-0 h-20 w-20 sm:h-24 sm:w-24">
                {/* Pink particle */}
                <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 animate-[particle-spiral_3s_ease-in-out_infinite] sm:h-24 sm:w-24">
                  <div className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-pink-500 blur-[1px] sm:h-3 sm:w-3" style={{ boxShadow: '0 0 15px rgba(236, 72, 153, 0.9)' }}></div>
                </div>

                {/* Blue particle */}
                <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 animate-[particle-spiral_3s_ease-in-out_infinite_0.6s] sm:h-24 sm:w-24">
                  <div className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-blue-500 blur-[1px] sm:h-3 sm:w-3" style={{ boxShadow: '0 0 15px rgba(59, 130, 246, 0.9)' }}></div>
                </div>

                {/* Green particle */}
                <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 animate-[particle-spiral_3s_ease-in-out_infinite_1.2s] sm:h-24 sm:w-24">
                  <div className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-green-500 blur-[1px] sm:h-3 sm:w-3" style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.9)' }}></div>
                </div>

                {/* Yellow particle */}
                <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 animate-[particle-spiral_3s_ease-in-out_infinite_1.8s] sm:h-24 sm:w-24">
                  <div className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-yellow-500 blur-[1px] sm:h-3 sm:w-3" style={{ boxShadow: '0 0 15px rgba(234, 179, 8, 0.9)' }}></div>
                </div>

                {/* Red particle */}
                <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 animate-[particle-spiral_3s_ease-in-out_infinite_2.4s] sm:h-24 sm:w-24">
                  <div className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-red-500 blur-[1px] sm:h-3 sm:w-3" style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.9)' }}></div>
                </div>
              </div>

              {/* Inner ring with logo */}
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl dark:bg-gray-900 sm:h-24 sm:w-24">
                <div className="text-2xl font-bold text-primary sm:text-3xl">A</div>
              </div>
            </div>

            <style jsx>{`
              @keyframes particle-spiral {
                0% {
                  transform: rotate(0deg) scale(0.8);
                  opacity: 0;
                }
                15% {
                  opacity: 1;
                }
                50% {
                  transform: rotate(180deg) scale(1.1);
                  opacity: 1;
                }
                85% {
                  opacity: 1;
                }
                100% {
                  transform: rotate(360deg) scale(0.8);
                  opacity: 0;
                }
              }
            `}</style>

            {/* Loading text with animation */}
            <div className="mt-8 text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white sm:text-xl">
                Signing In
              </h3>
              <div className="flex items-center justify-center gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Session Warning Modal */}
      {showExistingSessionModal && existingSessionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark w-full max-w-md rounded-xl shadow-2xl p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white">Already Logged In</h3>
                <p className="text-sm text-body-color">Active session detected on another device</p>
              </div>
            </div>

            <div className="mb-5 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-body-color">Current Active Session</p>
              <div className="flex items-center gap-2 text-sm text-dark dark:text-white">
                <svg className="h-4 w-4 text-body-color shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{existingSessionData.existingSession.device} · {existingSessionData.existingSession.browser}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark dark:text-white">
                <svg className="h-4 w-4 text-body-color shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{existingSessionData.existingSession.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-body-color">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last active: {formatLastActive(existingSessionData.existingSession.lastActive)}</span>
              </div>
            </div>

            <p className="mb-6 text-sm text-body-color">
              Continuing will log out the other device immediately. Only one active session is allowed at a time.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowExistingSessionModal(false); setIsLoading(false); }}
                className="flex-1 rounded-xl border border-stroke bg-transparent px-6 py-3 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleForceLogin}
                className="flex-1 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                Continue on This Device
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="relative z-10 overflow-hidden pt-16 pb-16 md:pt-20 md:pb-20 lg:pt-24 lg:pb-28">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="mx-auto max-w-[500px]">
                <Link href="/" className="mb-3 flex items-center gap-1.5 text-sm font-medium text-body-color hover:text-primary transition-colors duration-200 dark:text-body-color-dark dark:hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                  </svg>
                  Home
                </Link>
              </div>
              <div className="shadow-three dark:bg-dark mx-auto max-w-[500px] rounded-2xl bg-white px-6 py-10 sm:p-[60px]">
                <div className="mb-8 flex justify-center">
                  <a href="/">
                    <img src="/images/logo/A-LogoB.png" alt="Alvarado Associates" className="h-12 dark:hidden" />
                    <img src="/images/logo/A-Logo.png" alt="Alvarado Associates" className="hidden h-12 dark:block" />
                  </a>
                </div>
                <h3 className="mb-2 text-center text-2xl font-bold text-black sm:text-3xl dark:text-white">
                  Sign in to your account
                </h3>
                <p className="text-body-color mb-6 text-center text-base font-medium">
                  Login to your account for a faster checkout.
                </p>

                {/* Session Timeout / Revoked Warning */}
                {sessionTimeoutWarning && (
                  <div className="mb-6 rounded-lg bg-yellow-100 p-4 dark:bg-yellow-900/30">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        {sessionReason === 'session_revoked'
                          ? 'Your session was revoked from another device. Please sign in again.'
                          : sessionReason === 'account_deleted'
                          ? 'Your account has been deactivated. Contact support to restore access.'
                          : sessionReason === 'session_expired'
                          ? 'Your session expired. Please sign in again.'
                          : 'Your session expired due to inactivity. Please sign in again.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color hover:border-primary hover:bg-primary/5 hover:text-primary dark:hover:border-primary dark:hover:bg-primary/5 dark:hover:text-primary flex w-full sm:w-auto sm:min-w-[340px] items-center justify-center rounded-xl border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="mr-3">
                    {isGoogleLoading ? (
                      <svg className="h-5 w-5 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_95:967)">
                          <path
                            d="M20.0001 10.2216C20.0122 9.53416 19.9397 8.84776 19.7844 8.17725H10.2042V11.8883H15.8277C15.7211 12.539 15.4814 13.1618 15.1229 13.7194C14.7644 14.2769 14.2946 14.7577 13.7416 15.1327L13.722 15.257L16.7512 17.5567L16.961 17.5772C18.8883 15.8328 19.9997 13.266 19.9997 10.2216"
                            fill="#4285F4"
                          />
                          <path
                            d="M10.2042 20.0001C12.9592 20.0001 15.2721 19.1111 16.9616 17.5778L13.7416 15.1332C12.88 15.7223 11.7235 16.1334 10.2042 16.1334C8.91385 16.126 7.65863 15.7206 6.61663 14.9747C5.57464 14.2287 4.79879 13.1802 4.39915 11.9778L4.27957 11.9878L1.12973 14.3766L1.08856 14.4888C1.93689 16.1457 3.23879 17.5387 4.84869 18.512C6.45859 19.4852 8.31301 20.0005 10.2046 20.0001"
                            fill="#34A853"
                          />
                          <path
                            d="M4.39911 11.9777C4.17592 11.3411 4.06075 10.673 4.05819 9.99996C4.0623 9.32799 4.17322 8.66075 4.38696 8.02225L4.38127 7.88968L1.19282 5.4624L1.08852 5.51101C0.372885 6.90343 0.00012207 8.4408 0.00012207 9.99987C0.00012207 11.5589 0.372885 13.0963 1.08852 14.4887L4.39911 11.9777Z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M10.2042 3.86663C11.6663 3.84438 13.0804 4.37803 14.1498 5.35558L17.0296 2.59996C15.1826 0.901848 12.7366 -0.0298855 10.2042 -3.6784e-05C8.3126 -0.000477834 6.45819 0.514732 4.8483 1.48798C3.2384 2.46124 1.93649 3.85416 1.08813 5.51101L4.38775 8.02225C4.79132 6.82005 5.56974 5.77231 6.61327 5.02675C7.6568 4.28118 8.91279 3.87541 10.2042 3.86663Z"
                            fill="#EB4335"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_95:967">
                            <rect width="20" height="20" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    )}
                  </span>
                  {isGoogleLoading ? "Redirecting to Google..." : "Sign in with Google"}
                </button>
                </div>

                {/* <button className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color hover:border-primary hover:bg-primary/5 hover:text-primary dark:hover:border-primary dark:hover:bg-primary/5 dark:hover:text-primary mb-6 flex w-full items-center justify-center rounded-xl border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:hover:shadow-none">
                  <span className="mr-3">
                    <svg
                      fill="currentColor"
                      width="22"
                      height="22"
                      viewBox="0 0 64 64"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M32 1.7998C15 1.7998 1 15.5998 1 32.7998C1 46.3998 9.9 57.9998 22.3 62.1998C23.9 62.4998 24.4 61.4998 24.4 60.7998C24.4 60.0998 24.4 58.0998 24.3 55.3998C15.7 57.3998 13.9 51.1998 13.9 51.1998C12.5 47.6998 10.4 46.6998 10.4 46.6998C7.6 44.6998 10.5 44.6998 10.5 44.6998C13.6 44.7998 15.3 47.8998 15.3 47.8998C18 52.6998 22.6 51.2998 24.3 50.3998C24.6 48.3998 25.4 46.9998 26.3 46.1998C19.5 45.4998 12.2 42.7998 12.2 30.9998C12.2 27.5998 13.5 24.8998 15.4 22.7998C15.1 22.0998 14 18.8998 15.7 14.5998C15.7 14.5998 18.4 13.7998 24.3 17.7998C26.8 17.0998 29.4 16.6998 32.1 16.6998C34.8 16.6998 37.5 16.9998 39.9 17.7998C45.8 13.8998 48.4 14.5998 48.4 14.5998C50.1 18.7998 49.1 22.0998 48.7 22.7998C50.7 24.8998 51.9 27.6998 51.9 30.9998C51.9 42.7998 44.6 45.4998 37.8 46.1998C38.9 47.1998 39.9 49.1998 39.9 51.9998C39.9 56.1998 39.8 59.4998 39.8 60.4998C39.8 61.2998 40.4 62.1998 41.9 61.8998C54.1 57.7998 63 46.2998 63 32.5998C62.9 15.5998 49 1.7998 32 1.7998Z" />
                    </svg>
                  </span>
                  Sign in with Github
                </button> */}
                <div className="mb-5 flex items-center">
                  <span className="bg-body-color/50 block h-[1px] flex-1"></span>
                  <p className="text-body-color shrink-0 px-3 text-center text-sm sm:px-5 sm:text-base font-medium">
                    Or, sign in with your email
                  </p>
                  <span className="bg-body-color/50 block h-[1px] flex-1"></span>
                </div>
                {requires2FA ? (
                  <form onSubmit={handle2FAVerification}>
                    {error && (
                      <div className="mb-6 rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <p>{error}</p>
                      </div>
                    )}
                    <div className="mb-6 rounded-lg bg-blue-100 p-4 dark:bg-blue-900/30">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Two-factor authentication is required. Please enter your 6-digit code from your authenticator app.
                      </p>
                    </div>
                    <div className="mb-5">
                      <label
                        htmlFor="twoFactorCode"
                        className="text-dark mb-3 block text-sm dark:text-white"
                      >
                        Authentication Code
                      </label>
                      <input
                        type="text"
                        id="twoFactorCode"
                        name="one-time-code"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        required
                        maxLength={6}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xl border bg-[#f8f8f8] px-6 py-3 text-base text-center tracking-widest outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                      />
                    </div>
                    <div className="mb-6 flex justify-center">
                      <button
                        type="submit"
                        disabled={isLoading || twoFactorCode.length !== 6}
                        className="shadow-submit dark:shadow-submit-dark bg-primary hover:bg-primary/90 flex w-full sm:w-auto sm:min-w-[340px] items-center justify-center gap-2 rounded-xl px-9 py-4 text-base font-medium text-white duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading && (
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        )}
                        {isLoading ? "Verifying..." : "Verify & Sign In"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRequires2FA(false);
                        setTwoFactorCode("");
                        setError("");
                      }}
                      className="text-primary text-sm hover:underline"
                    >
                      ← Back to login
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div className={`mb-6 rounded-lg p-4 text-sm ${requiresVerification ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        <p className="mb-3">{error}</p>
                        {requiresVerification && (
                          <button
                            type="button"
                            onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}`)}
                            className="mt-2 w-full rounded-sm bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 transition-all duration-300"
                          >
                            Verify Email Now
                          </button>
                        )}
                      </div>
                    )}
                    <div className="mb-5">
                    <label
                      htmlFor="email"
                      className="text-dark mb-3 block text-sm dark:text-white"
                    >
                      Your Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your Email"
                      required
                      className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xl border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                    />
                  </div>
                  <div className="mb-5">
                    <label
                      htmlFor="password"
                      className="text-dark mb-3 block text-sm dark:text-white"
                    >
                      Your Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your Password"
                        required
                        className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xl border bg-[#f8f8f8] px-6 py-3 pr-12 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-5 flex flex-col justify-between sm:flex-row sm:items-center">
                    <div className="mb-4 sm:mb-0">
                      <label
                        htmlFor="checkboxLabel"
                        className="text-body-color flex cursor-pointer items-center text-sm font-medium select-none"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            id="checkboxLabel"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`box mr-4 flex h-5 w-5 items-center justify-center rounded-sm border transition-colors ${rememberMe ? "border-primary bg-primary" : "border-body-color/20 dark:border-white/10"}`}>
                            <span className={rememberMe ? "opacity-100" : "opacity-0"}>
                              <svg
                                width="11"
                                height="8"
                                viewBox="0 0 11 8"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                                  fill="white"
                                  stroke="white"
                                  strokeWidth="0.4"
                                />
                              </svg>
                            </span>
                          </div>
                        </div>
                        Keep me signed in
                      </label>
                    </div>
                    <div>
                      <Link
                        href="/forgot-password"
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </div>
                  <div className="mb-6 flex justify-center">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="shadow-submit dark:shadow-submit-dark bg-primary hover:bg-primary/90 flex w-full sm:w-auto sm:min-w-[340px] items-center justify-center gap-2 rounded-xl px-9 py-4 text-base font-medium text-white duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading && (
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                  </div>
                </form>
                )}
                <p className="text-body-color text-center text-base font-medium">
                  Don't you have an account?{" "}
                  <Link href="/signup" className="text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 z-[-1]">
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

const SigninPage = () => {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SigninContent />
    </Suspense>
  );
};

export default SigninPage;
