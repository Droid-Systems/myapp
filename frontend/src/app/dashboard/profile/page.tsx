"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { UserProfile } from "@/types/user";
import EditProfileModal from "@/components/Dashboard/EditProfileModal";
import ProfileSkeleton from "@/components/ProfileSkeleton";
import { api } from "@/lib/api";

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${baseUrl}${path}`;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchProfile();

    // Listen for profile photo updates
    const handlePhotoUpdate = (event: any) => {
      setProfile((prev) => prev ? { ...prev, profilePhoto: event.detail.profilePhoto } : null);
    };

    window.addEventListener('profilePhotoUpdated', handlePhotoUpdate);
    return () => {
      window.removeEventListener('profilePhotoUpdated', handlePhotoUpdate);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const result = await api.getProfile();
      if (result.success && result.data) {
        setProfile(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSuccess = async () => {
    // Fetch fresh profile data from API to ensure we have all fields
    await fetchProfile();
    setIsEditModalOpen(false);
    setSuccessMessage("Profile updated successfully!");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-black dark:text-white">Failed to load profile</p>
          <button
            onClick={fetchProfile}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Success Notification */}
      {successMessage && (
        <div className="fixed left-4 right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg sm:left-auto sm:right-4 sm:w-auto sm:gap-3 sm:px-6 sm:py-4">
          <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="flex-1 text-sm font-medium sm:text-base">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage("")}
            className="flex-shrink-0 rounded-full p-1 hover:bg-white/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark sm:text-base">
          View and manage your personal information
        </p>
      </div>

      {/* Profile Card */}
      <div className="overflow-hidden rounded-xl bg-white p-4 shadow-lg dark:bg-gray-dark sm:p-6">
        {/* Profile Header with Edit Icon */}
        <div className="mb-6 flex flex-col items-center gap-4 border-b border-gray-200 pb-6 dark:border-gray-800 sm:mb-8 sm:flex-row sm:items-start sm:gap-6 sm:pb-8">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 sm:h-28 sm:w-28">
              {getImageUrl(profile.profilePhoto) ? (
                <Image
                  src={getImageUrl(profile.profilePhoto)!}
                  alt="Profile"
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-2xl font-bold text-primary sm:text-4xl">
                  {(profile.firstName?.charAt(0) || "").toUpperCase()}{(profile.lastName?.charAt(0) || "").toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 max-w-full">
                <h2 className="truncate text-xl font-bold text-black dark:text-white sm:text-2xl">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="truncate text-sm text-body-color dark:text-body-color-dark">{profile.email}</p>
                {profile.occupation && (
                  <p className="mt-1 text-xs font-medium text-primary sm:text-sm">{profile.occupation}</p>
                )}
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="mt-2 flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary hover:text-white sm:mt-0 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            </div>

            {profile.bio && (
              <p className="mt-3 text-xs text-body-color dark:text-body-color-dark sm:mt-4 sm:max-w-lg sm:text-sm">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Personal Information */}
          <div>
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
              <svg className="h-4 w-4 text-primary sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-base font-semibold text-black dark:text-white sm:text-lg">
                Personal Information
              </h3>
            </div>
            <div className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-black/20 sm:space-y-4 sm:p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">Full Name</span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {profile.firstName} {profile.lastName}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">Email</span>
                <span className="break-all text-sm font-medium text-black dark:text-white">
                  {profile.email}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">Phone</span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {profile.phone || "Not provided"}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">Date of Birth</span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not provided"}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">Nationality</span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {profile.nationality || "Not provided"}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">Occupation</span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {profile.occupation || "Not provided"}
                </span>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
              <svg className="h-4 w-4 text-primary sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-base font-semibold text-black dark:text-white sm:text-lg">
                Address
              </h3>
            </div>
            <div className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-black/20 sm:space-y-4 sm:p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">Street</span>
                <span className="text-sm font-medium text-black dark:text-white sm:text-right">
                  {profile.address || "Not provided"}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">City</span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {profile.city || "Not provided"}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">State/Province</span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {profile.state || "Not provided"}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">Postal Code</span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {profile.postalCode || "Not provided"}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-xs text-body-color dark:text-body-color-dark sm:text-sm">Country</span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {profile.country || "Not provided"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info Footer */}
        <div className="mt-6 flex flex-col gap-3 rounded-lg bg-primary/5 p-3 dark:bg-primary/10 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <svg className="h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-xs sm:text-sm">
              <span className="text-body-color dark:text-body-color-dark">Member since </span>
              <span className="font-medium text-black dark:text-white">
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <svg className="h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs sm:text-sm">
              <span className="text-body-color dark:text-body-color-dark">Last updated </span>
              <span className="font-medium text-black dark:text-white">
                {profile.updatedAt
                  ? new Date(profile.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
