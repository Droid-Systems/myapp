"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

function GlobalSessionTimeout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Don't run session timeout on auth pages (signin, signup, verify, reset password, etc.)
  const isAuthPage = pathname === "/signin" ||
                     pathname === "/signup" ||
                     pathname?.startsWith("/verify") ||
                     pathname?.startsWith("/reset-password") ||
                     pathname?.startsWith("/forgot-password") ||
                     pathname?.startsWith("/auth/");

  // Monitor authentication status continuously
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      // Tokens are in httpOnly cookies, just check the login flag
      setIsAuthenticated(isLoggedIn === "true");
    };

    // Check immediately
    checkAuth();

    // Check every 2 seconds to stay in sync
    const authInterval = setInterval(checkAuth, 2000);

    return () => clearInterval(authInterval);
  }, []);

  // Always call the hook (Rules of Hooks - must be called unconditionally)
  // But only show warning when user is authenticated AND not on auth pages
  const { showWarning, remainingSeconds, continueSession } = useSessionTimeout(isAuthPage);

  return (
    <>
      {/* Global Session Timeout Warning Modal - Only show if authenticated */}
      {isAuthenticated && showWarning && remainingSeconds > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-dark">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white">
                  Session Expiring Soon
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  You will be logged out due to inactivity
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-center dark:bg-yellow-900/20">
              <p className="mb-2 text-sm text-yellow-800 dark:text-yellow-300">
                Your session will expire in:
              </p>
              <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                {remainingSeconds}s
              </div>
            </div>

            <button
              onClick={continueSession}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Continue Session
            </button>
          </div>
        </div>
      )}

      {/* Logging Out Modal - Show when countdown reaches 0 */}
      {isAuthenticated && showWarning && remainingSeconds === 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-dark">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg className="h-6 w-6 animate-spin text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-lg font-bold text-black dark:text-white">
                Session Expired
              </h3>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                Logging you out...
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
      <GlobalSessionTimeout>
        {children}
      </GlobalSessionTimeout>
    </ThemeProvider>
  );
}
