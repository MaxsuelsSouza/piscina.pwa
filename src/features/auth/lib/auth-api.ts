/**
 * Auth API Client
 * API calls specific to authentication feature
 */

import { apiClient } from "@/lib/api-client";
import type { LoginCredentials, RegisterData, AuthResponse } from "../types";

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>("/api/auth/login", credentials),

  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>("/api/auth/register", data),

  logout: () => apiClient.post("/api/auth/logout"),

  forgotPassword: (email: string) =>
    apiClient.post("/api/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post("/api/auth/reset-password", { token, password }),
};
