"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/Admin/Sidebar";
import { api } from "@/lib/api";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn !== "true") {
      // Pass current path so signin can return the admin here after login
      const returnTo = encodeURIComponent(window.location.pathname);
      router.push(`/signin?redirect=${returnTo}`);
      return;
    }

    // Verify the user has admin/superadmin role by calling a protected endpoint
    api.adminGetUserStats()
      .then(() => setReady(true))
      .catch((err) => {
        if (err?.response?.status === 403 || err?.response?.status === 401) {
          router.push("/dashboard/overview");
        } else {
          // Network error or server issue — still allow in so they see an error in the page
          setReady(true);
        }
      });
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-1 dark:bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-1 dark:bg-black">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stroke bg-white px-4 dark:border-gray-700 dark:bg-gray-dark lg:ml-64">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stroke dark:border-gray-700 lg:hidden"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="text-sm font-semibold text-black dark:text-white lg:text-base">
          Admin Panel
        </span>

        <button
          onClick={() => {
            api.logout().finally(() => {
              localStorage.removeItem("isLoggedIn");
              localStorage.removeItem("user");
              localStorage.removeItem("userEmail");
              localStorage.removeItem("userName");
              localStorage.removeItem("userProfilePicture");
              router.push("/signin");
            });
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Logout
        </button>
      </div>

      {/* Page content */}
      <main className="lg:ml-64">
        <div className="p-4 pt-6 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
