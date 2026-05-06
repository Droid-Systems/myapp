"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { api } from "@/lib/api";
import { TabWrapper } from "./TabWrapper";
import SettingsSkeleton from "@/components/SettingsSkeleton";

interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
}

function CustomSelectOption({
  value,
  label,
  onChange,
  options,
}: {
  value: number;
  label: string;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-black outline-none transition-all hover:border-gray-300 hover:bg-gray-100 focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-700/60"
      >
        <span className="truncate">{selected?.label ?? label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[100] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <ul className="max-h-52 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-primary/8 font-semibold text-primary dark:bg-primary/15 dark:text-primary"
                        : "text-black hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700/50"
                    }`}
                  >
                    {isSelected ? (
                      <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const urlTab = searchParams.get("tab");
  const initialTab = (urlTab === "notifications" || urlTab === "privacy" || urlTab === "sessions" || urlTab === "danger") ? urlTab : "password";
  const [activeTab, setActiveTab] = useState<"password" | "notifications" | "privacy" | "sessions" | "danger">(initialTab);

  const handleTabChange = useCallback((tab: string) => {
    const validTab = (tab === "notifications" || tab === "privacy" || tab === "sessions" || tab === "danger") ? tab : "password";
    setActiveTab(validTab);
    router.replace(`?tab=${tab}`, { scroll: false });
  }, [router]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStrengthError, setPasswordStrengthError] = useState("");
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    loginAlerts: true,
    sessionTimeout: 30,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [backupCodesCount, setBackupCodesCount] = useState(0);

  // Sessions state
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [cachedSessionsCount, setCachedSessionsCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('settingsSessionsCount');
      return cached ? parseInt(cached, 10) : 5;
    }
    return 5;
  });

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Backup codes regeneration state
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSessions();
    fetchProfile();
    fetch2FAStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const result = await api.getProfile();
      if (result.success && result.data) {
        setTwoFactorEnabled(result.data.twoFactorEnabled || false);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetch2FAStatus = async () => {
    try {
      const result = await api.get2FAStatus();
      if (result.success && result.data) {
        setBackupCodesCount(result.data.backupCodesCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch 2FA status:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const result = await api.getSettings();
      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const result = await api.getSessions();
      if (result.success && result.data) {
        setSessions(result.data);
        const count = result.data.length;
        setCachedSessionsCount(count);
        if (typeof window !== 'undefined') {
          localStorage.setItem('settingsSessionsCount', count.toString());
        }
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Real-time password strength validation
  useEffect(() => {
    if (passwordForm.newPassword === "") {
      setPasswordStrengthError("");
      return;
    }

    const errors: string[] = [];
    if (passwordForm.newPassword.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(passwordForm.newPassword)) errors.push("one uppercase letter");
    if (!/[a-z]/.test(passwordForm.newPassword)) errors.push("one lowercase letter");
    if (!/[0-9]/.test(passwordForm.newPassword)) errors.push("one number");
    if (!/[^A-Za-z0-9]/.test(passwordForm.newPassword)) errors.push("one special character");

    if (errors.length > 0) {
      setPasswordStrengthError(`Password must contain ${errors.join(", ")}`);
    } else {
      setPasswordStrengthError("");
    }
  }, [passwordForm.newPassword]);

  const showNotification = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccessMessage(message);
      setErrorMessage("");
    } else {
      setErrorMessage(message);
      setSuccessMessage("");
    }
    setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
      setNewPasswordTouched(true);
    } else if (passwordStrengthError) {
      errors.newPassword = passwordStrengthError;
      setNewPasswordTouched(true);
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      setConfirmPasswordTouched(true);
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsChangingPassword(true);
    setPasswordErrors({});

    try {
      const result = await api.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (result.success) {
        showNotification("Password updated successfully!", "success");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setNewPasswordTouched(false);
        setConfirmPasswordTouched(false);
      } else {
        showNotification(result.message || "Failed to update password", "error");
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        showNotification(error.response.data.message, "error");
      } else {
        showNotification("An error occurred. Please try again.", "error");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSettingChange = async (key: keyof UserSettings, value: boolean | number) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    setIsSavingSettings(true);

    try {
      const result = await api.updateSettings(updatedSettings);

      if (result.success) {
        showNotification("Settings saved successfully!", "success");

        // If session timeout was changed, notify the hook to update without page reload
        if (key === "sessionTimeout") {
          console.log("⚡ Session timeout changed - notifying hook");
          // Dispatch custom event to update session timeout in background
          const event = new CustomEvent('sessionTimeoutUpdated', {
            detail: { sessionTimeout: value }
          });
          window.dispatchEvent(event);
        }
      } else {
        setSettings(settings);
        showNotification("Failed to save settings", "error");
      }
    } catch (error) {
      setSettings(settings);
      showNotification("An error occurred. Please try again.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const result = await api.terminateSession(sessionId);

      if (result.success) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
        showNotification("Session revoked successfully!", "success");
      } else {
        showNotification("Failed to revoke session", "error");
      }
    } catch (error) {
      showNotification("An error occurred. Please try again.", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeletePasswordError("Password is required");
      return;
    }

    setIsDeleting(true);
    setDeletePasswordError("");
    try {
      const result = await api.deleteAccount(deletePassword);

      if (result.success) {
        api.clearTokens();
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        localStorage.removeItem("userEmail");
        window.location.href = "/signin?reason=account_deleted";
      } else {
        setDeletePasswordError("Failed to delete account. Please try again.");
      }
    } catch (err: any) {
      setDeletePasswordError(err.response?.data?.message || "Incorrect password. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!regenerateCode) {
      setRegenerateError("2FA code is required");
      return;
    }

    if (regenerateCode.length !== 6) {
      setRegenerateError("Please enter a valid 6-digit code");
      return;
    }

    setIsRegenerating(true);
    setRegenerateError("");

    try {
      const result = await api.regenerateBackupCodes(regenerateCode);

      if (result.success && result.data?.backupCodes) {
        // Success - close 2FA modal and show backup codes
        setNewBackupCodes(result.data.backupCodes);
        setShowRegenerateModal(false);
        setRegenerateCode("");
        setShowBackupCodesModal(true);

        // Update backup codes count
        setBackupCodesCount(result.data.backupCodes.length);

        showNotification("Backup codes regenerated successfully!", "success");
      } else {
        setRegenerateError(result.message || "Failed to regenerate backup codes");
      }
    } catch (error: any) {
      console.error("Regenerate backup codes error:", error);
      setRegenerateError(
        error.response?.data?.message || "Invalid 2FA code. Please try again."
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    const codesText = newBackupCodes.join("\n");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codesText);
        showNotification("Backup codes copied to clipboard!", "success");
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = codesText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showNotification("Backup codes copied to clipboard!", "success");
      }
    } catch (err) {
      showNotification("Failed to copy backup codes", "error");
    }
  };

  const handleDownloadBackupCodes = () => {
    const codesText = newBackupCodes.join("\n");
    const blob = new Blob([`Alvarado Investment - Backup Codes\n\n${codesText}\n\nIMPORTANT: Keep these codes safe. Each code can only be used once.`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-codes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("Backup codes downloaded!", "success");
  };

  const tabs = [
    { id: "password", label: "Password", icon: "lock" },
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "privacy", label: "Privacy", icon: "shield" },
    { id: "sessions", label: "Sessions", icon: "device" },
    { id: "danger", label: "Danger Zone", icon: "warning" },
  ];

  const renderIcon = (icon: string) => {
    switch (icon) {
      case "lock":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case "bell":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case "shield":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case "device":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "warning":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <SettingsSkeleton tab={activeTab} sessionsCount={cachedSessionsCount} />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Tab synchronization with URL */}
      <Suspense fallback={null}>
        <TabWrapper onTabChange={handleTabChange} />
      </Suspense>
      {/* Notifications */}
      {successMessage && (
        <div className="fixed left-4 right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg sm:left-auto sm:right-4 sm:w-auto sm:gap-3 sm:px-6 sm:py-4">
          <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="flex-1 text-sm font-medium sm:text-base">{successMessage}</p>
          <button onClick={() => setSuccessMessage("")} className="flex-shrink-0 rounded-full p-1 hover:bg-white/20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="fixed left-4 right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white shadow-lg sm:left-auto sm:right-4 sm:w-auto sm:gap-3 sm:px-6 sm:py-4">
          <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="flex-1 text-sm font-medium sm:text-base">{errorMessage}</p>
          <button onClick={() => setErrorMessage("")} className="flex-shrink-0 rounded-full p-1 hover:bg-white/20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white sm:text-3xl">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark sm:text-base">
          Manage your account preferences and security settings
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 flex justify-center overflow-x-auto">
        <div className="inline-flex gap-1 rounded-xl bg-gray-100 p-1.5 dark:bg-gray-800 sm:gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
                activeTab === tab.id
                  ? "bg-white text-primary shadow-sm dark:bg-gray-dark"
                  : "text-body-color hover:text-black dark:text-body-color-dark dark:hover:text-white"
              }`}
            >
              {renderIcon(tab.icon)}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="rounded-xl bg-white p-4 shadow-lg dark:bg-gray-dark sm:p-6">
        {/* Password Tab */}
        {activeTab === "password" && (
          <div>
            <h2 className="mb-2 text-lg font-bold text-black dark:text-white sm:text-xl">
              Update Password
            </h2>
            <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
              Ensure your account is using a strong password for security
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className={`w-full rounded-lg border bg-white px-4 py-3 pr-12 text-sm text-black outline-none transition-colors focus:border-primary dark:bg-gray-800 dark:text-white sm:text-base ${
                      passwordErrors.currentPassword ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? (
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
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-xs text-red-500">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                      setNewPasswordTouched(true);
                    }}
                    onBlur={() => setNewPasswordTouched(true)}
                    className={`w-full rounded-lg border bg-white px-4 py-3 pr-12 text-sm text-black outline-none transition-colors focus:border-primary dark:bg-gray-800 dark:text-white sm:text-base ${
                      (newPasswordTouched && passwordStrengthError) || passwordErrors.newPassword ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
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
                <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                  Min 8 characters, uppercase, lowercase, number, special character
                </p>
                {newPasswordTouched && passwordStrengthError && !passwordErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-500">{passwordStrengthError}</p>
                )}
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-500">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                      setConfirmPasswordTouched(true);
                    }}
                    onBlur={() => setConfirmPasswordTouched(true)}
                    className={`w-full rounded-lg border bg-white px-4 py-3 pr-12 text-sm text-black outline-none transition-colors focus:border-primary dark:bg-gray-800 dark:text-white sm:text-base ${
                      (confirmPasswordTouched && passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== "") || passwordErrors.confirmPassword ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
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
                {confirmPasswordTouched && passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== "" && !passwordErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                )}
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Password requirements:</strong> At least 8 characters, including uppercase, lowercase, numbers, and special characters.
                </p>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div>
            <h2 className="mb-2 text-lg font-bold text-black dark:text-white sm:text-xl">
              Notification Preferences
            </h2>
            <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
              Choose how and when you want to be notified
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-black/20">
                <div>
                  <h3 className="font-medium text-black dark:text-white">Email Notifications</h3>
                  <p className="text-sm text-body-color dark:text-body-color-dark">
                    Receive important updates via email
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange("emailNotifications", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full dark:bg-gray-700"></div>
                </label>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-black/20">
                <div>
                  <h3 className="font-medium text-black dark:text-white">Push Notifications</h3>
                  <p className="text-sm text-body-color dark:text-body-color-dark">
                    Receive real-time alerts on your device
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange("pushNotifications", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full dark:bg-gray-700"></div>
                </label>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-black/20">
                <div>
                  <h3 className="font-medium text-black dark:text-white">Marketing Emails</h3>
                  <p className="text-sm text-body-color dark:text-body-color-dark">
                    Receive news, offers, and promotions
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.marketingEmails}
                    onChange={(e) => handleSettingChange("marketingEmails", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full dark:bg-gray-700"></div>
                </label>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-black/20">
                <div>
                  <h3 className="font-medium text-black dark:text-white">Login Alerts</h3>
                  <p className="text-sm text-body-color dark:text-body-color-dark">
                    Get notified when someone logs into your account
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.loginAlerts}
                    onChange={(e) => handleSettingChange("loginAlerts", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full dark:bg-gray-700"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === "privacy" && (
          <div className="space-y-6">
            {/* Security Overview */}
            <div>
              <h2 className="mb-4 text-lg font-bold text-black dark:text-white sm:text-xl">
                Security Overview
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-body-color dark:text-body-color-dark">Security Score</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {twoFactorEnabled && settings.loginAlerts ? "95%" : twoFactorEnabled || settings.loginAlerts ? "70%" : "45%"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-body-color dark:text-body-color-dark">Active Sessions</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sessions.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Authentication Methods */}
            <div>
              <h3 className="mb-3 text-base font-bold text-black dark:text-white">
                Authentication Methods
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-black dark:text-white">Two-Factor Authentication</h4>
                      <p className="text-sm text-body-color dark:text-body-color-dark">
                        {twoFactorEnabled ? "Enabled • Authenticator app" : "Not enabled • Recommended"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(twoFactorEnabled ? "/dashboard/security/manage-2fa" : "/dashboard/security/setup-2fa")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      twoFactorEnabled
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    {twoFactorEnabled ? "Manage" : "Enable"}
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-black dark:text-white">Backup Codes</h4>
                      <p className="text-sm text-body-color dark:text-body-color-dark">
                        {twoFactorEnabled
                          ? `${backupCodesCount} ${backupCodesCount === 1 ? 'code' : 'codes'} available${backupCodesCount <= 3 && backupCodesCount > 0 ? ' ⚠️ Low' : ''}`
                          : "Available when 2FA is enabled"}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={!twoFactorEnabled}
                    onClick={() => setShowRegenerateModal(true)}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div>
              <h3 className="mb-3 text-base font-bold text-black dark:text-white">
                Security Settings
              </h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-black/20">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-black dark:text-white">Session Timeout</h4>
                      <p className="text-sm text-body-color dark:text-body-color-dark">
                        Automatically log out after inactivity
                      </p>
                    </div>
                  </div>
                  <CustomSelectOption
                    value={settings.sessionTimeout}
                    label="Select timeout"
                    onChange={(v) => handleSettingChange("sessionTimeout", v)}
                    options={[
                      { value: 2,   label: "2 minutes" },
                      { value: 15,  label: "15 minutes" },
                      { value: 30,  label: "30 minutes" },
                      { value: 60,  label: "1 hour" },
                      { value: 120, label: "2 hours" },
                      { value: 0,   label: "Never (Not recommended)" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Login Activity */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-black dark:text-white">
                  Recent Login Activity
                </h3>
                <button
                  onClick={fetchSessions}
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between rounded-lg p-3 ${
                        session.current
                          ? "bg-green-50 dark:bg-green-900/20"
                          : "bg-gray-50 dark:bg-black/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          session.current
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}>
                          <svg className={`h-5 w-5 ${
                            session.current
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-black dark:text-white">
                              {session.browser} • {session.device}
                            </p>
                            {session.current && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-body-color dark:text-body-color-dark">
                            📍 {session.location} • {session.lastActive}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => handleTabChange("sessions")}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                View all sessions →
              </button>
            </div>

            {/* Security Recommendations */}
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
              <div className="flex gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="mb-2 font-semibold text-blue-800 dark:text-blue-300">Security Recommendations</h4>
                  <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                    {!twoFactorEnabled && <li>• Enable two-factor authentication for better security</li>}
                    {!settings.loginAlerts && <li>• Enable login alerts to track account access</li>}
                    {settings.sessionTimeout === 0 && <li>• Set a session timeout to prevent unauthorized access</li>}
                    {sessions.length > 3 && <li>• You have {sessions.length} active sessions. Review and revoke unused ones</li>}
                    {twoFactorEnabled && settings.loginAlerts && sessions.length <= 3 && (
                      <li>✓ Your account security is excellent! Keep it up.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div>
            <h2 className="mb-2 text-lg font-bold text-black dark:text-white sm:text-xl">
              Active Sessions
            </h2>
            <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
              Manage devices that are currently logged into your account
            </p>

            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between ${
                      session.current ? "bg-primary/5 dark:bg-primary/10" : "bg-gray-50 dark:bg-black/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                        <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-black dark:text-white">{session.browser}</h3>
                          {session.current && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-body-color dark:text-body-color-dark">
                          {session.device} • {session.location}
                        </p>
                        <p className="text-xs text-body-color dark:text-body-color-dark">
                          Last active: {session.lastActive}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="self-start rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:hover:bg-red-900/20 sm:self-center"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={fetchSessions}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh sessions
            </button>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === "danger" && (
          <div>
            <h2 className="mb-2 text-lg font-bold text-red-600 dark:text-red-400 sm:text-xl">
              Danger Zone
            </h2>
            <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
              Irreversible and destructive actions
            </p>

            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20 sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-300">
                    Delete Account
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                    Your account will be deactivated and you will be logged out immediately. All your data (transactions, investments, profile) is securely retained and can be restored by contacting support.
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => { setShowDeleteConfirm(true); setDeletePasswordError(""); setDeletePassword(""); }}
                  className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Enter your password to confirm
                    </label>
                    <div className="relative">
                      <input
                        type={showDeletePassword ? "text" : "password"}
                        value={deletePassword}
                        onChange={(e) => { setDeletePassword(e.target.value); setDeletePasswordError(""); }}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 pr-12 text-sm text-black outline-none focus:border-red-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                        aria-label={showDeletePassword ? "Hide password" : "Show password"}
                      >
                        {showDeletePassword ? (
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
                    {deletePasswordError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{deletePasswordError}</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword("");
                        setDeletePasswordError("");
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={!deletePassword || isDeleting}
                      className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Delete My Account"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2FA Verification Modal for Regenerate Backup Codes */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-dark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black dark:text-white">
                Verify 2FA Code
              </h3>
              <button
                onClick={() => {
                  setShowRegenerateModal(false);
                  setRegenerateCode("");
                  setRegenerateError("");
                }}
                className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>⚠️ Warning:</strong> This will invalidate all existing backup codes and generate 10 new ones.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Enter the 6-digit code from your authenticator app
              </label>
              <input
                type="text"
                maxLength={6}
                value={regenerateCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // Only digits
                  setRegenerateCode(value);
                  setRegenerateError("");
                }}
                placeholder="000000"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-center text-2xl font-bold tracking-widest text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && regenerateCode.length === 6) {
                    handleRegenerateBackupCodes();
                  }
                }}
              />
              {regenerateError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {regenerateError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRegenerateModal(false);
                  setRegenerateCode("");
                  setRegenerateError("");
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-black transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateBackupCodes}
                disabled={regenerateCode.length !== 6 || isRegenerating}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRegenerating ? "Regenerating..." : "Regenerate Codes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Backup Codes Display Modal */}
      {showBackupCodesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-dark">
            <div className="mb-4">
              <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
                Your New Backup Codes
              </h3>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                Save these codes in a secure location. Each code can only be used once.
              </p>
            </div>

            <div className="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex gap-2">
                <svg className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300">
                    Important: Save these codes now!
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    You won't be able to see these codes again. Your old backup codes have been invalidated.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-4 dark:bg-black/20">
              {newBackupCodes.map((code, index) => (
                <div
                  key={index}
                  className="rounded-md bg-white p-3 text-center font-mono text-sm font-bold text-black shadow-sm dark:bg-gray-800 dark:text-white"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleCopyBackupCodes}
                className="flex-1 rounded-lg border border-primary bg-white px-4 py-2.5 font-medium text-primary transition-colors hover:bg-primary/10 dark:bg-gray-800 dark:hover:bg-primary/20"
              >
                📋 Copy All Codes
              </button>
              <button
                onClick={handleDownloadBackupCodes}
                className="flex-1 rounded-lg border border-primary bg-white px-4 py-2.5 font-medium text-primary transition-colors hover:bg-primary/10 dark:bg-gray-800 dark:hover:bg-primary/20"
              >
                💾 Download as Text
              </button>
              <button
                onClick={() => {
                  setShowBackupCodesModal(false);
                  setNewBackupCodes([]);
                }}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary/90"
              >
                ✓ I've Saved Them
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
