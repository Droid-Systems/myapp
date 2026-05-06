"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${baseUrl}${path}`;
};

interface ProfileDropdownProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const ProfileDropdown = ({ isOpen: controlledIsOpen, onToggle }: ProfileDropdownProps = {}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggleOpen = onToggle || (() => setInternalIsOpen(!internalIsOpen));

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch user data on mount
  useEffect(() => {
    // Load cached data from localStorage first for immediate display
    const storedEmail = localStorage.getItem("userEmail");
    const storedName = localStorage.getItem("userName");
    const storedPhoto = localStorage.getItem("userProfilePicture");

    console.log("📸 ProfileDropdown - Cached data:", {
      email: storedEmail,
      name: storedName,
      photo: storedPhoto
    });

    // Load cached data immediately
    if (storedEmail) setUserEmail(storedEmail);
    if (storedName) setUserName(storedName);
    if (storedPhoto) setProfilePhoto(storedPhoto);

    // Hide loading skeleton if we have name/email cached (show immediately for fast UX)
    // Photo will transition in smoothly when API returns if not cached
    const hasCachedData = storedEmail || storedName;
    if (hasCachedData) {
      setLoadingProfile(false);
    }

    const fetchUserData = async () => {
      try {
        const result = await api.getProfile();
        if (result.success && result.data) {
          const fullName = `${result.data.firstName} ${result.data.lastName}`;
          setUserName(fullName);
          setUserEmail(result.data.email);

          // Use API profile photo if available, otherwise keep the cached one (from Google OAuth)
          if (result.data.profilePhoto) {
            setProfilePhoto(result.data.profilePhoto);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        // Keep using localStorage data that was already set above
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserData();

    // Listen for profile photo updates
    const handlePhotoUpdate = (event: any) => {
      setProfilePhoto(event.detail.profilePhoto);
    };

    // Listen for full profile updates
    const handleProfileUpdate = (event: any) => {
      const profile = event.detail.profile;
      setUserName(`${profile.firstName} ${profile.lastName}`);
      setUserEmail(profile.email);
      setProfilePhoto(profile.profilePhoto);
    };

    window.addEventListener('profilePhotoUpdated', handlePhotoUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profilePhotoUpdated', handlePhotoUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Close the dropdown
        if (onToggle && isOpen) {
          onToggle();
        } else if (internalIsOpen) {
          setInternalIsOpen(false);
        }
      }
    };

    // Only add listener when dropdown is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onToggle, internalIsOpen]);


  const handleSignOut = () => {
    // Clear all auth data
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userProfilePicture");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    api.clearTokens();
    router.push("/signin");
  };


  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={toggleOpen}
        className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {/* Avatar */}
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-white">
          {loadingProfile ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-primary/50" />
          ) : getImageUrl(profilePhoto) ? (
            <Image
              src={getImageUrl(profilePhoto)!}
              alt={userName}
              width={40}
              height={40}
              className="h-full w-full object-cover transition-opacity duration-300"
              onError={() => {
                console.error("❌ Failed to load profile image:", getImageUrl(profilePhoto));
                setProfilePhoto(null); // Fallback to initials on error
              }}
            />
          ) : (
            <span className="text-sm font-semibold transition-opacity duration-300">
              {userName.split(" ").map(n => n.charAt(0).toUpperCase()).join("")}
            </span>
          )}
        </div>

        {/* Name - Always visible */}
        {loadingProfile ? (
          <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        ) : (
          <span className="text-sm font-medium text-black dark:text-white">
            {userName.split(" ")[0]}
          </span>
        )}

        {/* Dropdown Icon */}
        <svg
          className={`h-4 w-4 text-black transition-transform dark:text-white ${
            isOpen ? "rotate-180" : ""
          }`}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-[100] mt-2 w-72 overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-dark">
          {/* User Info Section */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 px-6 py-5 dark:from-primary/10 dark:to-primary/20">
            <h3 className="mb-1 text-base font-semibold text-black dark:text-white">
              {userName}
            </h3>
            <p className="break-all text-sm text-body-color dark:text-body-color-dark">
              {userEmail}
            </p>
          </div>

          {/* Menu Items */}
          <div className="p-3">
            <button
              onClick={() => {
                if (onToggle && isOpen) {
                  onToggle();
                } else {
                  setInternalIsOpen(false);
                }
                router.push("/dashboard/profile");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-black transition-all hover:bg-gray-100 hover:pl-5 dark:text-white dark:hover:bg-gray-800"
            >
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Profile
            </button>

            <button
              onClick={() => {
                if (onToggle && isOpen) {
                  onToggle();
                } else {
                  setInternalIsOpen(false);
                }
                router.push("/dashboard/settings");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-black transition-all hover:bg-gray-100 hover:pl-5 dark:text-white dark:hover:bg-gray-800"
            >
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Account settings
            </button>

            <button
              onClick={() => {
                if (onToggle && isOpen) {
                  onToggle();
                } else {
                  setInternalIsOpen(false);
                }
                router.push("/dashboard/support");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-black transition-all hover:bg-gray-100 hover:pl-5 dark:text-white dark:hover:bg-gray-800"
            >
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Support
            </button>
          </div>

          {/* Sign Out */}
          <div className="bg-gray-50 p-3 dark:bg-black/20">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-500 transition-all hover:bg-red-50 hover:pl-5 dark:hover:bg-red-900/20"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
