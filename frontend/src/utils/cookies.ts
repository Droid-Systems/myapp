/**
 * Cookie utilities shared by the backend.
 *
 * Note: We avoid importing Express here to keep the frontend build lean.
 * These helpers assume an Express-like request/response shape.
 */
type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "none" | "lax" | "strict";
  path?: string;
  maxAge?: number;
};

type ResponseLike = {
  cookie: (name: string, value: string, options?: CookieOptions) => void;
  clearCookie: (name: string, options?: CookieOptions) => void;
};

type RequestLike = {
  cookies?: Record<string, string | undefined>;
};

const isProduction = process.env.NODE_ENV === "production";

type ParsedAuthTokens = {
  at?: string;
  rt?: string;
};

const parseAuthTokens = (req: RequestLike): ParsedAuthTokens | null => {
  const raw = req.cookies?.auth_tokens;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const parsedTokens = parsed as ParsedAuthTokens;
    const at = typeof parsedTokens.at === "string" ? parsedTokens.at : undefined;
    const rt = typeof parsedTokens.rt === "string" ? parsedTokens.rt : undefined;
    if (!at && !rt) return null;
    return { at, rt };
  } catch {
    return null;
  }
};

const getAuthTokens = (req: RequestLike): ParsedAuthTokens => {
  const combined = parseAuthTokens(req);
  if (combined) return combined;
  return {
    at: req.cookies?.access_token,
    rt: req.cookies?.refresh_token,
  };
};

/**
 * Cookie configuration for httpOnly cookies
 */
const cookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Set access token as httpOnly cookie
 */
export function setAccessTokenCookie(res: ResponseLike, token: string): void {
  res.cookie("access_token", token, {
    ...cookieConfig,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Set refresh token as httpOnly cookie
 */
export function setRefreshTokenCookie(res: ResponseLike, token: string): void {
  res.cookie("refresh_token", token, {
    ...cookieConfig,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Set both auth cookies using a single combined cookie
 * Combined cookie is the primary mechanism; individual cookies are set only
 * for backward compatibility in environments that still accept multiple Set-Cookie
 * headers.
 */
export function setAuthCookies(res: ResponseLike, accessToken: string, refreshToken: string): void {
  // Combine both tokens into a single cookie as JSON
  const authData = JSON.stringify({ at: accessToken, rt: refreshToken });
  res.cookie("auth_tokens", authData, {
    ...cookieConfig,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches refresh token)
  });
  // Also set individual cookies for backwards compatibility
  res.cookie("access_token", accessToken, {
    ...cookieConfig,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", refreshToken, {
    ...cookieConfig,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/**
 * Clear all authentication cookies (logout)
 */
export function clearAuthCookies(res: ResponseLike): void {
  res.clearCookie("access_token", { ...cookieConfig });
  res.clearCookie("refresh_token", { ...cookieConfig });
  res.clearCookie("auth_tokens", { ...cookieConfig });
  res.clearCookie("pdf_access_token", { ...cookieConfig });
}

/**
 * Get access token from request cookies
 * Combined cookie is primary; falls back to individual cookie if needed.
 * If you need both tokens, call getAuthTokens once to avoid duplicate parsing.
 */
export function getAccessTokenFromCookies(req: RequestLike): string | null {
  const tokens = getAuthTokens(req);
  return tokens.at ?? null;
}

/**
 * Get refresh token from request cookies
 * Combined cookie is primary; falls back to individual cookie if needed.
 * If you need both tokens, call getAuthTokens once to avoid duplicate parsing.
 */
export function getRefreshTokenFromCookies(req: RequestLike): string | null {
  const tokens = getAuthTokens(req);
  return tokens.rt ?? null;
}
