/**
 * Serviços de autenticação do Firebase
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '../config';

/**
 * Faz login com email e senha
 */
export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
}

/**
 * Faz logout
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
}

/**
 * Obtém o usuário autenticado atual
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Escuta mudanças no estado de autenticação
 */
export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Verifica se o usuário é admin (baseado no email ou custom claims)
 */
export async function isAdmin(): Promise<boolean> {
  const user = auth.currentUser;

  if (!user) return false;

  try {
    // Opção 1: Verificar pelo email
    // const adminEmails = ['admin@piscina.com', 'seu-email@gmail.com'];
    // return adminEmails.includes(user.email || '');

    // Opção 2: Usar custom claims (requer configuração no backend)
    const tokenResult = await user.getIdTokenResult();
    return tokenResult.claims.admin === true;
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
}

/**
 * Envia email de redefinição de senha
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: false,
    });
  } catch (error) {
    console.error('Erro ao enviar email de redefinição:', error);
    throw error;
  }
}
