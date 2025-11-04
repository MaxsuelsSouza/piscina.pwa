/**
 * Validações para Login
 */

import type { LoginCredentials, RegisterCredentials, AuthError } from '../_types';

export function validateEmail(email: string): AuthError | null {
  if (!email) {
    return { field: 'email', message: 'Email é obrigatório' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Email inválido' };
  }

  return null;
}

export function validatePassword(password: string): AuthError | null {
  if (!password) {
    return { field: 'password', message: 'Senha é obrigatória' };
  }

  if (password.length < 6) {
    return { field: 'password', message: 'Senha deve ter no mínimo 6 caracteres' };
  }

  return null;
}

export function validateName(name: string): AuthError | null {
  if (!name) {
    return { field: 'name', message: 'Nome é obrigatório' };
  }

  if (name.length < 3) {
    return { field: 'name', message: 'Nome deve ter no mínimo 3 caracteres' };
  }

  return null;
}

export function validateLoginCredentials(credentials: LoginCredentials): AuthError[] {
  const errors: AuthError[] = [];

  const emailError = validateEmail(credentials.email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(credentials.password);
  if (passwordError) errors.push(passwordError);

  return errors;
}

export function validateRegisterCredentials(credentials: RegisterCredentials): AuthError[] {
  const errors: AuthError[] = [];

  const nameError = validateName(credentials.name);
  if (nameError) errors.push(nameError);

  const emailError = validateEmail(credentials.email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(credentials.password);
  if (passwordError) errors.push(passwordError);

  if (credentials.password !== credentials.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'As senhas não coincidem' });
  }

  return errors;
}
