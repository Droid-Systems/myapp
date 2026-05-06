"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

interface SubMenuItem {
  name: string;
  href: string;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  hasDropdown?: boolean;
  subItems?: SubMenuItem[];
}

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ isOpen, onClose }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Collapse all dropdowns when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setOpenDropdowns({});
    }
  }, [isOpen]);

  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard/overview",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: "Portfolio Market",
      href: "/dashboard/property-market",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      hasDropdown: true,
      subItems: [
        { name: "Listed Properties", href: "/dashboard/property-market/properties" },
        { name: "Power Projects", href: "/dashboard/property-market/power-projects" },
        { name: "My Portfolio", href: "/dashboard/investments" },
      ],
    },
    {
      name: "Add Fund",
      href: "/dashboard/add-fund",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      name: "Money Transfer",
      href: "/dashboard/money-transfer",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      name: "Transactions History",
      href: "/dashboard/transaction",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: "Withdraw Fund",
      href: "/dashboard/withdraw-fund",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: "Referrals/Commissions",
      href: "/dashboard/my-referral",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      name: "Security",
      href: "/dashboard/security",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: "Documents",
      href: "/dashboard/documents",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-screen w-64 overflow-y-auto bg-black transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      {/* Logo and Close button */}
      <div className="relative flex h-16 items-center border-b border-gray-800 px-4">
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="relative z-10 ml-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white hover:bg-gray-800 lg:hidden"
          aria-label="Close sidebar"
        >
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {/* Logo - absolutely centered - hidden on mobile, shown on desktop */}
        <div className="absolute inset-0 hidden items-center justify-center lg:flex">
          <Image
            src="/images/logo/A-Logo.png"
            alt="Golden Units Logo"
            width={120}
            height={48}
            className="h-8 w-auto"
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="px-4 py-4">
        {/* Home Button */}
        <Link
          href="/"
          onClick={onClose}
          className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Home</span>
        </Link>

        {menuItems.map((item, index) => (
          <div key={index}>
            {item.hasDropdown ? (
              <>
                <button
                  onClick={() => toggleDropdown(item.name)}
                  className="mb-2 flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  <svg
                    className={`h-4 w-4 transition-transform ${openDropdowns[item.name] ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openDropdowns[item.name] && item.subItems && (
                  <div className="mb-2 ml-4 space-y-1">
                    {item.subItems.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.href}
                        onClick={onClose}
                        className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          pathname === subItem.href
                            ? "bg-gray-800 text-white"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                onClick={onClose}
                className={`mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-gray-800 text-white"
                    : "text-white hover:bg-gray-800"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
