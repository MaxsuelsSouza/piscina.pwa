'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LoginCredentials, RegisterCredentials, AuthError } from '../_types';
import { validateLoginCredentials, validateRegisterCredentials } from '../_utils/validation';
import { login as loginService, register as registerService } from '../_services/authService';

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AuthError[]>([]);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setErrors([]);

    const validationErrors = validateLoginCredentials(credentials);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await loginService(credentials);

      if (!response.success) {
        setErrors([{ field: 'general', message: response.message || 'Erro ao fazer login' }]);
        setLoading(false);
        return;
      }

      router.push('/admin');
    } catch (error) {
      setErrors([{ field: 'general', message: 'Erro ao conectar com o servidor' }]);
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setLoading(true);
    setErrors([]);

    const validationErrors = validateRegisterCredentials(credentials);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await registerService(credentials);

      if (!response.success) {
        setErrors([{ field: 'general', message: response.message || 'Erro ao criar conta' }]);
        setLoading(false);
        return;
      }

      router.push('/');
    } catch (error) {
      setErrors([{ field: 'general', message: 'Erro ao conectar com o servidor' }]);
    } finally {
      setLoading(false);
    }
  };

  const getError = (field: string) => {
    return errors.find((e) => e.field === field)?.message;
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return {
    login,
    register,
    loading,
    errors,
    getError,
    clearErrors,
  };
}
