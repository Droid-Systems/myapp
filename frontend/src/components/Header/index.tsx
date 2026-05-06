"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggler from "./ThemeToggler";
import LanguageSelector from "./LanguageSelector";
import menuData from "./menuData";
import PasscodeModal from "@/components/PasscodeModal";
import { hasVerifiedAccess, getAccessToken } from "@/utils/passcode";
import axios from "axios";
import { api } from "@/lib/api";
import { Menu } from "@/types/menu";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const Header = () => {
  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Dynamic menu data with PDFs from API
  const [dynamicMenuData, setDynamicMenuData] = useState<Menu[]>(menuData);

  useEffect(() => {
    const checkAuthStatus = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(loggedIn);
      setIsAuthChecked(true);
    };

    // Check on mount
    checkAuthStatus();

    // Listen for storage changes (when localStorage is updated in another tab or programmatically)
    window.addEventListener("storage", checkAuthStatus);

    // Listen for custom auth event (for same-tab login/logout)
    window.addEventListener("authStateChanged", checkAuthStatus);

    return () => {
      window.removeEventListener("storage", checkAuthStatus);
      window.removeEventListener("authStateChanged", checkAuthStatus);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout API to clear httpOnly cookies
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear localStorage and tokens regardless of API call success
      api.clearTokens();
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("userProfilePicture");

      // Dispatch custom event to notify Header of auth state change
      window.dispatchEvent(new Event("authStateChanged"));

      // Update state immediately
      setIsLoggedIn(false);

      // Redirect to home page
      window.location.href = "/";
    }
  };

  // Fetch PDF documents from API
  useEffect(() => {
    const fetchPDFDocuments = async () => {
      try {
        console.log("Fetching PDFs from:", `${API_URL}/api/pdf/documents`);
        const response = await axios.get(`${API_URL}/api/pdf/documents`);

        console.log("PDF API Response:", response.data);

        if (response.data.success && response.data.data) {
          const pdfDocuments = response.data.data;

          console.log("PDF Documents loaded:", pdfDocuments.length);

          // Create submenu items from PDF documents WITHOUT passcode
          // Passcode will be added after user enters it via modal
          const pdfSubmenu = pdfDocuments.map((pdf: any, index: number) => {
            console.log(`PDF ${index + 1}:`, pdf.title, "URL:", pdf.fileUrl);
            return {
              id: 40 + index + 1,
              title: pdf.title,
              path: `/pdf-viewer?docId=${encodeURIComponent(pdf.id)}&title=${encodeURIComponent(pdf.title)}`,
              newTab: true,
            };
          });

          console.log("Generated PDF submenu:", pdfSubmenu);

          // Update menu data with dynamic PDFs
          const updatedMenuData = menuData.map(item => {
            if (item.title === "Documents") {
              return {
                ...item,
                submenu: pdfSubmenu
              };
            }
            return item;
          });

          setDynamicMenuData(updatedMenuData);
        } else {
          console.warn("No PDF data received from API");
        }
      } catch (error) {
        console.error("Failed to fetch PDF documents:", error);
        // Keep static menu data on error
        setDynamicMenuData(menuData);
      }
    };

    fetchPDFDocuments();
  }, []);

  // Navbar toggle
  const [navbarOpen, setNavbarOpen] = useState(false);
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  // Sticky Navbar
  const [sticky, setSticky] = useState(false);
  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true);
    } else {
      setSticky(false);
    }
  };
  useEffect(() => {
    window.addEventListener("scroll", handleStickyNavbar);
  });

  // submenu handler
  const [openIndex, setOpenIndex] = useState(-1);
  const handleSubmenu = (index) => {
    if (openIndex === index) {
      setOpenIndex(-1);
    } else {
      setOpenIndex(index);
    }
  };

  // Reset submenu when mobile menu closes
  useEffect(() => {
    if (!navbarOpen) {
      setOpenIndex(-1);
    }
  }, [navbarOpen]);

  const usePathName = usePathname();

  // Check if current path matches any submenu item
  const isSubmenuActive = (submenu: any[]) => {
    if (!submenu) return false;
    return submenu.some(item => usePathName === item.path || usePathName?.startsWith(item.path + '/'));
  };

  // Passcode modal for document access
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<{
    path: string;
    title: string;
  } | null>(null);

  // Handle document link click
  const handleDocumentClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string,
    title: string
  ) => {
    // Check if user already has verified access
    if (hasVerifiedAccess()) {
      // Get the stored JWT token and add it to the URL
      const token = getAccessToken();
      if (token) {
        e.preventDefault();
        const urlWithToken = `${path}&token=${encodeURIComponent(token)}`;
        window.open(urlWithToken, "_blank");
        setNavbarOpen(false);
        return;
      }
    }

    // Prevent default navigation
    e.preventDefault();
    // Store the document info
    setPendingDocument({ path, title });
    // Open passcode modal
    setIsPasscodeModalOpen(true);
    // Close mobile menu if open
    setNavbarOpen(false);
  };

  // Handle successful passcode verification
  const handlePasscodeSuccess = (token: string) => {
    if (pendingDocument) {
      const urlWithToken = `${pendingDocument.path}&token=${encodeURIComponent(token)}`;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        // Navigate in same tab on mobile to avoid popup blocking
        window.location.href = urlWithToken;
      } else {
        // Desktop: open the pdf-viewer page in a new tab
        window.open(urlWithToken, "_blank");
      }

      setPendingDocument(null);
    }
  };

  return (
    <>
      <header
        className="header fixed top-0 left-0 z-9999 flex w-full items-center bg-white/90 backdrop-blur-sm dark:bg-gray-dark/90"
      >
        <div className="container">
          <div className="relative -mx-4 flex items-center justify-between min-h-[60px] xlg:min-h-0">
            {/* Mobile Layout: Language & Theme on Left */}
            <div className="flex items-center gap-3 px-4 py-4 xlg:hidden xlg:py-0">
              <LanguageSelector onMenuClose={() => setNavbarOpen(false)} />
              <ThemeToggler />
            </div>

            {/* Mobile Layout: Centered Logo */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 xlg:hidden">
              <Link
                href="/"
                className={`header-logo block ${
                  sticky ? "py-4 lg:py-2" : "py-6"
                } `}
              >
                {/* Light mode logo */}
                <Image
                  src="/images/logo/A-LogoB.png"
                  alt="logo"
                  width={140}
                  height={30}
                  className="block dark:hidden"
                />
                {/* Dark mode logo */}
                <Image
                  src="/images/logo/A-Logo.png"
                  alt="logo"
                  width={140}
                  height={30}
                  className="hidden dark:block"
                />
              </Link>
            </div>

            {/* Desktop Layout: Logo on Left */}
            <div className="hidden w-60 max-w-full px-4 xlg:block xl:mr-6 -ml-12">
              <Link
                href="/"
                className={`header-logo block w-full ${
                  sticky ? "py-4 lg:py-2" : "py-6"
                } `}
              >
                {/* Light mode logo */}
                <Image
                  src="/images/logo/A-LogoB.png"
                  alt="logo"
                  width={140}
                  height={30}
                  className="w-full block dark:hidden"
                />
                {/* Dark mode logo */}
                <Image
                  src="/images/logo/A-Logo.png"
                  alt="logo"
                  width={140}
                  height={30}
                  className="w-full hidden dark:block"
                />
              </Link>
            </div>

            <div className="flex w-full items-center justify-between px-4">
              <div>
                <button
                  onClick={navbarToggleHandler}
                  id="navbarToggler"
                  aria-label="Mobile Menu"
                  className="absolute top-1/2 right-4 flex h-10 w-10 translate-y-[-50%] items-center justify-center rounded-lg border border-white outline-none xlg:hidden dark:border-white"
                >
                  {navbarOpen ? (
                    <svg
                      className="h-6 w-6 text-black dark:text-white"
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
                  ) : (
                    <svg
                      className="h-6 w-6 text-black dark:text-white"
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
                  )}
                </button>
                <nav
                  id="navbarCollapse"
                  className={`navbar border-body-color/50 dark:border-body-color/20 dark:bg-dark absolute right-0 z-30 w-[250px] rounded border-[.5px] bg-white px-6 py-4 duration-300 xlg:visible xlg:static xlg:w-auto xlg:border-none xlg:!bg-transparent xlg:p-0 xlg:opacity-100 ${
                    navbarOpen
                      ? "visibility top-full opacity-100"
                      : "invisible top-[120%] opacity-0"
                  }`}
                >
                  <ul className="block xlg:flex xlg:space-x-12">
                    {dynamicMenuData.map((menuItem, index) => (
                      <li key={menuItem.id || menuItem.title} className="group relative">
                        {menuItem.path ? (
                          <Link
                            href={menuItem.path}
                            onClick={() => setNavbarOpen(false)}
                            className={`flex py-2 text-base xlg:mr-0 xlg:inline-flex xlg:px-0 xlg:py-6 ${
                              usePathName === menuItem.path
                                ? "text-primary dark:text-white"
                                : "text-dark hover:text-primary dark:text-white/70 dark:hover:text-white"
                            }`}
                          >
                            {menuItem.title}
                          </Link>
                        ) : (
                          <>
                            <p
                              onClick={() => handleSubmenu(index)}
                              className={`flex cursor-pointer items-center justify-between py-2 text-base xlg:mr-0 xlg:inline-flex xlg:px-0 xlg:py-6 ${
                                isSubmenuActive(menuItem.submenu)
                                  ? "text-primary dark:text-white"
                                  : "text-dark group-hover:text-primary dark:text-white/70 dark:group-hover:text-white"
                              }`}
                            >
                              {menuItem.title}
                              <span className="pl-3">
                                <svg width="25" height="24" viewBox="0 0 25 24">
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M6.29289 8.8427C6.68342 8.45217 7.31658 8.45217 7.70711 8.8427L12 13.1356L16.2929 8.8427C16.6834 8.45217 17.3166 8.45217 17.7071 8.8427C18.0976 9.23322 18.0976 9.86639 17.7071 10.2569L12 15.964L6.29289 10.2569C5.90237 9.86639 5.90237 9.23322 6.29289 8.8427Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                            </p>
                            <div
                              className={`submenu dark:bg-dark relative top-full left-0 rounded-sm bg-white transition-[top] duration-300 group-hover:opacity-100 xlg:invisible xlg:absolute xlg:top-[110%] xlg:block xlg:w-max xlg:min-w-[150px] xlg:p-4 xlg:opacity-0 xlg:shadow-lg xlg:group-hover:visible xlg:group-hover:top-full ${
                                openIndex === index ? "block" : "hidden"
                              }`}
                            >
                              {menuItem.submenu.map((submenuItem, index) => {
                                const isActive = usePathName === submenuItem.path || usePathName?.startsWith(submenuItem.path + '/');
                                const itemKey = submenuItem.id || submenuItem.path || `submenu-${index}`;
                                return submenuItem.newTab ? (
                                  <a
                                    href={submenuItem.path}
                                    key={itemKey}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                      // Check if this is a PDF document
                                      if (submenuItem.path.includes("/pdf-viewer")) {
                                        handleDocumentClick(
                                          e,
                                          submenuItem.path,
                                          submenuItem.title
                                        );
                                      } else {
                                        setNavbarOpen(false);
                                      }
                                    }}
                                    className={`block rounded-sm py-2.5 pl-4 pr-3 text-sm xlg:px-3 ${
                                      isActive
                                        ? "text-primary dark:text-white font-medium"
                                        : "text-dark hover:text-primary dark:text-white/70 dark:hover:text-white"
                                    }`}
                                  >
                                    {submenuItem.title}
                                  </a>
                                ) : (
                                  <Link
                                    href={submenuItem.path}
                                    key={itemKey}
                                    onClick={() => setNavbarOpen(false)}
                                    className={`block rounded-sm py-2.5 pl-4 pr-3 text-sm xlg:px-3 ${
                                      isActive
                                        ? "text-primary dark:text-white font-medium"
                                        : "text-dark hover:text-primary dark:text-white/70 dark:hover:text-white"
                                    }`}
                                  >
                                    {submenuItem.title}
                                  </Link>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </li>
                    ))}

                    {/* Mobile Sign In and Sign Up Links / Dashboard */}
                    {isAuthChecked && (
                      isLoggedIn ? (
                        <>
                          <li className="xlg:hidden">
                            <Link
                              href="/dashboard"
                              onClick={() => setNavbarOpen(false)}
                              className="ease-in-up shadow-btn hover:shadow-btn-hover bg-primary hover:bg-primary/90 mt-2 block rounded-full px-8 py-3 text-center text-base font-medium text-white transition duration-300"
                            >
                              Dashboard
                            </Link>
                          </li>
                          <li className="xlg:hidden">
                            <button
                              onClick={handleLogout}
                              className="text-dark hover:text-red-500 mt-2 flex w-full py-2 text-base dark:text-white/70 dark:hover:text-red-400"
                            >
                              Logout
                            </button>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="xlg:hidden">
                            <Link
                              href="/signin"
                              onClick={() => setNavbarOpen(false)}
                              className="text-dark hover:text-primary flex py-2 text-base dark:text-white/70 dark:hover:text-white"
                            >
                              Sign In
                            </Link>
                          </li>
                          <li className="xlg:hidden">
                            <Link
                              href="/signup"
                              onClick={() => setNavbarOpen(false)}
                              className="ease-in-up shadow-btn hover:shadow-btn-hover bg-primary hover:bg-primary/90 mt-2 block rounded-full px-8 py-3 text-center text-base font-medium text-white transition duration-300"
                            >
                              Sign Up
                            </Link>
                          </li>
                        </>
                      )
                    )}
                  </ul>
                </nav>
              </div>
              <div className="flex items-center justify-end gap-3 pr-16 xlg:pr-0 xlg:-mr-12">
                {isAuthChecked && (
                  isLoggedIn ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="ease-in-up shadow-btn hover:shadow-btn-hover bg-primary hover:bg-primary/90 hidden rounded-full px-8 py-3 text-base font-medium text-white transition duration-300 xlg:block xlg:px-9"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="text-dark hidden px-7 py-3 text-base font-medium hover:text-red-500 xlg:block dark:text-white dark:hover:text-red-400"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/signin"
                        className="text-dark hidden px-7 py-3 text-base font-medium hover:opacity-70 xlg:block dark:text-white"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="ease-in-up shadow-btn hover:shadow-btn-hover bg-primary hover:bg-primary/90 hidden rounded-full px-8 py-3 text-base font-medium text-white transition duration-300 xlg:block xlg:px-9"
                      >
                        Sign Up
                      </Link>
                    </>
                  )
                )}
                {/* Desktop Layout: Language & Theme on Right */}
                <div className="hidden items-center gap-3 xlg:flex">
                  <LanguageSelector onMenuClose={() => setNavbarOpen(false)} />
                  <ThemeToggler />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop - Click to close */}
      {navbarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm xlg:hidden"
          onClick={() => setNavbarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Passcode Modal for Document Access */}
      <PasscodeModal
        isOpen={isPasscodeModalOpen}
        onClose={() => {
          setIsPasscodeModalOpen(false);
          setPendingDocument(null);
        }}
        onSuccess={handlePasscodeSuccess}
        documentTitle={pendingDocument?.title || "Document"}
      />
    </>
  );
};

export default Header;
