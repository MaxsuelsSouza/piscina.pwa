/**
 * Auth Feature Types
 * TypeScript types specific to authentication
 */

import type { z } from "zod";
import type {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema";

export type LoginCredentials = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export type AuthResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  token?: string;
};
