"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import { UserProfile, UpdateProfileRequest, ApiResponse } from "@/types/user";
import { api } from "@/lib/api";
import DatePicker from "@/components/DatePicker";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import "@/components/SignupForm/phoneInput.css";
import { z } from "zod";

const editProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().refine(
    (val) => val.replace(/[^\d]/g, "").length >= 10,
    "Please enter a valid phone number"
  ),
});

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${baseUrl}${path}`;
};

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSuccess: () => Promise<void>;
}

const EditProfileModal = ({ isOpen, onClose, profile, onSuccess }: EditProfileModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (addressBoxRef.current && !addressBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const fetchAddressSuggestions = (query: string) => {
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    if (query.trim().length < 4) { setAddressSuggestions([]); setShowSuggestions(false); return; }
    addressDebounceRef.current = setTimeout(async () => {
      setAddressLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setAddressSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch { setAddressSuggestions([]); }
      finally { setAddressLoading(false); }
    }, 400);
  };

  const selectAddressSuggestion = (item: any) => {
    const a = item.address ?? {};
    const street = [a.house_number, a.road].filter(Boolean).join(" ") || item.display_name.split(",")[0];
    const city = a.city || a.town || a.village || a.municipality || a.county || "";
    const state = a.state || "";
    const postalCode = a.postcode || "";
    const country = a.country || "";
    setFormData((prev) => ({ ...prev, address: street, city, state, postalCode, country }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    dateOfBirth: profile.dateOfBirth,
    nationality: profile.nationality,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    postalCode: profile.postalCode,
    country: profile.country,
    profilePhoto: profile.profilePhoto,
    bio: profile.bio,
    occupation: profile.occupation,
  });

  // Reset form when profile changes
  useEffect(() => {
    setFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth,
      nationality: profile.nationality,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      postalCode: profile.postalCode,
      country: profile.country,
      profilePhoto: profile.profilePhoto,
      bio: profile.bio,
      occupation: profile.occupation,
    });
    setErrorMessage("");
    setFieldErrors({});
  }, [profile, isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Close when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Format text to title case (capitalize first letter of each word)
  const toTitleCase = (text: string): string => {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format input values based on field type
  const formatValue = (field: keyof UpdateProfileRequest, value: string): string => {
    // Fields that should be title case
    const titleCaseFields = ['firstName', 'lastName', 'city', 'state', 'country', 'nationality', 'occupation'];

    if (titleCaseFields.includes(field) && value) {
      return toTitleCase(value);
    }

    return value;
  };

  const handleInputChange = (field: keyof UpdateProfileRequest, value: string) => {
    const formattedValue = formatValue(field, value);
    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setErrorMessage("");

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      // Use httpOnly cookies instead of localStorage token
      const response = await axios.post<ApiResponse<{ url: string; accessToken?: string }>>(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/profile/upload`,
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true, // Send httpOnly cookies
          timeout: 30000, // 30 second timeout for file uploads
        }
      );

      const result = response.data;

      if (result.success && result.data) {
        setFormData((prev) => ({ ...prev, profilePhoto: result.data!.url }));

        // Update localStorage immediately
        if (result.data.url) {
          localStorage.setItem("userProfilePicture", result.data.url);
        }

        // Emit event to notify other components
        window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
          detail: { profilePhoto: result.data!.url }
        }));
      } else {
        setErrorMessage(result.message || "Failed to upload photo");
      }
    } catch (error: any) {
      console.error("Photo upload error:", error);
      if (error.code === 'ECONNABORTED') {
        setErrorMessage("Upload timeout. Please try again with a smaller image.");
      } else if (error.response?.status === 401) {
        setErrorMessage("Session expired. Please refresh and try again.");
      } else if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Failed to upload photo. Please try again.");
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePhoto: null }));
    // Emit event to notify other components
    window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
      detail: { profilePhoto: null }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = editProfileSchema.safeParse({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const result = await api.updateProfile(formData);

      if (result.success && result.data) {
        // Update localStorage for ProfileDropdown
        if (formData.firstName) {
          localStorage.setItem("userName", `${formData.firstName} ${formData.lastName}`);
        }
        // Update profile picture in localStorage
        if (result.data.profilePhoto) {
          localStorage.setItem("userProfilePicture", result.data.profilePhoto);
        } else {
          localStorage.removeItem("userProfilePicture");
        }
        // Store the full user object
        localStorage.setItem("user", JSON.stringify(result.data));

        // Emit event to notify ProfileDropdown — merge formData fields so
        // firstName/lastName are always present even if result.data wraps them differently
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: {
            profile: {
              ...result.data,
              firstName: formData.firstName ?? result.data?.firstName,
              lastName: formData.lastName ?? result.data?.lastName,
              profilePhoto: result.data?.profilePhoto ?? formData.profilePhoto ?? null,
            }
          }
        }));

        // Call onSuccess to trigger parent to fetch fresh profile data
        await onSuccess();

        // Modal will be closed by parent's handleEditSuccess
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        setErrorMessage(result.message || "Failed to update profile");
      }
    } catch (error) {
      setErrorMessage("Failed to connect to server");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      onClick={handleBackdropClick}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Container - with safe area padding for mobile */}
      <div className="relative flex h-full w-full items-end justify-center sm:items-center sm:p-4">
        <div
          ref={modalRef}
          className="relative flex max-h-full w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-gray-dark sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-dark sm:px-6">
            <h2 className="text-lg font-bold text-black dark:text-white sm:text-xl">
              Edit Profile
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Error Message */}
            {errorMessage && (
              <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-4 dark:bg-red-900/20 sm:mx-6">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{errorMessage}</p>
              </div>
            )}

            {/* Form */}
            <form id="edit-profile-form" onSubmit={handleSubmit} className="p-4 sm:p-6">
              {/* Profile Photo */}
              <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative flex-shrink-0">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 sm:h-24 sm:w-24">
                    {getImageUrl(formData.profilePhoto) ? (
                      <Image
                        src={getImageUrl(formData.profilePhoto)!}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-2xl font-bold text-primary sm:text-3xl">
                        {(formData.firstName?.charAt(0) || "").toUpperCase()}{(formData.lastName?.charAt(0) || "").toUpperCase()}
                      </span>
                    )}
                  </div>
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handlePhotoClick}
                    disabled={isUploadingPhoto}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    Change
                  </button>
                  {formData.profilePhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Name Fields */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-primary dark:bg-gray-800 dark:text-white ${
                      fieldErrors.firstName ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                    placeholder="John"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-0.5 text-[10px] text-red-500">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-primary dark:bg-gray-800 dark:text-white ${
                      fieldErrors.lastName ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                    placeholder="Doe"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-0.5 text-[10px] text-red-500">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Phone Number *
                </label>
                <div className={fieldErrors.phone ? "phone-input-compact phone-input-error" : "phone-input-compact"}>
                  <PhoneInput
                    defaultCountry="us"
                    value={formData.phone || ""}
                    onChange={(phone) => {
                      setFormData((prev) => ({ ...prev, phone }));
                      if (fieldErrors.phone) {
                        setFieldErrors((prev) => { const n = { ...prev }; delete n.phone; return n; });
                      }
                    }}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="mt-0.5 text-[10px] text-red-500">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Date of Birth
                </label>
                <DatePicker
                  value={formData.dateOfBirth}
                  onChange={(value) => handleInputChange("dateOfBirth", value)}
                />
              </div>

              {/* Nationality */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Nationality
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange("nationality", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="USA"
                />
              </div>

              {/* Occupation */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange("occupation", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Lawyer, Engineer, etc"
                />
              </div>

              {/* Address with autocomplete */}
              <div className="mb-4" ref={addressBoxRef}>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Street Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => {
                      handleInputChange("address", e.target.value);
                      fetchAddressSuggestions(e.target.value);
                    }}
                    onFocus={() => { if (addressSuggestions.length > 0) setShowSuggestions(true); }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="Start typing an address…"
                    autoComplete="off"
                  />
                  {/* Loading spinner / pin icon */}
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {addressLoading ? (
                      <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 top-[calc(100%+4px)] z-[200] max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                      {addressSuggestions.map((item, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => selectAddressSuggestion(item)}
                            className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-black dark:text-white">{item.display_name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* City & State */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="NY"
                  />
                </div>
              </div>

              {/* Postal & Country */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="10001"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="USA"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="mb-2">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </form>
          </div>

          {/* Fixed Footer Actions */}
          <div className="flex flex-shrink-0 gap-3 border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-dark sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-profile-form"
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
