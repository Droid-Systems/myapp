"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import "./phoneInput.css";
import { api } from "@/lib/api";
import Toast from "@/components/Toast";
import { z } from "zod";

const signupSchema = z
  .object({
    firstName: z.string().min(1, "Please enter your first name."),
    lastName: z.string().min(1, "Please enter your last name."),
    email: z.string().min(1, "Please enter a valid email address.").refine(
      (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Please enter a valid email address."
    ),
    phone: z.string().refine(
      (val) => val.replace(/[^\d]/g, "").length >= 10,
      "Please enter a valid phone number."
    ),
    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .regex(/[A-Z]/, "Password must contain one uppercase letter")
      .regex(/[a-z]/, "Password must contain one lowercase letter")
      .regex(/[0-9]/, "Password must contain one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const SignupForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrengthError, setPasswordStrengthError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [formError, setFormError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      router.replace("/dashboard");
    }
  }, [router]);

  // Handle Google OAuth sign up
  const handleGoogleSignup = () => {
    setIsGoogleLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const ref = searchParams.get("ref");
    const url = ref
      ? `${API_URL}/api/auth/google?referralCode=${encodeURIComponent(ref)}`
      : `${API_URL}/api/auth/google`;
    window.location.href = url;
  };

  // Real-time email validation
  useEffect(() => {
    if (email === "") {
      setEmailError("");
    } else {
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Check for common errors
      if (!email.includes("@")) {
        setEmailError("Email must contain @ symbol");
      } else if (email.startsWith("@") || email.endsWith("@")) {
        setEmailError("Invalid email format");
      } else if (!emailRegex.test(email)) {
        setEmailError("Please enter a valid email address");
      } else if (email.split("@")[1] && !email.split("@")[1].includes(".")) {
        setEmailError("Email domain must contain a period");
      } else {
        setEmailError("");
      }
    }
  }, [email]);

  // Real-time phone validation
  useEffect(() => {
    // Count only digits (excluding country code and formatting)
    const digitCount = phone.replace(/[^\d]/g, "").length;

    // Don't show error if field is empty or only has country code (1-2 digits)
    if (phone === "" || digitCount === 0 || digitCount === 1) {
      setPhoneError("");
    } else {
      // Check if phone contains any letters or invalid characters
      const hasLetters = /[a-zA-Z]/.test(phone);
      const hasInvalidChars = /[^+\d\s\-()]/.test(phone);

      if (hasLetters || hasInvalidChars) {
        setPhoneError("Phone number can only contain numbers");
      } else if (digitCount < 10) {
        setPhoneError("Phone number must be at least 10 digits");
      } else {
        setPhoneError("");
      }
    }
  }, [phone]);

  // Real-time password strength validation
  useEffect(() => {
    if (password === "") {
      setPasswordStrengthError("");
      return;
    }

    const errors: string[] = [];
    if (password.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("one number");
    if (!/[^A-Za-z0-9]/.test(password)) errors.push("one special character");

    if (errors.length > 0) {
      setPasswordStrengthError(`Password must contain ${errors.join(", ")}`);
    } else {
      setPasswordStrengthError("");
    }
  }, [password]);

  // Real-time password match validation
  useEffect(() => {
    if (confirmPassword === "") {
      setPasswordError("");
    } else if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [password, confirmPassword]);

  // Handle keyboard input for phone - detect letters
  const handlePhoneKeyDown = (e: React.KeyboardEvent) => {
    // Check if a letter key is pressed (excluding special keys)
    if (
      e.key.length === 1 &&
      /[a-zA-Z]/.test(e.key) &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      setPhoneError("Phone number can only contain numbers");

      // Clear temp error after 2 seconds
      setTimeout(() => {
        // Only clear if it's still showing the temp error message
        if (phoneError === "Phone number can only contain numbers") {
          // Re-run validation
          const digitCount = phone.replace(/[^\d]/g, "").length;
          if (digitCount > 0 && digitCount < 10) {
            setPhoneError("Phone number must be at least 10 digits");
          } else if (digitCount === 0 && phone !== "") {
            setPhoneError("Please enter a valid phone number");
          } else if (phone === "") {
            setPhoneError("");
          }
        }
      }, 2000);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Check if terms checkbox is checked
    const checkbox = document.getElementById("checkboxLabel") as HTMLInputElement;
    if (!checkbox?.checked) {
      setFormError("Please agree to the Terms and Conditions to continue.");
      return;
    }

    // Zod validation
    const parsed = signupSchema.safeParse({ firstName, lastName, email, phone, password, confirmPassword });
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      if (firstIssue.path[0] === "confirmPassword") {
        setPasswordError(firstIssue.message);
        setConfirmPasswordTouched(true);
      } else {
        setFormError(firstIssue.message);
      }
      return;
    }

    setIsLoading(true);

    try {
      // Call backend register API using the API client
      const ref = searchParams.get("ref");
      const response = await api.register({
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone,
        ...(ref ? { referralCode: ref } : {}),
      });

      if (response.success) {
        setToast({ message: "Registration successful! Please check your email for the OTP code.", type: "success" });
        setTimeout(() => router.push(`/verify-otp?email=${encodeURIComponent(email)}`), 1500);
      }
    } catch (error: any) {
      console.error("Registration error:", error);

      // Extract detailed error message from backend
      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data) {
        const data = error.response.data;
        // Check if it's a validation error with detailed errors object
        if (data.errors && typeof data.errors === 'object') {
          // Get first error message from validation errors
          const firstError = Object.values(data.errors)[0] as string;
          errorMessage = firstError || data.message;
        } else if (data.message) {
          errorMessage = data.message;
        }
      }

      setToast({ message: errorMessage, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    <div className="mx-auto max-w-[500px] lg:max-w-[800px]">
      <Link href="/" className="mb-3 flex items-center gap-1.5 text-sm font-medium text-body-color hover:text-primary transition-colors duration-200 dark:text-body-color-dark dark:hover:text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Home
      </Link>
    </div>
    <div className="shadow-three dark:bg-dark mx-auto max-w-[500px] lg:max-w-[800px] rounded-2xl bg-white px-6 py-10 sm:p-[60px]">
      <div className="mb-8 flex justify-center">
        <a href="/">
          <img src="/images/logo/A-LogoB.png" alt="Alvarado Associates" className="h-12 dark:hidden" />
          <img src="/images/logo/A-Logo.png" alt="Alvarado Associates" className="hidden h-12 dark:block" />
        </a>
      </div>
      <h3 className="mb-2 text-center text-2xl font-bold text-black sm:text-3xl dark:text-white">
        Create your account
      </h3>
      <p className="text-body-color mb-6 text-center text-base font-medium">
        It's totally free and super easy
      </p>
      <div className="mb-4 flex justify-center">
      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={isGoogleLoading || isLoading}
        className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color hover:border-primary hover:bg-primary/5 hover:text-primary dark:hover:border-primary dark:hover:bg-primary/5 dark:hover:text-primary flex w-full sm:w-auto sm:min-w-[340px] items-center justify-center rounded-xl border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60">
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
        {isGoogleLoading ? "Redirecting to Google..." : "Sign up with Google"}
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
          Or, register with your email
        </p>
        <span className="bg-body-color/50 block h-[1px] flex-1"></span>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-5">
          <div className="mb-5">
            <label
              htmlFor="firstName"
              className="text-dark mb-3 block text-sm dark:text-white"
            >
              {" "}
              First Name{" "}
            </label>
            <input
              type="text"
              name="firstName"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xl border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
            />
          </div>
          <div className="mb-5">
            <label
              htmlFor="lastName"
              className="text-dark mb-3 block text-sm dark:text-white"
            >
              {" "}
              Last Name{" "}
            </label>
            <input
              type="text"
              name="lastName"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xl border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
            />
          </div>
        </div>
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-5">
          <div className="mb-5">
            <label
              htmlFor="email"
              className="text-dark mb-3 block text-sm dark:text-white"
            >
              {" "}
              Work Email{" "}
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-xl border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:bg-[#2C303B] ${
                emailError
                  ? "border-red-500 focus:border-red-500 dark:border-red-500"
                  : "border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary dark:border-transparent dark:focus:shadow-none"
              }`}
            />
            {emailError && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                {emailError}
              </p>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="phone"
              className="text-dark mb-3 block text-sm dark:text-white"
            >
              {" "}
              Phone Number{" "}
            </label>
            <div
              className={phoneError ? "phone-input-error" : ""}
              onKeyDown={handlePhoneKeyDown}
            >
              <PhoneInput
                defaultCountry="us"
                value={phone}
                onChange={(phone) => setPhone(phone)}
              />
            </div>
            {phoneError && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                {phoneError}
              </p>
            )}
          </div>
        </div>
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-5">
          <div className="mb-5">
            <label
              htmlFor="password"
              className="text-dark mb-3 block text-sm dark:text-white"
            >
              {" "}
              Your Password{" "}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordTouched(true);
                }}
                onBlur={() => setPasswordTouched(true)}
                className={`w-full rounded-xl border bg-[#f8f8f8] px-6 py-3 pr-12 text-base outline-hidden transition-all duration-300 dark:bg-[#2C303B] ${
                  passwordTouched && passwordStrengthError
                    ? "border-red-500 focus:border-red-500 dark:border-red-500"
                    : "border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary dark:border-transparent dark:focus:shadow-none"
                }`}
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
            {passwordTouched && (
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Min 8 characters, uppercase, lowercase, number, special character
              </p>
            )}
            {passwordTouched && passwordStrengthError && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                {passwordStrengthError}
              </p>
            )}
          </div>
          <div className="mb-5">
            <label
              htmlFor="confirmPassword"
              className="text-dark mb-3 block text-sm dark:text-white"
            >
              {" "}
              Confirm Password{" "}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPasswordTouched(true);
                }}
                onBlur={() => setConfirmPasswordTouched(true)}
                className={`w-full rounded-xl border bg-[#f8f8f8] px-6 py-3 pr-12 text-base outline-hidden transition-all duration-300 dark:bg-[#2C303B] ${
                  confirmPasswordTouched && passwordError
                    ? "border-red-500 focus:border-red-500 dark:border-red-500"
                    : "border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary dark:border-transparent dark:focus:shadow-none"
                }`}
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
            {confirmPasswordTouched && passwordError && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                {passwordError}
              </p>
            )}
          </div>
        </div>
        <div className="mb-8 flex">
          <label
            htmlFor="checkboxLabel"
            className="text-body-color flex cursor-pointer text-sm font-medium select-none"
          >
            <div className="relative">
              <input type="checkbox" id="checkboxLabel" className="sr-only" />
              <div className="box border-body-color/20 mt-1 mr-4 flex h-5 w-5 items-center justify-center rounded-sm border dark:border-white/10">
                <span className="opacity-0">
                  <svg
                    width="11"
                    height="8"
                    viewBox="0 0 11 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                      fill="#3056D3"
                      stroke="#3056D3"
                      strokeWidth="0.4"
                    />
                  </svg>
                </span>
              </div>
            </div>
            <span>
              By creating account means you agree to the
              <a href="#0" className="text-primary hover:underline">
                {" "}
                Terms and Conditions{" "}
              </a>
              , and our
              <a href="#0" className="text-primary hover:underline">
                {" "}
                Privacy Policy{" "}
              </a>
            </span>
          </label>
        </div>
        {formError && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          </div>
        )}

        <div className="mb-6 flex justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className="shadow-submit dark:shadow-submit-dark bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed flex w-full sm:w-auto sm:min-w-[340px] items-center justify-center gap-2 rounded-xl px-9 py-4 text-base font-medium text-white duration-300"
          >
            {isLoading && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isLoading ? "Creating account..." : "Sign up"}
          </button>
        </div>
      </form>
      <p className="text-body-color text-center text-base font-medium">
        Already have an account?{" "}
        <Link href="/signin" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
    </>
  );
};

export default SignupForm;
