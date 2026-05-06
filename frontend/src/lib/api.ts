import axios, { AxiosInstance, AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private refreshQueue: Array<(retry: boolean) => void> = [];
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;

  private loadTokensFromStorage() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("_at") || null;
      this.refreshTokenValue = localStorage.getItem("_rt") || null;
    }
  }

  constructor(baseURL: string = API_URL) {
    this.loadTokensFromStorage();
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Still send cookies as fallback
    });

    // Request interceptor: attach Bearer token to every request
    this.axiosInstance.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Don't auto-refresh for endpoints where 401 is a valid business response
        const skipRefreshUrls = [
          "/api/settings/password",
          "/api/settings/account",              // Wrong password during account deletion
          "/api/auth/login",
          "/api/auth/register",
          "/api/auth/force-login",              // Wrong password during force login
          "/api/auth/validate-session",         // Session revoked - logout immediately
          "/api/2fa/enable",                    // Wrong 2FA code during setup
          "/api/2fa/disable",                   // Wrong password when disabling
          "/api/2fa/backup-codes/regenerate",   // Wrong 2FA code when regenerating
          "/api/transfers",                     // Wrong 2FA code during transfer
          "/api/fund-operations/withdrawal",    // Wrong 2FA code during withdrawal
        ];

        const requestUrl = error.config?.url || "";
        const shouldSkipRefresh = skipRefreshUrls.some(url => requestUrl.includes(url));

        // Only handle TOKEN_EXPIRED (or generic 401) for non-skip URLs
        const errorCode = (error.response?.data as any)?.code;
        const isTokenExpired =
          error.response?.status === 401 &&
          !shouldSkipRefresh &&
          errorCode !== "INVALID_TOKEN";

        if (!isTokenExpired) {
          return Promise.reject(error);
        }

        // If a refresh is already in flight, queue this request
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.refreshQueue.push((success: boolean) => {
              if (success && error.config) {
                resolve(this.axiosInstance.request(error.config));
              } else {
                reject(error);
              }
            });
          });
        }

        // This request is the one doing the refresh
        this.isRefreshing = true;
        let refreshSuccess = false;

        try {
          const refreshRes = await axios.post(
            `${baseURL}/api/auth/refresh-token`,
            { refreshToken: this.refreshTokenValue || undefined },
            { withCredentials: true }
          );

          // Store new tokens from response body
          const newTokens = refreshRes.data?.data;
          if (newTokens?.accessToken && newTokens?.refreshToken) {
            this.setTokens(newTokens.accessToken, newTokens.refreshToken);
          } else if (newTokens?.accessToken) {
            this.accessToken = newTokens.accessToken;
            if (typeof window !== "undefined") localStorage.setItem("_at", newTokens.accessToken);
          }

          refreshSuccess = true;

        } catch (refreshError) {
          refreshSuccess = false;
          this.clearTokens();

          if (typeof window !== "undefined") {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userName");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userProfilePicture");
            window.dispatchEvent(new Event("authStateChanged"));
            window.location.href = "/signin?reason=session_revoked";
          }
        } finally {
          this.isRefreshing = false;

          // Process queue AFTER cookies are set
          this.refreshQueue.forEach(cb => cb(refreshSuccess));
          this.refreshQueue = [];
        }

        // Retry the original request if refresh succeeded
        if (refreshSuccess && error.config) {
          return this.axiosInstance.request(error.config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Store tokens in memory for Bearer header authentication.
   * Cookies are still set as fallback, but Bearer header is the primary auth method
   * to avoid issues with proxy cookie forwarding.
   */
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshTokenValue = refreshToken;
    if (typeof window !== "undefined") {
      localStorage.setItem("_at", accessToken);
      localStorage.setItem("_rt", refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshTokenValue = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("_at");
      localStorage.removeItem("_rt");
    }
  }

  // Public endpoints
  async getTeamMembers() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/public/team");
    return response.data;
  }

  async getTestimonials() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/public/testimonials");
    return response.data;
  }

  async getInvestmentOptions() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/public/investments");
    return response.data;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ user: any }>>(
      "/api/auth/login",
      { email, password }
    );
    return response.data;
  }

  async forceLogin(email: string, password: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ user: any; message: string }>>(
      "/api/auth/force-login",
      { email, password }
    );
    return response.data;
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    referralCode?: string;
  }) {
    const response = await this.axiosInstance.post<ApiResponse<{ user: any }>>(
      "/api/auth/register",
      data
    );
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.axiosInstance.post<ApiResponse<null>>(
      "/api/auth/forgot-password",
      { email }
    );
    return response.data;
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await this.axiosInstance.post<ApiResponse<null>>(
      "/api/auth/reset-password",
      { token, newPassword }
    );
    return response.data;
  }

  async logout() {
    const response = await this.axiosInstance.post<ApiResponse<void>>("/api/auth/logout", {
      refreshToken: this.refreshTokenValue || undefined,
    });
    this.clearTokens();
    return response.data;
  }

  async refreshToken() {
    // Refresh token is in httpOnly cookie, sent automatically
    const response = await this.axiosInstance.post<ApiResponse<{ message: string }>>(
      "/api/auth/refresh-token",
      {}
    );
    return response.data;
  }

  async validateSession() {
    const response = await this.axiosInstance.post<ApiResponse<{ valid: boolean; checkInterval: number }>>(
      "/api/auth/validate-session",
      { refreshToken: this.refreshTokenValue || undefined }
    );
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.axiosInstance.get<ApiResponse<any>>("/api/profile");
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.axiosInstance.put<ApiResponse<any>>("/api/profile", data);
    return response.data;
  }

  async getTransactions(limit?: number, type?: string) {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (type) params.set("type", type);
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await this.axiosInstance.get<ApiResponse<any[]>>(`/api/transactions${query}`);
    return response.data;
  }

  async getBalanceSummary() {
    const response = await this.axiosInstance.get<ApiResponse<{
      balance: number;
      profits: number;
      referralCommissions: number;
      bonus: number;
      pendingDeposits: number;
      pendingWithdrawals: number;
      breakdown: {
        deposits: number;
        profits: number;
        adminBonuses: number;
        referralBonuses: number;
        transferIn: number;
        withdrawals: number;
        investedFunds: number;
        transferOut: number;
      };
    }>>("/api/transactions/balance");
    return response.data;
  }

  async getNotifications() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/notifications?limit=500");
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.axiosInstance.patch<ApiResponse<void>>(`/api/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.axiosInstance.put<ApiResponse<void>>("/api/notifications/read-all");
    return response.data;
  }

  async clearAllNotifications() {
    const response = await this.axiosInstance.delete<ApiResponse<void>>("/api/notifications");
    return response.data;
  }

  async getSupportTickets() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/support");
    return response.data;
  }

  async getSupportTicket(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/api/support/${id}`);
    return response.data;
  }

  async createSupportTicket(data: {
    subject: string;
    category: string;
    priority: string;
    message: string;
    attachmentIds?: string[];
  }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>("/api/support", data);
    return response.data;
  }

  async replySupportTicket(id: string, data: { message: string; attachmentIds?: string[] }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>(`/api/support/${id}/reply`, data);
    return response.data;
  }

  async updateSupportTicket(id: string, data: { status?: string }) {
    const response = await this.axiosInstance.put<ApiResponse<any>>(`/api/support/${id}`, data);
    return response.data;
  }

  async uploadSupportAttachment(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await this.axiosInstance.post<ApiResponse<any>>(
      "/api/support/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }

  async getProperties(filters?: { category?: string; investmentType?: string; status?: string; search?: string }) {
    let url = "/api/properties";
    if (filters) {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.investmentType) params.append("investmentType", filters.investmentType);
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      if (params.toString()) url += `?${params.toString()}`;
    }
    const response = await this.axiosInstance.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async getProperty(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/api/properties/${id}`);
    return response.data;
  }

  async getFeaturedProperties() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/properties/featured");
    return response.data;
  }

  async submitBid(propertyId: string, amount: number) {
    const response = await this.axiosInstance.post<ApiResponse<any>>(`/api/properties/${propertyId}/bid`, { amount });
    return response.data;
  }

  async submitBuyNow(propertyId: string) {
    const response = await this.axiosInstance.post<ApiResponse<any>>(`/api/properties/${propertyId}/buy`);
    return response.data;
  }

  async getInvestments() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/investments");
    return response.data;
  }

  async checkPropertyInvestment(propertyId: string) {
    const response = await this.axiosInstance.get<ApiResponse<{ exists: boolean; investment: any }>>(`/api/investments/property/${propertyId}/check`);
    return response.data;
  }

  async createPropertyInvestment(propertyId: string, amount: number) {
    const response = await this.axiosInstance.post<ApiResponse<{ id: string }>>("/api/investments/property", { propertyId, amount });
    return response.data;
  }

  // Referral endpoints
  async getReferralInfo() {
    const response = await this.axiosInstance.get<ApiResponse<{
      referralCode: string;
      referralLink: string;
    }>>("/api/referrals/info");
    return response.data;
  }

  async getReferralStats() {
    const response = await this.axiosInstance.get<ApiResponse<{
      totalReferrals: number;
      completedReferrals: number;
      pendingReferrals: number;
      totalEarnings: number;
      completedEarnings: number;
      pendingEarnings: number;
      recentActivity: any[];
    }>>("/api/referrals/stats");
    return response.data;
  }

  async getReferralList() {
    const response = await this.axiosInstance.get<ApiResponse<Array<{
      id: string;
      name: string;
      email: string;
      status: string;
      reward: number;
      joinedAt: string;
    }>>>("/api/referrals/list");
    return response.data;
  }

  async getSettings() {
    const response = await this.axiosInstance.get<ApiResponse<any>>("/api/settings");
    return response.data;
  }

  async updateSettings(data: any) {
    const response = await this.axiosInstance.put<ApiResponse<any>>("/api/settings", data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.axiosInstance.put<ApiResponse<null>>(
      "/api/settings/password",
      { currentPassword, newPassword }
    );
    return response.data;
  }

  async getSessions() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/sessions");
    return response.data;
  }

  async terminateSession(id: string) {
    const response = await this.axiosInstance.delete<ApiResponse<void>>(`/api/sessions/${id}`);
    return response.data;
  }

  async deleteAccount(password: string) {
    const response = await this.axiosInstance.delete<ApiResponse<null>>("/api/settings/account", {
      data: { password },
    });
    return response.data;
  }

  // Two-Factor Authentication endpoints
  async get2FAStatus() {
    const response = await this.axiosInstance.get<ApiResponse<{ enabled: boolean; backupCodesCount: number }>>("/api/2fa/status");
    return response.data;
  }

  async setup2FA() {
    const response = await this.axiosInstance.post<ApiResponse<{ secret: string; qrCode: string; manualEntry: string }>>("/api/2fa/setup");
    return response.data;
  }

  async enable2FA(code: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ enabled: boolean; backupCodes: string[] }>>("/api/2fa/enable", { code });
    return response.data;
  }

  async disable2FA(code: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ disabled: boolean }>>("/api/2fa/disable", { code });
    return response.data;
  }

  async regenerateBackupCodes(code: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ backupCodes: string[] }>>("/api/2fa/backup-codes/regenerate", { code });
    return response.data;
  }

  async setRequire2FALogin(require: boolean) {
    const response = await this.axiosInstance.post<ApiResponse<{ requireTwoFactorLogin: boolean }>>("/api/2fa/require-login", { require });
    return response.data;
  }

  // Payment Methods endpoints
  async getPaymentMethods(type?: "bank" | "crypto") {
    const url = type ? `/api/payment-methods?type=${type}` : "/api/payment-methods";
    const response = await this.axiosInstance.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async getPaymentMethodById(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/api/payment-methods/${id}`);
    return response.data;
  }

  // Fund Operations endpoints
  async getWithdrawalAuthorizationStatus() {
    const response = await this.axiosInstance.get<ApiResponse<{
      canWithdraw: boolean;
      twoFactorEnabled: boolean;
      kycVerified: boolean;
      kycStatus: string;
      reasons: string[];
    }>>("/api/fund-operations/withdrawal-authorization");
    return response.data;
  }

  async createDeposit(data: { method: string; amount: number; details?: any }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>("/api/fund-operations/deposit", data);
    return response.data;
  }

  async createWithdrawal(data: {
    method: string;
    amount: number;
    details?: any;
    twoFactorCode: string;
  }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>("/api/fund-operations/withdrawal", data);
    return response.data;
  }

  async uploadPaymentReceipt(reference: string, file: File) {
    const formData = new FormData();
    formData.append("reference", reference);
    formData.append("receipt", file);
    const response = await this.axiosInstance.post<ApiResponse<null>>(
      "/api/fund-operations/upload-receipt",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }

  async getFundOperations(type?: "deposit" | "withdrawal", status?: string) {
    let url = "/api/fund-operations";
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    if (params.toString()) url += `?${params.toString()}`;
    const response = await this.axiosInstance.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async getFundOperationById(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/api/fund-operations/${id}`);
    return response.data;
  }

  async getTransactionById(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/api/transactions/${id}`);
    return response.data;
  }

  // Transfer endpoints
  async getTransferData() {
    const response = await this.axiosInstance.get<ApiResponse<{
      balance: number;
      transfers: any[];
    }>>("/api/transfers");
    return response.data;
  }

  async getTransferAuthorizationStatus() {
    const response = await this.axiosInstance.get<ApiResponse<{
      canTransfer: boolean;
      twoFactorEnabled: boolean;
      kycVerified: boolean;
      kycStatus: string;
      reasons: string[];
    }>>("/api/transfers/authorization-status");
    return response.data;
  }

  async createTransfer(data: {
    recipientEmail: string;
    amount: number;
    note?: string;
    twoFactorCode: string;
  }) {
    const response = await this.axiosInstance.post<ApiResponse<{
      transfer: any;
      balance: number;
      recipientExists: boolean;
    }>>("/api/transfers", data);
    return response.data;
  }

  // KYC endpoints
  async getKYCStatus() {
    const response = await this.axiosInstance.get<ApiResponse<{
      kyc: {
        id: string;
        fullName: string;
        dateOfBirth: string;
        nationality: string;
        address: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        idFrontUrl: string | null;
        idBackUrl: string | null;
        proofOfAddressUrl: string | null;
        selfieUrl: string | null;
        documentType: string;
        documentNumber: string;
        status: "not_submitted" | "pending" | "approved" | "rejected";
        submittedAt: string | null;
        reviewedAt: string | null;
        rejectionReason: string;
        createdAt: string;
        updatedAt: string;
      };
    }>>("/api/kyc/status");
    return response.data;
  }

  async submitKYC(data: {
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    idFrontUrl: string;
    idBackUrl?: string; // Optional - only required for driver's licenses
    proofOfAddressUrl: string;
    selfieUrl: string;
    documentType: string;
    documentNumber: string;
  }) {
    const response = await this.axiosInstance.post<ApiResponse<{
      kyc: {
        id: string;
        status: string;
        submittedAt: string;
      };
    }>>("/api/kyc/submit", data);
    return response.data;
  }

  async updateKYC(data: {
    fullName?: string;
    dateOfBirth?: string;
    nationality?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    idFrontUrl?: string;
    idBackUrl?: string;
    proofOfAddressUrl?: string;
    selfieUrl?: string;
    documentType?: string;
    documentNumber?: string;
  }) {
    const response = await this.axiosInstance.put<ApiResponse<{ kyc: any }>>("/api/kyc/update", data);
    return response.data;
  }

  async uploadKYCDocument(file: File, documentType: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    const response = await this.axiosInstance.post<ApiResponse<{ fileUrl: string }>>(
      "/api/kyc/upload-document",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }

  // ─── ADMIN: Users ───────────────────────────────────────────────────────────

  async adminGetUserStats() {
    const response = await this.axiosInstance.get<ApiResponse<{
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      verifiedUsers: number;
      adminCount: number;
      superadminCount: number;
      regularUsers: number;
    }>>("/api/admin/users/stats");
    return response.data;
  }

  async adminGetUsers(params?: {
    role?: string;
    kycStatus?: string;
    isActive?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.role) query.append("role", params.role);
    if (params?.kycStatus) query.append("kycStatus", params.kycStatus);
    if (params?.isActive !== undefined) query.append("isActive", params.isActive);
    if (params?.search) query.append("search", params.search);
    if (params?.limit !== undefined) query.append("limit", String(params.limit));
    if (params?.offset !== undefined) query.append("offset", String(params.offset));
    const url = `/api/admin/users${query.toString() ? `?${query}` : ""}`;
    const response = await this.axiosInstance.get<ApiResponse<{
      users: Array<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string;
        role: string;
        emailVerified: boolean;
        twoFactorEnabled: boolean;
        kycStatus: string;
        balance: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        lastLoginAt: string | null;
        lastActiveAt: string | null;
        lastLoginDevice: string | null;
        lastLoginLocation: string | null;
      }>;
      total: number;
      limit: number;
      offset: number;
    }>>(url);
    return response.data;
  }

  async adminGetUser(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      dateOfBirth?: string;
      nationality?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      profilePhoto?: string;
      bio?: string;
      occupation?: string;
      role: string;
      emailVerified: boolean;
      twoFactorEnabled: boolean;
      kycStatus: string;
      balance: number;
      profits: number;
      referralCommissions: number;
      bonus: number;
      referralCode?: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      lastLoginAt: string | null;
      lastActiveAt: string | null;
      lastLoginDevice: string | null;
      lastLoginBrowser: string | null;
      lastLoginOs: string | null;
      lastLoginLocation: string | null;
      lastLoginIp: string | null;
      recentSessions: Array<{
        loginAt: string;
        lastActive: string | null;
        device: string | null;
        browser: string | null;
        os: string | null;
        location: string | null;
        ipAddress: string | null;
      }>;
      _count: { transactions: number; investments: number; referrals: number; sessions: number };
    }>>(`/api/admin/users/${id}`);
    return response.data;
  }

  async adminUpdateUserStatus(id: string, isActive: boolean) {
    const response = await this.axiosInstance.patch<ApiResponse<{ id: string; isActive: boolean }>>(
      `/api/admin/users/${id}/status`,
      { isActive }
    );
    return response.data;
  }

  async adminUpdateUserBalance(id: string, amount: number, note?: string, category = "balance") {
    const response = await this.axiosInstance.patch<ApiResponse<{ id: string; balance: number; profits: number; referralCommissions: number; bonus: number }>>(
      `/api/admin/users/${id}/balance`,
      { amount, note, category }
    );
    return response.data;
  }

  async adminAssignReferral(id: string, referrerIdentifier: string, reward: number) {
    const response = await this.axiosInstance.post<ApiResponse<{ referrerId: string; referredUserId: string; reward: number }>>(
      `/api/admin/users/${id}/assign-referral`,
      { referrerIdentifier, reward }
    );
    return response.data;
  }

  async adminResetUser(id: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ deleted: { transactions: number; fundOperations: number; referrals: number; investments: number } }>>(
      `/api/admin/users/${id}/reset`
    );
    return response.data;
  }

  // ─── ADMIN: Fund Operations ──────────────────────────────────────────────────

  async adminGetFundOperations(params?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.type) query.append("type", params.type);
    if (params?.status) query.append("status", params.status);
    if (params?.limit !== undefined) query.append("limit", String(params.limit));
    if (params?.offset !== undefined) query.append("offset", String(params.offset));
    const url = `/api/admin/fund-operations${query.toString() ? `?${query}` : ""}`;
    const response = await this.axiosInstance.get<ApiResponse<{
      operations: Array<{
        id: string;
        type: string;
        status: string;
        amount: number;
        reference: string;
        createdAt: string;
        completedAt?: string;
        user: { id: string; firstName: string; lastName: string; email: string };
      }>;
      total: number;
    }>>(url);
    return response.data;
  }

  async adminApproveFundOperation(id: string, note?: string) {
    const response = await this.axiosInstance.post<ApiResponse<null>>(
      `/api/admin/fund-operations/${id}/approve`,
      { note }
    );
    return response.data;
  }

  async adminRejectFundOperation(id: string, reason?: string) {
    const response = await this.axiosInstance.post<ApiResponse<null>>(
      `/api/admin/fund-operations/${id}/reject`,
      { reason }
    );
    return response.data;
  }

  // ─── ADMIN: KYC ─────────────────────────────────────────────────────────────

  async adminGetKYCStats() {
    const response = await this.axiosInstance.get<ApiResponse<{
      stats: { total: number; pending: number; approved: number; rejected: number; notSubmitted: number };
    }>>("/api/admin/kyc/stats");
    return response.data;
  }

  async adminGetKYCSubmissions(params?: { status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.limit !== undefined) query.append("limit", String(params.limit));
    const url = `/api/admin/kyc/submissions${query.toString() ? `?${query}` : ""}`;
    const response = await this.axiosInstance.get<ApiResponse<{
      submissions: Array<{
        id: string;
        userId: string;
        status: string;
        submittedAt: string;
        reviewedAt?: string;
        rejectionReason?: string;
        adminNotes?: string;
        user: { id: string; email: string; firstName: string; lastName: string; profilePhoto?: string; createdAt: string };
      }>;
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>>(url);
    return response.data;
  }

  async adminApproveKYC(id: string, adminNotes?: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ kyc: any }>>(
      `/api/admin/kyc/approve/${id}`,
      { adminNotes }
    );
    return response.data;
  }

  async adminRejectKYC(id: string, rejectionReason: string, adminNotes?: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ kyc: any }>>(
      `/api/admin/kyc/reject/${id}`,
      { rejectionReason, adminNotes }
    );
    return response.data;
  }

  // ─── ADMIN: Properties ───────────────────────────────────────────────────

  async adminGetProperties(params?: {
    category?: string;
    investmentType?: string;
    status?: string;
    type?: string;
    featured?: boolean;
    active?: boolean;
  }) {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.investmentType) query.append("investmentType", params.investmentType);
    if (params?.status) query.append("status", params.status);
    if (params?.type) query.append("type", params.type);
    if (params?.featured !== undefined) query.append("featured", String(params.featured));
    if (params?.active !== undefined) query.append("active", String(params.active));
    const url = `/api/admin/properties${query.toString() ? `?${query}` : ""}`;
    const response = await this.axiosInstance.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async adminGetProperty(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(
      `/api/admin/properties/${id}`
    );
    return response.data;
  }

  /**
   * Use native fetch (not axios) for multipart uploads.
   * Axios merges the instance-level "Content-Type: application/json" default
   * onto every request; setting it to undefined doesn't reliably clear it.
   * fetch() with a FormData body lets the browser generate the correct
   * "Content-Type: multipart/form-data; boundary=..." header automatically.
   */
  private async _fetchUpload(
    method: "POST" | "PATCH",
    path: string,
    formData: FormData
  ): Promise<any> {
    const headers: Record<string, string> = {};
    if (this.accessToken) headers["Authorization"] = `Bearer ${this.accessToken}`;
    const res = await fetch(`${API_URL}${path}`, {
      method,
      body: formData,
      credentials: "include",
      headers,
      // No Content-Type — browser sets it with the correct boundary
    });
    const data = await res.json().catch(() => ({ success: false, message: "Upload failed" }));
    if (!res.ok) throw { response: { data } };
    return data;
  }

  async adminImportZillow(url: string) {
    const response = await this.axiosInstance.post<ApiResponse<any>>(
      "/api/admin/zillow/import",
      { url }
    );
    return response.data;
  }

  async adminCreateProperty(formData: FormData) {
    return this._fetchUpload("POST", "/api/admin/properties", formData);
  }

  async adminUpdateProperty(id: string, formData: FormData) {
    return this._fetchUpload("PATCH", `/api/admin/properties/${id}`, formData);
  }

  /** Send a JSON (non-multipart) PATCH when there are no file uploads */
  async adminUpdatePropertyJson(id: string, data: Record<string, string>) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.accessToken) headers["Authorization"] = `Bearer ${this.accessToken}`;
    const res = await fetch(`${API_URL}/api/admin/properties/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
      credentials: "include",
    });
    const responseData = await res.json().catch(() => ({ success: false, message: "Update failed" }));
    if (!res.ok) throw { response: { data: responseData } };
    return responseData;
  }

  async adminSoftDeleteProperty(id: string) {
    const response = await this.axiosInstance.delete<ApiResponse<any>>(
      `/api/admin/properties/${id}`
    );
    return response.data;
  }

  async adminHardDeleteProperty(id: string) {
    const response = await this.axiosInstance.delete<ApiResponse<any>>(
      `/api/admin/properties/${id}/permanent`
    );
    return response.data;
  }

  async adminRemovePropertyImage(id: string, url: string) {
    const response = await this.axiosInstance.delete<ApiResponse<{ images: string[] }>>(
      `/api/admin/properties/${id}/images`,
      { data: { url } }
    );
    return response.data;
  }

  // ─── ADMIN: Payment Wallets ──────────────────────────────────────────────

  async adminGetPaymentWallets(params?: { type?: "bank" | "crypto" }) {
    const query = new URLSearchParams();
    if (params?.type) query.append("type", params.type);
    const url = `/api/admin/payment-wallets${query.toString() ? `?${query}` : ""}`;
    const response = await this.axiosInstance.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async adminCreatePaymentWallet(data: {
    type: "bank" | "crypto";
    method: string;
    name: string;
    address?: string;
    network?: string;
    bankName?: string;
    accountName?: string;
    swiftCode?: string;
    routingNumber?: string;
    instructions?: string;
    qrCodeData?: string;
    isActive?: boolean;
  }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>(
      "/api/admin/payment-wallets",
      data
    );
    return response.data;
  }

  async adminUpdatePaymentWallet(id: string, data: Record<string, unknown>) {
    const response = await this.axiosInstance.patch<ApiResponse<any>>(
      `/api/admin/payment-wallets/${id}`,
      data
    );
    return response.data;
  }

  async adminTogglePaymentWallet(id: string) {
    const response = await this.axiosInstance.patch<ApiResponse<any>>(
      `/api/admin/payment-wallets/${id}/toggle`
    );
    return response.data;
  }

  async adminDeletePaymentWallet(id: string) {
    const response = await this.axiosInstance.delete<ApiResponse<null>>(
      `/api/admin/payment-wallets/${id}`
    );
    return response.data;
  }

  // ─── ADMIN: Documents ────────────────────────────────────────────────────

  async adminGetDocuments(params?: { userId?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.userId) query.append("userId", params.userId);
    if (params?.status) query.append("status", params.status);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    const url = `/api/admin/documents${query.toString() ? `?${query}` : ""}`;
    const response = await this.axiosInstance.get<ApiResponse<any>>(url);
    return response.data;
  }

  async adminSendDocument(formData: FormData) {
    return this._fetchUpload("POST", "/api/admin/documents/send", formData);
  }

  async adminUpdateDocument(id: string, data: {
    title?: string;
    description?: string;
    userMessage?: string;
    status?: string;
  }) {
    const response = await this.axiosInstance.patch<ApiResponse<any>>(
      `/api/admin/documents/${encodeURIComponent(id)}`,
      data,
    );
    return response.data;
  }

  async adminUpdateDocumentWithFile(id: string, formData: FormData) {
    return this._fetchUpload("PATCH", `/api/admin/documents/${encodeURIComponent(id)}`, formData);
  }

  async adminDeleteDocument(id: string) {
    const response = await this.axiosInstance.delete<ApiResponse<null>>(
      `/api/admin/documents/${id}`
    );
    return response.data;
  }

  async adminSignDocument(id: string, payload: {
    fieldValues?: Array<{ fieldId: string; value: string; sigW?: number; sigH?: number }>;
    freePlacements?: Array<{ type: string; value: string; xPct: number; yPct: number; wPct: number; hPct: number; pageNum: number; rotation?: number }>;
    canvasW?: number;
  }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>(
      `/api/admin/documents/${encodeURIComponent(id)}/admin-sign`,
      payload,
    );
    return response.data;
  }

  // ─── USER: Documents ─────────────────────────────────────────────────────

  async getUserDocuments() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/documents");
    return response.data;
  }

  async signDocument(id: string, payload: {
    // Legacy free-placement mode
    signatureDataUrl?: string;
    sigPos?: { xPct: number; yPct: number };
    sigScale?: number;
    nameText?: string | null;
    namePos?: { xPct: number; yPct: number };
    dateText?: string | null;
    datePos?: { xPct: number; yPct: number };
    canvasW?: number;
    sigDisplayW?: number;
    sigDisplayH?: number;
    // Guided mode (admin-defined fields)
    fieldValues?: Array<{ fieldId: string; value: string; sigW?: number; sigH?: number; canvasW?: number }>;
  }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>(
      `/api/documents/${id}/sign`,
      payload,
    );
    return response.data;
  }

  async downloadDocumentFile(id: string, signed = false): Promise<Blob> {
    const response = await this.axiosInstance.get(
      `/api/documents/${encodeURIComponent(id)}/download${signed ? "?signed=true" : ""}`,
      { responseType: "blob" }
    );
    return response.data;
  }

  async adminDownloadDocument(id: string, signed = false): Promise<Blob> {
    const response = await this.axiosInstance.get(
      `/api/admin/documents/${encodeURIComponent(id)}/download${signed ? "?signed=true" : ""}`,
      { responseType: "blob" }
    );
    return response.data;
  }

  // Admin support ticket endpoints
  async adminGetSupportTickets(params?: {
    userId?: string;
    status?: string;
    priority?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.userId) query.set("userId", params.userId);
    if (params?.status) query.set("status", params.status);
    if (params?.priority) query.set("priority", params.priority);
    if (params?.category) query.set("category", params.category);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const response = await this.axiosInstance.get<ApiResponse<any>>(
      `/api/admin/support${query.toString() ? `?${query}` : ""}`
    );
    return response.data;
  }

  async adminGetSupportTicket(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(
      `/api/admin/support/${encodeURIComponent(id)}`
    );
    return response.data;
  }

  async adminReplyToTicket(id: string, message: string) {
    const response = await this.axiosInstance.post<ApiResponse<any>>(
      `/api/admin/support/${encodeURIComponent(id)}/reply`,
      { message }
    );
    return response.data;
  }

  async adminUpdateTicketStatus(id: string, status: string) {
    const response = await this.axiosInstance.patch<ApiResponse<any>>(
      `/api/admin/support/${encodeURIComponent(id)}/status`,
      { status }
    );
    return response.data;
  }

  // ── Admin: Header Documents (PdfDocument) ──────────────────────────────
  async adminGetHeaderDocuments() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/pdf/documents");
    return response.data;
  }

  async adminCreateHeaderDocument(formData: FormData) {
    const response = await this.axiosInstance.post<ApiResponse<any>>(
      "/api/pdf/documents",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }

  async adminUpdateHeaderDocument(id: string, data: {
    title?: string;
    description?: string;
    displayOrder?: number;
    category?: string;
    isActive?: boolean;
  }) {
    const response = await this.axiosInstance.put<ApiResponse<any>>(
      `/api/pdf/documents/${encodeURIComponent(id)}`,
      data
    );
    return response.data;
  }

  async adminDeleteHeaderDocument(id: string) {
    const response = await this.axiosInstance.delete<ApiResponse<null>>(
      `/api/pdf/documents/${encodeURIComponent(id)}`
    );
    return response.data;
  }

  // Newsletter endpoints
  async subscribeToNewsletter(data: { name: string; email: string }) {
    const response = await this.axiosInstance.post<ApiResponse<{
      message: string;
    }>>("/api/newsletter/subscribe", data);
    return response.data;
  }

  // Contact endpoints
  async submitContact(data: { name: string; email: string; phone: string; message: string }) {
    const response = await this.axiosInstance.post<ApiResponse<{
      message: string;
    }>>("/api/contact", data);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();
