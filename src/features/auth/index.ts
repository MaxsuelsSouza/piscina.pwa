/**
 * Auth Feature - Barrel Export
 * Public API da feature de autenticação
 */

// Hooks
export { useAuth } from "./hooks/use-auth";

// Schemas
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./schemas/auth.schema";

// Types
export type {
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  AuthResponse,
} from "./types";

// API
export { authApi } from "./lib/auth-api";
