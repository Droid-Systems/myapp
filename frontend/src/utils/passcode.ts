const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Interface for token response from backend
 */
interface TokenResponse {
  success: boolean;
  data?: {
    token: string;
    expiresAt: string;
    expiresIn: string;
  };
  message?: string;
}

/**
 * Verifies passcode and retrieves JWT token
 * Uses backend API for verification and token generation
 * @param passcode - The passcode to verify
 * @returns Promise<TokenResponse | null> - Token data if successful, null otherwise
 */
export async function verifyPasscode(passcode: string): Promise<TokenResponse | null> {
  if (!passcode) return null;

  try {
    const response = await fetch(`${API_URL}/api/pdf/verify-passcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for httpOnly cookies
      body: JSON.stringify({ passcode: passcode.trim() }),
    });

    const data: TokenResponse = await response.json();
    return data.success ? data : null;
  } catch (error) {
    console.error("Error verifying passcode:", error);
    return null;
  }
}

/**
 * Stores the JWT token and expiry in session storage
 * Token allows time-limited access (default: 1 hour)
 */
export function storeVerifiedAccess(token: string, expiresAt: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("document_access_verified", "true");
    sessionStorage.setItem("document_access_token", token);
    sessionStorage.setItem("document_access_expires_at", expiresAt);
    sessionStorage.setItem("document_access_time", Date.now().toString());
  }
}

/**
 * Checks if the user has a valid token in the current session
 * Also verifies that the token hasn't expired
 */
export function hasVerifiedAccess(): boolean {
  if (typeof window === "undefined") return false;

  const verified = sessionStorage.getItem("document_access_verified");
  const token = sessionStorage.getItem("document_access_token");
  const expiresAt = sessionStorage.getItem("document_access_expires_at");

  if (verified !== "true" || !token || !expiresAt) {
    return false;
  }

  // Check if token has expired
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();

  if (now >= expiryTime) {
    // Token expired, clear storage
    clearVerifiedAccess();
    return false;
  }

  return true;
}

/**
 * Gets the stored JWT token
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  // Check if token is still valid before returning
  if (!hasVerifiedAccess()) {
    return null;
  }

  return sessionStorage.getItem("document_access_token");
}

/**
 * Gets the token expiration time
 */
export function getTokenExpiry(): Date | null {
  if (typeof window === "undefined") return null;

  const expiresAt = sessionStorage.getItem("document_access_expires_at");
  return expiresAt ? new Date(expiresAt) : null;
}

/**
 * Checks how much time is left before token expires
 * @returns Number of milliseconds until expiry, or 0 if expired
 */
export function getTimeUntilExpiry(): number {
  const expiryDate = getTokenExpiry();
  if (!expiryDate) return 0;

  const timeLeft = expiryDate.getTime() - Date.now();
  return Math.max(0, timeLeft);
}

/**
 * Clears the verified access (logout)
 */
export function clearVerifiedAccess(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("document_access_verified");
    sessionStorage.removeItem("document_access_token");
    sessionStorage.removeItem("document_access_expires_at");
    sessionStorage.removeItem("document_access_time");
  }
}

/**
 * DEPRECATED: Legacy function for backward compatibility
 * Use getAccessToken() instead
 */
export function getVerifiedPasscode(): string | null {
  console.warn("getVerifiedPasscode() is deprecated. Use getAccessToken() instead.");
  return getAccessToken();
}
