"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "";
import Link from "next/link";
import DashboardSidebar from "@/components/Dashboard/Sidebar";
import ThemeToggler from "@/components/Header/ThemeToggler";
import NotificationPanel from "@/components/Dashboard/NotificationPanel";
import ProfileDropdown from "@/components/Dashboard/ProfileDropdown";
import { api } from "@/lib/api";
import Image from "next/image";

function SecuritySetupPrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-dark">

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 className="mb-2 text-center text-xl font-bold text-black dark:text-white">
          Complete Your Profile
        </h2>
        <p className="mb-7 text-center text-sm leading-relaxed text-body-color dark:text-body-color-dark">
          Two quick steps to secure your account and start investing.
        </p>

        {/* Steps */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/10">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-black dark:text-white">Two-Factor Authentication</p>
              <p className="text-xs text-body-color dark:text-body-color-dark">Extra layer of security on your login</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/10">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-black dark:text-white">Identity Verification (KYC)</p>
              <p className="text-xs text-body-color dark:text-body-color-dark">Required to activate your investment account</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <Link
          href="/dashboard/security"
          onClick={onDismiss}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Get Started
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <button
          onClick={onDismiss}
          className="w-full rounded-xl py-3 text-sm text-body-color transition hover:text-black dark:text-body-color-dark dark:hover:text-white"
        >
          Remind me later
        </button>
      </div>
    </div>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'notification' | 'profile' | null>(null);
  const [showSecurityPrompt, setShowSecurityPrompt] = useState(false);
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  // null = not yet checked (SSR / first render), false = not logged in, true = authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Resolve auth state client-side only to avoid SSR/hydration mismatch
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!loggedIn) {
      router.push("/signin");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Show security prompt only once per session (not on every page refresh)
  // sessionStorage is cleared when the browser tab is closed, so it resets on each new login session
  useEffect(() => {
    if (!isAuthenticated) return;
    if (sessionStorage.getItem("securityPromptChecked")) return;
    sessionStorage.setItem("securityPromptChecked", "true");

    api.getProfile()
      .then((res) => {
        const { twoFactorEnabled, kycStatus } = res.data || {};
        const kycComplete = kycStatus === "verified" || kycStatus === "approved" || kycStatus === "pending_review" || kycStatus === "pending";
        if (!twoFactorEnabled || !kycComplete) {
          setShowSecurityPrompt(true);
        }
      })
      .catch(() => {
        // silently fail
      });
  }, [isAuthenticated]);

  const dismissSecurityPrompt = () => {
    setShowSecurityPrompt(false);
  };

  // Listen for session_revoked via socket — instant logout when another device
  // force-logs in, replacing the old polling approach.
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem("_at");
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("session_revoked", () => {
      api.clearTokens();
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("userProfilePicture");
      window.dispatchEvent(new Event("authStateChanged"));
      router.push("/signin?reason=session_revoked");
    });

    socket.on("connect_error", () => {
      // Silent — JWT expiry (15 min) is the safety net if socket is unavailable
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, router]);

  // Don't render dashboard until auth is resolved (null = still checking)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-1 dark:bg-black">
      {/* Security Setup Prompt - shown once on first login */}
      {showSecurityPrompt && <SecuritySetupPrompt onDismiss={dismissSecurityPrompt} />}

      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="min-h-screen lg:ml-64">
        {/* Mobile Header with Hamburger */}
        <div className="sticky top-0 z-30 bg-white shadow-[0_8px_16px_-8px_rgba(0,0,0,0.1)] dark:bg-gray-dark dark:shadow-[0_8px_16px_-8px_rgba(0,0,0,0.3)] lg:hidden">
          {/* Top bar with hamburger, logo, and menu */}
          <div className="relative flex h-16 items-center justify-between px-4">
            {/* Left side - Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Open sidebar"
            >
              <svg
                className="h-6 w-6 text-gray-600 dark:text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Center - Logo/Brand */}
            <div className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
              <Link href="/" className="block">
                {/* Light mode logo */}
                <Image
                  src="/images/logo/A-LogoB.png"
                  alt="Logo"
                  width={120}
                  height={40}
                  className="block dark:hidden"
                />
                {/* Dark mode logo */}
                <Image
                  src="/images/logo/A-Logo.png"
                  alt="Logo"
                  width={120}
                  height={40}
                  className="hidden dark:block"
                />
              </Link>
            </div>

            {/* Right side - Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="More options"
            >
              <svg
                className="h-6 w-6 text-gray-600 dark:text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>

          {/* Dropdown Menu - Expands below when three-dot is clicked */}
          {mobileMenuOpen && (
            <>
              {/* Dropdown content */}
              <div className="relative z-50 h-16 border-t border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-dark">
                <div className="flex h-full items-center justify-between gap-4">
                  {/* Left side - Theme Toggler and Notification */}
                  <div className="flex items-center gap-2">
                    <ThemeToggler />
                    <NotificationPanel
                      isOpen={activeDropdown === 'notification'}
                      onToggle={() => setActiveDropdown(activeDropdown === 'notification' ? null : 'notification')}
                    />
                  </div>

                  {/* Right side - Profile Dropdown */}
                  <div className="flex items-center gap-2">
                    <ProfileDropdown
                      isOpen={activeDropdown === 'profile'}
                      onToggle={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Desktop Top Bar - Full Width */}
        <div className="fixed left-64 right-0 top-0 z-30 hidden h-16 items-center justify-end gap-3 border-b border-gray-200 bg-white px-6 shadow-sm dark:border-gray-800 dark:bg-black lg:flex">
          <ThemeToggler />
          <NotificationPanel />
          <ProfileDropdown />
        </div>

        {/* Page Content */}
        <div className="p-4 pb-14 pt-6 sm:p-6 sm:pb-14 lg:pb-14 lg:pt-20">{children}</div>

        {/* Footer - Fixed on both mobile and desktop */}
        <footer className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-center bg-[#f8f9fa] py-3 dark:bg-black lg:left-64">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <svg
              className="h-3.5 w-3.5"
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
            <span>Secured</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
